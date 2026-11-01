import mongoose from 'mongoose';

const WorkshopSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  targetSkill: { type: String, required: true }, // e.g. "Docker", "System Design", "React"
  targetStudentCount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  duration: { type: String, default: '2 Hours' },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  venueOrLink: { type: String, default: 'Google Meet / Placement Auditorium' },
  trainer: { type: String, default: 'Industry Subject Matter Expert' },
  capacity: { type: Number, default: 100 },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  registeredStudents: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
    studentName: String,
    studentEmail: String,
    branch: String,
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false }
  }],
  skillImprovementScore: { type: Number, default: 0 } // e.g. 28% improvement measured
}, { timestamps: true });

export default mongoose.model('Workshop', WorkshopSchema);
