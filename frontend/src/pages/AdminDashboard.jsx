import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import {
  Database, UserCheck, ShieldAlert, FileText, CheckCircle, XCircle,
  Navigation, Users, Building2, Briefcase, Activity, Search,
  ChevronLeft, ChevronRight, Filter, AlertCircle, RefreshCw, X, Eye
} from 'lucide-react';
import AIInsightsDashboard from '../components/ai/AIInsightsDashboard';

const STATUS_KEYS = ['Applied', 'Shortlisted', 'Technical Round', 'HR Round', 'Selected', 'Rejected', 'Other'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [distView, setDistView] = useState('applications'); // 'applications' | 'students'
  const [view, setView] = useState('overview'); // 'overview' | 'applications' | 'companies' | 'students' | 'jobs' | 'insights'

  // Collections state
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Applications Table & Pagination State
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, totalPages: 1 });

  // Student Drilldown Modal State
  const [drilldownStudent, setDrilldownStudent] = useState(null);
  const [studentApps, setStudentApps] = useState([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // ─── Fetch Dashboard Stats ──────────────────────────────────────────────────
  const fetchDashboard = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.stats);
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
      setStatsError('Failed to load dashboard statistics.');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ─── Fetch Applications with server-side pagination & filter ────────────────
  const fetchApplications = useCallback(async (statusOverride, pageNum = 1, search = searchQuery) => {
    setAppsLoading(true);
    setAppsError(null);
    const activeStatus = statusOverride !== undefined ? statusOverride : selectedStatus;
    try {
      const { data } = await api.get('/admin/applications', {
        params: {
          status: activeStatus === 'All' ? undefined : activeStatus,
          search: search.trim() || undefined,
          page: pageNum,
          limit: 10
        }
      });
      setApplications(data.applications || []);
      setPagination(data.pagination || { total: 0, limit: 10, totalPages: 1 });
      setPage(pageNum);
      setSelectedStatus(activeStatus);
      setView('applications');
    } catch (err) {
      console.error('Error fetching applications:', err);
      setAppsError('Failed to load applications list.');
    } finally {
      setAppsLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/admin/companies');
      setCompanies(data.companies || []);
      setView('companies');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data.students || []);
      setView('students');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/admin/jobs');
      setJobs(data.jobs || []);
      setView('jobs');
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Student Applications Drilldown ─────────────────────────────────────────
  const openStudentDrilldown = async (student) => {
    if (!student?._id) return;
    setDrilldownStudent(student);
    setDrilldownLoading(true);
    try {
      const { data } = await api.get('/admin/applications', {
        params: { studentId: student._id, limit: 100 }
      });
      setStudentApps(data.applications || []);
    } catch (err) {
      console.error('Error fetching student applications:', err);
      setStudentApps([]);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const closeDrilldown = () => {
    setDrilldownStudent(null);
    setStudentApps([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Shortlisted':
      case 'Resume Shortlisted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Technical Round': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HR Round': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Applied': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Distribution safe map (guarantees number values)
  const currentDistMap = distView === 'applications'
    ? (stats?.statusDistribution?.byApplications || {})
    : (stats?.statusDistribution?.byStudents || {});

  return (
    <div className="animate-fade-in space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="text-indigo-600 w-8 h-8" />
            Administrative Control Panel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time university placement metrics, student records & application pipeline
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={statsLoading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Loading Skeleton & Error State */}
      {statsLoading && !stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      )}

      {statsError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{statsError}</span>
          </div>
          <button onClick={fetchDashboard} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* High-Level Stat Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Registered Students', value: stats.students || 0, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-100', action: fetchStudents },
              { label: 'Students who Applied', value: stats.studentsWhoApplied || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', action: () => fetchApplications('All') },
              { label: 'Platform Companies', value: stats.companies || 0, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100', action: fetchCompanies },
              { label: 'Total Job Postings', value: stats.jobs || 0, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-100', action: fetchJobs },
              { label: 'System Applications', value: stats.statusDistribution?.appTotal || stats.applications || 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100', action: () => fetchApplications('All') },
            ].map((s, i) => (
              <div
                key={i}
                onClick={s.action}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <Navigation className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition translate-x-0 group-hover:translate-x-1" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insights & Workshops Link Banner */}
          <div
            onClick={() => setView('insights')}
            className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 rounded-2xl shadow-sm border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-lg transition cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Placement Intelligence & Interventions</p>
                  <span className="bg-emerald-500/20 text-emerald-300 text-2xs px-2 py-0.5 rounded-full font-bold">Workshops & Hackathons</span>
                </div>
                <p className="text-xl font-black text-white mt-0.5">Conduct Workshops, Hackathons & Skill-Gap Diagnostics</p>
                <p className="text-xs text-indigo-200/80 mt-1">1-click create campus workshops tailored to student skill deficiencies & track attendance</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold shrink-0 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 group-hover:bg-white/20 transition">
              <span>Open Workshops & Insights</span>
              <Navigation className="w-4 h-4 transition translate-x-0 group-hover:translate-x-1" />
            </div>
          </div>
        </>
      )}

      {/* ─── Application Status Distribution (Toggleable) ──────────────────── */}
      {stats && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Application Status Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {distView === 'applications'
                  ? `Counts all individual applications across companies (Sum = ${stats.statusDistribution?.appTotal || stats.applications || 0})`
                  : `Counts each student once at their most advanced stage (Sum = ${stats.studentsWhoApplied || 0} students)`}
              </p>
            </div>
            {/* Toggle By Applications | By Students */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setDistView('applications')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  distView === 'applications'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Applications ({stats.statusDistribution?.appTotal || stats.applications || 0})
              </button>
              <button
                type="button"
                onClick={() => setDistView('students')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  distView === 'students'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Students ({stats.studentsWhoApplied || 0})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {STATUS_KEYS.map((status) => {
              const count = Number(currentDistMap[status] || 0);
              return (
                <button
                  key={status}
                  onClick={() => fetchApplications(status, 1)}
                  className={`p-4 rounded-xl border text-center transition hover:shadow-md hover:scale-[1.02] ${getStatusColor(
                    status
                  )}`}
                >
                  <p className="text-2xl font-black">{count}</p>
                  <p className="text-xs font-bold mt-1 truncate">{status}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── AI Insights View ────────────────────────────────────────────── */}
      {view === 'insights' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fade-in mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Coordinator Analytics Dashboard</h2>
            <button
              onClick={() => setView('overview')}
              className="text-sm text-indigo-600 font-bold hover:underline"
            >
              Close View
            </button>
          </div>
          <AIInsightsDashboard />
        </div>
      )}

      {/* ─── Overview Prompt View ────────────────────────────────────────── */}
      {view === 'overview' && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          <Database className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">Select a category or status card above to drill down</h2>
          <p className="text-sm mt-1 text-slate-400">
            Click any metric card to review paginated student records, company details, or the application pipeline.
          </p>
        </div>
      )}

      {/* ─── Applications Table View (Server-side Paginated) ─────────────── */}
      {view === 'applications' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          {/* Table Header Controls */}
          <div className="p-5 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>System Applications</span>
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Total: {pagination.total}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtered by status: <strong>{selectedStatus}</strong> · Showing {applications.length} on page {page} of {pagination.totalPages || 1}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchApplications(selectedStatus, 1, searchQuery);
                  }}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 w-48 sm:w-56"
                />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => fetchApplications(e.target.value, 1, searchQuery)}
                className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                {STATUS_KEYS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button
                onClick={() => setView('overview')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                Close View
              </button>
            </div>
          </div>

          {appsLoading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading applications...</div>
          ) : appsError ? (
            <div className="p-8 text-center text-rose-600">
              <p className="text-sm font-semibold">{appsError}</p>
              <button
                onClick={() => fetchApplications(selectedStatus, page, searchQuery)}
                className="mt-2 text-xs font-bold underline"
              >
                Retry
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No applications found matching the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Student (Click to drill down)</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Company → Role</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Applied Date</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Match Score</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => openStudentDrilldown(a.student)}
                          className="font-bold text-indigo-600 hover:underline flex items-center gap-1.5 text-left"
                        >
                          <span>{a.student?.name || 'Unknown Student'}</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                        <span className="text-xs text-slate-400 block font-normal">
                          {a.student?.user?.email || a.student?.user?.userId || ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-medium text-slate-700">
                        {a.company?.name || 'N/A'} <span className="text-slate-400 font-normal">→</span> {a.job?.role || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {a.appliedOn ? new Date(a.appliedOn).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-indigo-600 text-sm">
                        {a.matchScore != null ? `${a.matchScore}%` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing {applications.length > 0 ? (page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} applications
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchApplications(selectedStatus, page - 1, searchQuery)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold px-2">Page {page} of {pagination.totalPages || 1}</span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => fetchApplications(selectedStatus, page + 1, searchQuery)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Companies View ─────────────────────────────────────────────── */}
      {view === 'companies' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Manage Partner Companies ({companies.length})</h2>
            <button onClick={() => setView('overview')} className="text-sm text-indigo-600 font-bold hover:underline">Close View</button>
          </div>
          <div className="overflow-x-auto p-4">
            {companies.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No companies registered yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Company</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Headquarters</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Branch Offices</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Website</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map(c => {
                    const hq = c.headquarters || {};
                    const hqText = [hq.city, hq.state, hq.country].filter(Boolean).join(', ') || 'Noida, India';
                    return (
                      <tr key={c._id} className="hover:bg-slate-50">
                        <td className="py-4 px-2 font-bold text-slate-900">
                          {c.name}
                          <span className="text-2xs text-slate-400 block font-normal">{c.contactPerson || c.user?.email || ''}</span>
                        </td>
                        <td className="py-4 px-2 text-xs font-medium text-slate-700">📍 {hqText}</td>
                        <td className="py-4 px-2 text-xs text-slate-600">
                          {c.branchLocations?.length ? (
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-2xs">
                              {c.branchLocations.slice(0, 3).join(', ')}{c.branchLocations.length > 3 ? ` +${c.branchLocations.length - 3}` : ''}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-4 px-2 text-sm text-indigo-600">
                          {c.website ? (
                            <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1 text-xs font-semibold">
                              {c.website.replace(/^https?:\/\//, '')}
                            </a>
                          ) : 'N/A'}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Jobs View ─────────────────────────────────────────────────── */}
      {view === 'jobs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">All Job Posts ({jobs.length})</h2>
            <button onClick={() => setView('overview')} className="text-sm text-indigo-600 font-bold hover:underline">Close View</button>
          </div>
          <div className="overflow-x-auto p-4">
            {jobs.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No jobs posted yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Company</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Role</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Compensation</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map(j => (
                    <tr key={j._id} className="hover:bg-slate-50">
                      <td className="py-4 px-2 font-bold text-slate-700">{j.company?.name || 'Unknown'}</td>
                      <td className="py-4 px-2 text-slate-900 font-semibold">{j.role}</td>
                      <td className="py-4 px-2 text-sm text-slate-600">{j.salary}</td>
                      <td className="py-4 px-2 text-sm text-slate-600">{j.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Students View ─────────────────────────────────────────────── */}
      {view === 'students' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">All Registered Students ({students.length})</h2>
            <button onClick={() => setView('overview')} className="text-sm text-indigo-600 font-bold hover:underline">Close View</button>
          </div>
          <div className="overflow-x-auto p-4">
            {students.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No students registered yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Student Name</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Student ID</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Branch / Year</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Applications</th>
                    <th className="pb-3 px-2 text-xs font-bold text-slate-500 uppercase">Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="py-4 px-2 font-bold text-slate-900">
                        <button
                          onClick={() => openStudentDrilldown(s)}
                          className="hover:underline text-indigo-600 text-left font-bold"
                        >
                          {s.name}
                        </button>
                        <span className="text-xs text-slate-400 font-normal block">{s.user?.email}</span>
                      </td>
                      <td className="py-4 px-2 text-sm text-slate-600 font-mono">{s.user?.userId || 'N/A'}</td>
                      <td className="py-4 px-2 text-sm text-slate-600">{s.branch || 'Not set'} — {s.year || 'Not set'}</td>
                      <td className="py-4 px-2 text-sm">
                        <button
                          onClick={() => openStudentDrilldown(s)}
                          className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100"
                        >
                          View Applications →
                        </button>
                      </td>
                      <td className="py-4 px-2 text-sm">
                        {s.resumeUrl ? <CheckCircle className="text-emerald-500 w-5 h-5"/> : <XCircle className="text-slate-300 w-5 h-5" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Student Drill-Down Modal ────────────────────────────────────── */}
      {drilldownStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{drilldownStudent.name} — Applications Breakdown</h3>
                <p className="text-xs text-indigo-200">
                  {drilldownStudent.branch || 'Branch N/A'} · {drilldownStudent.year || 'Year N/A'} · {studentApps.length} total applications
                </p>
              </div>
              <button onClick={closeDrilldown} className="p-2 hover:bg-white/10 rounded-xl transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {drilldownLoading ? (
                <div className="text-center py-8 text-slate-400">Loading student applications...</div>
              ) : studentApps.length === 0 ? (
                <div className="text-center py-8 text-slate-400">This student has not submitted any applications yet.</div>
              ) : (
                studentApps.map((app) => (
                  <div key={app._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{app.company?.name || 'Company N/A'}</h4>
                      <p className="text-xs text-slate-600 font-medium">{app.job?.role || 'Job Role N/A'}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applied on: {app.appliedOn ? new Date(app.appliedOn).toLocaleDateString('en-IN') : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      {app.matchScore != null && (
                        <p className="text-[11px] font-bold text-indigo-600 mt-1.5">Match: {app.matchScore}%</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={closeDrilldown}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
