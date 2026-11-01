import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['interviewer', 'candidate'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const QuestionEvaluationSchema = new mongoose.Schema({
  questionIndex: { type: Number },
  question: { type: String, required: true },
  candidateAnswer: { type: String, default: '' },
  score: { type: Number, min: 0, max: 100, default: 0 },
  whatWasGood: { type: String, default: '' },
  whatWasMissing: { type: String, default: '' },
  idealSampleAnswer: { type: String, default: '' }
}, { _id: false });

const InterviewSessionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  roleDomain: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  interviewType: { type: String, enum: ['Technical', 'HR', 'Behavioral', 'Mixed'], default: 'Mixed' },
  totalQuestionsTarget: { type: Number, default: 5 },
  status: { type: String, enum: ['in_progress', 'completed', 'evaluating', 'abandoned', 'terminated'], default: 'in_progress' },
  terminationReason: { type: String, default: '' },
  proctoringEvents: [{ type: { type: String }, timestamp: { type: Date, default: Date.now } }],
  
  messages: [MessageSchema],
  
  overallScore: { type: Number, min: 0, max: 100, default: 0 },
  categoryScores: {
    technicalKnowledge: { type: Number, min: 0, max: 100, default: 0 },
    communication: { type: Number, min: 0, max: 100, default: 0 },
    problemSolving: { type: Number, min: 0, max: 100, default: 0 },
    confidenceClarity: { type: Number, min: 0, max: 100, default: 0 },
    relevance: { type: Number, min: 0, max: 100, default: 0 }
  },
  
  evaluations: [QuestionEvaluationSchema],
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  improvementSuggestions: { type: [String], default: [] },
  
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

InterviewSessionSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model('InterviewSession', InterviewSessionSchema);
