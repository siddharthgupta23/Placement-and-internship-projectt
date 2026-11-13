import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Briefcase, Users, Trash2, Edit, Plus, User, FileText, CheckCircle, 
  XCircle, ListOrdered, Navigation, ArrowRight, HelpCircle, Building2, 
  MapPin, Globe, ShieldAlert, Award, AlertTriangle, Calendar, Clock, Video 
} from 'lucide-react';
import StructuredJobPostForm from '../components/dashboard/StructuredJobPostForm';
import CompanyProfileManager from '../components/dashboard/CompanyProfileManager';

const CompanyDashboard = () => {
    const [stats, setStats] = useState({ totalJobs: 0, totalApplicants: 0 });
    const [jobs, setJobs] = useState([]);
    const [companyProfile, setCompanyProfile] = useState(null);

    // View state: 'jobs', 'applicants', 'create', 'edit', 'profile'
    const [view, setView] = useState('jobs');
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicants, setApplicants] = useState([]);

    // Custom delete confirmation modal state
    const [jobToDelete, setJobToDelete] = useState(null);

    // Interview schedule modal state
    const [scheduleModal, setScheduleModal] = useState({
        isOpen: false,
        app: null,
        roundName: 'Technical Round',
        interviewDate: '',
        interviewTime: '10:00 AM',
        durationMinutes: 45,
        mode: 'Online',
        meetingLink: '',
        venue: 'Campus Placement Cell, Block B',
        instructions: 'Please be ready 5 minutes early with your camera and mic enabled, and your code editor ready.',
        interviewerName: 'Technical Hiring Panel'
    });

    const [sessionError, setSessionError] = useState(null);

    useEffect(() => {
        fetchDashboard();
        fetchJobs();
        fetchProfile();
    }, []);

    const fetchDashboard = async () => {
        try {
            const { data } = await api.get('/company/dashboard');
            setStats(data.stats);
            if (data.company) setCompanyProfile(data.company);
            setSessionError(null);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                setSessionError(err.response?.data?.error || 'Access denied. Company or Admin role required.');
            }
        }
    };

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/company/profile');
            if (data.company) setCompanyProfile(data.company);
        } catch (err) { }
    };

    const fetchJobs = async () => {
        try {
            const { data } = await api.get('/company/jobs');
            setJobs(data.jobs);
            fetchDashboard();
        } catch (err) { }
    };

    const fetchApplicants = async (jobId) => {
        try {
            const { data } = await api.get(`/company/jobs/${jobId}/applicants`);
            setApplicants(data.applications || []);
            setSelectedJobId(jobId);
            setView('applicants');
        } catch (err) { }
    };

    const updateStatus = async (appId, status) => {
        try {
            const { data } = await api.put(`/company/applications/${appId}/status`, { status });
            setApplicants(prev => prev.map(a => a._id === appId ? { 
                ...a, 
                status,
                scheduledInterview: data.interview || a.scheduledInterview 
            } : a));
        } catch (err) {
            if (err.response?.status === 403) {
                alert('Access Denied: You are currently signed in as a Student in this browser. Please log out and sign in with your Company credentials.');
            } else {
                alert('Error updating status: ' + (err.response?.data?.error || 'Unknown error'));
            }
        }
    };

    const openScheduleModal = (app, initialRound = 'Technical Round') => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        const defaultDateStr = `${yyyy}-${mm}-${dd}`;

        const existing = app.scheduledInterview;
        const shortApp = app._id.slice(-4);
        const shortStudent = (app.student?._id || app.student || '').toString().slice(-4);
        const defaultMeet = `https://meet.google.com/plm-${shortApp}-${shortStudent || 'room'}`;

        setScheduleModal({
            isOpen: true,
            app,
            roundName: existing?.roundName || (['Technical Round', 'HR Round'].includes(initialRound) ? initialRound : 'Technical Round'),
            interviewDate: existing?.interviewDate ? new Date(existing.interviewDate).toISOString().split('T')[0] : defaultDateStr,
            interviewTime: existing?.interviewTime || '10:00 AM',
            durationMinutes: existing?.durationMinutes || 45,
            mode: existing?.mode || 'Online',
            meetingLink: existing?.meetingLink || defaultMeet,
            venue: existing?.venue || 'Campus Placement Cell, Block B',
            instructions: existing?.instructions || 'Please be ready 5 minutes early with your camera and mic enabled, and your code editor ready.',
            interviewerName: existing?.interviewerName || 'Technical Hiring Panel'
        });
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        if (!scheduleModal.app) return;
        try {
            const { data } = await api.put(`/company/applications/${scheduleModal.app._id}/status`, {
                status: scheduleModal.roundName,
                roundName: scheduleModal.roundName,
                interviewDate: scheduleModal.interviewDate,
                interviewTime: scheduleModal.interviewTime,
                durationMinutes: scheduleModal.durationMinutes,
                mode: scheduleModal.mode,
                meetingLink: scheduleModal.meetingLink,
                venue: scheduleModal.venue,
                instructions: scheduleModal.instructions,
                interviewerName: scheduleModal.interviewerName
            });

            setApplicants(prev => prev.map(a => {
                if (a._id === scheduleModal.app._id) {
                    return {
                        ...a,
                        status: scheduleModal.roundName,
                        scheduledInterview: data.interview || a.scheduledInterview
                    };
                }
                return a;
            }));

            setScheduleModal(prev => ({ ...prev, isOpen: false, app: null }));
            alert(`Interview for ${scheduleModal.app.student?.name} has been successfully scheduled! Student notification has been dispatched.`);
        } catch (err) {
            alert('Failed to schedule interview: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleStatusDropdownChange = (app, newStatus) => {
        if (newStatus === 'Technical Round' || newStatus === 'HR Round') {
            openScheduleModal(app, newStatus);
        } else {
            updateStatus(app._id, newStatus);
        }
    };

    const handleCreateJob = async (payload) => {
        try {
            await api.post('/company/jobs', payload);
            await fetchJobs();
            setView('jobs');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create job');
        }
    };

    const handleEditJobSubmit = async (payload) => {
        try {
            await api.put(`/company/jobs/${selectedJobId}`, payload);
            await fetchJobs();
            setView('jobs');
            setSelectedJobId(null);
            setSelectedJob(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update job');
        }
    };

    const initiateEdit = (job) => {
        setSelectedJobId(job._id);
        setSelectedJob(job);
        setView('edit');
    };

    const confirmDeleteJob = async () => {
        if (!jobToDelete) return;
        try {
            await api.delete(`/company/jobs/${jobToDelete._id}`);
            await fetchJobs();
            setJobToDelete(null);
        } catch (err) {
            alert('Failed to delete job');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Selected': return 'bg-green-100 text-green-800 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'Resume Shortlisted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Technical Round': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'HR Round': return 'bg-pink-100 text-pink-800 border-pink-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const handleViewResume = async (appId, studentName) => {
        try {
            const response = await api.get(`/company/applications/${appId}/resume`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: response.data.type || 'application/pdf' });
            const resumeUrl = window.URL.createObjectURL(blob);
            window.open(resumeUrl, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(resumeUrl), 60000);
        } catch (error) {
            console.error('Error fetching resume:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to load resume';
            alert(`Unable to view resume: ${errorMsg}`);
        }
    };

    const hq = companyProfile?.headquarters || {};
    const hqText = [hq.city, hq.state].filter(Boolean).join(', ') || 'Noida, India';

    return (
        <div className="animate-fade-in space-y-8 pb-12 font-sans">
            {/* Top Navigation Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        {companyProfile?.name ? `${companyProfile.name} • Portal` : 'Company Portal'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" /> HQ: {hqText}
                        {companyProfile?.branchLocations?.length > 0 && (
                            <span>• {companyProfile.branchLocations.length} Regional Branches</span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {view !== 'jobs' && (
                        <button
                            onClick={() => setView('jobs')}
                            className="px-4 py-2 text-slate-600 font-bold hover:text-slate-900 transition flex items-center gap-1.5 text-sm cursor-pointer"
                        >
                            ← Back to Jobs
                        </button>
                    )}
                    <button
                        onClick={() => setView('profile')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                            view === 'profile'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <Building2 className="w-4 h-4 text-blue-600" /> Edit Profile & Locations
                    </button>
                    {view === 'jobs' && (
                        <button
                            onClick={() => { setSelectedJob(null); setView('create'); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-sm transition text-sm cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Post New Job
                        </button>
                    )}
                </div>
            </div>

            {/* Metric Counters */}
            <div className="grid md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                        <Briefcase className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Campus Openings</p>
                        <h2 className="text-3xl font-black text-slate-800">{stats.totalJobs}</h2>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition">
                    <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Applicants In Pipeline</p>
                        <h2 className="text-3xl font-black text-slate-800">{stats.totalApplicants}</h2>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
                        <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">HQ & Active Hubs</p>
                        <h2 className="text-xl font-black text-slate-800 truncate max-w-[200px]">
                            {hq.city || 'Gurugram'} {companyProfile?.branchLocations?.length ? `+${companyProfile.branchLocations.length}` : ''}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Profile View */}
            {view === 'profile' && (
                <CompanyProfileManager
                    onProfileUpdated={(updated) => {
                        setCompanyProfile(updated);
                    }}
                />
            )}

            {/* Jobs View */}
            {view === 'jobs' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <ListOrdered className="text-slate-500 w-5 h-5" />
                            <h2 className="text-xl font-black text-slate-900">Your Active Campus Job Posts</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        {jobs.length === 0 ? (
                            <div className="text-center text-slate-500 py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                <p className="font-bold text-slate-700">No jobs posted yet.</p>
                                <p className="text-xs text-slate-400 mt-1">Start by posting a structured opening with campus rounds and eligibility criteria.</p>
                                <button
                                    onClick={() => setView('create')}
                                    className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm cursor-pointer"
                                >
                                    + Post Your First Role
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {jobs.map(job => (
                                    <div key={job._id} className="border border-slate-200 rounded-3xl overflow-hidden hover:border-slate-300 transition shadow-sm bg-white flex flex-col justify-between">
                                        <div className="p-6 grow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-black text-lg text-slate-900 leading-tight">{job.role}</h3>
                                                <div className="flex gap-1 shrink-0">
                                                    <button onClick={() => initiateEdit(job)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg bg-slate-50 cursor-pointer"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => setJobToDelete(job)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg bg-slate-50 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-xs text-slate-600 mb-4">
                                                <p className="flex items-center gap-1 font-semibold text-slate-800">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                                    {job.locations?.length ? job.locations.join(', ') : job.location || 'Noida'}
                                                </p>
                                                <p className="font-bold text-blue-700 text-sm">
                                                    ₹ {job.ctc?.total || job.salary || 'Competitive'}
                                                </p>
                                                <p className="text-slate-400">
                                                    📅 Campus Date: <span className="text-slate-700 font-semibold">{job.campusDate || 'To be shared soon'}</span>
                                                </p>
                                                <p className="text-slate-400">
                                                    📜 Service Agreement: <span className={job.hasBond ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                                                        {job.hasBond ? `Bond (${job.bondDuration})` : 'No Bond'}
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {job.requiredSkills?.slice(0, 4).map((s, i) => (
                                                    <span key={i} className="text-2xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">{s}</span>
                                                ))}
                                                {job.requiredSkills?.length > 4 && (
                                                    <span className="text-2xs bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded">+{job.requiredSkills.length - 4} more</span>
                                                )}
                                            </div>

                                            {job.interviewRounds?.length > 0 && (
                                                <p className="text-2xs font-bold text-indigo-700 flex items-center gap-1 mt-2">
                                                    <ListOrdered className="w-3 h-3" /> {job.interviewRounds.length} Recruitment Stages
                                                </p>
                                            )}
                                        </div>

                                        <button onClick={() => fetchApplicants(job._id)} className="w-full py-3.5 bg-slate-50 text-blue-600 font-bold hover:bg-slate-100 transition border-t border-slate-100 text-xs flex items-center justify-center gap-1 cursor-pointer">
                                            View Applicants & Manage Pipeline <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Job View */}
            {view === 'create' && (
                <StructuredJobPostForm
                    companyProfile={companyProfile}
                    onSubmit={handleCreateJob}
                    onCancel={() => setView('jobs')}
                    onEditProfile={() => setView('profile')}
                />
            )}

            {/* Edit Job View */}
            {view === 'edit' && (
                <StructuredJobPostForm
                    companyProfile={companyProfile}
                    initialData={selectedJob}
                    onSubmit={handleEditJobSubmit}
                    onCancel={() => { setSelectedJob(null); setSelectedJobId(null); setView('jobs'); }}
                    onEditProfile={() => setView('profile')}
                />
            )}

            {/* Applicants View */}
            {view === 'applicants' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 animate-fade-in mx-auto w-full">
                    <h2 className="text-xl font-black mb-4 flex items-center justify-between">
                        <span>Candidate Pipeline Review</span>
                        <span className="bg-blue-100 text-blue-700 text-xs py-1 px-3 rounded-full font-bold">{applicants.length} Total Applicants</span>
                    </h2>

                    {applicants.length === 0 ? (
                        <p className="text-slate-500 bg-slate-50 p-8 text-center rounded-2xl border border-dashed my-4 text-xs font-semibold">
                            No applications received yet for this role.
                        </p>
                    ) : (
                        <div className="space-y-5">
                            {applicants.map(app => (
                                <div key={app._id} className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition bg-white">
                                    <div className="p-5 flex flex-wrap md:flex-nowrap justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-900">{app.student?.name}</h3>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        {app.student?.branch || 'N/A'} • {app.student?.year || 'Batch 2026'} • CGPA: {app.student?.cgpa || 'N/A'}
                                                    </p>
                                                    {app.student?.resumeUrl && (
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleViewResume(app._id, app.student?.name); }} className="text-xs text-blue-600 font-bold hover:underline mt-1.5 inline-block">
                                                            📄 View Uploaded Resume
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-blue-600">{app.matchScore}%</div>
                                                    <div className="text-2xs text-slate-400 font-bold uppercase tracking-wide">AI Match</div>
                                                </div>
                                            </div>

                                            {/* Scheduled Interview Details Card */}
                                            {app.scheduledInterview && (
                                                <div className="mt-3 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                                            {app.scheduledInterview.roundName}: {new Date(app.scheduledInterview.interviewDate).toLocaleDateString()} at {app.scheduledInterview.interviewTime}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-blue-200/60 text-blue-800">
                                                            {app.scheduledInterview.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            {app.scheduledInterview.mode === 'Online' ? <Video className="w-3 h-3 text-purple-600" /> : <MapPin className="w-3 h-3 text-emerald-600" />}
                                                            {app.scheduledInterview.mode} {app.scheduledInterview.mode === 'Online' ? '(Virtual Video Call)' : `(Venue: ${app.scheduledInterview.venue})`}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            {app.scheduledInterview.mode === 'Online' && app.scheduledInterview.meetingLink && (
                                                                <a
                                                                    href={app.scheduledInterview.meetingLink.startsWith('http') ? app.scheduledInterview.meetingLink : `https://${app.scheduledInterview.meetingLink}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-3xs flex items-center gap-1 transition"
                                                                >
                                                                    <Video className="w-3 h-3" /> Join Meet
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => openScheduleModal(app, app.scheduledInterview.roundName)}
                                                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-bold text-3xs transition cursor-pointer"
                                                            >
                                                                Edit Slot
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:w-64 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0 flex flex-col items-end shrink-0 justify-center">
                                            <div className="mb-2 text-right">
                                                <p className="text-2xs text-slate-400 font-bold uppercase tracking-wider mb-1">Current Status</p>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(app.status)}`}>
                                                    {app.status}
                                                </span>
                                            </div>

                                            <div className="w-full mt-2">
                                                <p className="text-2xs text-slate-400 font-bold uppercase tracking-wider mb-1 text-right">Update Round</p>
                                                <select
                                                    className="w-full text-xs border border-slate-300 rounded-xl p-2 font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer bg-white"
                                                    value={app.status}
                                                    onChange={(e) => handleStatusDropdownChange(app, e.target.value)}
                                                >
                                                    <option value="Applied">Applied</option>
                                                    <option value="Resume Shortlisted">Resume Shortlisted</option>
                                                    <option value="Technical Round">Technical Round</option>
                                                    <option value="HR Round">HR Round</option>
                                                    <option value="Selected">Selected / Offer</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() => openScheduleModal(app, app.status === 'Applied' || app.status === 'Resume Shortlisted' ? 'Technical Round' : app.status)}
                                                    className="mt-2.5 w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                                                >
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                                    {app.scheduledInterview ? 'Reschedule Interview' : 'Schedule Interview Slot'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Custom Delete Confirmation Modal (NO native window.confirm) */}
            {jobToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Job Post</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Are you sure you want to delete <span className="font-bold text-slate-800">&quot;{jobToDelete.role}&quot;</span>? This will remove the listing and all student applications.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setJobToDelete(null)}
                                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteJob}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                            >
                                Yes, Delete Job
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Interview Modal */}
            {scheduleModal.isOpen && scheduleModal.app && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">Schedule Interview Slot</h3>
                                    <p className="text-xs text-slate-500 font-medium">Candidate: <span className="font-bold text-slate-700">{scheduleModal.app.student?.name}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setScheduleModal(prev => ({ ...prev, isOpen: false, app: null }))}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleScheduleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Interview Round</label>
                                    <select
                                        value={scheduleModal.roundName}
                                        onChange={e => setScheduleModal({ ...scheduleModal, roundName: e.target.value })}
                                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value="Technical Round">Technical Round</option>
                                        <option value="Technical Round 1">Technical Round 1</option>
                                        <option value="Technical Round 2">Technical Round 2</option>
                                        <option value="HR Round">HR Round</option>
                                        <option value="Managerial Round">Managerial Round</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Mode</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setScheduleModal({ ...scheduleModal, mode: 'Online' })}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                                scheduleModal.mode === 'Online' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Video className="w-3.5 h-3.5" /> Online
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setScheduleModal({ ...scheduleModal, mode: 'Offline' })}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                                scheduleModal.mode === 'Offline' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <MapPin className="w-3.5 h-3.5" /> Offline
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={scheduleModal.interviewDate}
                                        onChange={e => setScheduleModal({ ...scheduleModal, interviewDate: e.target.value })}
                                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Time Slot</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 10:00 AM"
                                        value={scheduleModal.interviewTime}
                                        onChange={e => setScheduleModal({ ...scheduleModal, interviewTime: e.target.value })}
                                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                                    />
                                </div>
                            </div>

                            {scheduleModal.mode === 'Online' ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider">Video Meeting Link (Google Meet / Zoom)</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const randId = Math.random().toString(36).substring(2, 6);
                                                setScheduleModal({ ...scheduleModal, meetingLink: `https://meet.google.com/plm-${randId}-${scheduleModal.app._id.slice(-4)}` });
                                            }}
                                            className="text-3xs text-blue-600 font-bold hover:underline cursor-pointer"
                                        >
                                            ⚡ Regenerate Meet Link
                                        </button>
                                    </div>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://meet.google.com/xyz-abc-def"
                                        value={scheduleModal.meetingLink}
                                        onChange={e => setScheduleModal({ ...scheduleModal, meetingLink: e.target.value })}
                                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Physical Venue / Room</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Placement Cell Block B, Interview Room 3"
                                        value={scheduleModal.venue}
                                        onChange={e => setScheduleModal({ ...scheduleModal, venue: e.target.value })}
                                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Interviewer Name / Panel</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Senior Tech Lead & Hiring Panel"
                                    value={scheduleModal.interviewerName}
                                    onChange={e => setScheduleModal({ ...scheduleModal, interviewerName: e.target.value })}
                                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Instructions for Student</label>
                                <textarea
                                    rows={2}
                                    value={scheduleModal.instructions}
                                    onChange={e => setScheduleModal({ ...scheduleModal, instructions: e.target.value })}
                                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-blue-500 bg-white resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setScheduleModal(prev => ({ ...prev, isOpen: false, app: null }))}
                                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <Calendar className="w-4 h-4" /> Confirm & Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;
