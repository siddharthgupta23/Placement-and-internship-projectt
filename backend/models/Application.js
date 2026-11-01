import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile' },
  matchScore: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Applied', 'Shortlisted', 'Resume Shortlisted', 'Technical Round', 'HR Round', 'Selected', 'Rejected', 'Withdrawn'], 
    default: 'Applied' 
  },
  aiScore: { type: Number, default: 0 },
  aiRecommended: { type: Boolean, default: false },
  answers: [{
    question: String,
    answer: String
  }],
  resumeSnapshot: {
    fileName: String,
    resumeUrl: String,
    uploadedAt: Date
  },
  appliedOn: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent duplicate applications
ApplicationSchema.index({ student: 1, job: 1 }, { unique: true });

ApplicationSchema.pre('validate', function syncReferenceFields() {
  if (!this.studentId && this.student) {
    this.studentId = this.student;
  }

  if (!this.student && this.studentId) {
    this.student = this.studentId;
  }

  if (!this.companyId && this.company) {
    this.companyId = this.company;
  }

  if (!this.company && this.companyId) {
    this.company = this.companyId;
  }
});

export default mongoose.model('Application', ApplicationSchema);
