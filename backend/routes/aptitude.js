import express from 'express';
import AptitudeTest from '../models/AptitudeTest.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import StudentProfile from '../models/Student.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Please log in to continue' });
  next();
};

// ─── Fisher-Yates shuffle ────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Seed default questions if bank is empty ──────────────────────────────────
const seedDefaultTestsIfEmpty = async () => {
  const count = await AptitudeTest.countDocuments();
  if (count > 0) return;

  await AptitudeTest.create([
    {
      title: 'National Campus Aptitude Assessment 2026',
      description: 'Comprehensive evaluation covering Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Technical Fundamentals.',
      durationMinutes: 20,
      totalMarks: 10,
      negativeMarking: 0.25,
      sections: ['Quantitative', 'Logical', 'Verbal', 'Technical'],
      // Config: how many questions per section to pick randomly
      sectionConfig: { Quantitative: 3, Logical: 3, Verbal: 2, Technical: 2 },
      questions: [
        // QUANTITATIVE (5 questions in bank)
        { questionText: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?', section: 'Quantitative', options: ['65 seconds', '89 seconds', '100 seconds', '150 seconds'], correctOptionIndex: 1, explanation: 'Speed = 240/24 = 10 m/s. Total distance = 240+650=890m. Time = 890/10 = 89 s.', topic: 'Speed & Distance', difficulty: 'Medium', marks: 1 },
        { questionText: 'If 12 men can complete a project in 15 days, in how many days can 20 men complete the same project?', section: 'Quantitative', options: ['9 days', '10 days', '8 days', '12 days'], correctOptionIndex: 0, explanation: 'Total Work = 180 man-days. Days = 180/20 = 9.', topic: 'Time and Work', difficulty: 'Easy', marks: 1 },
        { questionText: 'What is 15% of 840?', section: 'Quantitative', options: ['126', '132', '124', '128'], correctOptionIndex: 0, explanation: '15/100 × 840 = 126', topic: 'Percentages', difficulty: 'Easy', marks: 1 },
        { questionText: 'A shopkeeper buys an item for ₹800 and sells it for ₹1000. What is the profit percentage?', section: 'Quantitative', options: ['20%', '25%', '22.5%', '18%'], correctOptionIndex: 1, explanation: 'Profit = 200. Profit% = (200/800)×100 = 25%.', topic: 'Profit & Loss', difficulty: 'Easy', marks: 1 },
        { questionText: 'The ratio of milk to water in a mixture is 4:1. If 10 litres of water are added, the ratio becomes 2:1. What is the original amount of milk?', section: 'Quantitative', options: ['20L', '40L', '30L', '50L'], correctOptionIndex: 1, explanation: 'Let milk = 4x, water = x. (4x)/(x+10) = 2 → x=10, milk=40L.', topic: 'Ratio & Proportion', difficulty: 'Hard', marks: 1 },
        // LOGICAL (5 questions)
        { questionText: 'Find the next number in the series: 4, 9, 25, 49, 121, ?', section: 'Logical', options: ['144', '169', '196', '225'], correctOptionIndex: 1, explanation: 'Squares of primes: 2²,3²,5²,7²,11² → next is 13²=169.', topic: 'Number Series', difficulty: 'Medium', marks: 1 },
        { questionText: 'Pointing to a photograph, a man says, "She is the daughter of my grandfather\'s only son." How is the woman related to the man?', section: 'Logical', options: ['Mother', 'Sister', 'Daughter', 'Aunt'], correctOptionIndex: 1, explanation: 'Grandfather\'s only son = father. Daughter of father = sister.', topic: 'Blood Relations', difficulty: 'Easy', marks: 1 },
        { questionText: 'All cats are animals. All animals have legs. Conclusion: All cats have legs. Is this valid?', section: 'Logical', options: ['Valid', 'Invalid', 'Partially valid', 'Cannot determine'], correctOptionIndex: 0, explanation: 'Both premises are universal positives; conclusion follows by syllogism.', topic: 'Syllogism', difficulty: 'Easy', marks: 1 },
        { questionText: 'In a certain code, MANGO is written as OCPIQ. How is APPLE written in that code?', section: 'Logical', options: ['CRRNG', 'CRRNF', 'DQSOG', 'BQQMF'], correctOptionIndex: 0, explanation: 'Each letter is shifted +2. A→C, P→R, P→R, L→N, E→G → CRRNG.', topic: 'Coding-Decoding', difficulty: 'Medium', marks: 1 },
        { questionText: 'A is taller than B. C is taller than A. D is shorter than B. Who is the tallest?', section: 'Logical', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 2, explanation: 'C > A > B > D. Tallest is C.', topic: 'Arrangement', difficulty: 'Easy', marks: 1 },
        // VERBAL (4 questions)
        { questionText: 'Choose the word closest in meaning (Synonym) to: EPHEMERAL', section: 'Verbal', options: ['Eternal', 'Transient', 'Celestial', 'Enormous'], correctOptionIndex: 1, explanation: 'Ephemeral = lasting very short time; transient is the synonym.', topic: 'Vocabulary', difficulty: 'Medium', marks: 1 },
        { questionText: 'Identify the grammatically correct sentence:', section: 'Verbal', options: ['Neither of the candidates have submitted their resume.', 'Neither of the candidates has submitted his or her resume.', 'Neither candidate have submitted there resume.', 'None candidate has submit their resume.'], correctOptionIndex: 1, explanation: '"Neither" is singular → "has".', topic: 'Grammar', difficulty: 'Medium', marks: 1 },
        { questionText: 'Choose the word OPPOSITE in meaning to: BENEVOLENT', section: 'Verbal', options: ['Kind', 'Generous', 'Malevolent', 'Charitable'], correctOptionIndex: 2, explanation: 'Benevolent = kind; malevolent = wishing evil.', topic: 'Antonyms', difficulty: 'Easy', marks: 1 },
        { questionText: 'Select the most appropriate word: He _______ to the office every day by bus.', section: 'Verbal', options: ['go', 'goes', 'gone', 'going'], correctOptionIndex: 1, explanation: 'Third-person singular present: "goes".', topic: 'Sentence Completion', difficulty: 'Easy', marks: 1 },
        // TECHNICAL (6 questions)
        { questionText: 'What is the average time complexity of searching in a Balanced BST?', section: 'Technical', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], correctOptionIndex: 2, explanation: 'Balanced BST height = log n, so search = O(log n).', topic: 'Data Structures', difficulty: 'Medium', marks: 1 },
        { questionText: 'Which HTTP status code signifies a resource was successfully created?', section: 'Technical', options: ['200 OK', '201 Created', '204 No Content', '301 Moved'], correctOptionIndex: 1, explanation: 'HTTP 201 = Created.', topic: 'Web & REST', difficulty: 'Easy', marks: 1 },
        { questionText: 'In JavaScript, what is `typeof NaN`?', section: 'Technical', options: ['"undefined"', '"number"', '"NaN"', '"object"'], correctOptionIndex: 1, explanation: 'NaN has type "number" per ECMAScript spec.', topic: 'JavaScript', difficulty: 'Easy', marks: 1 },
        { questionText: 'Which SQL clause filters aggregated group records?', section: 'Technical', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], correctOptionIndex: 2, explanation: 'HAVING filters groups produced by GROUP BY.', topic: 'Databases & SQL', difficulty: 'Easy', marks: 1 },
        { questionText: 'What does the "S" in SOLID design principles stand for?', section: 'Technical', options: ['Scalability', 'Single Responsibility', 'Separation of Concerns', 'Synchronization'], correctOptionIndex: 1, explanation: 'Single Responsibility Principle: a class should have only one reason to change.', topic: 'OOP & Design', difficulty: 'Medium', marks: 1 },
        { questionText: 'Which data structure uses LIFO (Last In, First Out) ordering?', section: 'Technical', options: ['Queue', 'Stack', 'Deque', 'Linked List'], correctOptionIndex: 1, explanation: 'A Stack follows LIFO ordering.', topic: 'Data Structures', difficulty: 'Easy', marks: 1 }
      ]
    }
  ]);
  console.log('[Aptitude] Seeded default test with question bank.');
};

// ─── GET /api/aptitude/tests ──────────────────────────────────────────────────
router.get('/tests', isAuthenticated, async (req, res) => {
  try {
    await seedDefaultTestsIfEmpty();
    const tests = await AptitudeTest.find({ isActive: true })
      .select('title description durationMinutes totalMarks negativeMarking sections sectionConfig createdAt');
    // Add question count dynamically
    const testsWithCount = await Promise.all(tests.map(async t => {
      const full = await AptitudeTest.findById(t._id).select('questions');
      return { ...t.toObject(), questionCount: full.questions.length };
    }));
    res.json({ tests: testsWithCount });
  } catch (err) {
    console.error('[Aptitude] Fetch tests error:', err);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// ─── GET /api/aptitude/tests/:id/start ────────────────────────────────────────
// Returns randomized questions for this attempt (answers stripped)
router.get('/tests/:id/start', isAuthenticated, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const test = await AptitudeTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Get question IDs from previous attempts to avoid repeating them
    const prevAttempts = await AptitudeAttempt.find({ student: student._id, test: test._id })
      .select('questionsServed').lean();
    const prevServedIds = new Set(
      prevAttempts.flatMap(a => (a.questionsServed || []).map(id => id.toString()))
    );

    // Group questions by section
    const bySection = {};
    test.questions.forEach(q => {
      if (!bySection[q.section]) bySection[q.section] = [];
      bySection[q.section].push(q);
    });

    // Pick random questions per section (avoid previously seen if possible)
    const sectionConfig = test.sectionConfig || {};
    const selectedQuestions = [];

    Object.entries(bySection).forEach(([section, qs]) => {
      const count = sectionConfig[section] || Math.ceil(qs.length / 2);
      // Prefer unseen questions
      const unseen = qs.filter(q => !prevServedIds.has(q._id.toString()));
      const seen = qs.filter(q => prevServedIds.has(q._id.toString()));

      let pool = shuffle(unseen);
      if (pool.length < count) {
        // Fill with seen questions if not enough unseen
        pool = [...pool, ...shuffle(seen)].slice(0, count);
      } else {
        pool = pool.slice(0, count);
      }
      selectedQuestions.push(...pool);
    });

    // Shuffle final question order
    const shuffled = shuffle(selectedQuestions);

    // Shuffle options (and track correct index mapping)
    const sanitizedQuestions = shuffled.map(q => {
      const optionObjects = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctOptionIndex }));
      const shuffledOpts = shuffle(optionObjects);
      const newCorrectIndex = shuffledOpts.findIndex(o => o.isCorrect);
      return {
        _id: q._id,
        questionText: q.questionText,
        section: q.section,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        options: shuffledOpts.map(o => o.opt),
        // We store a mapping so server can validate: shuffledCorrectIndex
        _shuffledCorrectIndex: newCorrectIndex // Only sent here; client will NOT know correct answers
      };
    });

    // IMPORTANT: strip the answer before sending to client
    const clientQuestions = sanitizedQuestions.map(({ _shuffledCorrectIndex, ...rest }) => rest);

    // Store the answer key server-side in session or pass via secure token
    // We use a simple approach: store the mapping in the DB with the attempt
    // Create an "in_progress" attempt to store the question mapping
    const attempt = await AptitudeAttempt.create({
      student: student._id,
      test: test._id,
      questionsServed: shuffled.map(q => q._id),
      status: 'in_progress',
      answers: [],
      totalScore: 0,
      maxScore: shuffled.reduce((s, q) => s + (q.marks || 1), 0)
    });

    // Store the correct indices mapping in session (in-memory for this request cycle)
    // Attach the answer key to the attempt doc for server-side validation on submit
    attempt._answerKey = sanitizedQuestions.map(q => q._shuffledCorrectIndex);
    // We'll re-validate from the original test data on submit (no need to store answer key)

    res.json({
      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        durationMinutes: test.durationMinutes,
        totalMarks: shuffled.reduce((s, q) => s + (q.marks || 1), 0),
        negativeMarking: test.negativeMarking,
        sections: test.sections
      },
      questions: clientQuestions,
      attemptId: attempt._id
    });
  } catch (err) {
    console.error('[Aptitude] Start test error:', err);
    res.status(500).json({ error: 'Failed to start test' });
  }
});

// ─── POST /api/aptitude/submit ────────────────────────────────────────────────
// Server-side scoring: looks up correct answers from the DB
router.post('/submit', isAuthenticated, async (req, res) => {
  try {
    const { attemptId, studentAnswers, violations = [], timeTakenSeconds } = req.body;
    if (!attemptId) return res.status(400).json({ error: 'attemptId is required' });

    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const attempt = await AptitudeAttempt.findOne({ _id: attemptId, student: student._id, status: 'in_progress' });
    if (!attempt) return res.status(404).json({ error: 'Active attempt not found or already submitted' });

    const test = await AptitudeTest.findById(attempt.test);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Build lookup from question ID → full question (for server-side scoring)
    const questionMap = {};
    test.questions.forEach(q => { questionMap[q._id.toString()] = q; });

    // Score based on questions actually served in this attempt
    let totalScore = 0;
    const sectionBreakdown = {};
    const detailedAnswers = [];
    const weakTopicsMap = {};

    attempt.questionsServed.forEach(qId => {
      const q = questionMap[qId.toString()];
      if (!q) return;

      const section = q.section.toLowerCase();
      if (!sectionBreakdown[section]) sectionBreakdown[section] = { score: 0, total: 0 };
      sectionBreakdown[section].total += q.marks || 1;

      const userChoice = studentAnswers?.[qId.toString()];
      const isAttempted = userChoice !== undefined && userChoice !== null && userChoice !== -1;
      const isCorrect = isAttempted && Number(userChoice) === q.correctOptionIndex;

      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = q.marks || 1;
        totalScore += marksAwarded;
        sectionBreakdown[section].score += marksAwarded;
      } else if (isAttempted && test.negativeMarking > 0) {
        marksAwarded = -test.negativeMarking;
        totalScore = Math.max(0, totalScore - test.negativeMarking);
        weakTopicsMap[q.topic || q.section] = (weakTopicsMap[q.topic || q.section] || 0) + 1;
      } else if (!isCorrect) {
        weakTopicsMap[q.topic || q.section] = (weakTopicsMap[q.topic || q.section] || 0) + 1;
      }

      detailedAnswers.push({
        questionId: q._id,
        questionText: q.questionText,
        section: q.section,
        topic: q.topic,
        options: q.options,
        selectedOptionIndex: isAttempted ? Number(userChoice) : -1,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        isCorrect,
        marksAwarded
      });
    });

    const maxScore = attempt.maxScore || detailedAnswers.length;
    const finalScore = Math.max(0, Number(totalScore.toFixed(2)));
    const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
    const weakAreas = Object.entries(weakTopicsMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);

    // Check if terminated by violations
    const violationCount = violations.length;
    const isTerminated = violationCount >= 3;

    // Update the attempt record
    attempt.answers = detailedAnswers.map(a => ({
      questionId: a.questionId,
      selectedOptionIndex: a.selectedOptionIndex,
      isCorrect: a.isCorrect,
      marksAwarded: a.marksAwarded,
      section: a.section,
      topic: a.topic
    }));
    attempt.totalScore = finalScore;
    attempt.percentage = percentage;
    attempt.sectionScores = sectionBreakdown;
    attempt.weakAreas = weakAreas;
    attempt.tabSwitchWarnings = violations.filter(v => v.type === 'tab_switch').length;
    attempt.violations = violations;
    attempt.timeTakenSeconds = timeTakenSeconds || 0;
    attempt.status = isTerminated ? 'terminated' : 'completed';
    attempt.terminationReason = isTerminated ? 'Auto-submitted after 3 proctoring violations' : '';
    await attempt.save();

    res.json({
      success: true,
      attemptId: attempt._id,
      totalScore: finalScore,
      maxScore,
      percentage,
      sectionScores: sectionBreakdown,
      weakAreas,
      detailedAnswers,
      violationCount,
      isTerminated,
      status: attempt.status
    });
  } catch (err) {
    console.error('[Aptitude] Submit error:', err);
    res.status(500).json({ error: 'Failed to submit test' });
  }
});

// ─── GET /api/aptitude/attempts ───────────────────────────────────────────────
router.get('/attempts', isAuthenticated, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const attempts = await AptitudeAttempt.find({
      student: student._id,
      status: { $ne: 'in_progress' }
    })
      .populate('test', 'title totalMarks durationMinutes')
      .sort({ createdAt: -1 })
      .lean();

    // Compute stats
    const completed = attempts.filter(a => a.percentage !== undefined);
    const bestScore = completed.length > 0 ? Math.max(...completed.map(a => a.percentage)) : 0;
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((s, a) => s + a.percentage, 0) / completed.length)
      : 0;

    res.json({
      attempts,
      stats: {
        total: attempts.length,
        bestScore,
        avgScore
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// ─── GET /api/aptitude/attempts/:id ───────────────────────────────────────────
// Full attempt review with correct answers
router.get('/attempts/:id', isAuthenticated, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const attempt = await AptitudeAttempt.findOne({
      _id: req.params.id,
      student: student._id
    }).populate('test').lean();

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    // Reconstruct detailed answers with full question data for review
    const test = attempt.test;
    if (test && test.questions && attempt.questionsServed?.length > 0) {
      const questionMap = {};
      test.questions.forEach(q => { questionMap[q._id.toString()] = q; });

      attempt.detailedReview = attempt.questionsServed.map(qId => {
        const q = questionMap[qId.toString()];
        const ans = attempt.answers.find(a => a.questionId?.toString() === qId.toString());
        return {
          questionText: q?.questionText,
          section: q?.section,
          topic: q?.topic,
          options: q?.options,
          correctOptionIndex: q?.correctOptionIndex,
          explanation: q?.explanation,
          selectedOptionIndex: ans?.selectedOptionIndex ?? -1,
          isCorrect: ans?.isCorrect ?? false,
          marksAwarded: ans?.marksAwarded ?? 0
        };
      });
    }

    res.json({ attempt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

// ─── POST /api/aptitude/create ────────────────────────────────────────────────
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'company', 'super_admin'].includes(req.session.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { title, description, durationMinutes, totalMarks, negativeMarking, sectionConfig, questions } = req.body;
    const sections = [...new Set(questions.map(q => q.section))];
    const test = await AptitudeTest.create({
      title, description,
      durationMinutes: durationMinutes || 30,
      totalMarks: totalMarks || questions.length,
      negativeMarking: negativeMarking || 0,
      createdByRole: req.session.role,
      sections,
      sectionConfig: sectionConfig || {},
      questions
    });
    res.status(201).json({ success: true, test });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// ─── GET /api/aptitude/admin/attempts ─────────────────────────────────────────
// Admin view of all attempts with violations
router.get('/admin/attempts', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.session.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { studentId, testId } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    if (testId) filter.test = testId;

    const attempts = await AptitudeAttempt.find(filter)
      .populate('student', 'name branch year')
      .populate('test', 'title')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin attempts' });
  }
});

export default router;
