import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', index: true },
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['read', 'unread'], default: 'unread', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    channels: [{ type: String, enum: ['in_app', 'email', 'sms', 'whatsapp', 'push'] }],
    delivery_status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
    scheduled_for: { type: Date, default: null, index: true },
    delivered_at: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ student_id: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
