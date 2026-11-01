import express from 'express';
import StudentProfile from '../models/Student.js';
import Job from '../models/Job.js';
import InterviewSession from '../models/InterviewSession.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';

const router = express.Router();

const isStudent = (req, res, next) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  if (req.session.role !== 'student') return res.status(403).json({ error: 'Only students allowed' });
  next();
};

// Learning resources dictionary
const RESOURCE_RECOMMENDATIONS = {
  'react': {
    title: 'Modern React & Component Patterns',
    url: 'https://react.dev/learn',
    type: 'Official Documentation & Projects',
    difficulty: 'Intermediate'
  },
  'node.js': {
    title: 'Node.js Backend Architecture & Event Loop',
    url: 'https://nodejs.org/en/learn',
    type: 'Documentation & API Guides',
    difficulty: 'Intermediate'
  },
  'python': {
    title: 'Python for Developers & Data Structures',
    url: 'https://docs.python.org/3/tutorial/',
    type: 'Interactive Tutorial',
    difficulty: 'Beginner to Advanced'
  },
  'aws': {
    title: 'AWS Cloud Practitioner & Serverless Core',
    url: 'https://aws.amazon.com/training/',
    type: 'Cloud Certification Path',
    difficulty: 'Intermediate'
  },
  'docker': {
    title: 'Docker & Containerization Essentials',
    url: 'https://docs.docker.com/get-started/',
    type: 'Hands-on Labs',
    difficulty: 'Intermediate'
  },
  'kubernetes': {
    title: 'Kubernetes Cluster Orchestration',
    url: 'https://kubernetes.io/docs/tutorials/',
    type: 'Enterprise DevOps',
    difficulty: 'Advanced'
  },
  'sql': {
    title: 'SQL Indexing & Advanced Query Optimization',
    url: 'https://mode.com/sql-tutorial/',
    type: 'Query Practicum',
    difficulty: 'Intermediate'
  },
  'mongodb': {
    title: 'MongoDB Aggregation Pipelines & Schema Design',
    url: 'https://learn.mongodb.com/',
    type: 'Database University',
    difficulty: 'Intermediate'
  },
  'system design': {
    title: 'High-Level System Design & Scalability',
    url: 'https://github.com/donnemartin/system-design-primer',
    type: 'Architecture Primer',
    difficulty: 'Advanced'
  },
  'data structures': {
    title: 'Data Structures & Algorithms Mastery',
    url: 'https://leetcode.com/explore/',
    type: 'Problem Solving Platform',
    difficulty: 'Intermediate to Hard'
  },
  'typescript': {
    title: 'TypeScript Full Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    type: 'Static Typing Mastery',
    difficulty: 'Intermediate'
  }
};

// GET /api/skill-gap/analysis - Comprehensive student skill gap analysis
router.get('/analysis', isStudent, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    // 1. Gather student skills
    const studentSkills = new Set((student.skills || []).map(s => s.toLowerCase().trim()));

    // 2. Fetch available target jobs
    const targetJobs = await Job.find().populate('company', 'name');
    
    // 3. Aggregate all required skills from market jobs
    const marketSkillDemand = {};
    targetJobs.forEach(job => {
      (job.requiredSkills || []).forEach(sk => {
        const lower = sk.toLowerCase().trim();
        marketSkillDemand[lower] = (marketSkillDemand[lower] || 0) + 1;
      });
    });

    // 4. Gather weaknesses from Mock Interviews
    const recentInterviews = await InterviewSession.find({ student: student._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const interviewWeaknesses = [
      ...new Set(recentInterviews.flatMap(i => i.weaknesses || []))
    ];

    // 5. Gather weak areas from Aptitude Tests
    const recentAptitudes = await AptitudeAttempt.find({ student: student._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const aptitudeWeaknesses = [
      ...new Set(recentAptitudes.flatMap(a => a.weakAreas || []))
    ];

    // 6. Calculate role-based skill match & missing skills
    const roleAnalyses = targetJobs.map(job => {
      const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase().trim());
      const matched = reqSkills.filter(s => studentSkills.has(s));
      const missing = reqSkills.filter(s => !studentSkills.has(s));
      const matchPct = reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 100;
      const gapPct = 100 - matchPct;

      return {
        jobId: job._id,
        role: job.role,
        company: job.company?.name || 'Top Recruiter',
        salary: job.salary,
        requiredSkills: reqSkills,
        matchedSkills: matched,
        missingSkills: missing,
        matchPercentage: matchPct,
        gapPercentage: gapPct
      };
    });

    // Overall missing high-demand skills
    const overallMissingSkills = Object.entries(marketSkillDemand)
      .filter(([skill]) => !studentSkills.has(skill))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, demandCount]) => {
        const resource = RESOURCE_RECOMMENDATIONS[skill] || {
          title: `Mastering ${skill.toUpperCase()} - Complete Roadmap`,
          url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial roadmap')}`,
          type: 'Guided Tutorial & Docs',
          difficulty: 'Intermediate'
        };

        return {
          skill,
          demandCount,
          learningResource: resource,
          suggestedAction: `Practice building 1 mini-project or solve 5 problems in ${skill}.`
        };
      });

    // Calculate overall student readiness score
    const avgMatchScore = roleAnalyses.length > 0 
      ? Math.round(roleAnalyses.reduce((sum, r) => sum + r.matchPercentage, 0) / roleAnalyses.length)
      : 70;

    res.json({
      success: true,
      studentSkills: student.skills || [],
      skillProficiencies: student.skillProficiencies || [],
      avgReadinessScore: avgMatchScore,
      roleAnalyses: roleAnalyses.slice(0, 10),
      overallMissingSkills,
      interviewWeaknesses,
      aptitudeWeaknesses
    });

  } catch (err) {
    console.error('Skill gap analysis error:', err);
    res.status(500).json({ error: 'Server error generating skill gap analysis' });
  }
});

// POST /api/skill-gap/skills - Update student skill proficiencies
router.post('/skills', isStudent, async (req, res) => {
  try {
    const { skills, skillProficiencies } = req.body;
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (skills) student.skills = skills;
    if (skillProficiencies) student.skillProficiencies = skillProficiencies;

    await student.save();
    res.json({ success: true, profile: student });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update skills' });
  }
});

export default router;
