import mongoose from 'mongoose';

const StudentPrepProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, unique: true },
  bookmarkedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PrepResource' }],
  completedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PrepResource' }]
}, { timestamps: true });

export default mongoose.model('StudentPrepProgress', StudentPrepProgressSchema);
