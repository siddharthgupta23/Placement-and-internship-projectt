import express from 'express';
import Hackathon from '../models/Hackathon.js';
import Workshop from '../models/Workshop.js';
import StudentProfile from '../models/Student.js';
import Job from '../models/Job.js';
import { createNotification } from '../services/notificationService.js';
import { sendEmailAsync } from '../services/emailService.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in' });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in' });
  }
  if (!['admin', 'super_admin'].includes(req.session.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Seed default sample hackathons and workshops if empty
const seedDefaults = async () => {
  try {
    const hCount = await Hackathon.countDocuments();
    if (hCount === 0) {
      await Hackathon.create([
        {
          title: 'Smart India AI & Cloud Hackathon 2026',
          theme: 'AI-Powered Campus & Sustainability Solutions',
          description: '36-hour flagship hackathon building intelligent solutions for institutional challenges, green energy, and cloud automation.',
          startDate: new Date('2026-10-24T09:00:00.000Z'),
          endDate: new Date('2026-10-25T18:00:00.000Z'),
          registrationDeadline: new Date('2026-10-20T23:59:59.000Z'),
          mode: 'hybrid',
          venueOrLink: 'JIMS Innovation Lab & AWS Cloud Sandboxes',
          teamSize: { min: 2, max: 4 },
          maxParticipants: 150,
          eligibility: { branches: ['All'], passingYears: ['2026', '2027'] },
          prizes: '1st: ₹50,000 + Cloud Credits, 2nd: ₹25,000, 3rd: ₹15,000',
          rules: 'All code repositories must be initiated during the hackathon. Plagiarism check applied on final PR.',
          skillsTargeted: ['React', 'Node.js', 'Python', 'AWS', 'TensorFlow'],
          organizerOrSponsor: 'JIMS ACM Student Chapter & Google Cloud',
          status: 'published'
        }
      ]);
    }

    const wCount = await Workshop.countDocuments();
    if (wCount === 0) {
      await Workshop.create([
        {
          title: 'Docker & Kubernetes Containerization Masterclass',
          topic: 'Container Orchestration & Production Deployment',
          targetSkill: 'Docker',
          targetStudentCount: 42,
          description: 'Hands-on practical session covering Dockerfiles, multi-stage builds, compose files, and mini-cluster deployment.',
          date: new Date('2026-10-28T14:00:00.000Z'),
          duration: '3 Hours',
          mode: 'online',
          venueOrLink: 'https://meet.google.com/jims-placement-workshop',
          trainer: 'Siddharth Gupta (Senior Cloud Architect)',
          capacity: 120,
          status: 'upcoming'
        }
      ]);
    }
  } catch (err) {
    console.error('Error seeding events:', err);
  }
};

// ==============================================================================
// HACKATHON ROUTES
// ==============================================================================

// GET /api/events/hackathons
router.get('/hackathons', isAuthenticated, async (req, res) => {
  try {
    await seedDefaults();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const hackathons = await Hackathon.find(filter).sort({ startDate: 1 });
    res.json({ hackathons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hackathons' });
  }
});

// GET /api/events/hackathons/:id
router.get('/hackathons/:id', isAuthenticated, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });
    res.json({ hackathon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load hackathon' });
  }
});

// POST /api/events/hackathons (Admin create)
router.post('/hackathons', isAdmin, async (req, res) => {
  try {
    const hackathon = await Hackathon.create(req.body);

    // Notify targeted students
    const query = {};
    if (req.body.eligibility?.branches && !req.body.eligibility.branches.includes('All')) {
      query.branch = { $in: req.body.eligibility.branches };
    }
    const students = await StudentProfile.find(query).limit(50);

    for (const student of students) {
      await createNotification({
        studentId: student._id,
        type: 'hackathon_announcement',
        title: `🏆 New Hackathon: ${hackathon.title}`,
        message: `Theme: ${hackathon.theme}. Registration open till ${new Date(hackathon.registrationDeadline).toLocaleDateString()}. Prizes: ${hackathon.prizes}`,
        metadata: { hackathonId: hackathon._id },
        channels: ['in_app', 'email']
      });

      if (student.email) {
        sendEmailAsync({
          to: student.email,
          subject: `🏆 Campus Hackathon Announcement: ${hackathon.title}`,
          heading: hackathon.title,
          bodyContent: `<p>Dear ${student.name},</p><p>Registration is now officially open for <strong>${hackathon.title}</strong>.</p><p><strong>Theme:</strong> ${hackathon.theme}</p><p><strong>Prizes:</strong> ${hackathon.prizes}</p><p><strong>Deadline to register:</strong> ${new Date(hackathon.registrationDeadline).toLocaleDateString()}</p>`,
          ctaText: 'Register Now',
          ctaUrl: 'http://localhost:5173/student-dashboard'
        }).catch(() => {});
      }
    }

    res.status(201).json({ success: true, hackathon });
  } catch (err) {
    console.error('Create hackathon error:', err);
    res.status(500).json({ error: 'Failed to create hackathon' });
  }
});

// PUT /api/events/hackathons/:id (Admin edit)
router.put('/hackathons/:id', isAdmin, async (req, res) => {
  try {
    const updated = await Hackathon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Hackathon not found' });
    res.json({ success: true, hackathon: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hackathon' });
  }
});

// DELETE /api/events/hackathons/:id (Admin delete)
router.delete('/hackathons/:id', isAdmin, async (req, res) => {
  try {
    const deleted = await Hackathon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Hackathon not found' });
    res.json({ success: true, message: 'Hackathon deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hackathon' });
  }
});

// PATCH /api/events/hackathons/:id/cancel
router.patch('/hackathons/:id/cancel', isAdmin, async (req, res) => {
  try {
    const updated = await Hackathon.findByIdAndUpdate(
      req.params.id, 
      { status: 'cancelled' }, 
      { new: true }
    );
    res.json({ success: true, hackathon: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel hackathon' });
  }
});

// POST /api/events/hackathons/:id/register (Student register)
router.post('/hackathons/:id/register', isAuthenticated, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile required' });

    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });

    // Check if already registered
    const exists = hackathon.registrations.some(r => r.student?.toString() === student._id.toString());
    if (exists) return res.status(400).json({ error: 'You are already registered for this hackathon.' });

    const newReg = {
      student: student._id,
      studentName: student.name,
      studentEmail: student.email,
      teamName: req.body.teamName || `${student.name}'s Team`,
      teamMembers: req.body.teamMembers || [{ name: student.name, email: student.email, rollNo: student.rollNo || 'N/A' }]
    };

    hackathon.registrations.push(newReg);
    await hackathon.save();

    await createNotification({
      studentId: student._id,
      type: 'hackathon_registered',
      title: 'Registration Confirmed!',
      message: `You are confirmed for ${hackathon.title}. Details sent to ${student.email}.`,
      channels: ['in_app', 'email']
    });

    res.json({ success: true, message: 'Registered successfully for hackathon!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register for hackathon' });
  }
});

// POST /api/events/hackathons/:id/winners (Admin record results)
router.post('/hackathons/:id/winners', isAdmin, async (req, res) => {
  try {
    const { winners } = req.body; // array of { position, teamName, members, prize }
    const hackathon = await Hackathon.findByIdAndUpdate(
      req.params.id,
      { winners: winners || [], status: 'completed' },
      { new: true }
    );
    res.json({ success: true, hackathon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record winners' });
  }
});

// POST /api/events/hackathons/:id/certificates (Admin issue certificates)
router.post('/hackathons/:id/certificates', isAdmin, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });

    hackathon.certificatesIssued = true;
    await hackathon.save();

    // Notify registered students
    for (const reg of hackathon.registrations) {
      if (reg.student) {
        await createNotification({
          studentId: reg.student,
          type: 'certificate_issued',
          title: 'Participation Certificate Issued!',
          message: `Your verified certificate for participating in ${hackathon.title} is now available on your dashboard.`,
          channels: ['in_app', 'email']
        });
      }
    }

    res.json({ success: true, message: 'Participation certificates successfully issued.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to issue certificates' });
  }
});

// GET /api/events/hackathons/:id/export-csv (Admin export CSV)
router.get('/hackathons/:id/export-csv', isAdmin, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });

    let csv = 'Registration ID,Student Name,Email,Team Name,Registered Date,Team Members\n';
    hackathon.registrations.forEach(r => {
      const members = (r.teamMembers || []).map(m => `${m.name} (${m.email || ''})`).join('; ');
      csv += `"${r._id}","${r.studentName || ''}","${r.studentEmail || ''}","${r.teamName || ''}","${r.registeredAt?.toISOString()}","${members}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${hackathon.title.replace(/\s+/g, '_')}_Registrations.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// ==============================================================================
// SKILL-GAP WORKSHOPS ROUTES
// ==============================================================================

// GET /api/events/workshops
router.get('/workshops', isAuthenticated, async (req, res) => {
  try {
    await seedDefaults();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const workshops = await Workshop.find(filter).sort({ date: 1 }).lean();

    const student = await StudentProfile.findOne({ user: req.session.userId }, '_id');
    const studentIdStr = student?._id?.toString();

    const enriched = workshops.map(w => ({
      ...w,
      isRegistered: studentIdStr ? (w.registeredStudents || []).some(r => r.student?.toString() === studentIdStr) : false
    }));

    res.json({ workshops: enriched, studentId: studentIdStr });
  } catch (err) {
    console.error('Fetch workshops error:', err);
    res.status(500).json({ error: 'Failed to fetch workshops' });
  }
});

// GET /api/events/workshops/skill-gap-suggestions
// Analyzes platform-wide skill gap and returns prefilled workshop suggestions
router.get('/workshops/skill-gap-suggestions', isAdmin, async (req, res) => {
  try {
    const jobs = await Job.find({}, 'requiredSkills');
    const students = await StudentProfile.find({}, 'skills name branch');

    const skillDemandMap = {};
    jobs.forEach(j => {
      (j.requiredSkills || []).forEach(s => {
        const norm = s.trim();
        skillDemandMap[norm] = (skillDemandMap[norm] || 0) + 1;
      });
    });

    const studentSkillSets = students.map(st => new Set((st.skills || []).map(s => s.toLowerCase().trim())));

    const gapCards = [];
    const sortedSkills = Object.entries(skillDemandMap).sort((a, b) => b[1] - a[1]);

    for (const [skill] of sortedSkills.slice(0, 5)) {
      const lower = skill.toLowerCase();
      let missingCount = 0;
      students.forEach(st => {
        const set = new Set((st.skills || []).map(s => s.toLowerCase().trim()));
        if (!set.has(lower)) missingCount++;
      });

      if (missingCount > 0) {
        gapCards.push({
          skill,
          missingCount,
          totalStudents: students.length,
          suggestedTitle: `Fast-Track ${skill} Architecture & Live Coding Workshop`,
          suggestedTopic: `Industry standard workflows, modern APIs, and project implementations with ${skill}.`,
          trainer: `Expert ${skill} Technical Specialist`,
          duration: '2.5 Hours',
          capacity: 100
        });
      }
    }

    // Default fallback if no jobs/students populated
    if (gapCards.length === 0) {
      gapCards.push(
        {
          skill: 'System Design & Scalability',
          missingCount: 38,
          totalStudents: 50,
          suggestedTitle: 'System Design & Distributed Scalability Masterclass',
          suggestedTopic: 'Microservices, Caching (Redis), Load Balancing, and Sharding patterns.',
          trainer: 'Principal Cloud Architect',
          duration: '3 Hours',
          capacity: 120
        },
        {
          skill: 'Docker & Kubernetes',
          missingCount: 42,
          totalStudents: 50,
          suggestedTitle: 'DevOps & Containerization Bootcamp',
          suggestedTopic: 'Docker containers, CI/CD pipeline automation, and Kubernetes pods.',
          trainer: 'Senior DevOps Engineer',
          duration: '2 Hours',
          capacity: 100
        }
      );
    }

    res.json({ suggestions: gapCards });
  } catch (err) {
    console.error('Skill gap suggestions error:', err);
    res.status(500).json({ error: 'Failed to compute skill gap suggestions' });
  }
});

// POST /api/events/workshops (Admin post workshop)
router.post('/workshops', isAdmin, async (req, res) => {
  try {
    const workshop = await Workshop.create(req.body);

    // Identify students lacking the target skill and send alerts
    const targetSkill = (workshop.targetSkill || '').toLowerCase();
    const students = await StudentProfile.find();

    const targetedStudents = students.filter(st => {
      const set = new Set((st.skills || []).map(s => s.toLowerCase().trim()));
      return !set.has(targetSkill);
    });

    for (const student of targetedStudents.slice(0, 50)) {
      await createNotification({
        studentId: student._id,
        type: 'workshop_invitation',
        title: `📚 Recommended Workshop: ${workshop.title}`,
        message: `Boost your ${workshop.targetSkill} proficiency! Scheduled for ${new Date(workshop.date).toLocaleDateString()}. Register before capacity fills.`,
        metadata: { workshopId: workshop._id },
        channels: ['in_app', 'email']
      });

      if (student.email) {
        sendEmailAsync({
          to: student.email,
          subject: `📚 Tailored Skill Workshop: ${workshop.title}`,
          heading: workshop.title,
          bodyContent: `<p>Hi ${student.name},</p><p>Based on our campus skill gap diagnostic, you can significantly enhance your placement match rate by attending <strong>${workshop.title}</strong>.</p><p><strong>Trainer:</strong> ${workshop.trainer}</p><p><strong>Date & Time:</strong> ${new Date(workshop.date).toLocaleString()}</p>`,
          ctaText: 'Reserve Your Seat',
          ctaUrl: 'http://localhost:5173/student-dashboard'
        }).catch(() => {});
      }
    }

    res.status(201).json({ success: true, workshop });
  } catch (err) {
    console.error('Create workshop error:', err);
    res.status(500).json({ error: 'Failed to create workshop' });
  }
});

// PUT /api/events/workshops/:id (Admin edit)
router.put('/workshops/:id', isAdmin, async (req, res) => {
  try {
    const updated = await Workshop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Workshop not found' });
    res.json({ success: true, workshop: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workshop' });
  }
});

// DELETE /api/events/workshops/:id (Admin delete)
router.delete('/workshops/:id', isAdmin, async (req, res) => {
  try {
    const deleted = await Workshop.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Workshop not found' });
    res.json({ success: true, message: 'Workshop deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workshop' });
  }
});

// PATCH /api/events/workshops/:id/cancel
router.patch('/workshops/:id/cancel', isAdmin, async (req, res) => {
  try {
    const updated = await Workshop.findByIdAndUpdate(
      req.params.id, 
      { status: 'cancelled' }, 
      { new: true }
    );
    res.json({ success: true, workshop: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel workshop' });
  }
});

// POST /api/events/workshops/:id/register (Student register)
router.post('/workshops/:id/register', isAuthenticated, async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile required' });

    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });

    const already = workshop.registeredStudents.some(r => r.student?.toString() === student._id.toString());
    if (already) return res.status(400).json({ error: 'Already registered for this workshop.' });

    if (workshop.registeredStudents.length >= workshop.capacity) {
      return res.status(400).json({ error: 'Workshop has reached maximum capacity.' });
    }

    workshop.registeredStudents.push({
      student: student._id,
      studentName: student.name,
      studentEmail: student.email,
      branch: student.branch || 'MCA'
    });
    await workshop.save();

    createNotification({
      studentId: student._id,
      type: 'workshop_registered',
      title: 'Workshop Registration Confirmed!',
      message: `Your seat for "${workshop.title}" is reserved. Link: ${workshop.venueOrLink}`,
      channels: ['in_app', 'email']
    }).catch(e => console.error('Notification error in workshop register:', e));

    res.json({ success: true, message: 'Seat reserved successfully!' });
  } catch (err) {
    console.error('Workshop registration error:', err);
    res.status(500).json({ error: err.message || 'Failed to register for workshop' });
  }
});

// PATCH /api/events/workshops/:id/attendance (Admin mark attendance & skill improvement)
router.patch('/workshops/:id/attendance', isAdmin, async (req, res) => {
  try {
    const { attendedStudentIds, skillImprovementScore } = req.body;
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });

    const attendedSet = new Set((attendedStudentIds || []).map(String));
    workshop.registeredStudents.forEach(reg => {
      if (attendedSet.has(String(reg.student))) {
        reg.attended = true;
      }
    });

    if (skillImprovementScore !== undefined) {
      workshop.skillImprovementScore = Number(skillImprovementScore) || 25;
      workshop.status = 'completed';
    }

    await workshop.save();
    res.json({ success: true, workshop });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

export default router;
