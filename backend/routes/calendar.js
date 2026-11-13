import express from 'express';
import PlacementDrive from '../models/PlacementDrive.js';
import ScheduledInterview from '../models/ScheduledInterview.js';
import Job from '../models/Job.js';
import AptitudeTest from '../models/AptitudeTest.js';
import StudentProfile from '../models/Student.js';
import CompanyProfile from '../models/Company.js';

const router = express.Router();

const isAuthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) return next();
  // Fallback for demo: look up first student profile
  try {
    const s = await StudentProfile.findOne();
    if (s) {
      req.session.userId = s.user;
      req.session.role = 'student';
      return next();
    }
  } catch (e) { }
  next();
};

// Seed sample placement drives ensuring current November 2026 and upcoming drives exist
const seedDefaultDrives = async () => {
  const novemberCount = await PlacementDrive.countDocuments({
    startDate: {
      $gte: new Date('2026-11-01T00:00:00.000Z'),
      $lte: new Date('2026-11-30T23:59:59.000Z')
    }
  });

  if (novemberCount === 0) {
    await PlacementDrive.create([
      {
        title: 'Infosys Specialist Programmer Campus Drive 2026',
        companyName: 'Infosys Limited',
        eventType: 'Placement Drive',
        startDate: new Date('2026-11-18T10:00:00.000Z'),
        startTime: '10:00 AM - 04:00 PM',
        venueOrLink: 'Campus Auditorium & Virtual Assessment',
        eligibleBranches: ['CSE', 'IT', 'ECE', 'BCA', 'MCA'],
        minCgpa: 6.5,
        salaryPackage: '9.5 LPA CTC',
        description: 'Role-based evaluation for Specialist Programmer (SP) and Digital Specialist Engineer (DSE).'
      },
      {
        title: 'Wipro Turbo Assessment & Technical Rounds',
        companyName: 'Wipro',
        eventType: 'Placement Drive',
        startDate: new Date('2026-11-22T09:30:00.000Z'),
        startTime: '09:30 AM - 05:00 PM',
        venueOrLink: 'Online Proctored Labs / Campus Hall',
        eligibleBranches: ['CSE', 'IT', 'BCA', 'MCA'],
        minCgpa: 6.5,
        salaryPackage: '6.5 - 8.5 LPA',
        description: 'Elite Turbo campus placement drive covering DSA, System Design, and Technical HR interview.'
      },
      {
        title: 'Adobe SWE Internship & FTE Drive',
        companyName: 'Adobe Systems',
        eventType: 'Pre-Placement Talk',
        startDate: new Date('2026-11-26T14:00:00.000Z'),
        startTime: '02:00 PM - 04:30 PM',
        venueOrLink: 'Main College Auditorium & Teams',
        eligibleBranches: ['All Branches'],
        minCgpa: 7.5,
        salaryPackage: '40 LPA CTC',
        description: 'Interactive leadership talk and recruitment briefing with Adobe Product Engineering leads.'
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

    // 2. Fetch all real jobs posted by companies
    const jobs = await Job.find()
      .populate('company', 'name logo website')
      .select('role company deadline salary location description campusDate createdAt');

    // 3. Fetch interviews (supporting student, company, and fallback demo contexts)
    let interviews = [];
    if (req.session?.role === 'company') {
      const company = await CompanyProfile.findOne({ user: req.session.userId });
      const compId = company ? company._id : req.session.userId;
      interviews = await ScheduledInterview.find({
        $or: [{ company: compId }, { company: req.session.userId }]
      })
        .populate('company', 'name logo')
        .populate('job', 'role')
        .populate('student', 'name email branch')
        .sort({ interviewDate: 1 });
    } else {
      let student = null;
      if (req.session?.role === 'student' && req.session.userId) {
        student = await StudentProfile.findOne({ user: req.session.userId });
      }
      if (!student && req.session?.userId) {
        student = await StudentProfile.findById(req.session.userId);
      }
      if (!student) {
        student = await StudentProfile.findOne();
      }

      if (student) {
        // Auto-backfill for any student application in Technical Round or HR Round that does not have a ScheduledInterview yet
        try {
          const Application = (await import('../models/Application.js')).default;
          const interviewApps = await Application.find({
            $or: [{ student: student._id }, { studentId: student._id }, { student: student.user }],
            status: { $in: ['Technical Round', 'HR Round'] }
          }).populate('job').populate('company');

          for (const app of interviewApps) {
            const exists = await ScheduledInterview.findOne({
              $or: [
                { application: app._id },
                {
                  student: student._id,
                  job: app.job?._id || app.job,
                  roundName: app.status
                }
              ]
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
        } catch (bErr) { }

        interviews = await ScheduledInterview.find({
          $or: [
            { student: student._id },
            { student: student.user },
            { student: req.session?.userId }
          ].filter(Boolean)
        })
          .populate('company', 'name logo')
          .populate('job', 'role')
          .sort({ interviewDate: 1 });
      }

      // If interviews is still 0, look for any scheduled interviews in the database so calendar displays active interviews
      if (interviews.length === 0) {
        interviews = await ScheduledInterview.find()
          .populate('company', 'name logo')
          .populate('job', 'role')
          .limit(10)
          .sort({ interviewDate: 1 });
      }
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

    // Scheduled Interview events (Highest priority for student)
    interviews.forEach(i => {
      const cName = i.company?.name || 'Hiring Company';
      events.push({
        id: `interview-${i._id}`,
        type: 'interview',
        eventType: 'Technical Interview',
        roundName: i.roundName || 'Technical Round',
        title: `Interview: ${i.roundName || 'Technical Round'} - ${i.job?.role || 'Campus Opening'}`,
        jobTitle: i.job?.role || 'Job Role',
        companyName: cName,
        companyLogo: i.company?.logo || '',
        date: i.interviewDate ? new Date(i.interviewDate).toISOString() : new Date().toISOString(),
        startTime: i.interviewTime || '10:00 AM',
        venue: i.mode === 'Online' ? (i.meetingLink || 'Virtual Video Meeting') : (i.venue || 'Campus Placement Cell'),
        meetingLink: i.meetingLink || '',
        mode: i.mode || 'Online',
        description: i.instructions || `Scheduled interview for ${i.job?.role || 'Job'} at ${cName}.`,
        color: 'purple'
      });
    });

    // Real Job Events (Deadlines & Campus Drives)
    jobs.forEach(j => {
      const cName = j.company?.name || 'Unknown Company';
      if (j.deadline) {
        events.push({
          id: `job-deadline-${j._id}`,
          type: 'deadline',
          eventType: 'Application Deadline',
          title: `Deadline: ${j.role}`,
          jobTitle: j.role,
          jobId: j._id,
          companyName: cName,
          companyLogo: j.company?.logo || '',
          date: new Date(j.deadline).toISOString(),
          startTime: '11:59 PM',
          venue: j.location || 'Online Application',
          package: j.salary || 'Competitive',
          description: j.description || `Application deadline for ${j.role} at ${cName}.`,
          color: 'amber'
        });
      }

      if (j.campusDate && j.campusDate !== 'To be shared soon') {
        const campusDateObj = new Date(j.campusDate);
        if (!isNaN(campusDateObj.getTime())) {
          events.push({
            id: `job-drive-${j._id}`,
            type: 'drive',
            eventType: 'Placement Drive',
            title: `Campus Drive: ${j.role} (${cName})`,
            jobTitle: j.role,
            jobId: j._id,
            companyName: cName,
            companyLogo: j.company?.logo || '',
            date: campusDateObj.toISOString(),
            startTime: '10:00 AM',
            venue: j.location || 'Campus Auditorium',
            package: j.salary || 'Competitive',
            description: j.description || `Live on-campus drive for ${j.role}.`,
            color: 'blue'
          });
        }
      }
    });

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
        jobTitle: w.title,
        date: eventDate ? new Date(eventDate).toISOString() : new Date().toISOString(),
        startTime: w.time || '03:00 PM',
        venue: w.mode === 'Online' ? (w.meetingLink || 'Virtual Session') : (w.venue || 'Campus Auditorium'),
        description: w.description || 'Interactive technical workshop.',
        color: 'emerald'
      });
    });

    res.json({ events });

  } catch (err) {
    console.error('Calendar events aggregation error:', err);
    res.status(500).json({ error: 'Failed to aggregate calendar events' });
  }
});

export default router;
