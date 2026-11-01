import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import NotificationLog from '../models/NotificationLog.js';
import StudentProfile from '../models/Student.js';

let ioRef = null;

export const setNotificationIo = (io) => {
  ioRef = io;
};

const channelEnabled = (prefs, channel) => {
  if (channel === 'in_app') return prefs.in_app_enabled;
  if (channel === 'email') return prefs.email_enabled;
  if (channel === 'sms') return prefs.sms_enabled;
  if (channel === 'whatsapp') return prefs.whatsapp_enabled;
  if (channel === 'push') return prefs.push_enabled;
  return true;
};

const emitRealtimeNotification = (notification) => {
  if (!ioRef) return;
  ioRef.to(`student:${notification.student_id}`).emit('notification:new', notification);
  ioRef.to(`student:${notification.student_id}`).emit('notification:badge_count:refresh');
};

const dispatchExternalChannels = async (notification) => {
  const external = (notification.channels || []).filter((c) => c !== 'in_app');
  if (external.length === 0) return;

  const profile = await StudentProfile.findById(notification.student_id);
  const contactName = profile ? profile.name : 'Unknown';

  for (const channel of external) {
    let contactInfo = 'Unknown';
    if (profile) {
        if (channel === 'email') contactInfo = profile.email || 'No email set';
        else if (channel === 'sms') contactInfo = profile.phone || 'No phone set';
        else if (channel === 'whatsapp') contactInfo = profile.whatsapp || profile.phone || 'No WhatsApp set';
        else if (channel === 'push') contactInfo = 'Registered Device';
    }

    console.log(
      `\n[EXTERNAL_NOTIFICATION] [${channel.toUpperCase()}]` +
      `\n   To: ${contactName} (${contactInfo})` +
      `\n   Type: ${notification.type}` +
      `\n   Title: "${notification.title}"\n`
    );
  }
};

export const createNotification = async ({
  studentId,
  applicationId = null,
  jobId = null,
  type,
  title,
  message,
  metadata = {},
  channels = ['in_app', 'email'],
  actor = { id: null, role: 'system' },
  scheduledFor = null,
}) => {
  try {
    const prefs =
      (await NotificationPreference.findOne({ student_id: studentId })) ||
      (await NotificationPreference.create({ student_id: studentId }));

    const effectiveChannels = channels.filter((channel) => channelEnabled(prefs, channel));

    const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();
    const notification = await Notification.create({
      student_id: studentId,
      application_id: applicationId,
      job_id: jobId,
      type,
      title,
      message,
      status: 'unread',
      metadata,
      channels: effectiveChannels,
      delivery_status: isScheduled ? 'queued' : 'sent',
      scheduled_for: isScheduled ? new Date(scheduledFor) : null,
      delivered_at: isScheduled ? null : new Date(),
    });

    await NotificationLog.create({
      actor_id: actor.id || null,
      actor_role: actor.role || 'system',
      action: isScheduled ? 'NOTIFICATION_SCHEDULED' : 'NOTIFICATION_SENT',
      target_notification_id: notification._id,
      payload: {
        type,
        channels: effectiveChannels,
        application_id: applicationId,
        student_id: studentId,
        job_id: jobId,
      },
    });

    if (!isScheduled) {
      if (effectiveChannels.includes('in_app')) {
        emitRealtimeNotification(notification.toObject());
      }
      dispatchExternalChannels(notification).catch((err) =>
        console.error('External notification dispatch error:', err)
      );
    }

    return notification;
  } catch (err) {
    console.error('createNotification failed gracefully:', err);
    return null;
  }
};

export const processScheduledNotifications = async () => {
  const due = await Notification.find({
    delivery_status: 'queued',
    scheduled_for: { $lte: new Date() },
  }).limit(100);

  if (!due.length) return 0;

  for (const notification of due) {
    notification.delivery_status = 'sent';
    notification.delivered_at = new Date();
    notification.scheduled_for = null;
    await notification.save();
    if ((notification.channels || []).includes('in_app')) {
      emitRealtimeNotification(notification.toObject());
    }
    await dispatchExternalChannels(notification);
  }

  return due.length;
};
