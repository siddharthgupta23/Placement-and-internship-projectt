import mongoose from 'mongoose';

const NotificationLogSchema = new mongoose.Schema(
  {
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actor_role: { type: String, enum: ['student', 'placement_officer', 'recruiter', 'super_admin', 'system', 'admin'], default: 'system' },
    action: { type: String, required: true },
    target_notification_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('NotificationLog', NotificationLogSchema);
