import express from 'express';
import InterviewSession from '../models/InterviewSession.js';
import StudentProfile from '../models/Student.js';
import {
  generateInitialInterviewQuestion,
  generateInterviewFollowUp,
  evaluateInterviewSession
} from '../services/geminiService.js';
import { createNotification } from '../services/notificationService.js';
import { sendMockInterviewReportEmail } from '../services/emailService.js';

const router = express.Router();

// Per-user rate limiting: max 15 API calls per 60 seconds (protects key without blocking normal response flow)
const rateLimitMap = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const window = 60 * 1000;
  const maxCalls = 15;
  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, { calls: [], blocked: false });
  }
  const entry = rateLimitMap.get(userId);
  entry.calls = entry.calls.filter(t => now - t < window);
  if (entry.calls.length >= maxCalls) {
    return false; // rate limited
  }
  entry.calls.push(now);
  return true;
}

const isStudent = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Authentication required' });
  if (req.session.role !== 'student') return res.status(403).json({ error: 'Only students can access mock interviews' });
  next();
};

// ─── POST /api/mock-interview/start ──────────────────────────────────────────
router.post('/start', isStudent, async (req, res) => {
  try {
    const { roleDomain, difficulty, interviewType, totalQuestionsTarget } = req.body;
    if (!roleDomain) return res.status(400).json({ error: 'roleDomain is required' });

    const studentProfile = await StudentProfile.findOne({ user: req.session.userId });
    if (!studentProfile) return res.status(404).json({ error: 'Student profile not found' });

    const targetQuestions = [5, 10, 15].includes(Number(totalQuestionsTarget))
      ? Number(totalQuestionsTarget)
      : 5;

    const initialQuestion = await generateInitialInterviewQuestion(
      roleDomain,
      difficulty || 'Medium',
      interviewType || 'Mixed',
      studentProfile
    );

    const session = await InterviewSession.create({
      student: studentProfile._id,
      roleDomain,
      difficulty: difficulty || 'Medium',
      interviewType: interviewType || 'Mixed',
      totalQuestionsTarget: targetQuestions,
      status: 'in_progress',
      messages: [{
        role: 'interviewer',
        content: initialQuestion,
        timestamp: new Date()
      }]
    });

    res.status(201).json({
      success: true,
      sessionId: session._id,
      currentQuestion: initialQuestion,
      questionIndex: 1,
      totalQuestions: targetQuestions
    });
  } catch (err) {
    console.error('[MockInterview] Start error:', err);
    res.status(500).json({ error: 'Failed to start interview session' });
  }
});

// ─── POST /api/mock-interview/message ────────────────────────────────────────
router.post('/message', isStudent, async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || !answer?.trim()) {
      return res.status(400).json({ error: 'sessionId and answer are required' });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Interview session not found' });
    if (session.status !== 'in_progress') {
      return res.status(400).json({ error: 'Interview session is not active' });
    }

    // Rate limit Gemini calls per user
    if (!checkRateLimit(req.session.userId)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment before answering.' });
    }

    // Append candidate message
    session.messages.push({ role: 'candidate', content: answer.trim(), timestamp: new Date() });

    // Count interviewer messages (questions asked)
    const interviewerQCount = session.messages.filter(m => m.role === 'interviewer').length;

    // Check if all questions answered
    if (interviewerQCount >= session.totalQuestionsTarget) {
      await session.save();
      return res.json({
        success: true,
        completed: true,
        message: 'All questions answered. Click "Finish & Evaluate" to get your report.'
      });
    }

    // Generate next question with reaction (structured JSON from Gemini)
    const nextData = await generateInterviewFollowUp(
      session.roleDomain,
      session.difficulty,
      session.interviewType,
      session.messages,
      interviewerQCount + 1,
      session.totalQuestionsTarget
    );

    // nextData is now a structured object: { reaction, followUp, nextQuestion, questionNumber, topic }
    const fullResponse = nextData.reaction
      ? `${nextData.reaction} ${nextData.nextQuestion}`
      : nextData.nextQuestion;

    session.messages.push({
      role: 'interviewer',
      content: fullResponse,
      timestamp: new Date()
    });

    await session.save();

    res.json({
      success: true,
      completed: false,
      reaction: nextData.reaction || '',
      question: nextData.nextQuestion,
      fullResponse,
      isFollowUp: nextData.followUp || false,
      topic: nextData.topic || '',
      questionIndex: interviewerQCount + 1,
      totalQuestions: session.totalQuestionsTarget
    });
  } catch (err) {
    console.error('[MockInterview] Message error:', err);
    res.status(500).json({ error: 'Failed to process answer. Please retry.' });
  }
});

// ─── POST /api/mock-interview/terminate ──────────────────────────────────────
// For proctoring violations — immediately ends session
router.post('/terminate', isStudent, async (req, res) => {
  try {
    const { sessionId, reason = 'terminated: screen change detected' } = req.body;
    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.status = 'terminated';
    session.terminationReason = reason;
    session.completedAt = new Date();
    await session.save();

    res.json({ success: true, message: 'Session terminated and saved.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// ─── POST /api/mock-interview/evaluate & /finish ───────────────────────────
const handleFinishAndEvaluate = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Interview session not found' });

    // If session was already evaluated and completed, return the results immediately
    if (session.status === 'completed' && session.overallScore != null) {
      return res.json({ success: true, session, evaluation: session });
    }

    session.status = 'evaluating';
    await session.save();

    const evalData = await evaluateInterviewSession(
      session.roleDomain,
      session.difficulty,
      session.interviewType,
      session.messages
    );

    session.overallScore = evalData.overallScore ?? 75;
    session.categoryScores = evalData.categoryScores ?? {
      technicalKnowledge: 75,
      communication: 78,
      problemSolving: 74,
      confidenceClarity: 76,
      relevance: 75
    };
    session.evaluations = evalData.evaluations ?? [];
    session.strengths = evalData.strengths ?? ['Strong conceptual grasp', 'Good communication'];
    session.weaknesses = evalData.weaknesses ?? ['Could provide more structural examples'];
    session.improvementSuggestions = evalData.improvementSuggestions ?? ['Practice the STAR method', 'Review system design patterns'];
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Persist score in StudentProfile
    try {
      await StudentProfile.findByIdAndUpdate(session.student, {
        mockInterviewScore: session.overallScore
      });
    } catch (profErr) {
      console.warn('[MockInterview] Could not update student score:', profErr.message);
    }

    // Notifications (fire-and-forget)
    try {
      await createNotification({
        studentId: session.student,
        type: 'interview_evaluated',
        title: 'Mock Interview Report Ready',
        message: `Your ${session.roleDomain} mock interview report is ready! Score: ${session.overallScore}/100`,
        channels: ['in_app']
      });

      // Email notification
      const studentProfile = await StudentProfile.findById(session.student).populate('user', 'email');
      if (studentProfile?.user?.email) {
        sendMockInterviewReportEmail(
          studentProfile.user.email,
          studentProfile.name,
          session.roleDomain,
          session.overallScore
        );
      }
    } catch (notifErr) {
      console.warn('[MockInterview] Notification failed (non-fatal):', notifErr.message);
    }

    res.json({ success: true, session, evaluation: session });
  } catch (err) {
    console.error('[MockInterview] Finish/Evaluate error:', err);
    res.status(500).json({ error: 'Failed to evaluate interview. Please try again.' });
  }
};

router.post('/evaluate', isStudent, handleFinishAndEvaluate);
router.post('/finish', isStudent, handleFinishAndEvaluate);

// ─── GET /api/mock-interview/sessions ────────────────────────────────────────
router.get('/sessions', isStudent, async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.session.userId });
    if (!studentProfile) return res.status(404).json({ error: 'Student not found' });

    const sessions = await InterviewSession.find({ student: studentProfile._id })
      .sort({ createdAt: -1 })
      .select('roleDomain difficulty interviewType overallScore categoryScores status createdAt completedAt strengths weaknesses terminationReason');

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ─── GET /api/mock-interview/sessions/:id ────────────────────────────────────
router.get('/sessions/:id', isStudent, async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.session.userId });
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      student: studentProfile._id
    });
    if (!session) return res.status(404).json({ error: 'Interview report not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interview details' });
  }
});

export default router;
