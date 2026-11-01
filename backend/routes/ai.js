import express from 'express';
import StudentProfile from '../models/Student.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import InterviewQuestion from '../models/InterviewQuestion.js';
import { generateInterviewQuestions, getJobRecommendations, generateAIInsights } from '../services/geminiService.js';

const router = express.Router();

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

router.post('/interview-questions', isAuthenticated, async (req, res) => {
  try {
    const { jobTitle, requiredSkills, includeProfile } = req.body;
    
    // Check if we already have it cached
    let studentProfile = null;
    let queryOptions = { jobTitle };
    
    if (includeProfile && req.session.role === 'student') {
      studentProfile = await StudentProfile.findOne({ user: req.session.userId });
      if (studentProfile) {
        queryOptions.student = studentProfile._id;
      }
    }

    const cachedQuestions = await InterviewQuestion.findOne(queryOptions).sort({ generatedAt: -1 });
    
    // If we have recent cached questions (e.g. less than 1 week old) and we don't explicitly require regeneration, we could return them.
    // For simplicity, we regenerate if missing, else return cache if valid. Actually, let's always regenerate if req body says `regenerate: true`, else check cache
    if (cachedQuestions && !req.body.regenerate) {
        return res.json(cachedQuestions.questions);
    }

    const aiQuestions = await generateInterviewQuestions(
      jobTitle, 
      requiredSkills || [], 
      includeProfile ? studentProfile : null
    );

    // Save to cache
    const newDoc = new InterviewQuestion({
      student: studentProfile ? studentProfile._id : undefined,
      jobTitle,
      requiredSkills,
      questions: aiQuestions
    });
    await newDoc.save();

    res.json(aiQuestions);
  } catch (error) {
    console.error("Error in /interview-questions:", error);
    res.status(500).json({ error: 'Failed to generate interview questions' });
  }
});

router.get('/recommend-jobs/:studentId', isAuthenticated, async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findById(req.params.studentId);
    if (!studentProfile) return res.status(404).json({ error: "Student not found" });

    // Fetch jobs that haven't expired (limit to 50 to avoid token limits with LLM)
    const currentDate = new Date();
    const availableJobs = await Job.find({
      $or: [
        { deadline: { $gte: currentDate } },
        { deadline: { $exists: false } },
        { deadline: null }
      ]
    })
      .populate('company', 'name')
      .limit(50)
      .exec();

    // Call Gemini
    const recommendationsData = await getJobRecommendations(studentProfile, availableJobs);
    
    // Map back to full job documents based on jobId
    const finalRecommendations = recommendationsData.recommendations.map(r => {
      const jobDoc = availableJobs.find(j => j._id.toString() === r.jobId);
      return {
        job: jobDoc,
        matchPercentage: r.matchPercentage,
        reasons: r.reasons
      };
    }).filter(r => r.job != null); // filter out if LLM hallucinates an ID

    res.json({ recommendations: finalRecommendations });
  } catch (error) {
    console.error("Error in /recommend-jobs:", error);
    res.status(500).json({ error: 'Failed to recommend jobs' });
  }
});

router.get('/insights', isAuthenticated, async (req, res) => {
  try {
    // Basic auth check: Admin or coordinator only based on session or DB check
    // Actually, dashboard will just call this, assuming frontend handles navigation.
    const startTime = Date.now();
    const students = await StudentProfile.find({}, 'skills experience cgpa');
    const jobs = await Job.find({}, 'role requiredSkills');
    const applications = await Application.find({}, 'status');
    const dbTime = Date.now() - startTime;

    const insights = await generateAIInsights(students, jobs, applications);
    
    res.json(insights);
  } catch (error) {
    console.error("Error in /insights:", error);
    res.status(500).json({ error: 'Failed to load AI insights' });
  }
});

export default router;
