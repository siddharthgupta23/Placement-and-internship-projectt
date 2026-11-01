import { useState, useEffect } from 'react';
import { 
  Building2, Briefcase, GraduationCap, IndianRupee, ShieldAlert, 
  ListOrdered, Eye, CheckCircle2, AlertCircle, Plus, Trash2, 
  ChevronDown, ChevronUp, ArrowUp, ArrowDown, MapPin, Globe, ExternalLink 
} from 'lucide-react';

const DEGREE_OPTIONS = ['MCA', 'BCA', 'B.Tech', 'M.Tech', 'B.Sc (IT)', 'BBA', 'MBA'];
const BRANCH_OPTIONS = ['All', 'Computer Science & Engineering', 'Information Technology', 'Electronics & Comm.', 'Software Engineering', 'Data Science', 'AI & ML'];
const PASSING_YEAR_OPTIONS = ['2025', '2026', '2027', '2028'];

export default function StructuredJobPostForm({ companyProfile, initialData, onSubmit, onCancel, onEditProfile }) {
  const [activeSection, setActiveSection] = useState('jobDetails');
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [form, setForm] = useState({
    role: '',
    campusDateType: 'tbd', // 'tbd' or 'specific'
    campusDate: 'To be shared soon',
    locations: ['Noida'],
    newLocationInput: '',
    workingPattern: 'General - 5 days working',
    requiredSkills: [],
    skillInput: '',
    expectedJoining: 'Immediate',
    deadline: '',
    jobType: 'Full-time',
    openings: 1,
    description: '',

    // Eligibility
    noCriterion: false,
    eligibleDegrees: ['MCA', 'BCA', 'B.Tech'],
    allowedBranches: ['All'],
    allowedPassingYears: ['2026'],
    minCgpa: 6.5,
    min10thPercentage: 60,
    min12thPercentage: 60,
    minGradPercentage: 60,
    maxBacklogs: 0,

    // Compensation
    stipend: { amount: '', duration: '' },
    ctc: { total: '6.0 LPA', fixed: '5.5 LPA', variable: '0.5 LPA', conditions: 'Post training completion' },
    salary: '6.0 LPA',
    otherBenefits: 'Health Insurance, Free Cab / Shuttle, Flexible Work Hours',

    // Bond
    hasBond: false,
    bondDuration: '2 years',
    bondAmount: '',
    bondTerms: 'Standard service commitment with professional certification reimbursement',

    // Interview Process
    interviewRounds: [
      { roundNumber: 1, name: 'Online Aptitude & Technical Assessment', mode: 'Online', description: 'MCQs covering Quantitative, Logic, & CS Core' },
      { roundNumber: 2, name: 'Technical Coding & Architecture Interview', mode: 'Online', description: 'Hands-on problem solving and project deep-dive' },
      { roundNumber: 3, name: 'HR & Culture Fit Discussion', mode: 'Offline', description: 'Campus round / Corporate HQ interaction' }
    ],

    status: 'published'
  });

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        ...initialData,
        locations: initialData.locations?.length ? initialData.locations : (initialData.location ? [initialData.location] : ['Noida']),
        requiredSkills: Array.isArray(initialData.requiredSkills) ? initialData.requiredSkills : [],
        campusDateType: initialData.campusDate && initialData.campusDate !== 'To be shared soon' ? 'specific' : 'tbd',
        interviewRounds: initialData.interviewRounds?.length ? initialData.interviewRounds : prev.interviewRounds,
        stipend: initialData.stipend || prev.stipend,
        ctc: initialData.ctc || prev.ctc
      }));
    }
  }, [initialData]);

  // Skill tag add/remove
  const handleAddSkill = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && form.skillInput.trim()) {
      e.preventDefault();
      const s = form.skillInput.trim().replace(/^,+|,+$/g, '');
      if (s && !form.requiredSkills.includes(s)) {
        setForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, s], skillInput: '' }));
      }
    }
  };

  const handleRemoveSkill = (skill) => {
    setForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter(s => s !== skill) }));
  };

  // Location add/remove
  const handleAddLocation = (e) => {
    if (e.key === 'Enter' && form.newLocationInput.trim()) {
      e.preventDefault();
      const loc = form.newLocationInput.trim();
      if (!form.locations.includes(loc)) {
        setForm(f => ({ ...f, locations: [...f.locations, loc], newLocationInput: '' }));
      }
    }
  };

  const handleRemoveLocation = (loc) => {
    setForm(f => ({ ...f, locations: f.locations.filter(l => l !== loc) }));
  };

  // Round management
  const addRound = () => {
    const nextNum = form.interviewRounds.length + 1;
    setForm(f => ({
      ...f,
      interviewRounds: [
        ...f.interviewRounds,
        { roundNumber: nextNum, name: `Round ${nextNum}: Technical Evaluation`, mode: 'Online', description: '' }
      ]
    }));
  };

  const removeRound = (index) => {
    const updated = form.interviewRounds.filter((_, i) => i !== index).map((r, i) => ({ ...r, roundNumber: i + 1 }));
    setForm(f => ({ ...f, interviewRounds: updated }));
  };

  const moveRound = (index, dir) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= form.interviewRounds.length) return;
    const items = [...form.interviewRounds];
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    setForm(f => ({
      ...f,
      interviewRounds: items.map((r, i) => ({ ...r, roundNumber: i + 1 }))
    }));
  };

  const updateRound = (index, field, value) => {
    const updated = [...form.interviewRounds];
    updated[index] = { ...updated[index], [field]: value };
    setForm(f => ({ ...f, interviewRounds: updated }));
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!form.role.trim()) errors.role = 'Job Role / Title is required.';
    if (form.locations.length === 0) errors.locations = 'At least one job location is required.';
    if (form.requiredSkills.length === 0) errors.requiredSkills = 'Add at least one key required skill.';
    if (!form.deadline) errors.deadline = 'Application deadline is required.';
    if (!form.noCriterion && form.eligibleDegrees.length === 0) {
      errors.eligibleDegrees = 'Select at least one eligible degree or enable "No criterion".';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePublish = (status = 'published') => {
    if (!validateForm()) {
      setActiveSection('jobDetails');
      alert('Please fill all mandatory fields highlighted in red.');
      return;
    }
    const payload = {
      ...form,
      status,
      salary: form.ctc.total || form.salary || 'Competitive',
      location: form.locations.join(', ')
    };
    onSubmit(payload);
  };

  const toggleDegree = (deg) => {
    setForm(f => ({
      ...f,
      eligibleDegrees: f.eligibleDegrees.includes(deg)
        ? f.eligibleDegrees.filter(d => d !== deg)
        : [...f.eligibleDegrees, deg]
    }));
  };

  const togglePassingYear = (yr) => {
    setForm(f => ({
      ...f,
      allowedPassingYears: f.allowedPassingYears.includes(yr)
        ? f.allowedPassingYears.filter(y => y !== yr)
        : [...f.allowedPassingYears, yr]
    }));
  };

  const hq = companyProfile?.headquarters || {};
  const hqString = [hq.address, hq.city, hq.state, hq.country].filter(Boolean).join(', ') || 'New Delhi, India';

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation / Stepper */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-sm font-semibold">
          {[
            { id: 'companyDetails', label: 'A. Company', icon: Building2 },
            { id: 'jobDetails', label: 'B. Job Details', icon: Briefcase },
            { id: 'eligibility', label: 'C. Eligibility', icon: GraduationCap },
            { id: 'compensation', label: 'D. Compensation', icon: IndianRupee },
            { id: 'bond', label: 'E. Bond Details', icon: ShieldAlert },
            { id: 'rounds', label: 'F. Interview Process', icon: ListOrdered },
            { id: 'preview', label: 'G. Preview & Publish', icon: Eye }
          ].map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handlePublish('draft')}
            className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handlePublish('published')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            Publish Job
          </button>
        </div>
      </div>

      {/* SECTION A: Company Details (Read-only auto-fill from profile) */}
      {activeSection === 'companyDetails' && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sub-section A</span>
              <h2 className="text-xl font-extrabold text-slate-900">Company Details (Auto-filled from Profile)</h2>
              <p className="text-xs text-slate-500 mt-0.5">These values are automatically attached to the job posting so students have complete transparency.</p>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1 transition"
            >
              Edit in Profile <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Company Name</span>
              <p className="font-bold text-slate-900 text-base">{companyProfile?.name || 'Recruiter Partner'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Website</span>
              <p className="font-bold text-blue-600 text-sm truncate">{companyProfile?.website || 'https://company.com'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Employees (Range)</span>
              <p className="font-bold text-slate-900 text-sm">{companyProfile?.employeeCount || '500 - 1,000 Employees'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Year of Establishment</span>
              <p className="font-bold text-slate-900 text-sm">{companyProfile?.establishedYear || '2015'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Annual Turnover</span>
              <p className="font-bold text-slate-900 text-sm">{companyProfile?.turnover || '₹50 Cr - ₹250 Cr'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Headquarters</span>
              <p className="font-bold text-slate-900 text-sm truncate">{hqString}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Branch / Office Locations</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(companyProfile?.branchLocations?.length ? companyProfile.branchLocations : ['Bengaluru', 'Hyderabad', 'Pune', 'Noida']).map((b, i) => (
                  <span key={i} className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                    📍 {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 block mb-1">About the Organization</span>
              <p className="text-xs text-slate-700 leading-relaxed mt-1">
                {companyProfile?.about || companyProfile?.description || 'Leading technology and digital innovation enterprise offering high-growth opportunities for fresh talent.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveSection('jobDetails')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
            >
              Next: Job Details →
            </button>
          </div>
        </div>
      )}

      {/* SECTION B: Job Details */}
      {activeSection === 'jobDetails' && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sub-section B</span>
            <h2 className="text-xl font-extrabold text-slate-900">Job Details & Scope</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Job Title / Role *</label>
              <input
                type="text"
                className={`w-full p-3 border rounded-xl outline-none text-sm transition ${validationErrors.role ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-300 focus:border-blue-500'}`}
                placeholder="e.g. Associate Software Engineer - Cloud"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              />
              {validationErrors.role && <p className="text-xs text-red-500 mt-1">{validationErrors.role}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Campus Drive Date</label>
              <div className="flex items-center gap-3">
                <select
                  className="p-3 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 font-medium"
                  value={form.campusDateType}
                  onChange={e => {
                    const type = e.target.value;
                    setForm({
                      ...form,
                      campusDateType: type,
                      campusDate: type === 'tbd' ? 'To be shared soon' : new Date().toISOString().split('T')[0]
                    });
                  }}
                >
                  <option value="tbd">To be shared soon</option>
                  <option value="specific">Set Specific Date</option>
                </select>
                {form.campusDateType === 'specific' && (
                  <input
                    type="date"
                    className="grow p-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                    value={form.campusDate}
                    onChange={e => setForm({ ...form, campusDate: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Job Locations (Multiple) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Job Location(s) (Multiple cities allowed) *</label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {form.locations.map(loc => (
                <span key={loc} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                  📍 {loc}
                  <button type="button" onClick={() => handleRemoveLocation(loc)} className="text-blue-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="grow p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                placeholder="Type a location (e.g. Bengaluru) and press Enter"
                value={form.newLocationInput}
                onChange={e => setForm({ ...form, newLocationInput: e.target.value })}
                onKeyDown={handleAddLocation}
              />
              <button
                type="button"
                onClick={() => {
                  if (form.newLocationInput.trim() && !form.locations.includes(form.newLocationInput.trim())) {
                    setForm({ ...form, locations: [...form.locations, form.newLocationInput.trim()], newLocationInput: '' });
                  }
                }}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Add City
              </button>
            </div>
            {validationErrors.locations && <p className="text-xs text-red-500 mt-1">{validationErrors.locations}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Working Pattern</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                placeholder="General - 5 days working"
                value={form.workingPattern}
                onChange={e => setForm({ ...form, workingPattern: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Expected Joining Month</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                placeholder="Immediate / July 2026"
                value={form.expectedJoining}
                onChange={e => setForm({ ...form, expectedJoining: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Application Deadline *</label>
              <input
                type="date"
                className={`w-full p-3 border rounded-xl text-sm outline-none ${validationErrors.deadline ? 'border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                value={form.deadline ? form.deadline.split('T')[0] : ''}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
              />
              {validationErrors.deadline && <p className="text-xs text-red-500 mt-1">{validationErrors.deadline}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Job Type</label>
              <select
                className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none bg-white focus:border-blue-500 font-medium"
                value={form.jobType}
                onChange={e => setForm({ ...form, jobType: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Both">Both (Internship followed by Full-time PPO)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Number of Openings</label>
              <input
                type="number"
                min="1"
                className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                value={form.openings}
                onChange={e => setForm({ ...form, openings: e.target.value })}
              />
            </div>
          </div>

          {/* Key Skills Tag Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Key Skills Required (Tag input, press Enter or Comma) *</label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 border border-slate-300 rounded-xl min-h-[46px] items-center">
              {form.requiredSkills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-bold shadow-2xs">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-slate-400 hover:text-red-600 font-bold">×</button>
                </span>
              ))}
              <input
                type="text"
                className="grow bg-transparent p-1 text-sm outline-none min-w-[140px]"
                placeholder="Add skill (e.g. React, Python, SQL) and press Enter"
                value={form.skillInput}
                onChange={e => setForm({ ...form, skillInput: e.target.value })}
                onKeyDown={handleAddSkill}
              />
            </div>
            {validationErrors.requiredSkills && <p className="text-xs text-red-500 mt-1">{validationErrors.requiredSkills}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Full Job Description & Responsibilities</label>
            <textarea
              rows="5"
              className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
              placeholder="Outline role responsibilities, day-to-day work, training modules, and candidate expectations..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            ></textarea>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('companyDetails')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('eligibility')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
            >
              Next: Eligibility Criteria →
            </button>
          </div>
        </div>
      )}

      {/* SECTION C: Eligibility Criteria */}
      {activeSection === 'eligibility' && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sub-section C</span>
              <h2 className="text-xl font-extrabold text-slate-900">Eligibility Criteria</h2>
              <p className="text-xs text-slate-500 mt-0.5">Feeds directly into student Eligibility Diagnostic to prevent non-qualifying applications.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 select-none">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                checked={form.noCriterion}
                onChange={e => setForm({ ...form, noCriterion: e.target.checked })}
              />
              <span className="text-xs font-bold text-slate-800">No Criterion (Open to all students)</span>
            </label>
          </div>

          {form.noCriterion ? (
            <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm font-medium flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-bold">No academic restrictions enabled.</p>
                <p className="text-xs text-green-700 mt-0.5">All registered students will be allowed to submit applications without cutoff barriers.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Eligible Degrees Multi-select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Eligible Degrees (Multi-select) *</label>
                <div className="flex flex-wrap gap-2">
                  {DEGREE_OPTIONS.map(deg => {
                    const isSelected = form.eligibleDegrees.includes(deg);
                    return (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => toggleDegree(deg)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {deg}
                      </button>
                    );
                  })}
                </div>
                {validationErrors.eligibleDegrees && <p className="text-xs text-red-500 mt-1">{validationErrors.eligibleDegrees}</p>}
              </div>

              {/* Eligible Passing Years */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Eligible Batches / Passing Years</label>
                <div className="flex flex-wrap gap-2">
                  {PASSING_YEAR_OPTIONS.map(yr => {
                    const isSelected = form.allowedPassingYears.includes(yr);
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => togglePassingYear(yr)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Class of {yr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cutoffs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Min Graduation CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                    value={form.minCgpa}
                    onChange={e => setForm({ ...form, minCgpa: e.target.value })}
                  />
                  <span className="text-2xs text-slate-400 mt-1 block">e.g. 6.5 or 7.0</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Min 10th Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                    value={form.min10thPercentage}
                    onChange={e => setForm({ ...form, min10thPercentage: e.target.value })}
                  />
                  <span className="text-2xs text-slate-400 mt-1 block">e.g. 60%</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Min 12th / Diploma %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                    value={form.min12thPercentage}
                    onChange={e => setForm({ ...form, min12thPercentage: e.target.value })}
                  />
                  <span className="text-2xs text-slate-400 mt-1 block">e.g. 60%</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                    value={form.maxBacklogs}
                    onChange={e => setForm({ ...form, maxBacklogs: e.target.value })}
                  />
                  <span className="text-2xs text-slate-400 mt-1 block">0 = No standing arrears</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('jobDetails')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('compensation')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
            >
              Next: Compensation Details →
            </button>
          </div>
        </div>
      )}

      {/* SECTION D: Compensation */}
      {activeSection === 'compensation' && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sub-section D</span>
            <h2 className="text-xl font-extrabold text-slate-900">Compensation Package & Breakdown</h2>
          </div>

          {/* Stipend Details */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" /> Internship Stipend (If applicable)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Stipend Amount</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none"
                  placeholder="e.g. ₹15,000/- PM or ₹25,000/- PM"
                  value={form.stipend.amount}
                  onChange={e => setForm({ ...form, stipend: { ...form.stipend, amount: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Internship Duration</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none"
                  placeholder="e.g. 6 Months Full-time Internship"
                  value={form.stipend.duration}
                  onChange={e => setForm({ ...form, stipend: { ...form.stipend, duration: e.target.value } })}
                />
              </div>
            </div>
          </div>

          {/* CTC Breakdown */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-blue-600" /> Full-time Annual CTC Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Total CTC *</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none font-bold text-blue-700"
                  placeholder="e.g. 5.5 LPA"
                  value={form.ctc.total}
                  onChange={e => setForm({ ...form, ctc: { ...form.ctc, total: e.target.value }, salary: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed Component</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none"
                  placeholder="e.g. 4.8 LPA"
                  value={form.ctc.fixed}
                  onChange={e => setForm({ ...form, ctc: { ...form.ctc, fixed: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Variable Component</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none"
                  placeholder="e.g. 0.7 LPA (performance linked)"
                  value={form.ctc.variable}
                  onChange={e => setForm({ ...form, ctc: { ...form.ctc, variable: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Conditions / Milestone Remarks</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none"
                placeholder="e.g. Post successful completion of 6 months training period and performance appraisal"
                value={form.ctc.conditions}
                onChange={e => setForm({ ...form, ctc: { ...form.ctc, conditions: e.target.value } })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Other Perks & Benefits</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              placeholder="e.g. Group Medical Insurance (₹5 Lakh), Gratuity, Free Meals, Relocation Bonus"
              value={form.otherBenefits}
              onChange={e => setForm({ ...form, otherBenefits: e.target.value })}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('eligibility')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('bond')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
            >
              Next: Bond Details →
            </button>
          </div>
        </div>
      )}

      {/* SECTION E: Bond Details */}
      {activeSection === 'bond' && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sub-section E</span>
            <h2 className="text-xl font-extrabold text-slate-900">Service Agreement / Bond Details</h2>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Is there a Service Agreement or Bond?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Toggle yes if candidate needs to sign a minimum service duration commitment.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.hasBond}
                onChange={e => setForm({ ...form, hasBond: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {form.hasBond ? (
            <div className="p-5 border border-amber-200 bg-amber-50/50 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bond Duration *</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none font-semibold"
                    placeholder="e.g. 2 Years / 18 Months"
                    value={form.bondDuration}
                    onChange={e => setForm({ ...form, bondDuration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bond Amount (Optional)</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none"
                    placeholder="e.g. ₹1,00,000 (towards specialized training)"
                    value={form.bondAmount}
                    onChange={e => setForm({ ...form, bondAmount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bond Terms & Clarifications</label>
                <textarea
                  rows="3"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none resize-none"
                  placeholder="Terms covering notice period, certificate retention policy, training cost deduction..."
                  value={form.bondTerms}
                  onChange={e => setForm({ ...form, bondTerms: e.target.value })}
                ></textarea>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">No Service Agreement Required</p>
                <p className="text-xs text-slate-500">Students will see &quot;No Bond&quot; badge on their campus job portal.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('compensation')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('rounds')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
            >
              Next: Interview Process →
            </button>
          </div>
        </div>
      )}

      {/* SECTION F: Interview Process */}
      {activeSection === 'rounds' && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sub-section F</span>
              <h2 className="text-xl font-extrabold text-slate-900">Interview Process & Rounds</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ordered sequence of recruitment stages. You can reorder, add, or customize each round.</p>
            </div>
            <button
              type="button"
              onClick={addRound}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Round
            </button>
          </div>

          <div className="space-y-4">
            {form.interviewRounds.map((round, idx) => (
              <div key={idx} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 grow">
                    <input
                      type="text"
                      className="w-full md:w-80 p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold outline-none"
                      value={round.name}
                      onChange={e => updateRound(idx, 'name', e.target.value)}
                      placeholder="Round Title"
                    />
                    <input
                      type="text"
                      className="w-full md:w-96 p-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none text-slate-600"
                      value={round.description}
                      onChange={e => updateRound(idx, 'description', e.target.value)}
                      placeholder="e.g. Physical campus drive at company premises (Noida)"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <select
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
                    value={round.mode}
                    onChange={e => updateRound(idx, 'mode', e.target.value)}
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveRound(idx, -1)}
                    className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === form.interviewRounds.length - 1}
                    onClick={() => moveRound(idx, 1)}
                    className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRound(idx)}
                    className="p-1.5 bg-white border border-slate-200 rounded hover:bg-red-50 text-red-500"
                    title="Delete Round"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('bond')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('preview')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
            >
              Next: Preview & Publish →
            </button>
          </div>
        </div>
      )}

      {/* SECTION G: Preview & Publish */}
      {activeSection === 'preview' && (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sub-section G</span>
              <h2 className="text-xl font-extrabold text-slate-900">Student Portal Live Preview</h2>
              <p className="text-xs text-slate-500 mt-0.5">This is exactly how students will see this opening on their dashboard.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePublish('draft')}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handlePublish('published')}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Publish Live Now
              </button>
            </div>
          </div>

          {/* Student View Mockup */}
          <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-inner space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200/80 pb-5">
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-2xs font-extrabold uppercase tracking-wide inline-block mb-2">
                  {companyProfile?.name || 'Recruiter'}
                </span>
                <h1 className="text-2xl font-black text-slate-900">{form.role || 'Role Title'}</h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>📍 {form.locations.join(', ') || 'Noida'}</span>
                  <span>•</span>
                  <span>📅 Campus: {form.campusDate}</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl font-black text-blue-700">{form.ctc.total || form.salary || 'Competitive'}</div>
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Package (CTC)</div>
              </div>
            </div>

            {/* Key Facts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-2xs font-bold text-slate-400 block uppercase">Bond Requirement</span>
                <span className={`font-extrabold text-sm ${form.hasBond ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {form.hasBond ? `Yes (${form.bondDuration})` : 'No Bond'}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-2xs font-bold text-slate-400 block uppercase">Job Type</span>
                <span className="font-extrabold text-sm text-slate-800">{form.jobType}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-2xs font-bold text-slate-400 block uppercase">Min CGPA</span>
                <span className="font-extrabold text-sm text-slate-800">{form.noCriterion ? 'None' : `${form.minCgpa} CGPA`}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-2xs font-bold text-slate-400 block uppercase">Apply By</span>
                <span className="font-extrabold text-sm text-orange-600">{form.deadline ? new Date(form.deadline).toLocaleDateString() : 'TBD'}</span>
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {form.requiredSkills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-blue-700 font-bold text-xs rounded-xl shadow-2xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Structured Interview Process Rounds */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2.5">Recruitment Process ({form.interviewRounds.length} Rounds)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {form.interviewRounds.map((r, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex justify-between items-center text-2xs font-bold text-slate-400">
                      <span>ROUND {i + 1}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">{r.mode}</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900">{r.name}</p>
                    <p className="text-2xs text-slate-500 leading-tight">{r.description || 'Details shared prior to round.'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">About the Role</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {form.description || 'Full job description will be shared with shortlisted applicants.'}
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('rounds')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => handlePublish('published')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition"
            >
              Confirm & Publish Job Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
