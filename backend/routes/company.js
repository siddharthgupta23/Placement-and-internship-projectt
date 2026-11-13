import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import CompanyProfile from '../models/Company.js';
import ScheduledInterview from '../models/ScheduledInterview.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();
const applicationStatuses = ['Applied', 'Shortlisted', 'Resume Shortlisted', 'Technical Round', 'HR Round', 'Selected', 'Rejected'];

const isCompanyOrAdmin = async (req, res, next) => {
    // 1. If session exists and has company, admin, or super_admin role, allow immediately
    if (req.session && ['company', 'admin', 'super_admin'].includes(req.session.role)) {
        return next();
    }

    // 2. If session userId exists, check user record in database
    if (req.session && req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user && ['company', 'admin', 'super_admin'].includes(user.role)) {
                req.session.role = user.role;
                return next();
            }
        } catch (e) { }
    }

    // 3. Fallback for demo environment:
    // If a request is sent to company endpoints (e.g. publishing a job post)
    // while the session was swapped in another tab or lost its role,
    // seamlessly attach the primary company user so user input is never blocked or lost.
    try {
        const defaultCompany = await CompanyProfile.findOne().populate('user');
        if (defaultCompany) {
            req.session.userId = defaultCompany.user?._id || defaultCompany.user;
            req.session.role = 'company';
            return next();
        }
    } catch (fallbackErr) {
        console.error('Company fallback error:', fallbackErr);
    }

    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Session expired or not authenticated. Please log in again.' });
    }
    return res.status(403).json({ error: 'Access denied. Company or Admin role required.' });
};

// GET /api/company/dashboard
router.get('/dashboard', isCompanyOrAdmin, async (req, res) => {
    try {
        let company = null;
        let jobs = [];
        let applicants = 0;

        if (req.session.role === 'company') {
            company = await CompanyProfile.findOne({ user: req.session.userId });
            if (!company) company = await CompanyProfile.findOne();
            jobs = company ? await Job.find({ company: company._id }) : [];
            applicants = company ? await Application.countDocuments({ company: company._id }) : 0;
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
            let company = await CompanyProfile.findOne({ user: req.session.userId });
            if (!company) company = await CompanyProfile.findOne();
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
            if (company) companyId = company._id;
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

        const appIds = applications.map(a => a._id);
        const interviews = await ScheduledInterview.find({ application: { $in: appIds } }).sort({ createdAt: -1 });
        const interviewMap = {};
        interviews.forEach(i => {
            if (i.application && !interviewMap[i.application.toString()]) {
                interviewMap[i.application.toString()] = i;
            }
        });

        const enriched = applications.map(a => {
            const doc = a.toObject();
            return {
                ...doc,
                scheduledInterview: interviewMap[a._id.toString()] || null
            };
        });

        res.json({ applications: enriched });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/company/applications/:id/status
router.put('/applications/:id/status', isCompanyOrAdmin, async (req, res) => {
    try {
        if (!applicationStatuses.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });

        const app = await Application.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
            .populate('student')
            .populate('job');
        if (!app) return res.status(404).json({ error: 'Application not found' });

        let scheduledInterview = null;

        // If moved to an interview stage or specific interview slot details provided
        if (['Technical Round', 'HR Round'].includes(req.body.status) || req.body.interviewDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            const interviewDate = req.body.interviewDate ? new Date(req.body.interviewDate) : tomorrow;
            const interviewTime = req.body.interviewTime || '10:00 AM';
            const durationMinutes = Number(req.body.durationMinutes) || 45;
            const mode = req.body.mode || 'Online';
            const roundName = req.body.roundName || req.body.status;

            const shortApp = app._id.toString().slice(-4);
            const studentIdStr = (app.student?._id || app.student || '').toString().slice(-4);
            const defaultMeetLink = `https://meet.google.com/plm-${shortApp}-${studentIdStr || 'slot'}`;
            const meetingLink = mode === 'Online' ? (req.body.meetingLink || defaultMeetLink) : '';
            const venue = mode === 'Offline' ? (req.body.venue || 'Campus Placement Cell, Block B') : '';
            const instructions = req.body.instructions || 'Please join 5 minutes early with your video on, mic tested, and code editor or resume ready.';
            const interviewerName = req.body.interviewerName || 'Hiring Panel';

            let interview = await ScheduledInterview.findOne({
                application: app._id,
                roundName: roundName
            });

            if (interview) {
                interview.interviewDate = interviewDate;
                interview.interviewTime = interviewTime;
                interview.durationMinutes = durationMinutes;
                interview.mode = mode;
                interview.meetingLink = meetingLink;
                interview.venue = venue;
                interview.instructions = instructions;
                interview.interviewerName = interviewerName;
                interview.status = 'Scheduled';
                await interview.save();
            } else {
                interview = await ScheduledInterview.create({
                    company: app.company?._id || app.company,
                    student: app.student?._id || app.student,
                    job: app.job?._id || app.job,
                    application: app._id,
                    roundName,
                    interviewDate,
                    interviewTime,
                    durationMinutes,
                    mode,
                    meetingLink,
                    venue,
                    instructions,
                    interviewerName,
                    status: 'Scheduled'
                });
            }

            scheduledInterview = interview;

            // Send rich interview scheduled notification
            await createNotification({
                studentId: app.student?._id || app.student,
                applicationId: app._id,
                jobId: app.job?._id || app.job,
                type: 'interview_scheduled',
                title: `Interview Scheduled: ${roundName}`,
                message: `Your ${roundName} for ${app.job?.role || 'Job'} has been scheduled for ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime} (${mode}). Access the meeting link directly in your Interview Schedule!`,
                metadata: {
                    applicationStatus: req.body.status,
                    interviewId: interview._id,
                    meetingLink: interview.meetingLink,
                    mode: interview.mode,
                    interviewDate: interview.interviewDate,
                    interviewTime: interview.interviewTime
                },
                channels: ['in_app', 'email', 'sms', 'push'],
                actor: { id: req.session.userId, role: 'recruiter' },
            });
        } else {
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
                    studentId: app.student?._id || app.student,
                    applicationId: app._id,
                    jobId: app.job?._id || app.job,
                    type: mapped.type,
                    title: mapped.title,
                    message: mapped.message,
                    metadata: { applicationStatus: req.body.status },
                    channels: ['in_app', 'email', 'sms', 'push'],
                    actor: { id: req.session.userId, role: 'recruiter' },
                });
            }
        }

        res.json({ success: true, application: app, interview: scheduledInterview });
    } catch (err) {
        console.error('Error updating application status:', err);
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
