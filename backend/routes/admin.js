import express from 'express';
import User from '../models/User.js';
import StudentProfile from '../models/Student.js';
import CompanyProfile from '../models/Company.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { generateAIInsights } from '../services/geminiService.js';
import { sendEmailAsync } from '../services/emailService.js';

const router = express.Router();

// All 6 canonical statuses + an "Other" bucket for anything unexpected
const CANONICAL_STATUSES = ['Applied', 'Shortlisted', 'Technical Round', 'HR Round', 'Selected', 'Rejected'];

// Status priority for "most advanced" (higher index = more advanced)
const STATUS_PRIORITY = {
  'Applied': 0, 'Resume Shortlisted': 1, 'Shortlisted': 1,
  'Technical Round': 2, 'HR Round': 3, 'Selected': 4, 'Rejected': -1,
  'Withdrawn': -2, 'Other': -3
};

function normalizeStatus(status) {
  if (!status) return 'Other';
  if (status === 'Resume Shortlisted') return 'Shortlisted';
  if (CANONICAL_STATUSES.includes(status)) return status;
  return 'Other';
}

const isAdmin = (req, res, next) => {
  if (!req.session?.userId || !['admin', 'super_admin'].includes(req.session.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const [numStudents, numCompanies, numJobs, numApps] = await Promise.all([
      StudentProfile.countDocuments(),
      CompanyProfile.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments()
    ]);

    // ── By-Application distribution (must sum to numApps exactly) ──
    const appStatusAgg = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const byApplications = { Applied: 0, Shortlisted: 0, 'Technical Round': 0, 'HR Round': 0, Selected: 0, Rejected: 0, Other: 0 };
    appStatusAgg.forEach(({ _id: status, count }) => {
      const key = normalizeStatus(status);
      byApplications[key] = (byApplications[key] || 0) + count;
    });
    // Sanity check: total should equal numApps
    const appTotal = Object.values(byApplications).reduce((s, v) => s + v, 0);

    // ── Distinct-student count (students who applied, not application count) ──
    const distinctStudentCount = await Application.distinct('student').then(ids => ids.length);

    // ── By-Student distribution (each student counted once by most-advanced status) ──
    // Group all apps per student and pick the one with the highest priority
    const perStudentAgg = await Application.aggregate([
      {
        $group: {
          _id: '$student',
          statuses: { $push: '$status' }
        }
      }
    ]);

    const byStudents = { Applied: 0, Shortlisted: 0, 'Technical Round': 0, 'HR Round': 0, Selected: 0, Rejected: 0, Other: 0 };
    perStudentAgg.forEach(({ statuses }) => {
      // Pick the most-advanced status for this student
      const mostAdvanced = statuses.reduce((best, curr) => {
        const bPriority = STATUS_PRIORITY[normalizeStatus(best)] ?? -99;
        const cPriority = STATUS_PRIORITY[normalizeStatus(curr)] ?? -99;
        return cPriority > bPriority ? curr : best;
      }, statuses[0] || 'Applied');
      const key = normalizeStatus(mostAdvanced);
      byStudents[key] = (byStudents[key] || 0) + 1;
    });

    // AI-computed insights (non-blocking: use cached/fallback if Gemini fails)
    let aiInsights = null;
    try {
      const [students, jobs, applications] = await Promise.all([
        StudentProfile.find().select('skills cgpa branch year').lean(),
        Job.find().select('requiredSkills role').lean(),
        Application.find().select('status student').lean()
      ]);
      aiInsights = await generateAIInsights(students, jobs, applications);
    } catch (e) {
      console.warn('[AdminDashboard] AI insights unavailable:', e.message);
    }

    // Real skill gap: compute from student profiles vs job requirements
    const students = await StudentProfile.find().select('skills').lean();
    const jobs = await Job.find().select('requiredSkills').lean();
    const allRequiredSkills = jobs.flatMap(j => (j.requiredSkills || []).map(s => s.toLowerCase()));
    const reqSkillFreq = {};
    allRequiredSkills.forEach(s => { reqSkillFreq[s] = (reqSkillFreq[s] || 0) + 1; });

    const totalStudents = students.length;
    const skillGapMap = {};
    Object.entries(reqSkillFreq).forEach(([skill, jobCount]) => {
      const studentsWithSkill = students.filter(st =>
        (st.skills || []).map(s => s.toLowerCase()).includes(skill)
      ).length;
      const lacking = totalStudents - studentsWithSkill;
      if (lacking > 0) {
        skillGapMap[skill] = {
          skill,
          studentsLacking: lacking,
          percentLacking: totalStudents > 0 ? Math.round((lacking / totalStudents) * 100) : 0,
          demandCount: jobCount
        };
      }
    });
    const topSkillGaps = Object.values(skillGapMap)
      .sort((a, b) => b.studentsLacking - a.studentsLacking)
      .slice(0, 10);

    res.json({
      stats: {
        students: numStudents,
        companies: numCompanies,
        jobs: numJobs,
        applications: numApps,
        studentsWhoApplied: distinctStudentCount,
        statusDistribution: {
          ...byApplications,
          byApplications,
          byStudents,
          appTotal
        }
      },
      topSkillGaps,
      aiInsights
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Dashboard error' });
  }
});

// ─── GET /api/admin/applications ─────────────────────────────────────────────
// Paginated, filterable, searchable
router.get('/applications', isAdmin, async (req, res) => {
  try {
    const {
      status,
      search,
      company: companyFilter,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      studentId // for drill-down
    } = req.query;

    const filter = {};

    // Status filter (also handle Shortlisted alias)
    if (status === 'Shortlisted') {
      filter.status = { $in: ['Shortlisted', 'Resume Shortlisted'] };
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.appliedOn = {};
      if (startDate) filter.appliedOn.$gte = new Date(startDate);
      if (endDate) filter.appliedOn.$lte = new Date(endDate);
    }

    // Student drill-down filter
    if (studentId) {
      filter.student = studentId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit) || 20, 100); // max 100 per page

    // Build base query
    let query = Application.find(filter)
      .populate({
        path: 'student',
        select: 'name branch year skills user',
        populate: { path: 'user', select: 'email userId' }
      })
      .populate('company', 'name')
      .populate('job', 'role')
      .sort({ appliedOn: -1 });

    // Get total count for pagination
    const total = await Application.countDocuments(filter);

    // Apply search AFTER populate (filter by student name or company name)
    let apps = await query.lean();

    if (search) {
      const s = search.toLowerCase();
      apps = apps.filter(app =>
        app.student?.name?.toLowerCase().includes(s) ||
        app.company?.name?.toLowerCase().includes(s) ||
        app.job?.role?.toLowerCase().includes(s) ||
        app.student?.user?.userId?.toLowerCase().includes(s)
      );
    }

    // Company filter (by name, after populate)
    if (companyFilter) {
      const cf = companyFilter.toLowerCase();
      apps = apps.filter(app => app.company?.name?.toLowerCase().includes(cf));
    }

    // Apply pagination after filtering
    const filteredTotal = apps.length;
    const paginated = apps.slice(skip, skip + limitNum);

    const applications = paginated.map(app => ({
      ...app,
      normalizedStatus: normalizeStatus(app.status)
    }));

    res.json({
      applications,
      pagination: {
        total: search || companyFilter ? filteredTotal : total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil((search || companyFilter ? filteredTotal : total) / limitNum)
      }
    });
  } catch (err) {
    console.error('Fetch applications error:', err);
    res.status(500).json({ error: 'Fetch applications error' });
  }
});

// ─── GET /api/admin/applications/student/:studentId ────────────────────────────
// All applications for a single student (drill-down)
router.get('/applications/student/:studentId', isAdmin, async (req, res) => {
  try {
    const apps = await Application.find({ student: req.params.studentId })
      .populate('company', 'name')
      .populate('job', 'role location stipend')
      .sort({ appliedOn: -1 })
      .lean();

    const student = await StudentProfile.findById(req.params.studentId)
      .populate('user', 'email userId')
      .lean();

    res.json({
      student,
      applications: apps.map(app => ({
        ...app,
        normalizedStatus: normalizeStatus(app.status)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Fetch student applications error' });
  }
});

// ─── GET /api/admin/companies ─────────────────────────────────────────────────
router.get('/companies', isAdmin, async (req, res) => {
  try {
    const companies = await CompanyProfile.find().populate('user', 'email');
    res.json({ companies });
  } catch (err) {
    res.status(500).json({ error: 'Fetch companies error' });
  }
});

// ─── PUT /api/admin/companies/:id/status ──────────────────────────────────────
router.put('/companies/:id/status', isAdmin, async (req, res) => {
  try {
    const company = await CompanyProfile.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json({ company });
  } catch (err) {
    res.status(500).json({ error: 'Update error' });
  }
});

// ─── GET /api/admin/students ──────────────────────────────────────────────────
router.get('/students', isAdmin, async (req, res) => {
  try {
    const students = await StudentProfile.find().populate('user', 'email userId');
    res.json({ students });
  } catch (err) {
    console.error('Fetch students error:', err);
    res.status(500).json({ error: 'Fetch students error' });
  }
});

// ─── GET /api/admin/jobs ──────────────────────────────────────────────────────
router.get('/jobs', isAdmin, async (req, res) => {
  try {
    const jobs = await Job.find().populate('company', 'name');
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: 'Fetch jobs error' });
  }
});

// ─── POST /api/admin/test-email ───────────────────────────────────────────────
router.post('/test-email', isAdmin, async (req, res) => {
  const { to } = req.body;
  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid "to" email address.' });
  }
  try {
    await sendEmailAsync({
      to,
      subject: 'Test Email from Placement Portal',
      heading: '✅ SMTP Test Successful!',
      bodyContent: `
        <p>This is a test email sent from the <strong>JIMS Placement Portal</strong> admin panel.</p>
        <p>If you received this, your SMTP configuration is working correctly!</p>
        <div class="info-box">
          <p><strong>Sent at:</strong> ${new Date().toLocaleString('en-IN')}</p>
          <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || '(not set)'}</p>
        </div>
      `
    });
    res.json({ success: true, message: `Test email dispatched to ${to}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send test email', details: err.message });
  }
});

// ─── GET /api/admin/smart-insights ────────────────────────────────────────────
// Returns real computed insights (no AI dependency for core data)
router.get('/smart-insights', isAdmin, async (req, res) => {
  try {
    const [students, jobs, applications] = await Promise.all([
      StudentProfile.find().select('skills cgpa branch year resumeScore').lean(),
      Job.find().select('requiredSkills role').lean(),
      Application.find().select('status student').lean()
    ]);

    const totalStudents = students.length;

    // Resume score distribution
    const resumeScores = students.map(s => s.resumeScore || 0).filter(s => s > 0);
    const avgResumeScore = resumeScores.length > 0
      ? Math.round(resumeScores.reduce((a, b) => a + b, 0) / resumeScores.length)
      : 0;
    const scoreDistribution = [
      { range: '0-20', count: resumeScores.filter(s => s <= 20).length },
      { range: '21-40', count: resumeScores.filter(s => s > 20 && s <= 40).length },
      { range: '41-60', count: resumeScores.filter(s => s > 40 && s <= 60).length },
      { range: '61-80', count: resumeScores.filter(s => s > 60 && s <= 80).length },
      { range: '81-100', count: resumeScores.filter(s => s > 80).length }
    ];

    // Platform-wide skill gap
    const allRequiredSkills = jobs.flatMap(j => (j.requiredSkills || []).map(s => s.toLowerCase()));
    const reqSkillFreq = {};
    allRequiredSkills.forEach(s => { reqSkillFreq[s] = (reqSkillFreq[s] || 0) + 1; });

    const skillGaps = Object.entries(reqSkillFreq).map(([skill, demandCount]) => {
      const studentsWithSkill = students.filter(st =>
        (st.skills || []).map(s => s.toLowerCase()).includes(skill)
      ).length;
      const lacking = totalStudents - studentsWithSkill;
      return {
        skill,
        studentsLacking: lacking,
        studentsHaving: studentsWithSkill,
        percentLacking: totalStudents > 0 ? Math.round((lacking / totalStudents) * 100) : 0,
        demandCount
      };
    }).sort((a, b) => b.studentsLacking - a.studentsLacking).slice(0, 15);

    // Students with high skill gap (> 3 missing required skills)
    const highGapStudents = students.map(student => {
      const studentSkills = new Set((student.skills || []).map(s => s.toLowerCase()));
      const missingCount = Object.keys(reqSkillFreq).filter(s => !studentSkills.has(s)).length;
      return { ...student, missingSkillsCount: missingCount };
    }).filter(s => s.missingSkillsCount > 3)
      .sort((a, b) => b.missingSkillsCount - a.missingSkillsCount);

    res.json({
      totalStudents,
      avgResumeScore,
      scoreDistribution,
      skillGaps,
      highGapStudents: highGapStudents.slice(0, 20)
    });
  } catch (err) {
    console.error('Smart insights error:', err);
    res.status(500).json({ error: 'Failed to compute insights' });
  }
});

export default router;
