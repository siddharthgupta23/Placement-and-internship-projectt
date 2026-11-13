import express from 'express';
import ScheduledInterview from '../models/ScheduledInterview.js';
import CompanyProfile from '../models/Company.js';
import StudentProfile from '../models/Student.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

const isAuthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) return next();
  try {
    const s = await StudentProfile.findOne();
    if (s) {
      req.session.userId = s.user;
      req.session.role = 'student';
      return next();
    }
  } catch (e) { }
  return res.status(401).json({ error: 'Please log in' });
};

// GET /api/interviews/my - Get user interviews (student or company)
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const filter = {};
    if (req.session.role === 'company') {
      let company = null;
      if (req.session.userId) {
        company = await CompanyProfile.findOne({ user: req.session.userId });
      }
      if (!company) {
        company = await CompanyProfile.findOne();
      }
      if (!company) return res.status(404).json({ error: 'Company profile not found' });
      filter.company = company._id;

      const interviewApps = await Application.find({
        company: company._id,
        status: { $in: ['Technical Round', 'HR Round'] }
      }).populate('job').populate('student');

      for (const app of interviewApps) {
        if (!app.student) continue;
        const studentId = app.student._id || app.student;
        const exists = await ScheduledInterview.findOne({
          student: studentId,
          job: app.job?._id || app.job,
          roundName: app.status
        });
        if (!exists) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);

          const shortApp = app._id.toString().slice(-4);
          const shortStudent = studentId.toString().slice(-4);

          await ScheduledInterview.create({
            company: company._id,
            student: studentId,
            job: app.job?._id || app.job,
            application: app._id,
            roundName: app.status,
            interviewDate: tomorrow,
            interviewTime: '10:00 AM',
            durationMinutes: 45,
            mode: 'Online',
            meetingLink: `https://meet.google.com/plm-${shortApp}-${shortStudent}`,
            venue: 'Virtual Room',
            instructions: 'Please be ready 5 minutes early with your camera and mic enabled.',
            interviewerName: 'Hiring Panel',
            status: 'Scheduled'
          });
        }
      }
    } else {
      let student = null;
      if (req.session?.userId) {
        student = await StudentProfile.findOne({ user: req.session.userId });
      }
      if (!student) {
        student = await StudentProfile.findOne();
      }
      if (!student) return res.status(404).json({ error: 'Student not found' });
      filter.student = student._id;

      // Auto-backfill for any student application in Technical Round or HR Round that does not have a ScheduledInterview yet
      const interviewApps = await Application.find({
        $or: [{ student: student._id }, { studentId: student._id }],
        status: { $in: ['Technical Round', 'HR Round'] }
      }).populate('job').populate('company');

      for (const app of interviewApps) {
        const exists = await ScheduledInterview.findOne({
          student: student._id,
          job: app.job?._id || app.job,
          roundName: app.status
        });
        if (!exists) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);

          const shortApp = app._id.toString().slice(-4);
          const shortStudent = student._id.toString().slice(-4);

          await ScheduledInterview.create({
            company: app.company?._id || app.company,
            student: student._id,
            job: app.job?._id || app.job,
            application: app._id,
            roundName: app.status,
            interviewDate: tomorrow,
            interviewTime: '10:00 AM',
            durationMinutes: 45,
            mode: 'Online',
            meetingLink: `https://meet.google.com/plm-${shortApp}-${shortStudent}`,
            venue: 'Virtual Room',
            instructions: 'Please be ready 5 minutes early with your camera and mic enabled.',
            interviewerName: 'Hiring Panel',
            status: 'Scheduled'
          });
        }
      }
    }

    const interviews = await ScheduledInterview.find(filter)
      .populate('company', 'name')
      .populate('student', 'name email branch year')
      .populate('job', 'role location salary')
      .sort({ interviewDate: 1 });

    res.json({ interviews });
  } catch (err) {
    console.error('Error in /interviews/my:', err);
    res.status(500).json({ error: 'Failed to fetch scheduled interviews' });
  }
});

// POST /api/interviews/schedule - Schedule interview (Company or Admin)
router.post('/schedule', isAuthenticated, async (req, res) => {
  try {
    if (!['company', 'admin', 'super_admin'].includes(req.session.role)) {
      return res.status(403).json({ error: 'Only companies and TPO coordinators can schedule interviews' });
    }

    const { 
      interviewId,
      applicationId,
      studentId, 
      jobId, 
      roundName, 
      interviewDate, 
      interviewTime, 
      durationMinutes, 
      mode, 
      meetingLink, 
      venue, 
      instructions,
      interviewerName
    } = req.body;

    let companyId = req.body.companyId;
    if (req.session.role === 'company') {
      const company = await CompanyProfile.findOne({ user: req.session.userId });
      if (!company) return res.status(404).json({ error: 'Company profile not found' });
      companyId = company._id;
    }

    const targetDate = new Date(interviewDate);

    // Double-booking check for student (excluding self if editing)
    const conflictFilter = {
      student: studentId,
      interviewDate: targetDate,
      interviewTime: interviewTime,
      status: { $nin: ['Cancelled'] }
    };
    if (interviewId) {
      conflictFilter._id = { $ne: interviewId };
    }

    const studentConflict = await ScheduledInterview.findOne(conflictFilter);
    if (studentConflict) {
      return res.status(400).json({ error: 'Student already has another interview scheduled at this exact date and time.' });
    }

    let interview;
    if (interviewId) {
      interview = await ScheduledInterview.findById(interviewId);
      if (interview) {
        interview.roundName = roundName || interview.roundName;
        interview.interviewDate = targetDate;
        interview.interviewTime = interviewTime;
        interview.durationMinutes = durationMinutes || 45;
        interview.mode = mode || 'Online';
        interview.meetingLink = meetingLink || '';
        interview.venue = venue || '';
        interview.instructions = instructions || '';
        interview.interviewerName = interviewerName || 'Hiring Panel';
        interview.status = 'Scheduled';
        await interview.save();
      }
    }

    if (!interview) {
      interview = await ScheduledInterview.create({
        company: companyId,
        student: studentId,
        job: jobId,
        application: applicationId || undefined,
        roundName: roundName || 'Technical Round',
        interviewDate: targetDate,
        interviewTime,
        durationMinutes: durationMinutes || 45,
        mode: mode || 'Online',
        meetingLink: meetingLink || '',
        venue: venue || '',
        instructions: instructions || '',
        interviewerName: interviewerName || 'Hiring Panel',
        status: 'Scheduled'
      });
    }

    // Also update corresponding application status if applicationId provided
    if (applicationId) {
      await Application.findByIdAndUpdate(applicationId, { status: roundName || 'Technical Round' });
    }

    // Notify student
    try {
      const jobDoc = await Job.findById(jobId);
      await createNotification({
        studentId,
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `Your ${roundName || 'Interview'} for ${jobDoc?.role || 'Job'} has been scheduled on ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}. Check your Interview Schedule to join or manage this round.`,
        channels: ['in_app', 'email', 'sms', 'push']
      });
    } catch (nErr) {
      console.warn('Interview notification warning:', nErr.message);
    }

    res.status(201).json({ success: true, interview });

  } catch (err) {
    console.error('Interview schedule error:', err);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// PATCH /api/interviews/:id/respond - Student confirms or requests reschedule
router.patch('/:id/respond', isAuthenticated, async (req, res) => {
  try {
    const { status, rescheduleReason, reschedulePreferredDate } = req.body;
    const interview = await ScheduledInterview.findById(req.params.id);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    if (status === 'Confirmed') {
      interview.status = 'Confirmed';
    } else if (status === 'Reschedule Requested') {
      interview.status = 'Reschedule Requested';
      interview.rescheduleReason = rescheduleReason || 'Schedule conflict';
      if (reschedulePreferredDate) interview.reschedulePreferredDate = new Date(reschedulePreferredDate);
    } else if (status === 'Cancelled') {
      interview.status = 'Cancelled';
    }

    await interview.save();
    res.json({ success: true, interview });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update interview response' });
  }
});

export default router;
