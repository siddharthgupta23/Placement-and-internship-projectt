import mongoose from 'mongoose';

const StudentAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptionIndex: { type: Number, default: -1 }, // -1 = unattempted
  isCorrect: { type: Boolean, default: false },
  marksAwarded: { type: Number, default: 0 },
  section: { type: String, required: true },
  topic: { type: String, default: 'General' }
}, { _id: false });

const ViolationSchema = new mongoose.Schema({
  type: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const AptitudeAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTest', required: true },

  // Store exact question IDs served for this attempt (for review & anti-repeat)
  questionsServed: [{ type: mongoose.Schema.Types.ObjectId }],

  answers: [StudentAnswerSchema],

  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },

  sectionScores: {
    quantitative: { score: Number, total: Number },
    logical: { score: Number, total: Number },
    verbal: { score: Number, total: Number },
    technical: { score: Number, total: Number }
  },

  weakAreas: [{ type: String }],
  tabSwitchWarnings: { type: Number, default: 0 },
  violations: [ViolationSchema],
  timeTakenSeconds: { type: Number, default: 0 },
  terminationReason: { type: String, default: '' },

  status: {
    type: String,
    enum: ['in_progress', 'completed', 'timed_out', 'terminated'],
    default: 'completed'
  }
}, { timestamps: true });

AptitudeAttemptSchema.index({ student: 1, test: 1 });
AptitudeAttemptSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model('AptitudeAttempt', AptitudeAttemptSchema);

