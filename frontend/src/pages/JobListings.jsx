import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Search, MapPin, Briefcase, IndianRupee, Clock, ChevronRight, 
  Target, CheckCircle, AlertTriangle, Building2, Globe, ShieldAlert, 
  GraduationCap, ListOrdered, Award, ExternalLink, X, FileText 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const JobListings = ({ isEmbedded = false, onApplicationSuccess }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [filters, setFilters] = useState({ role: '', location: '' });
    const [jobTypeFilter, setJobTypeFilter] = useState('all'); // 'all' | 'Full-time' | 'Internship'
    const [showExpired, setShowExpired] = useState(false);
    const [loading, setLoading] = useState(true);
    const [applyLoading, setApplyLoading] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, [filters, showExpired]);

    const fetchJobs = async () => {
        try {
            const params = {};
            if (filters.role) params.role = filters.role;
            if (filters.location) params.location = filters.location;
            if (showExpired) params.includeExpired = 'true';

            const query = new URLSearchParams(params).toString();
            const { data } = await api.get(`/jobs?${query}`);
            setJobs(data.jobs || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isExpired = (deadline) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    const initiateApplication = async (job) => {
        if (!user) {
            navigate('/login', { state: { from: '/jobs', message: 'Please sign in as a student to apply for campus openings.' } });
            return;
        }
        if (user.role !== 'student') {
            alert("Only registered students can apply for campus placement drives and internships.");
            return;
        }
        if (isExpired(job.deadline)) {
            alert("This application deadline has passed.");
            return;
        }
        await submitApplication(job._id);
    };

    const submitApplication = async (jobId) => {
        setApplyLoading(true);
        try {
            await api.post(`/jobs/${jobId}/apply`, { answers: [] });
            alert('🎉 Application submitted successfully!');
            setJobs(jobs.map(j => j._id === jobId ? { ...j, _applied: true } : j));
            if (selectedJob?._id === jobId) {
                setSelectedJob(prev => ({ ...prev, _applied: true }));
            }
            if (onApplicationSuccess) {
                onApplicationSuccess();
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit application.');
        } finally {
            setApplyLoading(false);
        }
    };

    const formatHQ = (hq) => {
        if (!hq) return 'Noida, India';
        return [hq.city, hq.state, hq.country].filter(Boolean).join(', ') || 'India';
    };

    const activeJobs = jobs.filter(j => !isExpired(j.deadline) && j.status !== 'closed');
    const baseList = showExpired ? jobs : activeJobs;

    const fullTimeCount = baseList.filter(j => j.jobType === 'Full-time' || j.jobType === 'Both' || (!j.jobType && !(j.role && j.role.toLowerCase().includes('intern')))).length;
    const internshipCount = baseList.filter(j => j.jobType === 'Internship' || (j.role && j.role.toLowerCase().includes('intern')) || Boolean(j.stipend?.amount)).length;

    const displayedJobs = baseList.filter(j => {
        if (jobTypeFilter === 'all') return true;
        if (jobTypeFilter === 'Internship') {
            return j.jobType === 'Internship' || (j.role && j.role.toLowerCase().includes('intern')) || Boolean(j.stipend?.amount);
        }
        if (jobTypeFilter === 'Full-time') {
            return j.jobType === 'Full-time' || j.jobType === 'Both' || (!j.jobType && !(j.role && j.role.toLowerCase().includes('intern')));
        }
        return true;
    });

    return (
        <div className={`space-y-6 animate-fade-in pb-12 relative font-sans ${isEmbedded ? 'mt-2' : ''}`}>
            {/* Header & Filters */}
            <div className={`bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200 ${isEmbedded ? '' : 'sticky top-4 z-10'} flex flex-col md:flex-row gap-4 items-center justify-between`}>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                        Campus Placement Drives & Internships
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Explore verified openings, review interview rounds & eligibility criteria, and apply directly.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search role or skill..."
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={filters.role}
                            onChange={e => setFilters({ ...filters, role: e.target.value })}
                        />
                    </div>
                    <div className="relative sm:w-52">
                        <MapPin className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="City / Location..."
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={filters.location}
                            onChange={e => setFilters({ ...filters, location: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Toggle Bar: Active vs All + Job Type Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-3.5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setShowExpired(false)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            !showExpired
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active Openings ({activeJobs.length})
                    </button>
                    <button
                        onClick={() => setShowExpired(true)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            showExpired
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        All / Expired ({jobs.length})
                    </button>
                </div>

                {/* Job vs Internship Type Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setJobTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            jobTypeFilter === 'all'
                                ? 'bg-white text-blue-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        All ({baseList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setJobTypeFilter('Full-time')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            jobTypeFilter === 'Full-time'
                                ? 'bg-white text-blue-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        💼 Full-Time ({fullTimeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setJobTypeFilter('Internship')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            jobTypeFilter === 'Internship'
                                ? 'bg-white text-purple-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        🎓 Internships ({internshipCount})
                    </button>
                </div>

                <span className="text-2xs font-semibold text-slate-400">
                    Showing {displayedJobs.length} openings
                </span>
            </div>

            {/* Job Listings Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-400 font-bold animate-pulse text-base">Loading campus openings...</div>
            ) : displayedJobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <Briefcase className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-slate-700">No matching campus openings found</h2>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or check back shortly.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedJobs.map(job => {
                        const expired = isExpired(job.deadline);
                        const company = job.company || {};
                        const companyName = company.name || 'Corporate Recruiter';
                        const locationsList = job.locations?.length ? job.locations : (job.location ? [job.location] : ['Noida']);
                        const isInternship = job.jobType === 'Internship' || (job.role && job.role.toLowerCase().includes('intern')) || Boolean(job.stipend?.amount);
                        const companyInitial = companyName.charAt(0).toUpperCase();

                        return (
                            <div 
                                key={job._id} 
                                className={`group relative bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between ${expired ? 'opacity-75 bg-slate-50/50' : ''}`}
                            >
                                {/* Recommended Badge */}
                                {job.matchScore >= 70 && !expired && (
                                    <div className="absolute -top-2.5 -right-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-2xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                                        <Target className="w-3 h-3" /> Verified Match
                                    </div>
                                )}

                                <div>
                                    {/* Company Header with Brand Avatar */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 border border-blue-100">
                                                {companyInitial}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-sm text-slate-900 truncate flex items-center gap-1.5" title={companyName}>
                                                    <span>{companyName}</span>
                                                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                </h4>
                                                <p className="text-2xs text-slate-500 flex items-center gap-1 font-semibold truncate mt-0.5">
                                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" /> {formatHQ(company.headquarters)}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-1 rounded-xl text-2xs font-extrabold shrink-0 border ${
                                            isInternship
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {isInternship ? '🎓 Internship' : '💼 Placement'}
                                        </span>
                                    </div>

                                    {/* Position Title */}
                                    <div className="mb-3">
                                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                                            {job.role}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                                job.hasBond 
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {job.hasBond ? `Bond: ${job.bondDuration || 'Required'}` : 'No Bond Policy'}
                                            </span>
                                            {job.openings && (
                                                <span className="text-3xs text-slate-500 font-bold">
                                                    • {job.openings} Openings
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Placement Package Highlight Box */}
                                    <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/80 mb-3.5">
                                        <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                                            {isInternship ? 'Monthly Stipend' : 'Compensation Package (CTC)'}
                                        </span>
                                        <div className="flex items-center gap-1 font-black text-blue-700 text-base">
                                            <IndianRupee className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>
                                                {job.stipend?.amount ? `${job.stipend.amount}` : (job.ctc?.total || job.salary || 'Competitive / As per Industry Norms')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Key Placement Specifications */}
                                    <div className="space-y-1.5 mb-4 text-xs text-slate-600 font-medium">
                                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-2xs">
                                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <span className="truncate">Locations: {locationsList.join(', ')}</span>
                                        </div>
                                        {job.eligibleDegrees?.length > 0 && (
                                            <div className="flex items-center gap-2 text-slate-600 text-2xs">
                                                <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                <span className="truncate">Eligible: {job.eligibleDegrees.join(', ')} {job.allowedPassingYears?.length ? `(${job.allowedPassingYears.join(', ')})` : ''}</span>
                                            </div>
                                        )}
                                        {job.campusDate && (
                                            <div className="flex items-center gap-2 text-slate-600 text-2xs">
                                                <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                                <span>Drive Date: <strong className="text-slate-800">{job.campusDate}</strong></span>
                                            </div>
                                        )}
                                        {job.deadline && !expired && (
                                            <div className="flex items-center gap-2 text-rose-600 text-2xs font-bold">
                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Required Skills Chips */}
                                    {job.requiredSkills?.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-1">
                                                {job.requiredSkills.slice(0, 4).map((s, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-2xs font-bold rounded-lg border border-slate-200">
                                                        {s}
                                                    </span>
                                                ))}
                                                {job.requiredSkills.length > 4 && (
                                                    <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-2xs font-semibold rounded-lg">
                                                        +{job.requiredSkills.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Match Gauge */}
                                    {user && user.role === 'student' && job.matchScore !== undefined && !expired && (
                                        <div className="mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-1 text-2xs font-bold">
                                                <span className="text-slate-500">Profile Compatibility</span>
                                                <span className={job.matchScore >= 50 ? 'text-emerald-600' : 'text-amber-600'}>
                                                    {job.matchScore}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                                <div 
                                                    className={`h-1 rounded-full ${job.matchScore >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                    style={{ width: `${job.matchScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Application Actions */}
                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                    {/* View Structured Details: visible after login inside dashboard, hidden in opportunities section before login */}
                                    {Boolean(user) && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedJob(job)}
                                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-blue-600" /> View Structured Details
                                        </button>
                                    )}

                                    {!expired && !job._applied && (
                                        <button 
                                            onClick={() => initiateApplication(job)} 
                                            disabled={applyLoading}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                                        >
                                            Apply for Drive <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {job._applied && (
                                        <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-200">
                                            <CheckCircle className="w-4 h-4" /> Application Submitted
                                        </div>
                                    )}

                                    {expired && (
                                        <div className="w-full py-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs text-center">
                                            Campus Drive Concluded
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* STRUCTURED JOB DETAILS MODAL (Sub-sections A through F) */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-2xs font-extrabold uppercase tracking-wide inline-block mb-2">
                                    {selectedJob.company?.name || 'Recruiter'}
                                </span>
                                <h2 className="text-2xl font-black text-slate-900">{selectedJob.role}</h2>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <span>📍 {selectedJob.locations?.length ? selectedJob.locations.join(', ') : selectedJob.location || 'Noida'}</span>
                                    <span>•</span>
                                    <span>📅 Campus: {selectedJob.campusDate || 'To be shared soon'}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Corporate Recruiter Profile */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" /> Corporate Recruiter Profile & Verification
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs">
                                <div>
                                    <span className="text-slate-400 block font-semibold">Headquarters</span>
                                    <span className="font-bold text-slate-800">{formatHQ(selectedJob.company?.headquarters)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-semibold">Website</span>
                                    {selectedJob.company?.website ? (
                                        <a href={selectedJob.company.website} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-0.5 truncate">
                                            Visit Link <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    ) : (
                                        <span className="text-slate-500">Not shared</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-semibold">Employees</span>
                                    <span className="font-bold text-slate-800">{selectedJob.company?.employeeCount || '500+'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-semibold">Turnover</span>
                                    <span className="font-bold text-slate-800">{selectedJob.company?.turnover || '₹50 Cr+'}</span>
                                </div>
                            </div>

                            {selectedJob.company?.branchLocations?.length > 0 && (
                                <div>
                                    <span className="text-2xs text-slate-400 block font-semibold mb-1">Branch / Office Locations</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedJob.company.branchLocations.map((b, i) => (
                                            <span key={i} className="text-2xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                                                📍 {b}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedJob.company?.about && (
                                <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
                                    {selectedJob.company.about}
                                </p>
                            )}
                        </div>

                        {/* Role Specifications */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Position Specifications & Working Terms
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <span className="text-2xs text-slate-400 block font-bold uppercase">Working Pattern</span>
                                    <span className="font-extrabold text-slate-800">{selectedJob.workingPattern || '5 Days Working'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <span className="text-2xs text-slate-400 block font-bold uppercase">Expected Joining</span>
                                    <span className="font-extrabold text-slate-800">{selectedJob.expectedJoining || 'Immediate'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <span className="text-2xs text-slate-400 block font-bold uppercase">Job Type</span>
                                    <span className="font-extrabold text-slate-800">{selectedJob.jobType || 'Full-time'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <span className="text-2xs text-slate-400 block font-bold uppercase">Openings</span>
                                    <span className="font-extrabold text-slate-800">{selectedJob.openings || 1} Positions</span>
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div>
                                <span className="text-2xs text-slate-400 block font-bold uppercase mb-1.5">Required Skills</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedJob.requiredSkills?.map((s, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            {selectedJob.description && (
                                <div className="pt-2">
                                    <span className="text-2xs text-slate-400 block font-bold uppercase mb-1">Job Description & Responsibilities</span>
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                        {selectedJob.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Eligibility Criteria */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Eligibility & Academic Requirements
                            </h3>
                            {selectedJob.noCriterion ? (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-bold flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Open Drive: No criteria restrictions.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-2xs text-slate-400 block font-bold uppercase">Eligible Degrees</span>
                                        <span className="font-extrabold text-slate-800">{selectedJob.eligibleDegrees?.join(', ') || 'All Degrees'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-2xs text-slate-400 block font-bold uppercase">Target Batches</span>
                                        <span className="font-extrabold text-slate-800">{selectedJob.allowedPassingYears?.join(', ') || '2026'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-2xs text-slate-400 block font-bold uppercase">Min CGPA</span>
                                        <span className="font-extrabold text-slate-800">{selectedJob.minCgpa ? `${selectedJob.minCgpa} CGPA` : 'None'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-2xs text-slate-400 block font-bold uppercase">Max Backlogs</span>
                                        <span className="font-extrabold text-slate-800">{selectedJob.maxBacklogs || 0}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Compensation */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Compensation & Package Breakdown
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                                    <span className="text-2xs text-blue-500 block font-bold uppercase">Annual CTC</span>
                                    <span className="text-base font-black text-blue-800">{selectedJob.ctc?.total || selectedJob.salary || 'Competitive'}</span>
                                    {selectedJob.ctc?.fixed && <span className="text-2xs text-slate-500 block">Fixed: {selectedJob.ctc.fixed}</span>}
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-2xs text-slate-400 block font-bold uppercase">Internship Stipend</span>
                                    <span className="text-sm font-black text-slate-800">{selectedJob.stipend?.amount || 'N/A'}</span>
                                    {selectedJob.stipend?.duration && <span className="text-2xs text-slate-500 block">Duration: {selectedJob.stipend.duration}</span>}
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-2xs text-slate-400 block font-bold uppercase">Benefits</span>
                                    <span className="text-xs font-semibold text-slate-700">{selectedJob.otherBenefits || 'Standard enterprise health insurance'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Service Agreement Policy */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className={`w-5 h-5 ${selectedJob.hasBond ? 'text-amber-600' : 'text-emerald-600'}`} />
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                        Service Agreement / Bond Policy
                                    </h4>
                                    <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                                        {selectedJob.hasBond ? `Bond Applicable: ${selectedJob.bondDuration}` : 'No Bond / Service Agreement Required'}
                                    </p>
                                    {selectedJob.hasBond && selectedJob.bondTerms && (
                                        <p className="text-2xs text-slate-500 mt-0.5">{selectedJob.bondTerms}</p>
                                    )}
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedJob.hasBond ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {selectedJob.hasBond ? selectedJob.bondDuration : 'Free to Explore'}
                            </span>
                        </div>

                        {/* Interview Process */}
                        {selectedJob.interviewRounds?.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <ListOrdered className="w-3.5 h-3.5 text-indigo-600" /> Selection Process & Drive Rounds ({selectedJob.interviewRounds.length} Rounds)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {selectedJob.interviewRounds.map((r, i) => (
                                        <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                            <div className="flex justify-between items-center text-2xs font-bold text-slate-400">
                                                <span>ROUND {i + 1}</span>
                                                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-blue-700 font-bold">{r.mode}</span>
                                            </div>
                                            <p className="font-bold text-xs text-slate-900">{r.name}</p>
                                            <p className="text-2xs text-slate-500">{r.description || 'Details will be sent via email.'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                                Close Details
                            </button>
                            {!isExpired(selectedJob.deadline) && !selectedJob._applied && (
                                <button
                                    onClick={() => initiateApplication(selectedJob)}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                                >
                                    Apply For This Drive
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobListings;
