import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import CompanyProfile from '../models/Company.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();
const applicationStatuses = ['Applied', 'Shortlisted', 'Resume Shortlisted', 'Technical Round', 'HR Round', 'Selected', 'Rejected'];

const isCompanyOrAdmin = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Session expired or not authenticated. Please log in again.' });
    }
    if (!['company', 'admin', 'super_admin'].includes(req.session.role)) {
        return res.status(403).json({ error: 'Access denied. Company or Admin role required.' });
    }
    next();
};

// GET /api/company/dashboard
router.get('/dashboard', isCompanyOrAdmin, async (req, res) => {
    try {
        let company = null;
        let jobs = [];
        let applicants = 0;

        if (req.session.role === 'company') {
            company = await CompanyProfile.findOne({ user: req.session.userId });
            if (!company) return res.status(404).json({ error: 'Company profile not found' });
            jobs = await Job.find({ company: company._id });
            applicants = await Application.countDocuments({ company: company._id });
        } else {
            jobs = await Job.find();
            applicants = await Application.countDocuments();
        }

        res.json({ company, stats: { totalJobs: jobs.length, totalApplicants: applicants } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/company/jobs
router.get('/jobs', isCompanyOrAdmin, async (req, res) => {
    try {
        let jobs = [];
        if (req.session.role === 'company') {
            const company = await CompanyProfile.findOne({ user: req.session.userId });
            jobs = company ? await Job.find({ company: company._id }) : [];
        } else {
            jobs = await Job.find().populate('company');
        }
        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/company/jobs/:id (Get single job details)
router.get('/jobs/:id', isCompanyOrAdmin, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('company');
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json({ job });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/company/profile
router.get('/profile', isCompanyOrAdmin, async (req, res) => {
    try {
        let company = null;
        if (req.session.role === 'company') {
            company = await CompanyProfile.findOne({ user: req.session.userId });
        } else if (req.query.id) {
            company = await CompanyProfile.findById(req.query.id);
        } else {
            company = await CompanyProfile.findOne();
        }
        if (!company) return res.status(404).json({ error: 'Company profile not found' });
        res.json({ company });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/company/profile
router.put('/profile', isCompanyOrAdmin, async (req, res) => {
    try {
        let filter = {};
        if (req.session.role === 'company') {
            filter.user = req.session.userId;
        } else if (req.body._id) {
            filter._id = req.body._id;
        } else {
            return res.status(400).json({ error: 'Missing target company' });
        }

        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.user;

        const updated = await CompanyProfile.findOneAndUpdate(
            filter,
            { $set: updateData },
            { new: true, upsert: false }
        );

        if (!updated) return res.status(404).json({ error: 'Company profile not found' });
        res.json({ success: true, company: updated });
    } catch (err) {
        console.error('Company profile update error:', err);
        res.status(500).json({ error: 'Failed to update company profile' });
    }
});

// POST /api/company/jobs (Create Post with structured sections)
router.post('/jobs', isCompanyOrAdmin, async (req, res) => {
    try {
        let companyId = req.body.companyId;
        if (req.session.role === 'company') {
            const company = await CompanyProfile.findOne({ user: req.session.userId });
            if (!company) return res.status(404).json({ error: 'Company profile not found' });
            companyId = company._id;
        }
        if (!companyId) {
            const firstCompany = await CompanyProfile.findOne();
            if (firstCompany) companyId = firstCompany._id;
        }

        const locationsArray = Array.isArray(req.body.locations)
            ? req.body.locations.filter(Boolean)
            : (req.body.location ? req.body.location.split(',').map(s => s.trim()).filter(Boolean) : []);

        const newJob = await Job.create({
            company: companyId,
            role: req.body.role || req.body.jobTitle,
            description: req.body.description || '',
            campusDate: req.body.campusDate || 'To be shared soon',
            locations: locationsArray.length > 0 ? locationsArray : (req.body.location ? [req.body.location] : ['Noida']),
            location: locationsArray.join(', ') || req.body.location || 'Noida',
            workingPattern: req.body.workingPattern || 'General - 5 days working',
            requiredSkills: Array.isArray(req.body.requiredSkills) ? req.body.requiredSkills : (req.body.requiredSkills ? req.body.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
            expectedJoining: req.body.expectedJoining || 'Immediate',
            deadline: req.body.deadline,
            jobType: req.body.jobType || 'Full-time',
            openings: Number(req.body.openings) || 1,

            // Eligibility
            eligibleDegrees: req.body.eligibleDegrees || ['MCA', 'BCA', 'B.Tech'],
            allowedBranches: req.body.allowedBranches || ['All'],
            allowedPassingYears: req.body.allowedPassingYears || ['2026', '2027'],
            minCgpa: Number(req.body.minCgpa) || 0,
            min10thPercentage: Number(req.body.min10thPercentage) || 0,
            min12thPercentage: Number(req.body.min12thPercentage) || 0,
            minGradPercentage: Number(req.body.minGradPercentage) || 0,
            maxBacklogs: Number(req.body.maxBacklogs) || 0,
            noCriterion: Boolean(req.body.noCriterion),

            // Compensation
            stipend: req.body.stipend || { amount: '', duration: '' },
            ctc: req.body.ctc || { total: req.body.salary || 'Competitive', fixed: '', variable: '', conditions: '' },
            salary: req.body.salary || req.body.ctc?.total || 'Competitive',
            otherBenefits: req.body.otherBenefits || '',

            // Bond
            hasBond: Boolean(req.body.hasBond),
            bondDuration: req.body.bondDuration || '',
            bondAmount: req.body.bondAmount || '',
            bondTerms: req.body.bondTerms || '',

            // Interview Process
            interviewRounds: req.body.interviewRounds || [
                { roundNumber: 1, name: 'Online Aptitude & Technical Assessment', mode: 'Online', description: 'Coding & MCQs' },
                { roundNumber: 2, name: 'Technical Interview', mode: 'Online', description: 'Core CS and project evaluation' },
                { roundNumber: 3, name: 'HR Interview', mode: 'Online', description: 'Culture fit & offer discussion' }
            ],

            status: req.body.status || 'published'
        });
        res.json({ success: true, newJob });
    } catch (err) {
        console.error("Job Creation Error:", err);
        res.status(500).json({ error: 'Submit error' });
    }
});

// PUT /api/company/jobs/:id (Edit Post)
router.put('/jobs/:id', isCompanyOrAdmin, async (req, res) => {
    try {
        let filter = { _id: req.params.id };
        if (req.session.role === 'company') {
            const company = await CompanyProfile.findOne({ user: req.session.userId });
            if (company) {
                filter.company = company._id;
            }
        }
        const updatedJob = await Job.findOneAndUpdate(
            filter,
            { $set: req.body },
            { new: true }
        );
        if (!updatedJob) return res.status(404).json({ error: 'Job not found' });
        res.json({ success: true, updatedJob });
    } catch (err) {
        res.status(500).json({ error: 'Update error' });
    }
});

// DELETE /api/company/jobs/:id
router.delete('/jobs/:id', isCompanyOrAdmin, async (req, res) => {
    try {
        let filter = { _id: req.params.id };
        if (req.session.role === 'company') {
            const company = await CompanyProfile.findOne({ user: req.session.userId });
            if (company) {
                filter.company = company._id;
            }
        }
        const deletedJob = await Job.findOneAndDelete(filter);
        if (!deletedJob) return res.status(404).json({ error: 'Job not found' });
        await Application.deleteMany({ job: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Deletion error' });
    }
});

// GET /api/company/jobs/:id/applicants
router.get('/jobs/:id/applicants', isCompanyOrAdmin, async (req, res) => {
    try {
        const applications = await Application.find({ job: req.params.id })
            .populate('student')
            .sort({ matchScore: -1 });

        res.json({ applications });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/company/applications/:id/status
router.put('/applications/:id/status', isCompanyOrAdmin, async (req, res) => {
    try {
        if (!applicationStatuses.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });

        const app = await Application.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!app) return res.status(404).json({ error: 'Application not found' });

        const statusTypeMap = {
            'Shortlisted': {
                type: 'shortlisted',
                title: 'You are Shortlisted',
                message: 'Congratulations! You have been shortlisted for the next stage.',
            },
            'Resume Shortlisted': {
                type: 'shortlisted',
                title: 'You are Shortlisted',
                message: 'Great news! Your resume has been shortlisted.',
            },
            'Technical Round': {
                type: 'round_result',
                title: 'Technical Round Update',
                message: 'You cleared the previous stage and moved to Technical Round.',
            },
            'HR Round': {
                type: 'round_result',
                title: 'HR Round Update',
                message: 'You cleared the previous stage and moved to HR Round.',
            },
            'Selected': {
                type: 'offer_received',
                title: 'Offer Received',
                message: 'Congratulations! You have received an offer.',
            },
            'Rejected': {
                type: 'application_rejected',
                title: 'Application Update',
                message: 'Thank you for applying. You were not selected this time. Keep applying to new opportunities.',
            },
        };

        const mapped = statusTypeMap[req.body.status];
        if (mapped) {
            await createNotification({
                studentId: app.student,
                applicationId: app._id,
                jobId: app.job,
                type: mapped.type,
                title: mapped.title,
                message: mapped.message,
                metadata: { applicationStatus: req.body.status },
                channels: ['in_app', 'email', 'sms', 'push'],
                actor: { id: req.session.userId, role: 'recruiter' },
            });
        }

        res.json({ success: true, application: app });
    } catch (err) {
        res.status(500).json({ error: 'Error updating' });
    }
});

router.post('/applications/:id/review', isCompanyOrAdmin, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ error: 'Application not found' });

        await createNotification({
            studentId: application.student,
            applicationId: application._id,
            jobId: application.job,
            type: 'application_under_review',
            title: 'Application Under Review',
            message: 'Your application has been opened and is currently under review.',
            channels: ['in_app', 'email'],
            actor: { id: req.session.userId, role: 'recruiter' },
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send review notification' });
    }
});

router.post('/applications/:id/interview-schedule', isCompanyOrAdmin, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ error: 'Application not found' });

        const { dateTime, mode, venue } = req.body;
        if (!dateTime) return res.status(400).json({ error: 'dateTime is required' });

        const scheduledAt = new Date(dateTime);

        await createNotification({
            studentId: application.student,
            applicationId: application._id,
            jobId: application.job,
            type: 'interview_scheduled',
            title: 'Interview Scheduled',
            message: `Interview scheduled on ${scheduledAt.toLocaleString()} (${mode || 'TBD'}). Venue: ${venue || 'TBD'}.`,
            metadata: { dateTime: scheduledAt, mode: mode || 'online', venue: venue || 'TBD' },
            channels: ['in_app', 'email', 'sms', 'push'],
            actor: { id: req.session.userId, role: 'recruiter' },
        });

        const reminder24 = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
        const reminder1 = new Date(scheduledAt.getTime() - 60 * 60 * 1000);

        if (reminder24 > new Date()) {
            await createNotification({
                studentId: application.student,
                applicationId: application._id,
                jobId: application.job,
                type: 'interview_reminder_24h',
                title: 'Interview Reminder (24h)',
                message: `Reminder: your interview is tomorrow at ${scheduledAt.toLocaleString()}.`,
                metadata: { dateTime: scheduledAt, mode: mode || 'online', venue: venue || 'TBD' },
                channels: ['in_app', 'email', 'sms', 'push'],
                actor: { id: req.session.userId, role: 'recruiter' },
                scheduledFor: reminder24,
            });
        }

        if (reminder1 > new Date()) {
            await createNotification({
                studentId: application.student,
                applicationId: application._id,
                jobId: application.job,
                type: 'interview_reminder_1h',
                title: 'Interview Reminder (1h)',
                message: `Reminder: your interview starts in 1 hour (${scheduledAt.toLocaleString()}).`,
                metadata: { dateTime: scheduledAt, mode: mode || 'online', venue: venue || 'TBD' },
                channels: ['in_app', 'email', 'sms', 'push'],
                actor: { id: req.session.userId, role: 'recruiter' },
                scheduledFor: reminder1,
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to schedule interview notification' });
    }
});

router.post('/applications/:id/document-request', isCompanyOrAdmin, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ error: 'Application not found' });

        const requiredDocuments = req.body.requiredDocuments || [];
        await createNotification({
            studentId: application.student,
            applicationId: application._id,
            jobId: application.job,
            type: 'document_required',
            title: 'Additional Documents Required',
            message: req.body.message || 'Additional documents were requested by the recruiter.',
            metadata: { requiredDocuments },
            channels: ['in_app', 'email', 'sms'],
            actor: { id: req.session.userId, role: 'recruiter' },
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send document request notification' });
    }
});

/**
 * GET /api/company/applications/:appId/resume
 * 
 * Allows a company or admin to download/view an applicant's resume.
 */
router.get('/applications/:appId/resume', isCompanyOrAdmin, async (req, res) => {
    try {
        const { appId } = req.params;

        // 1. Fetch the application with student and job details
        const application = await Application.findById(appId)
            .populate('student')
            .populate('job');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // 2. If company, verify company owns the job
        if (req.session.role === 'company') {
            const company = await CompanyProfile.findOne({ user: req.session.userId });
            if (!company) {
                return res.status(403).json({ error: 'Company profile not found' });
            }

            if (application.job && application.job.company && application.job.company.toString() !== company._id.toString()) {
                return res.status(403).json({ error: 'Unauthorized: This application does not belong to your company' });
            }
        }

        // 3. Check if student has a resume
        if (!application.student || !application.student.resumeFile || !application.student.resumeFile.data) {
            return res.status(404).json({ error: 'Resume not found for this applicant' });
        }

        // 4. Set proper headers for file download/display
        const contentType = application.student.resumeFile.contentType || 'application/pdf';
        const filename = application.student.resumeUrl || `${application.student.name}-resume.pdf`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        // 5. Send the binary resume data
        res.send(application.student.resumeFile.data);

    } catch (err) {
        console.error('Error fetching resume:', err);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});

export default router;
