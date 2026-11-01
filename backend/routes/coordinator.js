const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Placement = require('../models/Placement');
const Application = require('../models/Application');
const { verifyToken, requireCoordinator } = require('../middleware/auth');

// Coordinator register (optional) - be careful in production
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, role: 'coordinator' });
    await user.save();
    res.json({ message: 'Coordinator created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '8h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected routes for coordinator
// Students
router.get('/students', verifyToken, requireCoordinator, async (req, res) => {
  const list = await Student.find().sort({ createdAt: -1 });
  res.json(list);
});

router.post('/students', verifyToken, requireCoordinator, async (req, res) => {
  const s = new Student(req.body);
  await s.save();
  res.json(s);
});

// Companies
router.get('/companies', verifyToken, requireCoordinator, async (req, res) => {
  const list = await Company.find().sort({ createdAt: -1 });
  res.json(list);
});

router.post('/companies', verifyToken, requireCoordinator, async (req, res) => {
  const c = new Company(req.body);
  await c.save();
  res.json(c);
});

// Jobs
router.get('/jobs', verifyToken, requireCoordinator, async (req, res) => {
  const list = await Job.find().populate('company').sort({ createdAt: -1 });
  res.json(list);
});

router.post('/jobs', verifyToken, requireCoordinator, async (req, res) => {
  const j = new Job(req.body);
  await j.save();
  res.json(j);
});

// Placements - assign student to job
router.post('/placements', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const { studentId, jobId, status } = req.body;
    const job = await Job.findById(jobId).populate('company');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const placement = new Placement({ student: studentId, job: jobId, company: job.company._id, status, placedOn: status === 'placed' ? new Date() : undefined });
    await placement.save();
    res.json(placement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/placements', verifyToken, requireCoordinator, async (req, res) => {
  const list = await Placement.find().populate('student job company').sort({ createdAt: -1 });
  res.json(list);
});

// Stats endpoint
router.get('/stats', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const stats = {
      students: await Student.countDocuments(),
      companies: await Company.countDocuments(),
      companiesRegistered: await Company.countDocuments({ status: 'registered' }),
      companiesRegistering: await Company.countDocuments({ status: 'registering' }),
      jobs: await Job.countDocuments(),
      placements: await Placement.countDocuments({ status: 'placed' }),
      applications: await Application.countDocuments(),
      applicationsApplied: await Application.countDocuments({ status: 'applied' }),
      applicationsSelected: await Application.countDocuments({ status: 'selected' })
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get applications list
router.get('/applications', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const list = await Application.find()
      .populate('student')
      .populate('job')
      .populate('company')
      .sort({ appliedOn: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create application (student applies for job)
router.post('/applications', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const { studentId, jobId, companyId } = req.body;
    const existing = await Application.findOne({ student: studentId, job: jobId });
    if (existing) return res.status(400).json({ message: 'Student already applied for this job' });
    const app = new Application({ student: studentId, job: jobId, company: companyId, status: 'applied' });
    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status
router.patch('/applications/:id', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get registered companies
router.get('/companies/registered', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const list = await Company.find({ status: 'registered' }).sort({ registeredDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get registering companies
router.get('/companies/registering', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const list = await Company.find({ status: 'registering' }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update company registration status
router.patch('/companies/:id/status', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const { status } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status, registeredDate: status === 'registered' ? new Date() : null },
      { new: true }
    );
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
