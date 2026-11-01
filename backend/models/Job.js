import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
  role: { type: String, required: true },
  description: { type: String, default: '' },
  
  // Job Details
  campusDate: { type: String, default: 'To be shared soon' }, // date string or "To be shared soon"
  locations: { type: [String], default: [] }, // multiple locations e.g. ["Noida", "Bangalore", "Hyderabad"]
  location: { type: String, default: 'Noida' }, // backward compatibility fallback
  workingPattern: { type: String, default: 'General - 5 days working' },
  requiredSkills: { type: [String], required: true },
  expectedJoining: { type: String, default: 'Immediate' },
  deadline: { type: Date },
  jobType: { type: String, enum: ['Full-time', 'Internship', 'Both'], default: 'Full-time' },
  openings: { type: Number, default: 1 },

  // Eligibility Criteria (feeds into Eligibility Checker)
  eligibleDegrees: { type: [String], default: ['MCA', 'BCA', 'B.Tech', 'M.Tech'] },
  allowedBranches: { type: [String], default: ['All', 'CSE', 'IT', 'ECE', 'BCA', 'MCA', 'B.Tech', 'M.Tech'] },
  allowedPassingYears: { type: [String], default: ['2026', '2027'] },
  minCgpa: { type: Number, default: 0 },
  min10thPercentage: { type: Number, default: 0 },
  min12thPercentage: { type: Number, default: 0 },
  minGradPercentage: { type: Number, default: 0 },
  maxBacklogs: { type: Number, default: 0 },
  noCriterion: { type: Boolean, default: false },

  // Compensation
  stipend: {
    amount: { type: String, default: '' }, // e.g. "15,000/- PM"
    duration: { type: String, default: '' } // e.g. "6 months training"
  },
  ctc: {
    total: { type: String, default: 'Competitive' }, // e.g. "5.0 LPA"
    fixed: { type: String, default: '' }, // e.g. "4.5 LPA"
    variable: { type: String, default: '' }, // e.g. "0.5 LPA"
    conditions: { type: String, default: '' } // e.g. "Post successful completion of training period"
  },
  salary: { type: String, default: 'Competitive' }, // backward compatibility
  otherBenefits: { type: String, default: '' },

  // Bond Details
  hasBond: { type: Boolean, default: false },
  bondDuration: { type: String, default: '' }, // e.g. "2 years"
  bondAmount: { type: String, default: '' },
  bondTerms: { type: String, default: '' },

  // Interview Process
  interviewRounds: [{
    roundNumber: { type: Number, default: 1 },
    name: { type: String, required: true }, // e.g. "Online Aptitude & Coding Round"
    mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Online' },
    description: { type: String, default: '' }
  }],

  status: { type: String, enum: ['published', 'draft', 'closed'], default: 'published' }
}, { timestamps: true });

// Auto-sync legacy fields before save
JobSchema.pre('save', function (next) {
  if (this.locations?.length > 0 && !this.location) {
    this.location = this.locations.join(', ');
  } else if (this.location && (!this.locations || this.locations.length === 0)) {
    this.locations = this.location.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (this.ctc?.total && (!this.salary || this.salary === 'Competitive')) {
    this.salary = this.ctc.total;
  }
  if (typeof next === 'function') {
    next();
  }
});

export default mongoose.model('Job', JobSchema);
