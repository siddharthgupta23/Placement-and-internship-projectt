import mongoose from 'mongoose';

const CompanyReviewSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  
  overallRating: { type: Number, min: 1, max: 5, required: true },
  processRating: { type: Number, min: 1, max: 5, default: 4 },
  cultureRating: { type: Number, min: 1, max: 5, default: 4 },
  salaryRating: { type: Number, min: 1, max: 5, default: 4 },
  growthRating: { type: Number, min: 1, max: 5, default: 4 },
  
  reviewTitle: { type: String, required: true },
  interviewProcessReview: { type: String, required: true },
  workCultureReview: { type: String, default: '' },
  salaryReview: { type: String, default: '' },
  tipsForStudents: { type: String, default: '' },
  
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'hidden', 'rejected'], default: 'approved' },
  reportCount: { type: Number, default: 0 },
  reportedReasons: [{ type: String }]
}, { timestamps: true });

// One review per student per company
CompanyReviewSchema.index({ company: 1, student: 1 }, { unique: true });

export default mongoose.model('CompanyReview', CompanyReviewSchema);
