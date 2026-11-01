import express from 'express';
import ScheduledInterview from '../models/ScheduledInterview.js';
import CompanyProfile from '../models/Company.js';
import StudentProfile from '../models/Student.js';
import Job from '../models/Job.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in' });
  }
  next();
};

// GET /api/interviews/my - Get user interviews (student or company)
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const filter = {};
    if (req.session.role === 'student') {
      const student = await StudentProfile.findOne({ user: req.session.userId });
      if (!student) return res.status(404).json({ error: 'Student not found' });
      filter.student = student._id;
    } else if (req.session.role === 'company') {
      const company = await CompanyProfile.findOne({ user: req.session.userId });
      if (!company) return res.status(404).json({ error: 'Company not found' });
      filter.company = company._id;
    }

    const interviews = await ScheduledInterview.find(filter)
      .populate('company', 'name')
      .populate('student', 'name email branch year')
      .populate('job', 'role location salary')
      .sort({ interviewDate: 1 });

    res.json({ interviews });
  } catch (err) {
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

    // Double-booking check for student
    const studentConflict = await ScheduledInterview.findOne({
      student: studentId,
      interviewDate: targetDate,
      interviewTime: interviewTime,
      status: { $nin: ['Cancelled'] }
    });

    if (studentConflict) {
      return res.status(400).json({ error: 'Student already has another interview scheduled at this exact date and time.' });
    }

    // Double-booking check for company
    const companyConflict = await ScheduledInterview.findOne({
      company: companyId,
      interviewDate: targetDate,
      interviewTime: interviewTime,
      status: { $nin: ['Cancelled'] }
    });

    if (companyConflict) {
      return res.status(400).json({ error: 'You already have an interview slot booked at this time. Please pick another slot.' });
    }

    const interview = await ScheduledInterview.create({
      company: companyId,
      student: studentId,
      job: jobId,
      roundName: roundName || 'Technical Round 1',
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

    // Notify student
    try {
      const jobDoc = await Job.findById(jobId);
      await createNotification({
        studentId,
        type: 'interview_scheduled',
        title: 'New Interview Scheduled',
        message: `Your ${roundName || 'Interview'} for ${jobDoc?.role || 'Job'} has been scheduled on ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}.`,
        channels: ['in_app', 'email']
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
