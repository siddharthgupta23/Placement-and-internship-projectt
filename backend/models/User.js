import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true, sparse: true }, // For STU001 or predefined admin
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'company', 'admin', 'super_admin'], required: true },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
