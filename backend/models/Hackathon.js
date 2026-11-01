import mongoose from 'mongoose';

const HackathonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  theme: { type: String, required: true }, // Problem statement or overarching theme
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  venueOrLink: { type: String, default: 'Online Portal' },
  teamSize: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 4 }
  },
  maxParticipants: { type: Number, default: 200 },
  eligibility: {
    branches: { type: [String], default: ['All'] },
    passingYears: { type: [String], default: ['2026', '2027'] }
  },
  prizes: { type: String, default: '1st Prize: ₹50,000, 2nd Prize: ₹25,000 + Merit Badges' },
  rules: { type: String, default: 'Original code only. Submissions checked with automated plagiarism detection.' },
  skillsTargeted: { type: [String], default: ['Full Stack', 'AI/ML', 'Problem Solving'] },
  organizerOrSponsor: { type: String, default: 'JIMS Innovation & Placement Cell' },
  bannerImage: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['published', 'draft', 'ongoing', 'completed', 'cancelled'], 
    default: 'published' 
  },
  registrations: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
    studentName: String,
    studentEmail: String,
    registeredAt: { type: Date, default: Date.now },
    teamName: { type: String, default: '' },
    teamMembers: [{ name: String, email: String, rollNo: String }]
  }],
  winners: [{
    position: { type: String, default: 'Winner' }, // 1st, 2nd, 3rd, Honorable Mention
    teamName: { type: String, required: true },
    members: { type: String, default: '' },
    prize: { type: String, default: '' }
  }],
  certificatesIssued: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Hackathon', HackathonSchema);
