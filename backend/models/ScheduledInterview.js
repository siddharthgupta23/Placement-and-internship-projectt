import mongoose from 'mongoose';

const ScheduledInterviewSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  
  roundName: { type: String, required: true, default: 'Technical Round 1' },
  interviewDate: { type: Date, required: true },
  interviewTime: { type: String, required: true }, // e.g. '14:30'
  durationMinutes: { type: Number, default: 45 },
  
  mode: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  meetingLink: { type: String, default: '' },
  venue: { type: String, default: '' },
  instructions: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['Scheduled', 'Confirmed', 'Reschedule Requested', 'Completed', 'Cancelled'], 
    default: 'Scheduled' 
  },
  
  rescheduleReason: { type: String, default: '' },
  reschedulePreferredDate: { type: Date },
  
  interviewerName: { type: String, default: 'Hiring Team' },
  interviewerEmail: { type: String, default: '' }
}, { timestamps: true });

ScheduledInterviewSchema.index({ student: 1, interviewDate: 1 });
ScheduledInterviewSchema.index({ company: 1, interviewDate: 1 });

export default mongoose.model('ScheduledInterview', ScheduledInterviewSchema);
