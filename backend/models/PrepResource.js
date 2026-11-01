import mongoose from 'mongoose';

const PrepResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['company_questions', 'hr_bank', 'technical_notes', 'resume_tips', 'gd_topics'], 
    required: true 
  },
  role: { type: String, default: 'All Roles' },
  company: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'All Levels'], default: 'Medium' },
  content: { type: String, required: true }, // Markdown / rich text
  sampleAnswer: { type: String, default: '' },
  tags: [{ type: String }],
  readingTimeMinutes: { type: Number, default: 5 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

PrepResourceSchema.index({ category: 1, role: 1, company: 1 });

export default mongoose.model('PrepResource', PrepResourceSchema);
