import express from 'express';
import Job from '../models/Job.js';
import StudentProfile from '../models/Student.js';
import Application from '../models/Application.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in' });
  }
  next();
};

/**
 * Helper to compute precise eligibility checklist for a student against a job
 */
function evaluateEligibility(student, job) {
  const criteria = [];
  let isEligible = true;

  // 0. No Criterion Override
  if (job.noCriterion) {
    return {
      isEligible: true,
      overallMatchPercentage: 100,
      criteria: [{
        criterion: 'Eligibility Policy',
        required: 'Open Drive (No criteria restrictions)',
        studentValue: 'All students eligible',
        passed: true,
        reason: 'Recruiter has enabled No Criterion for this opening.'
      }],
      matchedSkills: job.requiredSkills || [],
      missingSkills: []
    };
  }

  // 1. CGPA Criterion
  const requiredCgpa = job.minCgpa || 0;
  const studentCgpa = student.cgpa || 0;
  const cgpaPass = studentCgpa >= requiredCgpa;
  criteria.push({
    criterion: 'Minimum CGPA Requirement',
    required: `${requiredCgpa.toFixed(1)} CGPA`,
    studentValue: `${studentCgpa.toFixed(1)} CGPA`,
    passed: cgpaPass,
    reason: cgpaPass 
      ? `Your CGPA (${studentCgpa}) meets or exceeds the required ${requiredCgpa}.`
      : `Your CGPA (${studentCgpa}) is below the required ${requiredCgpa}.`
  });
  if (!cgpaPass) isEligible = false;

  // 2. Degree / Branch Criterion
  const allowedBranches = job.allowedBranches || ['All'];
  const eligibleDegrees = job.eligibleDegrees || [];
  const studentBranch = (student.branch || '').toUpperCase().trim();
  const studentDegree = (student.degree || student.course || '').toUpperCase().trim();

  const isBranchAll = allowedBranches.includes('All') || allowedBranches.length === 0;
  const branchPass = isBranchAll || allowedBranches.some(b => studentBranch.includes(b.toUpperCase()) || (b.toUpperCase() === 'ALL'));
  const degreePass = eligibleDegrees.length === 0 || eligibleDegrees.some(d => studentBranch.includes(d.toUpperCase()) || studentDegree.includes(d.toUpperCase()));

  const programPass = branchPass || degreePass;
  criteria.push({
    criterion: 'Degree & Branch Requirement',
    required: [...new Set([...eligibleDegrees, ...allowedBranches])].join(', ') || 'All Programs',
    studentValue: student.branch || studentDegree || 'Not Set',
    passed: programPass,
    reason: programPass 
      ? `Your degree / branch (${student.branch || studentDegree || 'General'}) is eligible.`
      : `Allowed: ${[...new Set([...eligibleDegrees, ...allowedBranches])].join(', ')}. Yours: ${student.branch || 'Not specified'}.`
  });
  if (!programPass) isEligible = false;

  // 3. Passing Year / Batch Criterion
  if (job.allowedPassingYears && job.allowedPassingYears.length > 0) {
    const studentYear = String(student.year || student.passingYear || '').trim();
    const yearPass = !studentYear || job.allowedPassingYears.includes(studentYear) || job.allowedPassingYears.some(y => studentYear.includes(y));
    criteria.push({
      criterion: 'Eligible Passing Year / Batch',
      required: job.allowedPassingYears.join(', '),
      studentValue: studentYear || 'Current Batch',
      passed: yearPass,
      reason: yearPass
        ? `Your batch (${studentYear || 'current'}) is eligible.`
        : `Target batch: ${job.allowedPassingYears.join(', ')}. Yours: ${studentYear}.`
    });
    if (!yearPass) isEligible = false;
  }

  // 4. Backlogs Criterion
  const maxBacklogsAllowed = job.maxBacklogs || 0;
  const studentBacklogs = student.backlogs || 0;
  const backlogsPass = studentBacklogs <= maxBacklogsAllowed;
  criteria.push({
    criterion: 'Maximum Active Backlogs Allowed',
    required: `${maxBacklogsAllowed} active backlogs max`,
    studentValue: `${studentBacklogs} active backlogs`,
    passed: backlogsPass,
    reason: backlogsPass 
      ? `You have ${studentBacklogs} backlogs, which is within the allowed limit (${maxBacklogsAllowed}).`
      : `Job allows max ${maxBacklogsAllowed} backlogs, but you have ${studentBacklogs}.`
  });
  if (!backlogsPass) isEligible = false;

  // 5. 10th / 12th Percentage Criteria (if configured)
  if (job.min10thPercentage && job.min10thPercentage > 0) {
    const student10th = student.tenthPercentage || student.class10thPercentage || 80;
    const tenthPass = student10th >= job.min10thPercentage;
    criteria.push({
      criterion: '10th Standard Cutoff',
      required: `${job.min10thPercentage}%`,
      studentValue: `${student10th}%`,
      passed: tenthPass,
      reason: tenthPass ? `10th percentage criteria satisfied.` : `Requires minimum ${job.min10thPercentage}%.`
    });
    if (!tenthPass) isEligible = false;
  }

  if (job.min12thPercentage && job.min12thPercentage > 0) {
    const student12th = student.twelfthPercentage || student.class12thPercentage || 80;
    const twelfthPass = student12th >= job.min12thPercentage;
    criteria.push({
      criterion: '12th Standard Cutoff',
      required: `${job.min12thPercentage}%`,
      studentValue: `${student12th}%`,
      passed: twelfthPass,
      reason: twelfthPass ? `12th percentage criteria satisfied.` : `Requires minimum ${job.min12thPercentage}%.`
    });
    if (!twelfthPass) isEligible = false;
  }

  // 6. Skills Match
  const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase().trim());
  const studentSkills = new Set((student.skills || []).map(s => s.toLowerCase().trim()));
  const matchedSkills = reqSkills.filter(s => studentSkills.has(s));
  const missingSkills = reqSkills.filter(s => !studentSkills.has(s));
  const skillMatchPct = reqSkills.length > 0 ? Math.round((matchedSkills.length / reqSkills.length) * 100) : 100;

  criteria.push({
    criterion: 'Required Skills Match',
    required: `${reqSkills.length} skills (${reqSkills.slice(0, 3).join(', ')}${reqSkills.length > 3 ? '...' : ''})`,
    studentValue: `${matchedSkills.length} matched (${skillMatchPct}%)`,
    passed: skillMatchPct >= 30,
    reason: `You have ${matchedSkills.length} of ${reqSkills.length} required skills.`
  });

  return {
    isEligible,
    overallMatchPercentage: skillMatchPct,
    criteria,
    matchedSkills,
    missingSkills
  };
}

// GET /api/eligibility/check-all - Check student eligibility across all open jobs
router.get('/check-all', isAuthenticated, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const includeExpired = req.query.includeExpired === 'true';
    const query = includeExpired 
      ? {} 
      : {
          status: 'published',
          $or: [
            { deadline: { $exists: false } },
            { deadline: null },
            { deadline: { $gte: new Date() } }
          ]
        };

    const jobs = await Job.find(query).populate('company', 'name website');

    const now = new Date();
    const evaluations = jobs.map(job => {
      const evalResult = evaluateEligibility(student, job);
      const isExpired = job.deadline ? new Date(job.deadline) < now : false;
      return {
        jobId: job._id,
        role: job.role,
        company: job.company?.name || 'Recruiter',
        location: job.location,
        salary: job.salary,
        deadline: job.deadline,
        requiredSkills: job.requiredSkills,
        status: job.status,
        isExpired,
        canApply: !isExpired && job.status !== 'closed' && evalResult.isEligible,
        ...evalResult
      };
    });

    const eligibleCount = evaluations.filter(e => e.isEligible).length;

    res.json({
      studentInfo: {
        name: student.name,
        branch: student.branch,
        cgpa: student.cgpa,
        backlogs: student.backlogs,
        skillsCount: (student.skills || []).length
      },
      eligibleCount,
      totalJobs: jobs.length,
      evaluations
    });

  } catch (err) {
    console.error('Eligibility check error:', err);
    res.status(500).json({ error: 'Failed to compute eligibility' });
  }
});

// GET /api/eligibility/job/:jobId - Check student eligibility for a specific job
router.get('/job/:jobId', isAuthenticated, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const job = await Job.findById(req.params.jobId).populate('company', 'name');
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const evalResult = evaluateEligibility(student, job);

    res.json({
      jobId: job._id,
      role: job.role,
      company: job.company?.name,
      ...evalResult
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check job eligibility' });
  }
});

// GET /api/eligibility/company-stats - Company view of eligible vs applied candidates
router.get('/company-stats/:jobId', isAuthenticated, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const allStudents = await StudentProfile.find();
    let eligibleCount = 0;

    allStudents.forEach(student => {
      const evalResult = evaluateEligibility(student, job);
      if (evalResult.isEligible) eligibleCount++;
    });

    const appliedCount = await Application.countDocuments({ job: job._id });

    res.json({
      jobId: job._id,
      role: job.role,
      eligiblePoolSize: eligibleCount,
      appliedCount,
      conversionRate: eligibleCount > 0 ? Math.round((appliedCount / eligibleCount) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company candidate stats' });
  }
});

export default router;
