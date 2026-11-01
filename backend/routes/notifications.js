import express from 'express';
import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import NotificationLog from '../models/NotificationLog.js';
import StudentProfile from '../models/Student.js';
import Application from '../models/Application.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

const isStudent = (req, res, next) => {
  if (req.session.role !== 'student') return res.status(403).json({ error: 'Access denied' });
  next();
};

const isAdminLike = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.session.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

router.get('/student', isAuthenticated, isStudent, async (req, res) => {
  const student = await StudentProfile.findOne({ user: req.session.userId });
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  const notifications = await Notification.find({
    student_id: student._id,
    delivery_status: 'sent',
    channels: 'in_app',
  })
    .sort({ createdAt: -1 })
    .limit(200);

  const unreadCount = await Notification.countDocuments({
    student_id: student._id,
    delivery_status: 'sent',
    status: 'unread',
    channels: 'in_app',
  });

  res.json({ notifications, unreadCount });
});

router.patch('/student/:id/read', isAuthenticated, isStudent, async (req, res) => {
  const student = await StudentProfile.findOne({ user: req.session.userId });
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, student_id: student._id },
    { status: 'read' },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  res.json({ notification });
});

router.patch('/student/mark-all-read', isAuthenticated, isStudent, async (req, res) => {
  const student = await StudentProfile.findOne({ user: req.session.userId });
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  await Notification.updateMany({ student_id: student._id, status: 'unread' }, { status: 'read' });
  res.json({ success: true });
});

router.delete('/student/clear-all', isAuthenticated, isStudent, async (req, res) => {
  const student = await StudentProfile.findOne({ user: req.session.userId });
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  await Notification.deleteMany({ student_id: student._id });
  res.json({ success: true });
});

router.get('/student/preferences', isAuthenticated, isStudent, async (req, res) => {
  const student = await StudentProfile.findOne({ user: req.session.userId });
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  const preferences =
    (await NotificationPreference.findOne({ student_id: student._id })) ||
    (await NotificationPreference.create({ student_id: student._id }));
  res.json({ preferences });
});

router.put('/student/preferences', isAuthenticated, isStudent, async (req, res) => {
  const student = await StudentProfile.findOne({ user: req.session.userId });
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  const update = {
    email_enabled: !!req.body.email_enabled,
    sms_enabled: !!req.body.sms_enabled,
    whatsapp_enabled: !!req.body.whatsapp_enabled,
    push_enabled: !!req.body.push_enabled,
    in_app_enabled: !!req.body.in_app_enabled,
    type_overrides: req.body.type_overrides || {},
  };

  const preferences = await NotificationPreference.findOneAndUpdate(
    { student_id: student._id },
    { $set: update },
    { upsert: true, new: true }
  );
  res.json({ preferences });
});

router.get('/admin/logs', isAuthenticated, isAdminLike, async (req, res) => {
  const logs = await NotificationLog.find().sort({ createdAt: -1 }).limit(300);
  res.json({ logs });
});

router.post('/admin/bulk', isAuthenticated, isAdminLike, async (req, res) => {
  const { type, title, message, channels = ['in_app', 'email'], statusFilter = 'Shortlisted' } = req.body;
  const applications = await Application.find({ status: statusFilter }).select('_id student job');

  const results = [];
  for (const application of applications) {
    const notification = await createNotification({
      studentId: application.student,
      applicationId: application._id,
      jobId: application.job,
      type,
      title,
      message,
      channels,
      actor: { id: req.session.userId, role: req.session.role },
    });
    results.push(notification._id);
  }

  await NotificationLog.create({
    actor_id: req.session.userId,
    actor_role: req.session.role,
    action: 'BULK_NOTIFICATION_SENT',
    payload: { type, total: results.length, statusFilter },
  });

  res.json({ success: true, sent: results.length });
});

router.post('/admin/deadline-reminder/:jobId', isAuthenticated, isAdminLike, async (req, res) => {
  const applicants = await Application.find({ job: req.params.jobId }).select('_id student job');

  for (const application of applicants) {
    await createNotification({
      studentId: application.student,
      applicationId: application._id,
      jobId: application.job,
      type: 'deadline_reminder',
      title: 'Application Deadline Reminder',
      message: req.body.message || 'Application deadline is approaching soon. Complete required steps now.',
      channels: req.body.channels || ['in_app', 'email'],
      actor: { id: req.session.userId, role: req.session.role },
    });
  }

  res.json({ success: true, sent: applicants.length });
});

export default router;
