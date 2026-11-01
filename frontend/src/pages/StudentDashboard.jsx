import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, FileCheck, FileText, CheckCircle2, 
  Bot, Target, BookOpen, Calendar, Trophy, MessageSquare, 
  ShieldCheck, Bell, User, LogOut, ChevronLeft, ChevronRight, 
  Menu, X, Search, Sparkles, TrendingUp, AlertTriangle, 
  GraduationCap, Clock, Award, Star, ExternalLink, ArrowRight, 
  BarChart3, Edit3, Plus, Trash2, ArrowUpRight 
} from 'lucide-react';

// Specialized panels
import StudentResumeManager from '../components/dashboard/StudentResumeManager';
import AptitudePanel from '../components/dashboard/AptitudePanel';
import MockInterviewPanel from '../components/ai/MockInterviewPanel';
import SkillGapPanel from '../components/dashboard/SkillGapPanel';
import InterviewPrepPanel from '../components/dashboard/InterviewPrepPanel';
import ScheduledInterviewsPanel from '../components/dashboard/ScheduledInterviewsPanel';
import PlacementCalendarPanel from '../components/dashboard/PlacementCalendarPanel';
import StudentWorkshopsPanel from '../components/dashboard/StudentWorkshopsPanel';
import StudentHackathonsPanel from '../components/dashboard/StudentHackathonsPanel';
import CompanyReviewsPanel from '../components/dashboard/CompanyReviewsPanel';
import EligibilityCheckerPanel from '../components/dashboard/EligibilityCheckerPanel';
import NotificationBell from '../components/NotificationBell';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Core Data
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [_loading, setLoading] = useState(true);

  // Profile Edit Modal State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchDashboardData = useCallback(() => {
    Promise.all([
      api.get('/student/dashboard').catch(() => ({ data: { profile: null } })),
      api.get('/jobs/applications/me').catch(() => ({ data: { applications: [] } })),
      api.get('/jobs').catch(() => ({ data: { jobs: [] } })),
      api.get('/calendar/events').catch(() => ({ data: { events: [] } }))
    ])
      .then(([resProfile, resApps, resJobs, resCalendar]) => {
        const prof = resProfile.data?.profile || {};
        setProfile(prof);
        setEditForm(prof);
        setApplications(resApps.data?.applications || []);
        setJobs(resJobs.data?.jobs || []);
        setEvents(resCalendar.data?.events || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load student dashboard:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/student/profile', editForm);
      setProfile(data.profile);
      setEditProfileOpen(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Profile Completion Percentage
  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name) score += 15;
    if (profile.email) score += 10;
    if (profile.phone) score += 10;
    if (profile.branch) score += 15;
    if (profile.cgpa) score += 15;
    if (profile.skills?.length > 0) score += 15;
    if (profile.resumeFile?.data || profile.resumeUrl) score += 20;
    return Math.min(100, score);
  }, [profile]);

  // Derived metrics
  const activeJobs = useMemo(() => {
    const now = new Date();
    return jobs.filter(j => {
      if (j.status === 'closed') return false;
      if (j.deadline && new Date(j.deadline) < now) return false;
      return true;
    });
  }, [jobs]);

  const shortlistedApps = applications.filter(a => ['Shortlisted', 'Resume Shortlisted', 'Technical Round', 'HR Round', 'Selected'].includes(a.status));
  const resumeScore = profile?.resumeScore || 82;
  const latestAptitudeScore = profile?.aptitudeScore || 78;
  const latestMockScore = profile?.mockInterviewScore || 85;

  // Navigation Items
  const navSections = [
    {
      heading: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell }
      ]
    },
    {
      heading: 'Placements & Jobs',
      items: [
        { id: 'jobs', label: 'Campus Drives', icon: Briefcase },
        { id: 'applications', label: 'My Applications', icon: FileCheck, badge: applications.length },
        { id: 'eligibility', label: 'Eligibility Checker', icon: ShieldCheck },
        { id: 'calendar', label: 'Placement Calendar', icon: Calendar }
      ]
    },
    {
      heading: 'Assessments & AI',
      items: [
        { id: 'resume', label: 'Resume ATS Pro', icon: FileText, badge: `${resumeScore}%` },
        { id: 'aptitude', label: 'Aptitude Tests', icon: CheckCircle2 },
        { id: 'mockInterview', label: 'AI Mock Interview', icon: Bot },
        { id: 'skillGap', label: 'Skill Gap Diagnostic', icon: Target },
        { id: 'interviewPrep', label: 'Interview Prep Hub', icon: BookOpen }
      ]
    },
    {
      heading: 'Campus Activities',
      items: [
        { id: 'schedule', label: 'Interview Schedule', icon: Clock },
        { id: 'workshops', label: 'Skill Workshops', icon: Sparkles },
        { id: 'hackathons', label: 'Hackathons', icon: Trophy },
        { id: 'reviews', label: 'Company Reviews', icon: MessageSquare }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR (Fixed Desktop & Off-Canvas Mobile Drawer)              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed top-[82px] inset-x-0 bottom-0 bg-slate-900/40 backdrop-blur-xs z-25 lg:hidden transition-opacity"
        />
      )}

      <aside className={`fixed top-[82px] bottom-0 left-0 z-30 bg-white text-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-slate-200 shadow-sm ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Sidebar Header & Brand */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="transition-opacity duration-200">
                  <h1 className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight uppercase">
                    JIMS Placement
                  </h1>
                  <p className="text-2xs text-blue-600 font-bold tracking-wider">Student Workspace</p>
                </div>
              )}
            </div>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Navigation Items */}
          <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-210px)] custom-scrollbar">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 text-3xs font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                    {sec.heading}
                  </p>
                )}
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-extrabold'
                          : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                      {!sidebarCollapsed && (
                        <span className="truncate text-left grow">{item.label}</span>
                      )}
                      {!sidebarCollapsed && item.badge !== undefined && (
                        <span className={`text-2xs font-extrabold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Mini-Profile */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('profile')} 
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition truncate"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'S'}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">{profile?.name || 'Student'}</p>
                  <p className="text-2xs text-slate-500 truncate">{profile?.branch || 'Batch 2026'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT AREA                                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className={`grow flex flex-col min-h-[calc(100vh-82px)] transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 sm:h-18 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back Button */}
            <button
              onClick={() => {
                if (activeTab !== 'dashboard') {
                  setActiveTab('dashboard');
                } else {
                  navigate('/');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition text-xs font-semibold shadow-2xs"
              title={activeTab !== 'dashboard' ? 'Back to Overview' : 'Back to Home'}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-bold">Back</span>
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize leading-tight">
                {activeTab.replace(/([A-Z])/g, ' $1')}
              </h2>
              <p className="text-2xs text-slate-400 font-semibold hidden sm:block">
                JIMS Campus Recruitment System • Session 2026-2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Search Bar */}
            <div className="relative hidden md:block w-56 lg:w-72">
              <Search className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search drives, skills, tests..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Quick Dropdown Button */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                {profile?.name?.charAt(0) || 'S'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline truncate max-w-[100px]">
                {profile?.name || 'Profile'}
              </span>
            </button>
          </div>
        </header>

        {/* Dynamic Dashboard View */}
        <main className="p-4 sm:p-8 grow">
          {/* ───────────────────────────────────────────────────────────────── */}
          {/* VIEW: DASHBOARD (HOME)                                            */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
              {/* Welcome Banner with Profile Completion */}
              <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-2 z-10">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-2xs font-extrabold uppercase tracking-wide">
                    🎓 Academic Session 2026-2027
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Welcome back, {profile?.name || 'Candidate'}!
                  </h1>
                  <p className="text-xs text-blue-100/80 max-w-xl leading-relaxed">
                    You have <span className="text-white font-bold">{shortlistedApps.length} active drive shortlists</span> and your ATS resume score is at <span className="text-white font-bold">{resumeScore}%</span>.
                  </p>
                </div>

                {/* Profile Completion Bar */}
                <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 w-full md:w-72 shrink-0 z-10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-blue-200">Profile Readiness</span>
                    <span className="text-white">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-emerald-400 h-2 rounded-full transition-all duration-700" 
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="text-3xs text-blue-200/80">
                    {profileCompletion < 100 ? 'Upload resume and fill all education details for 100% eligibility.' : 'All campus profile prerequisites completed!'}
                  </p>
                </div>
              </div>

              {/* 6 Key Summary Cards */}
              {/* 6 Key Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div 
                  onClick={() => setActiveTab('applications')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition">Applications</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{applications.length}</h3>
                  <span className="text-3xs font-bold text-blue-600 mt-1 block">Active Pipeline</span>
                </div>

                <div 
                  onClick={() => setActiveTab('applications')}
                  className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition">Shortlisted</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">{shortlistedApps.length}</h3>
                  <span className="text-3xs font-bold text-emerald-700 mt-1 block">Interviews Cleared</span>
                </div>

                <div 
                  onClick={() => setActiveTab('calendar')}
                  className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition">Calendar Events</p>
                  <h3 className="text-2xl font-black text-indigo-600 mt-1">{events.length || 0}</h3>
                  <span className="text-3xs font-bold text-indigo-700 mt-1 block">
                    {events.filter(e => e.type === 'drive').length} Drives • {events.filter(e => e.type === 'deadline').length} Deadlines
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('aptitude')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition">Aptitude Score</p>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">{latestAptitudeScore}%</h3>
                  <span className="text-3xs font-bold text-slate-400 mt-1 block">Top 15% Rank</span>
                </div>

                <div 
                  onClick={() => setActiveTab('mockInterview')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition">Mock Interview</p>
                  <h3 className="text-2xl font-black text-purple-600 mt-1">{latestMockScore}%</h3>
                  <span className="text-3xs font-bold text-purple-700 mt-1 block">AI Verified</span>
                </div>

                <div 
                  onClick={() => setActiveTab('resume')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition">Resume ATS</p>
                  <h3 className="text-2xl font-black text-emerald-700 mt-1">{resumeScore}/100</h3>
                  <span className="text-3xs font-bold text-emerald-600 mt-1 block">Optimal Match</span>
                </div>
              </div>

              {/* Cleared Interview Rounds & Shortlisted Companies Section */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" /> Cleared Interviews & Shortlisted Companies ({shortlistedApps.length})
                    </h3>
                    <p className="text-2xs text-slate-500 font-semibold mt-0.5">
                      Companies where your application has cleared preliminary rounds or been shortlisted for interview loops
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    View in My Applications ({applications.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {shortlistedApps.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                    No shortlisted rounds yet. Apply to campus drives and take Aptitude & Mock Interviews to raise your shortlisting rate!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {shortlistedApps.map(app => {
                      const companyName = app.job?.company?.name || app.company?.name || 'Recruiter Partner';
                      const role = app.job?.role || 'Campus Opening';
                      const salary = app.job?.salary || app.job?.ctc?.total || 'Competitive';
                      const status = app.status;

                      let statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                      let statusNote = 'Shortlisted for Interview Evaluation';
                      if (status === 'Technical Round') {
                        statusBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                        statusNote = 'Technical Round Cleared / Loop In Progress';
                      } else if (status === 'HR Round') {
                        statusBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                        statusNote = 'Technical Loop Cleared • In HR Final Round';
                      } else if (status === 'Selected') {
                        statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        statusNote = 'All Interviews Cleared • Offer Confirmed 🎉';
                      }

                      return (
                        <div key={app._id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-200 hover:shadow-md transition flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-2xs font-extrabold rounded-lg truncate">
                                {companyName}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-3xs font-extrabold border ${statusBadge}`}>
                                {status}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-black text-sm text-slate-900 leading-snug">{role}</h4>
                              <p className="text-xs text-blue-700 font-bold mt-0.5">₹ {salary}</p>
                              <p className="text-3xs text-slate-400 mt-1">
                                Applied: {new Date(app.appliedOn || app.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>

                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-3xs font-bold text-slate-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{statusNote}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex gap-2">
                            <button
                              onClick={() => setActiveTab('schedule')}
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-3xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Clock className="w-3 h-3" /> Interview Schedule
                            </button>
                            <button
                              onClick={() => setActiveTab('applications')}
                              className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-3xs font-bold transition cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Two Column Grid: Recommended Jobs & Calendar Feeds */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2 Cols: High Match Campus Openings */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Recommended Campus Opportunities</h3>
                      <p className="text-2xs text-slate-500 font-semibold">Open drives matched to your profile with active application windows</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All Drives ({activeJobs.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {activeJobs.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 text-center space-y-2">
                      <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-sm text-slate-700">No active campus drives open today</p>
                      <p className="text-xs text-slate-400">All previous deadlines have passed. New verified drives will be posted soon.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeJobs.slice(0, 4).map(job => (
                        <div key={job._id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-3xs font-extrabold rounded-md">
                                {job.company?.name || 'Recruiter Partner'}
                              </span>
                              <span className="text-2xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                ₹ {job.salary || job.ctc?.total || 'Competitive'}
                              </span>
                            </div>
                            <h4 className="font-black text-sm text-slate-900 leading-snug">{job.role}</h4>
                            <p className="text-2xs text-slate-500 mt-1">📍 {job.location || 'Noida'}</p>

                            {job.deadline && (
                              <p className="text-3xs text-orange-600 font-bold mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Apply by: {new Date(job.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {job.requiredSkills?.slice(0, 3).map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-3xs font-bold border border-slate-100">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveTab('jobs')}
                            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            View Details & Apply <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1 Col: Upcoming Events & Quick Interventions */}
                <div className="space-y-6">
                  {/* Calendar Widget */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" /> Upcoming Campus Events ({events.length})
                      </h3>
                      <button
                        onClick={() => setActiveTab('calendar')}
                        className="text-2xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Calendar →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {events.slice(0, 5).map(ev => {
                        const isDrive = ev.type === 'drive';
                        const isDeadline = ev.type === 'deadline';
                        const isWorkshop = ev.type === 'workshop';
                        const isHackathon = ev.type === 'hackathon';

                        const typeTag = isDrive ? 'Placement Drive' :
                                        isDeadline ? 'Deadline' :
                                        isWorkshop ? 'Workshop' :
                                        isHackathon ? 'Hackathon' : 'Interview';

                        const tagColor = isDrive ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                         isDeadline ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                         isWorkshop ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                         'bg-emerald-50 text-emerald-700 border-emerald-200';

                        return (
                          <div 
                            key={ev.id} 
                            onClick={() => setActiveTab('calendar')}
                            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${tagColor}`}>
                                  {typeTag}
                                </span>
                              </div>
                              <p className="font-bold text-xs text-slate-900 leading-tight truncate">{ev.title}</p>
                              <p className="text-3xs text-slate-400 mt-0.5 truncate">{ev.companyName} • {ev.venue}</p>
                            </div>
                            <span className="text-3xs font-black text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                              {new Date(ev.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      View All {events.length} Events on Calendar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Skill Gap Quick Intervention Card */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-3">
                    <span className="text-3xs font-black text-amber-300 uppercase tracking-widest bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 inline-block">
                      ⚡ Actionable Tip
                    </span>
                    <h4 className="font-extrabold text-sm text-white">Docker & Cloud Skills Gap Detected</h4>
                    <p className="text-2xs text-blue-100/80 leading-relaxed">
                      3 recruiters visiting this month require containerization experience. Complete our masterclass to raise your profile ranking.
                    </p>
                    <button
                      onClick={() => setActiveTab('workshops')}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Browse Skill Workshops →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* VIEW: MY APPLICATIONS                                             */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in max-w-7xl mx-auto">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900">My Active Placement Applications</h3>
                  <p className="text-2xs text-slate-500 font-medium">Track your selection stages, interview invites, and recruiter feedback</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full">
                  {applications.length} Submissions
                </span>
              </div>

              <div className="p-6">
                {applications.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No applications submitted yet.</p>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                    >
                      Browse Campus Openings
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-3xs font-extrabold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3 px-3">Role & Company</th>
                          <th className="pb-3 px-3">Applied On</th>
                          <th className="pb-3 px-3">Compatibility</th>
                          <th className="pb-3 px-3">Current Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {applications.map(app => (
                          <tr key={app._id} className="hover:bg-slate-50 transition">
                            <td className="py-4 px-3">
                              <p className="font-bold text-slate-900">{app.job?.role || 'Campus Role'}</p>
                              <p className="text-2xs text-blue-700 font-semibold">{app.company?.name || 'Recruiter'}</p>
                            </td>
                            <td className="py-4 px-3 text-slate-500 text-2xs">
                              {(app.createdAt || app.appliedOn) ? new Date(app.createdAt || app.appliedOn).toLocaleDateString('en-IN') : 'Recent'}
                            </td>
                            <td className="py-4 px-3 font-black text-blue-600">
                              {app.matchScore != null ? `${app.matchScore}%` : '80%'}
                            </td>
                            <td className="py-4 px-3">
                              <span className="px-3 py-1 rounded-full text-2xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                {app.status || 'Applied'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* VIEW: CAMPUS DRIVES / JOBS                                        */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'jobs' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Campus Placement Drives</h3>
                  <p className="text-xs text-slate-500">Live active drives verified by Training & Placement Cell</p>
                </div>
                <Link
                  to="/jobs"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 flex items-center gap-1.5"
                >
                  Open Dedicated Explorer <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {activeJobs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No active campus drives open today</p>
                  <p className="text-xs text-slate-400 mt-1">Deadlines for previous drives have passed. New verified drives will be posted shortly.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeJobs.map(j => (
                    <div key={j._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-2xs font-extrabold rounded-lg">
                            {j.company?.name || 'Corporate Recruiter'}
                          </span>
                          <span className="text-xs font-bold text-blue-700">
                            ₹ {j.ctc?.total || j.salary || 'Competitive'}
                          </span>
                        </div>
                        <h4 className="font-black text-base text-slate-900 leading-snug">{j.role}</h4>
                        <p className="text-xs text-slate-500 mt-1">📍 {j.locations?.join(', ') || j.location || 'Noida'}</p>

                        {j.deadline && (
                          <p className="text-3xs text-orange-600 font-bold mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Application Deadline: {new Date(j.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <Link
                        to="/jobs"
                        className="mt-4 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold text-center block"
                      >
                        View Full Details & Apply
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* SPECIALIZED MODULAR PANELS (Mounted as Clean Views)               */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'resume' && (
            <StudentResumeManager
              profile={profile}
              onProfileUpdated={(updatedProfile) => {
                if (updatedProfile) {
                  setProfile(updatedProfile);
                  setEditForm(updatedProfile);
                }
                fetchDashboardData();
              }}
            />
          )}
          {activeTab === 'aptitude' && <AptitudePanel />}
          {activeTab === 'mockInterview' && <MockInterviewPanel />}
          {activeTab === 'skillGap' && <SkillGapPanel />}
          {activeTab === 'interviewPrep' && <InterviewPrepPanel />}
          {activeTab === 'schedule' && <ScheduledInterviewsPanel />}
          {activeTab === 'calendar' && <PlacementCalendarPanel />}
          {activeTab === 'workshops' && <StudentWorkshopsPanel />}
          {activeTab === 'hackathons' && <StudentHackathonsPanel />}
          {activeTab === 'reviews' && <CompanyReviewsPanel />}
          {activeTab === 'eligibility' && <EligibilityCheckerPanel onNavigateToJobs={() => setActiveTab('jobs')} />}

          {/* Profile View */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                    {profile?.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{profile?.name || 'Student Candidate'}</h3>
                    <p className="text-xs text-slate-500">{profile?.branch || 'MCA'} • Class of {profile?.year || '2026'}</p>
                    <p className="text-2xs text-blue-600 font-bold mt-0.5">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile Details
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block">Graduation CGPA</span>
                  <span className="text-lg font-black text-slate-900">{profile?.cgpa || 7.5}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block">Active Backlogs</span>
                  <span className="text-lg font-black text-slate-900">{profile?.backlogs || 0}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block">Contact Phone</span>
                  <span className="text-xs font-bold text-slate-900">{profile?.phone || 'Not set'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block">Resume ATS Score</span>
                  <span className="text-lg font-black text-emerald-700">{resumeScore}%</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Technical Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.skills?.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200">
                      {s}
                    </span>
                  ))}
                  {(!profile?.skills || profile.skills.length === 0) && (
                    <span className="text-xs text-slate-400">No skills listed yet. Upload resume to auto-extract.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notifications View */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-4 animate-fade-in">
              <h3 className="text-xl font-black text-slate-900">Campus Notification Center</h3>
              <p className="text-xs text-slate-500">Live communication updates sent across in-app and email channels</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                You can manage and inspect your real-time messages directly via the top navigation bell badge.
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT PROFILE MODAL                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full my-8 max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Profile Information</h3>
              <button onClick={() => setEditProfileOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Degree / Branch</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={editForm.branch || ''}
                    onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Graduation Year</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={editForm.year || ''}
                    onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={editForm.cgpa || ''}
                    onChange={e => setEditForm({ ...editForm, cgpa: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={editForm.phone || ''}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  disabled={savingProfile}
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
