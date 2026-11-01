import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  branch: { type: String, default: '' },
  year: { type: String, default: '' },
  skills: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  experience: { type: String, default: '' },
  resumeUrl: { type: String },
  cgpa: { type: Number, default: 7.5 },
  backlogs: { type: Number, default: 0 },
  passingYear: { type: String, default: '2026' },
  targetRoles: { type: [String], default: ['Full Stack Developer', 'Frontend Engineer'] },
  skillProficiencies: [{
    skill: { type: String },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' }
  }],
  aiResumeScore: { type: Number, default: 0 },
  resumeFile: {
    data: Buffer,
    contentType: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  resumeData: {
    rawText: { type: String, default: '' },
    summary: { type: String, default: '' },
    location: { type: String, default: '' },
    links: { type: [String], default: [] },
    education: [{
      degree: String,
      institution: String,
      year: String,
      grade: String
    }],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String
    }],
    projects: [{
      name: String,
      techStack: [String],
      description: String
    }],
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    languages: { type: [String], default: [] }
  },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  address: { type: String, default: '' },
  mockInterviewScore: { type: Number, default: 0 },
  aptitudeScore: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('StudentProfile', StudentSchema);
