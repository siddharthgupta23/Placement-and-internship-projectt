import mongoose from 'mongoose';

const PlacementDriveSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile' },
  companyName: { type: String, required: true },
  eventType: { 
    type: String, 
    enum: ['Placement Drive', 'Application Deadline', 'Aptitude Test', 'Technical Interview', 'HR Interview', 'Pre-Placement Talk'], 
    default: 'Placement Drive' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  startTime: { type: String, default: '10:00 AM' },
  venueOrLink: { type: String, default: 'Campus Auditorium / Online' },
  eligibleBranches: [{ type: String }],
  minCgpa: { type: Number, default: 0 },
  salaryPackage: { type: String, default: 'Best in Industry' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], default: 'Upcoming' },
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
}, { timestamps: true });

PlacementDriveSchema.index({ startDate: 1 });

export default mongoose.model('PlacementDrive', PlacementDriveSchema);
