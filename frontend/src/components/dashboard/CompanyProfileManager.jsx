import { useState, useEffect } from 'react';
import api from '../../api';
import { Building2, MapPin, Globe, Phone, User, Award, CheckCircle2, AlertCircle, Plus, Trash2, Map, Briefcase } from 'lucide-react';

export default function CompanyProfileManager({ onProfileUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    name: '',
    website: '',
    description: '',
    contactPerson: '',
    phone: '',
    headquarters: { address: '', city: '', state: '', country: 'India' },
    branchLocations: [],
    newBranchInput: '',
    googleMapsUrl: '',
    about: '',
    achievements: '',
    productsServices: '',
    employeeCount: '500-1000',
    establishedYear: '2015',
    turnover: '₹50 Cr - ₹200 Cr'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/company/profile');
      if (res.data?.company) {
        const c = res.data.company;
        setProfile({
          ...c,
          headquarters: c.headquarters || { address: '', city: '', state: '', country: 'India' },
          branchLocations: c.branchLocations || [],
          newBranchInput: '',
          about: c.about || c.description || '',
          achievements: c.achievements || '',
          productsServices: c.productsServices || '',
          employeeCount: c.employeeCount || '500-1000',
          establishedYear: c.establishedYear || '2015',
          turnover: c.turnover || '₹50 Cr - ₹200 Cr'
        });
      }
    } catch (err) {
      console.error('Failed to load company profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/company/profile', profile);
      setMessage('Company profile and headquarters successfully updated!');
      if (onProfileUpdated) onProfileUpdated(res.data.company);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const addBranch = (e) => {
    if (e.key === 'Enter' && profile.newBranchInput.trim()) {
      e.preventDefault();
      const b = profile.newBranchInput.trim();
      if (!profile.branchLocations.includes(b)) {
        setProfile(p => ({
          ...p,
          branchLocations: [...p.branchLocations, b],
          newBranchInput: ''
        }));
      }
    }
  };

  const removeBranch = (b) => {
    setProfile(p => ({
      ...p,
      branchLocations: p.branchLocations.filter(loc => loc !== b)
    }));
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400 font-semibold">Loading profile information...</div>;
  }

  return (
    <form onSubmit={handleSave} className="bg-white p-7 sm:p-9 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Enterprise Identity</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Company Profile & Locations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage headquarters, branch offices, and organizational credentials.</p>
        </div>
        <button
          disabled={saving}
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" /> Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Company Name *</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Official Website</label>
            <input
              type="url"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.website}
              onChange={e => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://company.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contact Person</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.contactPerson}
              onChange={e => setProfile({ ...profile, contactPerson: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Headquarters & Office Locations */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" /> Corporate Headquarters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">HQ Street Address</label>
            <input
              type="text"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.headquarters.address}
              onChange={e => setProfile({ ...profile, headquarters: { ...profile.headquarters, address: e.target.value } })}
              placeholder="e.g. DLF Cyber City, Tower B"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">City</label>
            <input
              type="text"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.headquarters.city}
              onChange={e => setProfile({ ...profile, headquarters: { ...profile.headquarters, city: e.target.value } })}
              placeholder="e.g. Gurugram"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">State</label>
            <input
              type="text"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.headquarters.state}
              onChange={e => setProfile({ ...profile, headquarters: { ...profile.headquarters, state: e.target.value } })}
              placeholder="e.g. Haryana"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Country</label>
            <input
              type="text"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.headquarters.country}
              onChange={e => setProfile({ ...profile, headquarters: { ...profile.headquarters, country: e.target.value } })}
              placeholder="India"
            />
          </div>
        </div>

        {/* Branch / Office Locations (Multiple) */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Branch / Regional Offices (Multiple)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {profile.branchLocations.map(b => (
              <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs">
                📍 {b}
                <button type="button" onClick={() => removeBranch(b)} className="text-slate-400 hover:text-red-600">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="grow p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none"
              placeholder="Type office location (e.g. Bengaluru, Hyderabad) and press Enter"
              value={profile.newBranchInput}
              onChange={e => setProfile({ ...profile, newBranchInput: e.target.value })}
              onKeyDown={addBranch}
            />
            <button
              type="button"
              onClick={() => {
                if (profile.newBranchInput.trim() && !profile.branchLocations.includes(profile.newBranchInput.trim())) {
                  setProfile({
                    ...profile,
                    branchLocations: [...profile.branchLocations, profile.newBranchInput.trim()],
                    newBranchInput: ''
                  });
                }
              }}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Add Office
            </button>
          </div>
        </div>

        {/* Google Maps Link */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Google Maps Link (Optional)</label>
          <input
            type="url"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
            value={profile.googleMapsUrl}
            onChange={e => setProfile({ ...profile, googleMapsUrl: e.target.value })}
            placeholder="https://maps.google.com/..."
          />
        </div>
      </div>

      {/* Corporate Metadata */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" /> Organization Facts & Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Employee Count</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.employeeCount}
              onChange={e => setProfile({ ...profile, employeeCount: e.target.value })}
              placeholder="500 - 1,000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Year Established</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.establishedYear}
              onChange={e => setProfile({ ...profile, establishedYear: e.target.value })}
              placeholder="2015"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Annual Turnover</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              value={profile.turnover}
              onChange={e => setProfile({ ...profile, turnover: e.target.value })}
              placeholder="₹50 Cr - ₹200 Cr"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">About the Organization</label>
          <textarea
            rows="3"
            className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
            value={profile.about}
            onChange={e => setProfile({ ...profile, about: e.target.value })}
            placeholder="Overview of the company's domain, culture, and market presence..."
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Key Achievements & Awards</label>
          <textarea
            rows="2"
            className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
            value={profile.achievements}
            onChange={e => setProfile({ ...profile, achievements: e.target.value })}
            placeholder="e.g. Great Place to Work Certified 2025, Top 10 FinTech Innovator..."
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100">
        <button
          disabled={saving}
          type="submit"
          className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>
    </form>
  );
}
