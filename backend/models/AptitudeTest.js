import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  section: {
    type: String,
    enum: ['Quantitative', 'Logical', 'Verbal', 'Technical'],
    required: true
  },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
  topic: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  marks: { type: Number, default: 1 }
});

const AptitudeTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile' },
  createdByRole: { type: String, enum: ['admin', 'company', 'super_admin', 'system'], default: 'admin' },
  durationMinutes: { type: Number, required: true, default: 30 },
  totalMarks: { type: Number, default: 30 },
  negativeMarking: { type: Number, default: 0 },
  isPracticeTest: { type: Boolean, default: false },
  questions: [QuestionSchema],
  sections: [{ type: String }],
  // How many questions to pick per section for a randomized attempt
  sectionConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('AptitudeTest', AptitudeTestSchema);
