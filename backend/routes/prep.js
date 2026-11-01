import express from 'express';
import PrepResource from '../models/PrepResource.js';
import StudentPrepProgress from '../models/StudentPrepProgress.js';
import StudentProfile from '../models/Student.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in' });
  }
  next();
};

// Seed default preparation resources if collection is empty
const seedDefaultPrepResources = async () => {
  const count = await PrepResource.countDocuments();
  if (count === 0) {
    await PrepResource.create([
      {
        title: 'Top 50 Frontend & React Technical Questions',
        category: 'technical_notes',
        role: 'Frontend Engineer',
        company: 'Product Companies (Google, Microsoft, Amazon)',
        difficulty: 'Medium',
        content: `### Essential Core Concepts
1. **Virtual DOM & Reconciliation**: How React uses fiber tree diffing to minimize real DOM mutations.
2. **React Hooks Lifecycle**: useEffect dependencies, useCallback vs useMemo memoization tradeoffs.
3. **State Management**: Redux Toolkit, Context API, Zustand, and avoiding unnecessary re-renders.
4. **Web Performance**: Code splitting with dynamic imports, lazy loading, Core Web Vitals (LCP, FID, CLS).`,
        sampleAnswer: 'Explain closure, event bubbling, and microtask vs macrotask execution order in the JavaScript event loop.',
        tags: ['React', 'JavaScript', 'DOM', 'Performance'],
        readingTimeMinutes: 8
      },
      {
        title: 'Backend API Design & Distributed Microservices Notes',
        category: 'technical_notes',
        role: 'Backend Engineer',
        company: 'Fintech & Scaled Tech',
        difficulty: 'Hard',
        content: `### Key Principles
1. **Idempotency**: Ensuring POST/PUT operations with idempotent keys prevent duplicate payment or write requests.
2. **Database Sharding & Replication**: Read replicas, write-ahead logs, connection pooling.
3. **Rate Limiting & Caching**: Token bucket algorithm, Redis caching strategies (cache-aside, write-through).
4. **Message Queues**: RabbitMQ vs Apache Kafka for asynchronous processing.`,
        sampleAnswer: 'Walk through handling high concurrency in a flash sale using distributed locks (Redis Redlock) and optimistic concurrency control.',
        tags: ['Node.js', 'System Design', 'Redis', 'Kafka'],
        readingTimeMinutes: 10
      },
      {
        title: 'Behavioral & HR Question Bank: The STAR Method Guide',
        category: 'hr_bank',
        role: 'All Roles',
        company: 'General',
        difficulty: 'Medium',
        content: `### Master the STAR Structure
- **Situation**: Context of the challenge (15% of your time).
- **Task**: The specific responsibility you owned (15%).
- **Action**: Concrete technical/leadership actions YOU took (50%).
- **Result**: Quantifiable outcomes and metrics (20%).`,
        sampleAnswer: 'Example: "Tell me about a time you missed a deadline." Focus on proactive communication, mitigation strategy, and process improvements implemented afterwards.',
        tags: ['HR', 'Behavioral', 'STAR Method', 'Soft Skills'],
        readingTimeMinutes: 6
      },
      {
        title: 'Amazon Leadership Principles & Behavioral Matrix',
        category: 'company_questions',
        role: 'Software Engineer',
        company: 'Amazon',
        difficulty: 'Hard',
        content: `### High Priority Principles
1. **Customer Obsession**: Start with customer and work backwards.
2. **Ownership**: Leaders act on behalf of the entire company, beyond just their own team.
3. **Deliver Results**: Rise to the occasion and deliver despite setbacks.
4. **Bias for Action**: Speed matters in business; calculate risks.`,
        sampleAnswer: 'Prepare 2 unique stories per principle from your academic projects and internships.',
        tags: ['Amazon', 'Leadership Principles', 'Interviews'],
        readingTimeMinutes: 7
      },
      {
        title: 'Group Discussion Mastery: Frameworks & High-Scoring Strategies',
        category: 'gd_topics',
        role: 'All Roles',
        company: 'Campus Placement Drives',
        difficulty: 'Easy',
        content: `### GD Success Blueprint
- **Opening**: Give a clear definition and broad perspective if you know the topic well.
- **Moderation**: Bring straying participants back on track politely to gain leadership points.
- **Structure (PESTLE Framework)**: Political, Economic, Social, Technological, Legal, Environmental angles.
- **Conclusion**: Summarize multi-sided viewpoints clearly in 30 seconds.`,
        sampleAnswer: 'Topic: "AI in Recruitment: Boon or Threat to Job Seekers?" Frame as an augmentation tool for resume parsing while human review is vital for cultural fit.',
        tags: ['Group Discussion', 'Communication', 'TPO'],
        readingTimeMinutes: 5
      },
      {
        title: 'Resume Tips & ATS Optimization Checklist 2026',
        category: 'resume_tips',
        role: 'All Roles',
        company: 'General',
        difficulty: 'Easy',
        content: `### Essential Checklist
- **Single Page Format**: Clean typography, no multi-column parsing traps for ATS.
- **Action Verbs + Metrics**: Format each bullet as "Accomplished [X] as measured by [Y] by doing [Z]".
- **Standard Section Headers**: Experience, Projects, Skills, Education.
- **File Format**: Standard PDF under 5 MB.`,
        sampleAnswer: 'Always include live demo URLs and GitHub repository links for top projects.',
        tags: ['Resume', 'ATS', 'Job Search'],
        readingTimeMinutes: 4
      }
    ]);
  }
};

// GET /api/prep/resources - Get prep resources with filtering
router.get('/resources', isAuthenticated, async (req, res) => {
  try {
    await seedDefaultPrepResources();

    const { category, role, difficulty, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (role && role !== 'All') filter.role = new RegExp(role, 'i');
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const resources = await PrepResource.find(filter).sort({ createdAt: -1 });

    // If student, attach their progress
    let userProgress = { bookmarked: [], completed: [] };
    if (req.session.role === 'student') {
      const student = await StudentProfile.findOne({ user: req.session.userId });
      if (student) {
        const prog = await StudentPrepProgress.findOne({ student: student._id });
        if (prog) {
          userProgress.bookmarked = prog.bookmarkedResources.map(id => id.toString());
          userProgress.completed = prog.completedResources.map(id => id.toString());
        }
      }
    }

    res.json({ resources, userProgress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preparation resources' });
  }
});

// POST /api/prep/toggle-bookmark - Bookmark or unbookmark resource
router.post('/toggle-bookmark', isAuthenticated, async (req, res) => {
  try {
    const { resourceId } = req.body;
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let prog = await StudentPrepProgress.findOne({ student: student._id });
    if (!prog) {
      prog = await StudentPrepProgress.create({ student: student._id, bookmarkedResources: [], completedResources: [] });
    }

    const existsIndex = prog.bookmarkedResources.findIndex(id => id.toString() === resourceId);
    let isBookmarked = false;

    if (existsIndex > -1) {
      prog.bookmarkedResources.splice(existsIndex, 1);
    } else {
      prog.bookmarkedResources.push(resourceId);
      isBookmarked = true;
    }

    await prog.save();
    res.json({ success: true, isBookmarked });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

// POST /api/prep/toggle-complete - Mark topic as completed
router.post('/toggle-complete', isAuthenticated, async (req, res) => {
  try {
    const { resourceId } = req.body;
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let prog = await StudentPrepProgress.findOne({ student: student._id });
    if (!prog) {
      prog = await StudentPrepProgress.create({ student: student._id, bookmarkedResources: [], completedResources: [] });
    }

    const existsIndex = prog.completedResources.findIndex(id => id.toString() === resourceId);
    let isCompleted = false;

    if (existsIndex > -1) {
      prog.completedResources.splice(existsIndex, 1);
    } else {
      prog.completedResources.push(resourceId);
      isCompleted = true;
    }

    await prog.save();
    res.json({ success: true, isCompleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update completion status' });
  }
});

// POST /api/prep/create - Admin creation of prep materials
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.session.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const resource = await PrepResource.create({
      ...req.body,
      createdBy: req.session.userId
    });

    res.status(201).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

export default router;
