import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  website: { type: String, default: '' },
  description: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  phone: { type: String, default: '' },
  logo: { type: String, default: '' },
  
  // Headquarters
  headquarters: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },

  // Branch & Office Locations (multiple)
  branchLocations: { type: [String], default: [] },
  googleMapsUrl: { type: String, default: '' },

  // Structured Company Profile fields (Auto-fills into Job Post Section A)
  about: { type: String, default: '' },
  achievements: { type: String, default: '' },
  productsServices: { type: String, default: '' },
  employeeCount: { type: String, default: '' }, // e.g. "500-1000", "1000-5000"
  establishedYear: { type: String, default: '' },
  turnover: { type: String, default: '' }, // e.g. "50 Cr+", "100-500 Cr"

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true });

export default mongoose.model('CompanyProfile', CompanySchema);
