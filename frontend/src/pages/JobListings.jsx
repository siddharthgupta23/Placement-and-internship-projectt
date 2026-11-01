import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Search, MapPin, Briefcase, IndianRupee, Clock, ChevronRight, 
  Target, CheckCircle, AlertTriangle, Building2, Globe, ShieldAlert, 
  GraduationCap, ListOrdered, Award, ExternalLink, X, FileText 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const JobListings = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [filters, setFilters] = useState({ role: '', location: '' });
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
        if (!user || user.role !== 'student') {
            alert("Only students can apply to campus openings.");
            return;
        }
        if (isExpired(job.deadline)) {
            alert("This job's application deadline has passed.");
            return;
        }
        await submitApplication(job._id);
    };

    const submitApplication = async (jobId) => {
        setApplyLoading(true);
        try {
            await api.post(`/jobs/${jobId}/apply`, { answers: [] });
            alert('Application submitted successfully!');
            setJobs(jobs.map(j => j._id === jobId ? { ...j, _applied: true } : j));
            if (selectedJob?._id === jobId) {
                setSelectedJob(prev => ({ ...prev, _applied: true }));
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

    const displayedJobs = showExpired 
        ? jobs 
        : jobs.filter(j => !isExpired(j.deadline) && j.status !== 'closed');

    return (
        <div className="space-y-8 animate-fade-in pb-12 relative font-sans">
            {/* Header & Filters */}
            <div className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-4 z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campus Placement Drives</h1>
                    <p className="text-xs text-slate-500 mt-1">Explore verified campus openings with structured recruitment rounds & eligibility checks.</p>
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

            {/* Filter Toggle Bar: Active vs All */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowExpired(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            !showExpired
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active Openings Only ({jobs.filter(j => !isExpired(j.deadline) && j.status !== 'closed').length})
                    </button>
                    <button
                        onClick={() => setShowExpired(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            showExpired
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Include Closed / Expired
                    </button>
                </div>
                <span className="text-2xs font-semibold text-slate-400">
                    Showing {displayedJobs.length} {showExpired ? 'total' : 'active open'} positions
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
                        const locationsList = job.locations?.length ? job.locations : (job.location ? [job.location] : ['Noida']);

                        return (
                            <div 
                                key={job._id} 
                                className={`relative bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all flex flex-col justify-between ${expired ? 'opacity-75' : ''}`}
                            >
                                {/* Recommended Badge */}
                                {job.matchScore >= 70 && !expired && (
                                    <div className="absolute -top-2.5 -right-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-2xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                        <Target className="w-3 h-3" /> Highly Matched
                                    </div>
                                )}

                                <div>
                                    {/* Company and HQ */}
                                    <div className="flex justify-between items-start gap-2 mb-3">
                                        <div>
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-2xs font-extrabold rounded-lg inline-block">
                                                {company.name || 'Corporate Partner'}
                                            </span>
                                            {company.headquarters?.city && (
                                                <p className="text-2xs text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                                                    <Building2 className="w-3 h-3 text-slate-400" /> HQ: {formatHQ(company.headquarters)}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${job.hasBond ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                            {job.hasBond ? `Bond: ${job.bondDuration || 'Required'}` : 'No Bond'}
                                        </span>
                                    </div>

                                    {/* Job Title */}
                                    <h2 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition">
                                        {job.role}
                                    </h2>

                                    {/* Key Facts */}
                                    <div className="space-y-1.5 my-4 text-xs text-slate-600 font-medium">
                                        <div className="flex items-center gap-1.5 font-bold text-blue-700 text-sm">
                                            <IndianRupee className="w-4 h-4 text-blue-600 shrink-0" />
                                            {job.ctc?.total || job.salary || 'Competitive'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <span className="truncate">Locations: {locationsList.join(', ')}</span>
                                        </div>
                                        {job.campusDate && (
                                            <div className="flex items-center gap-1.5 text-slate-500 text-2xs">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                Campus Drive: <span className="font-bold text-slate-700">{job.campusDate}</span>
                                            </div>
                                        )}
                                        {job.deadline && !expired && (
                                            <div className="flex items-center gap-1.5 text-orange-600 text-2xs font-bold">
                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                Apply by: {new Date(job.deadline).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1">
                                            {job.requiredSkills?.slice(0, 4).map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-50/80 text-blue-700 text-2xs font-bold rounded-md">
                                                    {s}
                                                </span>
                                            ))}
                                            {job.requiredSkills?.length > 4 && (
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-2xs rounded-md">
                                                    +{job.requiredSkills.length - 4}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Match Gauge */}
                                    {user && user.role === 'student' && job.matchScore !== undefined && !expired && (
                                        <div className="mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-1 text-2xs font-bold">
                                                <span className="text-slate-500">Skills Compatibility</span>
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

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedJob(job)}
                                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> View Structured Details
                                    </button>

                                    {!expired && !job._applied && (
                                        <button 
                                            onClick={() => initiateApplication(job)} 
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1"
                                        >
                                            Fast Apply Now <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {job._applied && (
                                        <div className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-green-200">
                                            <CheckCircle className="w-4 h-4" /> Application Submitted
                                        </div>
                                    )}

                                    {expired && (
                                        <div className="w-full py-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs text-center">
                                            Applications Closed
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

                        {/* SECTION A: Company Details */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" /> Section A • Company Details & Credentials
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

                        {/* SECTION B: Job Details */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Section B • Role Specifications
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
                                    <span className="text-2xs text-slate-400 block font-bold uppercase mb-1">Description</span>
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                        {selectedJob.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* SECTION C: Eligibility Criteria */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Section C • Eligibility Criteria
                            </h3>
                            {selectedJob.noCriterion ? (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-bold flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Open Drive: No criteria restrictions.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-2xs text-slate-400 block font-bold uppercase">Degrees</span>
                                        <span className="font-extrabold text-slate-800">{selectedJob.eligibleDegrees?.join(', ') || 'All Degrees'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-2xs text-slate-400 block font-bold uppercase">Batches</span>
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

                        {/* SECTION D: Compensation */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Section D • Compensation & Stipend
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

                        {/* SECTION E: Bond Details */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className={`w-5 h-5 ${selectedJob.hasBond ? 'text-amber-600' : 'text-emerald-600'}`} />
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                        Section E • Service Agreement Policy
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

                        {/* SECTION F: Interview Process */}
                        {selectedJob.interviewRounds?.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <ListOrdered className="w-3.5 h-3.5 text-indigo-600" /> Section F • Recruitment Process ({selectedJob.interviewRounds.length} Rounds)
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
