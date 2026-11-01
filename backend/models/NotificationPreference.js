import mongoose from 'mongoose';

const NotificationPreferenceSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, unique: true },
    email_enabled: { type: Boolean, default: true },
    sms_enabled: { type: Boolean, default: true },
    whatsapp_enabled: { type: Boolean, default: false },
    push_enabled: { type: Boolean, default: true },
    in_app_enabled: { type: Boolean, default: true },
    type_overrides: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('NotificationPreference', NotificationPreferenceSchema);
