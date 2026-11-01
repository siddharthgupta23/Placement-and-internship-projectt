import mongoose from 'mongoose';

const InterviewQuestionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
  jobTitle: { type: String, required: true },
  requiredSkills: { type: [String], default: [] },
  questions: {
    technical: [{ type: String }],
    hr: [{ type: String }],
    scenario: [{ type: String }]
  },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('InterviewQuestion', InterviewQuestionSchema);
