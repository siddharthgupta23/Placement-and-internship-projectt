import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import StudentProfile from '../models/Student.js';
import { createNotification } from '../services/notificationService.js';
import { sendJobApplicationEmail } from '../services/emailService.js';
import { sendJobApplicationSms } from '../services/smsService.js';

const router = express.Router();

// Seed active upcoming jobs if all existing jobs have passed deadlines
const seedActiveJobsIfEmpty = async () => {
    try {
        const now = new Date();
        const activeCount = await Job.countDocuments({
            status: 'published',
            deadline: { $gte: now }
        });

        if (activeCount === 0) {
            const CompanyProfile = (await import('../models/Company.js')).default;
            const approvedCompany = await CompanyProfile.findOne({ status: 'approved' }) || 
                                    await CompanyProfile.findOne();

            if (approvedCompany) {
                await Job.create([
                    {
                        company: approvedCompany._id,
                        role: 'Cloud & Full Stack Engineer',
                        description: 'Exciting campus hiring role working on modern microservices, React web applications, and AWS/GCP cloud platforms.',
                        locations: ['Noida', 'Gurgaon', 'Bangalore'],
                        location: 'Noida',
                        requiredSkills: ['React', 'Node.js', 'MongoDB', 'AWS', 'JavaScript'],
                        deadline: new Date('2026-11-20T23:59:59.000Z'),
                        jobType: 'Full-time',
                        openings: 8,
                        eligibleDegrees: ['MCA', 'B.Tech', 'BCA'],
                        allowedBranches: ['All', 'CSE', 'IT', 'MCA'],
                        allowedPassingYears: ['2026', '2027'],
                        minCgpa: 6.5,
                        salary: '8.5 - 12 LPA',
                        ctc: { total: '12 LPA', fixed: '10 LPA', variable: '2 LPA' },
                        status: 'published'
                    },
                    {
                        company: approvedCompany._id,
                        role: 'Associate Software Development Engineer (SDE-1)',
                        description: 'Core product engineering team. Design, develop and deploy scalable backend services and responsive frontends.',
                        locations: ['Noida', 'Hyderabad'],
                        location: 'Noida',
                        requiredSkills: ['Java', 'Python', 'React', 'SQL', 'Data Structures'],
                        deadline: new Date('2026-11-15T23:59:59.000Z'),
                        jobType: 'Full-time',
                        openings: 12,
                        eligibleDegrees: ['MCA', 'B.Tech'],
                        allowedBranches: ['CSE', 'IT', 'ECE', 'MCA'],
                        allowedPassingYears: ['2026'],
                        minCgpa: 7.0,
                        salary: '10 - 15 LPA',
                        ctc: { total: '15 LPA', fixed: '12 LPA', variable: '3 LPA' },
                        status: 'published'
                    },
                    {
                        company: approvedCompany._id,
                        role: 'AI & Data Science Analyst',
                        description: 'Machine learning pipelines, predictive modeling, data analysis, and intelligent dashboard automation.',
                        locations: ['Bangalore', 'Remote'],
                        location: 'Bangalore',
                        requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'SQL', 'TensorFlow'],
                        deadline: new Date('2026-11-30T23:59:59.000Z'),
                        jobType: 'Full-time',
                        openings: 5,
                        eligibleDegrees: ['MCA', 'B.Tech', 'BCA'],
                        allowedBranches: ['All'],
                        allowedPassingYears: ['2026', '2027'],
                        minCgpa: 6.8,
                        salary: '9 - 13.5 LPA',
                        ctc: { total: '13.5 LPA', fixed: '11 LPA', variable: '2.5 LPA' },
                        status: 'published'
                    },
                    {
                        company: approvedCompany._id,
                        role: 'DevOps & Site Reliability Engineer',
                        description: 'Container orchestration with Docker & Kubernetes, CI/CD pipeline automation, and high availability systems monitoring.',
                        locations: ['Noida', 'Pune'],
                        location: 'Noida',
                        requiredSkills: ['Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Python'],
                        deadline: new Date('2026-11-25T23:59:59.000Z'),
                        jobType: 'Full-time',
                        openings: 4,
                        eligibleDegrees: ['MCA', 'B.Tech'],
                        allowedBranches: ['All', 'CSE', 'IT', 'MCA'],
                        allowedPassingYears: ['2026'],
                        minCgpa: 6.5,
                        salary: '8 - 11 LPA',
                        ctc: { total: '11 LPA', fixed: '9.5 LPA', variable: '1.5 LPA' },
                        status: 'published'
                    }
                ]);
            }
        }
    } catch (e) {
        console.error('Error seeding active jobs:', e);
    }
};

// GET /api/jobs
router.get('/', async (req, res) => {
    try {
        await seedActiveJobsIfEmpty();

        const filters = {};
        if (req.query.role) filters.role = new RegExp(req.query.role, 'i');
        if (req.query.location) filters.location = new RegExp(req.query.location, 'i');

        // By default, only show open jobs whose deadlines have NOT passed
        // Use ?includeExpired=true or ?status=all to view historical/closed jobs
        const includeExpired = req.query.includeExpired === 'true' || req.query.status === 'all';
        if (!includeExpired) {
            filters.status = 'published';
            filters.$or = [
                { deadline: { $exists: false } },
                { deadline: null },
                { deadline: { $gte: new Date() } }
            ];
        }

        let jobs = await Job.find(filters).populate('company', 'name website status headquarters branchLocations googleMapsUrl about achievements productsServices employeeCount establishedYear turnover logo');
        jobs = jobs.filter(j => j.company && j.company.status === 'approved');

        if (req.session.role === 'student') {
            const student = await StudentProfile.findOne({ user: req.session.userId });
            if (student && student.skills.length > 0) {
                const studentSkills = new Set(student.skills.map(s => s.toLowerCase()));
                
                jobs = jobs.map(job => {
                    const jobObj = job.toObject();
                    const reqSkills = job.requiredSkills.map(s => s.toLowerCase());
                    let match = 0;
                    reqSkills.forEach(s => { if (studentSkills.has(s)) match++; });
                    jobObj.matchScore = reqSkills.length > 0 ? Math.round((match / reqSkills.length) * 100) : 0;
                    return jobObj;
                });
                jobs.sort((a, b) => b.matchScore - a.matchScore);
            }
        }

        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching jobs' });
    }
});

// POST /api/jobs/:id/apply
router.post('/:id/apply', async (req, res) => {
    if (req.session.role !== 'student') return res.status(403).json({ error: 'Only students can apply' });
    
    try {
        if (!req.params.id?.match(/^[a-f\d]{24}$/i)) {
            return res.status(400).json({ error: 'Invalid job id' });
        }

        const student = await StudentProfile.findOne({ user: req.session.userId });
        const job = await Job.findById(req.params.id).populate('company', 'name');
        
        if (!student) return res.status(404).json({ error: 'Student profile not found' });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        if (job.deadline && new Date(job.deadline) < new Date()) {
            return res.status(400).json({ error: 'Application deadline for this job has already passed.' });
        }
        if (job.status === 'closed') {
            return res.status(400).json({ error: 'This job posting has been closed by recruiter.' });
        }

        const existing = await Application.findOne({ student: student._id, job: job._id });
        if (existing) return res.status(400).json({ error: 'Already applied' });

        const studentSkills = new Set(student.skills.map(s => s.toLowerCase()));
        const reqSkills = job.requiredSkills.map(s => s.toLowerCase());
        let match = 0;
        reqSkills.forEach(s => { if (studentSkills.has(s)) match++; });
        const matchScore = reqSkills.length > 0 ? Math.round((match / reqSkills.length) * 100) : 0;

        const application = await Application.create({
            student: student._id,
            job: job._id,
            company: job.company?._id || job.company,
            matchScore,
            status: 'Applied',
            answers: req.body.answers || [],
            resumeSnapshot: {
                fileName: student.resumeFile?.fileName || student.resumeUrl || 'resume.pdf',
                resumeUrl: student.resumeUrl || '',
                uploadedAt: student.resumeFile?.uploadedAt || new Date()
            }
        });

        const companyName = job.company?.name || 'Corporate Partner';

        // Direct email dispatch to student Gmail
        const recipientEmail = student.email || req.session?.email;
        if (recipientEmail && recipientEmail.includes('@')) {
            sendJobApplicationEmail(
                recipientEmail,
                student.name || 'Candidate',
                companyName,
                job.role
            );
        }

        // Direct SMS alert dispatch to student phone
        if (student.phone) {
            sendJobApplicationSms(
                student.phone,
                student.name || 'Candidate',
                companyName,
                job.role
            );
        }

        await createNotification({
            studentId: student._id,
            applicationId: application._id,
            jobId: job._id,
            type: 'application_submitted',
            title: `Application Submitted — ${job.role}`,
            message: `Your application for ${job.role} at ${companyName} was submitted successfully.`,
            channels: ['in_app', 'email', 'sms', 'push']
        });

        res.status(201).json({ success: true, application });

    } catch (err) {
        console.error(err);

        if (err?.code === 11000) {
            return res.status(400).json({ error: 'Already applied' });
        }

        res.status(500).json({ error: 'Server error while submitting application' });
    }
});

// GET /api/jobs/applications - get all student applications
router.get('/applications/me', async (req, res) => {
    try {
        let student = null;
        if (req.session?.userId) {
            student = await StudentProfile.findOne({ user: req.session.userId });
        }
        if (!student) {
            student = await StudentProfile.findOne();
        }
        if (!student) return res.json({ applications: [] });

        const applications = await Application.find({
            $or: [{ student: student._id }, { studentId: student._id }]
        })
            .populate({ path: 'job', populate: { path: 'company', select: 'name' } })
            .sort({ appliedOn: -1 });

        res.json({ applications });
    } catch (err) {
        console.error('Error fetching applications:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/jobs/applications/:id/withdraw
router.patch('/applications/:id/withdraw', async (req, res) => {
    if (req.session.role !== 'student') return res.status(403).json({ error: 'Only students can withdraw applications' });
    
    try {
        const student = await StudentProfile.findOne({ user: req.session.userId });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        const application = await Application.findOne({ _id: req.params.id, student: student._id });
        if (!application) return res.status(404).json({ error: 'Application not found' });

        if (!['Applied', 'Shortlisted', 'Resume Shortlisted'].includes(application.status)) {
            return res.status(400).json({ error: `Cannot withdraw application currently in '${application.status}' status` });
        }

        application.status = 'Withdrawn';
        await application.save();

        res.json({ success: true, application });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while withdrawing application' });
    }
});

export default router;
