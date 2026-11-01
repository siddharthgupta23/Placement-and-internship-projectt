import express from 'express';
import PlacementDrive from '../models/PlacementDrive.js';
import ScheduledInterview from '../models/ScheduledInterview.js';
import Job from '../models/Job.js';
import AptitudeTest from '../models/AptitudeTest.js';
import StudentProfile from '../models/Student.js';
import CompanyProfile from '../models/Company.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in' });
  }
  next();
};

// Seed sample placement drives if empty (ensuring both September 2026 and October 2026 events exist)
const seedDefaultDrives = async () => {
  const count = await PlacementDrive.countDocuments();
  if (count === 0) {
    await PlacementDrive.create([
      {
        title: 'TCS Digital Campus Drive 2026',
        companyName: 'Tata Consultancy Services',
        eventType: 'Placement Drive',
        startDate: new Date('2026-09-18T10:00:00.000Z'),
        startTime: '10:00 AM - 04:00 PM',
        venueOrLink: 'Campus Auditorium & Virtual Labs',
        eligibleBranches: ['CSE', 'IT', 'ECE', 'BCA', 'MCA'],
        minCgpa: 6.5,
        salaryPackage: '7.5 - 9.0 LPA',
        description: 'National Qualifier test shortlisted round and campus interview loop.'
      },
      {
        title: 'Google STEP / SWE Application Deadline',
        companyName: 'Google India',
        eventType: 'Application Deadline',
        startDate: new Date('2026-09-28T18:29:59.000Z'),
        startTime: '11:59 PM IST',
        venueOrLink: 'Google Careers Portal / Campus Referral',
        eligibleBranches: ['All Branches'],
        minCgpa: 7.5,
        salaryPackage: '32 LPA CTC',
        description: 'Submission deadline for Google India campus recruitment process 2026.'
      },
      {
        title: 'Microsoft Campus Virtual Drive 2026',
        companyName: 'Microsoft Corporation',
        eventType: 'Placement Drive',
        startDate: new Date('2026-10-18T10:00:00.000Z'),
        startTime: '10:00 AM - 05:00 PM',
        venueOrLink: 'Online Teams / Campus Lab 4',
        eligibleBranches: ['CSE', 'IT', 'ECE', 'BCA', 'MCA'],
        minCgpa: 7.5,
        salaryPackage: '18 - 24 LPA',
        description: 'Online coding round followed by 2 technical interview loops and 1 HR / culture fit round.'
      },
      {
        title: 'Amazon SDE-1 Application Deadline',
        companyName: 'Amazon',
        eventType: 'Application Deadline',
        startDate: new Date('2026-10-25T18:29:59.000Z'),
        startTime: '11:59 PM IST',
        venueOrLink: 'Campus Portal Submission',
        eligibleBranches: ['All'],
        minCgpa: 7.0,
        salaryPackage: '28 LPA CTC',
        description: 'Last date to submit verified resume for Amazon campus shortlisted pool.'
      },
      {
        title: 'Deloitte Tech Consulting Pre-Placement Talk & PPT',
        companyName: 'Deloitte USI',
        eventType: 'Pre-Placement Talk',
        startDate: new Date('2026-10-29T14:00:00.000Z'),
        startTime: '02:00 PM - 04:00 PM',
        venueOrLink: 'Main College Auditorium',
        eligibleBranches: ['All Branches'],
        minCgpa: 6.5,
        salaryPackage: '9 - 12 LPA',
        description: 'Interactive session with Deloitte leadership team and overview of consulting career paths.'
      }
    ]);
  }
};

// GET /api/calendar/events - Aggregate calendar events for user
router.get('/events', isAuthenticated, async (req, res) => {
  try {
    await seedDefaultDrives();

    // 1. Fetch drives
    const drives = await PlacementDrive.find().sort({ startDate: 1 });

    // 2. Fetch job deadlines
    const jobs = await Job.find({ deadline: { $exists: true, $ne: null } })
      .populate('company', 'name logo website')
      .select('role company deadline salary location description');

    // 3. Fetch user interviews if logged in
    let interviews = [];
    if (req.session.role === 'student') {
      const student = await StudentProfile.findOne({ user: req.session.userId });
      if (student) {
        interviews = await ScheduledInterview.find({ student: student._id })
          .populate('company', 'name logo')
          .populate('job', 'role');
      }
    } else if (req.session.role === 'company') {
      interviews = await ScheduledInterview.find({ company: req.session.userId })
        .populate('student', 'name')
        .populate('job', 'role');
    }

    // 4. Fetch hackathons and workshops if models are available
    let hackathons = [];
    let workshops = [];
    try {
      const Hackathon = (await import('../models/Hackathon.js')).default;
      hackathons = await Hackathon.find({ status: { $ne: 'cancelled' } }).sort({ startDate: 1 });
    } catch { /* Hackathon model may not be loaded yet */ }

    try {
      const Workshop = (await import('../models/Workshop.js')).default;
      workshops = await Workshop.find({ status: { $ne: 'cancelled' } }).sort({ dateTime: 1 });
    } catch { /* Workshop model may not be loaded yet */ }

    // Merge into standardized calendar event format
    const events = [];

    // Drive events
    drives.forEach(d => {
      events.push({
        id: `drive-${d._id}`,
        type: 'drive',
        eventType: d.eventType || 'Placement Drive',
        title: d.title,
        companyName: d.companyName || 'Unknown Company',
        companyLogo: '',
        jobTitle: d.title,
        date: d.startDate ? new Date(d.startDate).toISOString() : new Date().toISOString(),
        startTime: d.startTime || '10:00 AM',
        venue: d.venueOrLink || 'Campus',
        minCgpa: d.minCgpa,
        eligibleBranches: d.eligibleBranches,
        package: d.salaryPackage,
        description: d.description,
        color: d.eventType === 'Placement Drive' ? 'blue' : (d.eventType === 'Application Deadline' ? 'red' : 'emerald')
      });
    });

    // Job Deadline events
    jobs.forEach(j => {
      const cName = j.company?.name || 'Unknown Company';
      events.push({
        id: `job-${j._id}`,
        type: 'deadline',
        eventType: 'Application Deadline',
        title: `Deadline: ${j.role}`,
        jobTitle: j.role,
        jobId: j._id,
        companyName: cName,
        companyLogo: j.company?.logo || '',
        date: j.deadline ? new Date(j.deadline).toISOString() : new Date().toISOString(),
        startTime: '11:59 PM',
        venue: j.location || 'Online Application',
        package: j.salary || 'Competitive',
        description: j.description || `Application deadline for ${j.role} at ${cName}.`,
        color: 'amber'
      });
    });

    // Interview events
    interviews.forEach(i => {
      const cName = i.company?.name || 'Hiring Company';
      events.push({
        id: `interview-${i._id}`,
        type: 'interview',
        eventType: 'Technical Interview',
        title: `Interview: ${i.roundName || 'Technical Round'}`,
        jobTitle: i.job?.role || 'Job Role',
        companyName: cName,
        companyLogo: i.company?.logo || '',
        date: i.interviewDate ? new Date(i.interviewDate).toISOString() : new Date().toISOString(),
        startTime: i.interviewTime || '10:00 AM',
        venue: i.mode === 'Online' ? (i.meetingLink || 'Online Link') : (i.venue || 'Campus Venue'),
        description: i.instructions || 'Scheduled interview round.',
        color: 'purple'
      });
    });

    // Hackathon events
    hackathons.forEach(h => {
      events.push({
        id: `hackathon-${h._id}`,
        type: 'hackathon',
        eventType: 'Hackathon',
        title: h.title,
        companyName: h.organizer || 'Campus / Sponsor',
        companyLogo: h.bannerImage || '',
        jobTitle: h.theme || 'Hackathon',
        date: h.startDate ? new Date(h.startDate).toISOString() : new Date().toISOString(),
        startTime: h.startTime || '09:00 AM',
        venue: h.venueOrLink || (h.mode === 'online' ? 'Online' : 'Campus Lab'),
        package: h.prizes || 'Cash & Certificates',
        description: h.description,
        color: 'emerald'
      });
    });

    // Workshop events
    workshops.forEach(w => {
      const eventDate = w.date || w.dateTime;
      events.push({
        id: `workshop-${w._id}`,
        type: 'workshop',
        eventType: 'Skill Workshop',
        title: w.title,
        companyName: w.trainer || 'Industry Trainer',
        companyLogo: '',
        jobTitle: `Target: ${w.targetSkill || w.skillTargeted || 'Skill Improvement'}`,
        date: eventDate ? new Date(eventDate).toISOString() : new Date().toISOString(),
        startTime: '11:00 AM',
        venue: w.venueOrLink || 'Seminar Hall',
        package: 'Free / Certificate Included',
        description: w.description,
        color: 'blue'
      });
    });

    res.json({ events });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// POST /api/calendar/drives - Admin create placement drive
router.post('/drives', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.session.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const drive = await PlacementDrive.create(req.body);
    res.status(201).json({ success: true, drive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create drive' });
  }
});

// DELETE /api/calendar/drives/:id - Admin delete drive
router.delete('/drives/:id', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.session.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await PlacementDrive.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Drive removed from calendar' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete drive' });
  }
});

export default router;
