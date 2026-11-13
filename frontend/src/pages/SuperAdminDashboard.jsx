import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import {
    Activity,
    Building2,
    ChevronLeft,
    ChevronRight,
    Edit,
    FileText,
    Mail,
    Plus,
    Search,
    ShieldCheck,    
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import Analytics from './Analytics';

const PAGE_SIZE = 10;
const STATUSES = ['All', 'Applied', 'Shortlisted', 'Technical Round', 'HR Round', 'Selected', 'Rejected'];
const blankPagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };

const moduleMeta = {
    students: { label: 'Students', icon: Users, accent: 'bg-blue-50 text-blue-700 border-blue-100' },
    admins: { label: 'Admins', icon: UserCog, accent: 'bg-amber-50 text-amber-700 border-amber-100' },
    companies: { label: 'Companies', icon: Building2, accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    applications: { label: 'Applications', icon: FileText, accent: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' },
};

const studentForm = { name: '', email: '', userId: '', password: '', branch: '', year: '', skills: '', experience: '', cgpa: '' };
const adminForm = { name: '', email: '', userId: '', password: '' };
const companyForm = { name: '', email: '', password: '', website: '', description: '', contactPerson: '', phone: '', status: 'approved' };

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : 'N/A';

const statusClass = (status) => {
    switch (status) {
        case 'Selected': return 'bg-green-50 text-green-700 border-green-200';
        case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
        case 'Shortlisted': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Technical Round': return 'bg-violet-50 text-violet-700 border-violet-200';
        case 'HR Round': return 'bg-pink-50 text-pink-700 border-pink-200';
        default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};

const Pagination = ({ pagination, onChange }) => (
    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
        <div className="flex gap-2">
            <button type="button" onClick={() => onChange(pagination.page - 1)} disabled={pagination.page <= 1} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button type="button" onClick={() => onChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40">
                Next <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    </div>
);

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    const [students, setStudents] = useState([]);
    const [studentsPagination, setStudentsPagination] = useState(blankPagination);
    const [studentsSearch, setStudentsSearch] = useState('');
    const [studentsLoading, setStudentsLoading] = useState(false);

    const [admins, setAdmins] = useState([]);
    const [adminsPagination, setAdminsPagination] = useState(blankPagination);
    const [adminsSearch, setAdminsSearch] = useState('');
    const [adminsLoading, setAdminsLoading] = useState(false);

    const [companies, setCompanies] = useState([]);
    const [companiesPagination, setCompaniesPagination] = useState(blankPagination);
    const [companiesSearch, setCompaniesSearch] = useState('');
    const [companiesLoading, setCompaniesLoading] = useState(false);

    const [applications, setApplications] = useState([]);
    const [applicationsPagination, setApplicationsPagination] = useState(blankPagination);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');

    const [reportYear, setReportYear] = useState('');
    const [reportMonth, setReportMonth] = useState('');
    const [reportCourse, setReportCourse] = useState('');
    const [reportCompany, setReportCompany] = useState('');
    const [reportData, setReportData] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportPagination, setReportPagination] = useState(blankPagination);
    const [exportLoading, setExportLoading] = useState(false);

    const [modal, setModal] = useState({ open: false, type: 'students', mode: 'create', id: null, values: studentForm });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState('');

    const counts = useMemo(() => ({
        students: stats?.students || 0,
        admins: stats?.admins || 0,
        companies: stats?.companies || 0,
        applications: stats?.applications || 0,
    }), [stats]);

    const updateModal = (key, value) => setModal((current) => ({ ...current, values: { ...current.values, [key]: value } }));

    const refreshDashboard = async () => {
        setDashboardLoading(true);
        try {
            const { data } = await api.get('/super-admin/dashboard');
            setStats(data.stats);
            setActivity(data.recentActivity || []);
        } catch (error) {
            console.error(error);
        } finally {
            setDashboardLoading(false);
        }
    };

    useEffect(() => {
        refreshDashboard();
    }, []);

    const fetchStudents = async (page = studentsPagination.page, search = studentsSearch) => {
        setStudentsLoading(true);
        try {
            const { data } = await api.get('/super-admin/students', { params: { page, limit: PAGE_SIZE, search: search || undefined } });
            setStudents(data.students || []);
            setStudentsPagination(data.pagination || blankPagination);
        } catch (error) {
            console.error(error);
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchAdmins = async (page = adminsPagination.page, search = adminsSearch) => {
        setAdminsLoading(true);
        try {
            const { data } = await api.get('/super-admin/admins', { params: { page, limit: PAGE_SIZE, search: search || undefined } });
            setAdmins(data.admins || []);
            setAdminsPagination(data.pagination || blankPagination);
        } catch (error) {
            console.error(error);
        } finally {
            setAdminsLoading(false);
        }
    };

    const fetchCompanies = async (page = companiesPagination.page, search = companiesSearch) => {
        setCompaniesLoading(true);
        try {
            const { data } = await api.get('/super-admin/companies', { params: { page, limit: PAGE_SIZE, search: search || undefined } });
            setCompanies(data.companies || []);
            setCompaniesPagination(data.pagination || blankPagination);
        } catch (error) {
            console.error(error);
        } finally {
            setCompaniesLoading(false);
        }
    };

    const fetchApplications = async (page = applicationsPagination.page, status = statusFilter) => {
        setApplicationsLoading(true);
        try {
            const { data } = await api.get('/super-admin/applications', { params: { page, limit: PAGE_SIZE, status: status === 'All' ? undefined : status } });
            setApplications(data.applications || []);
            setApplicationsPagination(data.pagination || blankPagination);
        } catch (error) {
            console.error(error);
        } finally {
            setApplicationsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'students') fetchStudents();
    }, [activeTab, studentsPagination.page, studentsSearch]);

    useEffect(() => {
        if (activeTab === 'admins') fetchAdmins();
    }, [activeTab, adminsPagination.page, adminsSearch]);

    useEffect(() => {
        if (activeTab === 'companies') fetchCompanies();
    }, [activeTab, companiesPagination.page, companiesSearch]);

    useEffect(() => {
        if (activeTab === 'applications') fetchApplications();
    }, [activeTab, applicationsPagination.page, statusFilter]);

    const fetchReport = async (page = reportPagination.page) => {
        setReportLoading(true);
        try {
            const { data } = await api.get('/super-admin/reports/applications', {
                params: {
                    year: reportYear || undefined,
                    month: reportMonth || undefined,
                    course: reportCourse || undefined,
                    company: reportCompany || undefined,
                    page,
                    limit: PAGE_SIZE
                }
            });
            setReportData(data.report || []);
            setReportPagination(data.pagination || blankPagination);
        } catch (error) {
            console.error('Failed to fetch report');
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'reporting') {
            fetchReport(1); // Fetch page 1 when filters change
        }
    }, [activeTab, reportYear, reportMonth, reportCourse, reportCompany]);

    useEffect(() => {
        if (activeTab === 'reporting' && reportPagination.page > 1) {
            fetchReport(reportPagination.page);
        }
    }, [reportPagination.page]);

    const openModal = (type, mode, record = null) => {
        let values = studentForm;
        if (type === 'admins') values = adminForm;
        if (type === 'companies') values = companyForm;

        if (record && type === 'students') {
            values = {
                name: record.name || '',
                email: record.user?.email || '',
                userId: record.user?.userId || '',
                password: '',
                branch: record.branch || '',
                year: record.year || '',
                skills: record.skills?.join(', ') || '',
                experience: record.experience || '',
                cgpa: record.cgpa ?? '',
            };
        }

        if (record && type === 'admins') {
            values = { name: record.name || '', email: record.email || '', userId: record.userId || '', password: '' };
        }

        if (record && type === 'companies') {
            values = {
                name: record.name || '',
                email: record.user?.email || '',
                password: '',
                website: record.website || '',
                description: record.description || '',
                contactPerson: record.contactPerson || '',
                phone: record.phone || '',
                status: record.status || 'approved',
            };
        }

        setFormError('');
        setModal({ open: true, type, mode, id: record?._id || null, values });
    };

    const closeModal = () => {
        setModal((current) => ({ ...current, open: false }));
        setSaving(false);
        setFormError('');
    };

    const refreshCurrent = async () => {
        if (activeTab === 'students') await fetchStudents();
        if (activeTab === 'admins') await fetchAdmins();
        if (activeTab === 'companies') await fetchCompanies();
        if (activeTab === 'applications') await fetchApplications();
        if (activeTab === 'reporting') await fetchReport();
    };

    const handleExportCSV = async () => {
        setExportLoading(true);
        try {
            const { data } = await api.get('/super-admin/reports/applications', {
                params: {
                    year: reportYear || undefined,
                    month: reportMonth || undefined,
                    course: reportCourse || undefined,
                    company: reportCompany || undefined,
                    exportData: true
                }
            });

            if (!data.report || data.report.length === 0) {
                alert('No data found to export.');
                return;
            }

            // Generate CSV
            const headers = [
                'Student Name', 'Student ID', 'Email ID', 'Phone Number',
                'Course', 'Year', 'Company', 'Role', 'Status', 'Date Applied',
                'Skills', 'CGPA', 'Placement Type', 'Package'
            ];

            const rows = data.report.map(record => [
                `"${record.studentName || ''}"`,
                `"${record.studentId || ''}"`,
                `"${record.email || ''}"`,
                `"${record.phone || ''}"`,
                `"${record.course || ''}"`,
                `"${record.year || ''}"`,
                `"${record.company || ''}"`,
                `"${record.role || ''}"`,
                `"${record.status || ''}"`,
                `"${formatDate(record.appliedOn)}"`,
                `"${record.skills || ''}"`,
                `"${record.cgpa || ''}"`,
                `"${record.placementType || ''}"`,
                `"${record.package || ''}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            let filename = 'Applications_Master';
            if (reportCourse) filename += `_${reportCourse}`;
            if (reportMonth) filename += `_M${reportMonth}`;
            if (reportYear) filename += `_${reportYear}`;
            a.download = `${filename}.csv`;

            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to generate CSV export.');
        } finally {
            setExportLoading(false);
        }
    };

    const saveEntity = async () => {
        const payload = { ...modal.values };
        if (modal.type === 'students') {
            payload.skills = payload.skills.split(',').map((value) => value.trim()).filter(Boolean);
            payload.cgpa = payload.cgpa === '' ? undefined : Number(payload.cgpa);
        }
        if (!payload.password) delete payload.password;

        setSaving(true);
        setFormError('');

        try {
            const path = `/super-admin/${modal.type}`;
            if (modal.mode === 'create') await api.post(path, payload);
            else await api.put(`${path}/${modal.id}`, payload);
            closeModal();
            await Promise.all([refreshCurrent(), refreshDashboard()]);
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to save record');
            setSaving(false);
        }
    };

    const deleteEntity = async (type, id, label) => {
        if (!window.confirm(`Delete ${label}? This action cannot be undone.`)) return;
        setBusyId(id);
        try {
            await api.delete(`/super-admin/${type}/${id}`);
            if (type === 'students') await fetchStudents();
            if (type === 'admins') await fetchAdmins();
            if (type === 'companies') await fetchCompanies();
            if (type === 'applications') await fetchApplications();
            await refreshDashboard();
        } catch (error) {
            window.alert(error.response?.data?.error || 'Delete failed');
        } finally {
            setBusyId('');
        }
    };

    const updateApplicationStatus = async (id, status) => {
        setBusyId(id);
        try {
            await api.put(`/super-admin/applications/${id}`, { status });
            await Promise.all([fetchApplications(), refreshDashboard()]);
        } catch (error) {
            window.alert(error.response?.data?.error || 'Status update failed');
        } finally {
            setBusyId('');
        }
    };

    const renderHeader = (title, description, searchValue, onSearchChange, onCreate) => (
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={searchValue} onChange={onSearchChange} placeholder="Search records" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none sm:w-72" />
                </label>
                <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" /> Add new
                </button>
            </div>
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(moduleMeta).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                        <button key={key} type="button" onClick={() => setActiveTab(key)} className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{meta.label}</p>
                                    <p className="mt-3 text-4xl font-black text-slate-900">{counts[key]}</p>
                                    <p className="mt-2 text-sm text-slate-500">Open {meta.label.toLowerCase()} management</p>
                                </div>
                                <div className={`rounded-2xl border p-4 ${meta.accent}`}><Icon className="h-7 w-7" /></div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Application Tracking</h2>
                        <p className="text-sm text-slate-500">Click a status card to open the filtered table.</p>
                    </div>
                    <button type="button" onClick={() => { setStatusFilter('All'); setApplicationsPagination((current) => ({ ...current, page: 1 })); setActiveTab('applications'); }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                        View all applications
                    </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {STATUSES.filter((status) => status !== 'All').map((status) => (
                        <button key={status} type="button" onClick={() => { setStatusFilter(status); setApplicationsPagination((current) => ({ ...current, page: 1 })); setActiveTab('applications'); }} className={`rounded-2xl border p-4 text-center ${statusClass(status)}`}>
                            <p className="text-3xl font-black">{stats?.statusDistribution?.[status] || 0}</p>
                            <p className="mt-1 text-sm font-bold">{status}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <Activity className="h-5 w-5 text-slate-500" />
                        <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                    </div>
                    <div className="space-y-4">
                        {activity.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Activity will appear here as records change.</div> : activity.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{item.module}</span>
                                    <span className="text-xs text-slate-400">{formatDate(item.timestamp)}</span>
                                </div>
                                <p className="mt-3 text-base font-bold text-slate-900">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-slate-500" />
                        <h2 className="text-xl font-bold text-slate-900">Control Scope</h2>
                    </div>
                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-900">Full RBAC coverage</p><p className="mt-1">Super Admin routes are isolated from the existing admin, student, and company logic.</p></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-900">Central record management</p><p className="mt-1">Create, edit, and delete students, admins, and companies from one place.</p></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-900">Detailed application visibility</p><p className="mt-1">Filtered status tables include student email, company, status, application date, and added context.</p></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderModalFields = () => {
        if (modal.type === 'students') {
            return (
                <div className="grid gap-4 md:grid-cols-2">
                    <input value={modal.values.name} onChange={(event) => updateModal('name', event.target.value)} placeholder="Name" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.email} onChange={(event) => updateModal('email', event.target.value)} placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.userId} onChange={(event) => updateModal('userId', event.target.value)} placeholder="Student ID" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input type="password" value={modal.values.password} onChange={(event) => updateModal('password', event.target.value)} placeholder={`Password ${modal.mode === 'edit' ? '(optional)' : ''}`} className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.branch} onChange={(event) => updateModal('branch', event.target.value)} placeholder="Branch" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.year} onChange={(event) => updateModal('year', event.target.value)} placeholder="Year" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.cgpa} onChange={(event) => updateModal('cgpa', event.target.value)} placeholder="CGPA" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.experience} onChange={(event) => updateModal('experience', event.target.value)} placeholder="Experience" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <textarea value={modal.values.skills} onChange={(event) => updateModal('skills', event.target.value)} rows="3" placeholder="Skills (comma separated)" className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" />
                </div>
            );
        }

        if (modal.type === 'admins') {
            return (
                <div className="grid gap-4 md:grid-cols-2">
                    <input value={modal.values.name} onChange={(event) => updateModal('name', event.target.value)} placeholder="Name" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.email} onChange={(event) => updateModal('email', event.target.value)} placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input value={modal.values.userId} onChange={(event) => updateModal('userId', event.target.value)} placeholder="Admin ID" className="rounded-xl border border-slate-200 px-4 py-3" />
                    <input type="password" value={modal.values.password} onChange={(event) => updateModal('password', event.target.value)} placeholder={`Password ${modal.mode === 'edit' ? '(optional)' : ''}`} className="rounded-xl border border-slate-200 px-4 py-3" />
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2">
                <input value={modal.values.name} onChange={(event) => updateModal('name', event.target.value)} placeholder="Company name" className="rounded-xl border border-slate-200 px-4 py-3" />
                <input value={modal.values.email} onChange={(event) => updateModal('email', event.target.value)} placeholder="Email" className="rounded-xl border border-slate-200 px-4 py-3" />
                <input type="password" value={modal.values.password} onChange={(event) => updateModal('password', event.target.value)} placeholder={`Password ${modal.mode === 'edit' ? '(optional)' : ''}`} className="rounded-xl border border-slate-200 px-4 py-3" />
                <select value={modal.values.status} onChange={(event) => updateModal('status', event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">
                    <option value="approved">approved</option>
                    <option value="pending">pending</option>
                    <option value="rejected">rejected</option>
                </select>
                <input value={modal.values.website} onChange={(event) => updateModal('website', event.target.value)} placeholder="Website" className="rounded-xl border border-slate-200 px-4 py-3" />
                <input value={modal.values.contactPerson} onChange={(event) => updateModal('contactPerson', event.target.value)} placeholder="Contact person" className="rounded-xl border border-slate-200 px-4 py-3" />
                <input value={modal.values.phone} onChange={(event) => updateModal('phone', event.target.value)} placeholder="Phone" className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" />
                <textarea value={modal.values.description} onChange={(event) => updateModal('description', event.target.value)} rows="4" placeholder="Description" className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" />
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            <section className="overflow-hidden rounded-4xl border border-blue-900 bg-linear-to-br from-blue-950 via-blue-900 to-blue-800 p-8 text-white shadow-xl">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-200">
                            <ShieldCheck className="h-4 w-4" /> Super Admin Panel
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">Centralized control for students, admins, companies, and applications.</h1>
                        <p className="mt-4 max-w-2xl text-base text-slate-300">Manage every core module from one place, drill into application stages instantly, and monitor platform-wide activity without leaving the dashboard.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(moduleMeta).map(([key, meta]) => {
                            const Icon = meta.icon;
                            return (
                                <button key={key} type="button" onClick={() => setActiveTab(key)} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:bg-white/10">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{meta.label}</p>
                                            <p className="mt-2 text-2xl font-black">{counts[key]}</p>
                                        </div>
                                        <Icon className="h-6 w-6 text-slate-300" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="flex flex-wrap gap-3">
                {['overview', 'students', 'admins', 'companies', 'applications', 'analytics', 'reporting'].map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition ${activeTab === tab
                                ? 'bg-blue-900 text-white'
                                : 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-100'
                            }`}
                    >
                        {tab === 'overview' ? 'Overview' : tab === 'analytics' ? 'Analytics' : `Manage ${tab}`}
                    </button>
                ))}
            </div>

            {dashboardLoading && !stats ? <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">Loading super admin workspace...</div> : (
                <>
                    {activeTab === 'overview' && renderOverview()}

                    {activeTab === 'students' && (
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            {renderHeader('Manage Students', 'Search, create, update, and remove student records.', studentsSearch, (event) => { setStudentsSearch(event.target.value); setStudentsPagination((current) => ({ ...current, page: 1 })); }, () => openModal('students', 'create'))}
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-6 py-4">Student</th><th className="px-6 py-4">Student ID</th><th className="px-6 py-4">Academic</th><th className="px-6 py-4">Skills</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {studentsLoading ? <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">Loading students...</td></tr> : students.length === 0 ? <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500">No students found.</td></tr> : students.map((student) => (
                                            <tr key={student._id} className="align-top">
                                                <td className="px-6 py-4"><p className="font-bold text-slate-900">{student.name}</p><p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" />{student.user?.email || 'N/A'}</p></td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{student.user?.userId || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600"><p>{student.branch || 'Not set'}</p><p className="mt-1 text-slate-400">{student.year || 'Year not set'}</p></td>
                                                <td className="px-6 py-4"><div className="flex max-w-sm flex-wrap gap-2">{student.skills?.length ? student.skills.slice(0, 5).map((skill) => <span key={`${student._id}-${skill}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{skill}</span>) : <span className="text-sm text-slate-400">No skills</span>}</div></td>
                                                <td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openModal('students', 'edit', student)} className="rounded-lg border border-slate-200 p-2 text-slate-500"><Edit className="h-4 w-4" /></button><button type="button" disabled={busyId === student._id} onClick={() => deleteEntity('students', student._id, student.name)} className="rounded-lg border border-red-100 p-2 text-red-500 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination pagination={studentsPagination} onChange={(page) => setStudentsPagination((current) => ({ ...current, page }))} />
                        </div>
                    )}

                    {activeTab === 'admins' && (
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            {renderHeader('Manage Admins', 'Maintain limited-access admin accounts without changing their existing feature scope.', adminsSearch, (event) => { setAdminsSearch(event.target.value); setAdminsPagination((current) => ({ ...current, page: 1 })); }, () => openModal('admins', 'create'))}
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-6 py-4">Admin</th><th className="px-6 py-4">Admin ID</th><th className="px-6 py-4">Created</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {adminsLoading ? <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-500">Loading admins...</td></tr> : admins.length === 0 ? <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-500">No admins found.</td></tr> : admins.map((admin) => (
                                            <tr key={admin._id}>
                                                <td className="px-6 py-4"><p className="font-bold text-slate-900">{admin.name || 'Admin account'}</p><p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" />{admin.email}</p></td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{admin.userId || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(admin.createdAt)}</td>
                                                <td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openModal('admins', 'edit', admin)} className="rounded-lg border border-slate-200 p-2 text-slate-500"><Edit className="h-4 w-4" /></button><button type="button" disabled={busyId === admin._id} onClick={() => deleteEntity('admins', admin._id, admin.name || admin.email)} className="rounded-lg border border-red-100 p-2 text-red-500 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination pagination={adminsPagination} onChange={(page) => setAdminsPagination((current) => ({ ...current, page }))} />
                        </div>
                    )}

                    {activeTab === 'companies' && (
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            {renderHeader('Manage Companies', 'Control company access, contacts, approval state, and dashboard visibility.', companiesSearch, (event) => { setCompaniesSearch(event.target.value); setCompaniesPagination((current) => ({ ...current, page: 1 })); }, () => openModal('companies', 'create'))}
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-6 py-4">Company</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {companiesLoading ? <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-500">Loading companies...</td></tr> : companies.length === 0 ? <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-500">No companies found.</td></tr> : companies.map((company) => (
                                            <tr key={company._id}>
                                                <td className="px-6 py-4"><p className="font-bold text-slate-900">{company.name}</p><p className="mt-1 text-sm text-slate-500">{company.website || company.user?.email || 'No website provided'}</p></td>
                                                <td className="px-6 py-4 text-sm text-slate-600"><p>{company.contactPerson || 'N/A'}</p><p className="mt-1">{company.phone || company.user?.email || 'N/A'}</p></td>
                                                <td className="px-6 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${company.status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' : company.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{company.status}</span></td>
                                                <td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openModal('companies', 'edit', company)} className="rounded-lg border border-slate-200 p-2 text-slate-500"><Edit className="h-4 w-4" /></button><button type="button" disabled={busyId === company._id} onClick={() => deleteEntity('companies', company._id, company.name)} className="rounded-lg border border-red-100 p-2 text-red-500 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination pagination={companiesPagination} onChange={(page) => setCompaniesPagination((current) => ({ ...current, page }))} />
                        </div>
                    )}

                    {activeTab === 'applications' && (
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div><h2 className="text-xl font-bold text-slate-900">Application Tracking</h2><p className="mt-1 text-sm text-slate-500">Detailed student-company application data filtered by status.</p></div>
                                    <div className="flex flex-wrap gap-2">{STATUSES.map((status) => <button key={status} type="button" onClick={() => { setStatusFilter(status); setApplicationsPagination((current) => ({ ...current, page: 1 })); }} className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusFilter === status ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{status}</button>)}</div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-6 py-4">Student</th><th className="px-6 py-4">Company</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Applied On</th><th className="px-6 py-4">Additional Details</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {applicationsLoading ? <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">Loading applications...</td></tr> : applications.length === 0 ? <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">No applications found for this status.</td></tr> : applications.map((application) => (
                                            <tr key={application._id} className="align-top">
                                                <td className="px-6 py-4"><p className="font-bold text-slate-900">{application.studentName}</p><p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" />{application.studentEmail}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{application.studentProfileId}</p></td>
                                                <td className="px-6 py-4 text-sm text-slate-600"><p className="font-semibold text-slate-800">{application.companyName}</p><p className="mt-1">{application.jobRole}</p></td>
                                                <td className="px-6 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(application.status)}`}>{application.status}</span></td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(application.dateOfApplication)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600"><p>{application.location}</p><p className="mt-1">Match score: {application.matchScore}%</p><p className="mt-1">Year: {application.year || 'N/A'} | CGPA: {application.cgpa ?? 'N/A'}</p></td>
                                                <td className="px-6 py-4"><div className="flex flex-col items-end gap-2"><select value={application.status} disabled={busyId === application._id} onChange={(event) => updateApplicationStatus(application._id, event.target.value)} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">{STATUSES.filter((status) => status !== 'All').map((status) => <option key={status} value={status}>{status}</option>)}</select><button type="button" disabled={busyId === application._id} onClick={() => deleteEntity('applications', application._id, `${application.studentName} at ${application.companyName}`)} className="rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-40">Delete</button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination pagination={applicationsPagination} onChange={(page) => setApplicationsPagination((current) => ({ ...current, page }))} />
                        </div>
                    )}

                    {activeTab === 'reporting' && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Detailed Application Tracking Data</h2>

                            {/* Summary Note */}
                            {reportPagination.total > 0 && (
                                <div className="mb-4 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    Showing {reportPagination.total} applications {reportCourse ? `for ${reportCourse}` : ''} {reportMonth || reportYear ? `in ${reportMonth ? `Month ${reportMonth}` : ''} ${reportYear}` : ''}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 mb-8 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Year Filter</label>
                                    <select
                                        value={reportYear}
                                        onChange={(e) => setReportYear(e.target.value)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition w-full sm:w-auto"
                                    >
                                        <option value="">Any Year</option>
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Month Filter</label>
                                    <select
                                        value={reportMonth}
                                        onChange={(e) => setReportMonth(e.target.value)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition w-full sm:w-auto"
                                    >
                                        <option value="">Any Month</option>
                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Course Filter</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MCA, B.Tech"
                                        value={reportCourse}
                                        onChange={(e) => setReportCourse(e.target.value)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition w-full sm:w-auto"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company Filter</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Google, Microsoft"
                                        value={reportCompany}
                                        onChange={(e) => setReportCompany(e.target.value)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition w-full sm:w-auto"
                                    />
                                </div>
                                <div className="ml-auto">
                                    <button
                                        onClick={handleExportCSV}
                                        disabled={exportLoading}
                                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                                    >
                                        {exportLoading ? 'Generating CSV...' : 'Export to CSV'}
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-2xl w-full">
                                <table className="w-450 text-left bg-white">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-4">Student Name</th>
                                            <th className="px-5 py-4">Student ID</th>
                                            <th className="px-5 py-4">Email ID</th>
                                            <th className="px-5 py-4">Phone</th>
                                            <th className="px-5 py-4">Course</th>
                                            <th className="px-5 py-4">Year/Sem</th>
                                            <th className="px-5 py-4">Company</th>
                                            <th className="px-5 py-4">Role</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4">Date Applied</th>
                                            <th className="px-5 py-4 w-48">Skills</th>
                                            <th className="px-5 py-4">CGPA</th>
                                            <th className="px-5 py-4">Placement Type</th>
                                            <th className="px-5 py-4">Package/Stipend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {reportLoading ? (
                                            <tr><td colSpan="14" className="px-6 py-12 text-center text-sm font-semibold text-slate-500 animate-pulse">Running advanced aggregations...</td></tr>
                                        ) : reportData.length === 0 ? (
                                            <tr><td colSpan="14" className="px-6 py-12 text-center text-sm text-slate-500">No applications found based on your parameters.</td></tr>
                                        ) : (
                                            reportData.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition align-top">
                                                    <td className="px-5 py-4 font-bold text-slate-800">{row.studentName}</td>
                                                    <td className="px-5 py-4 text-slate-600">{row.studentId}</td>
                                                    <td className="px-5 py-4 text-slate-600">{row.email}</td>
                                                    <td className="px-5 py-4 text-slate-600">{row.phone}</td>
                                                    <td className="px-5 py-4 font-semibold text-slate-800">{row.course}</td>
                                                    <td className="px-5 py-4 text-slate-600">{row.year}</td>
                                                    <td className="px-5 py-4 font-bold text-blue-900">{row.company}</td>
                                                    <td className="px-5 py-4 font-semibold text-slate-800">{row.role}</td>
                                                    <td className="px-5 py-4"><span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass(row.status)} whitespace-nowrap`}>{row.status}</span></td>
                                                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{formatDate(row.appliedOn)}</td>
                                                    <td className="px-5 py-4 text-slate-600 truncate max-w-xs">{row.skills}</td>
                                                    <td className="px-5 py-4 font-semibold text-slate-700">{row.cgpa}</td>
                                                    <td className="px-5 py-4 text-slate-500">{row.placementType}</td>
                                                    <td className="px-5 py-4 font-semibold text-emerald-700">{row.package}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination pagination={reportPagination} onChange={(page) => setReportPagination((current) => ({ ...current, page }))} />
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div>
                            <Analytics />
                        </div>
                    )}
                </>
            )}

            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-4xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{modal.mode === 'create' ? 'Create' : 'Edit'} {modal.type.slice(0, -1)}</p>
                            <h3 className="mt-2 text-2xl font-bold text-slate-900">{modal.mode === 'create' ? 'Add a new record' : 'Update existing record'}</h3>
                        </div>
                        <div className="space-y-5 px-6 py-6">
                            {formError && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</div>}
                            {renderModalFields()}
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
                            <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
                            <button type="button" onClick={saveEntity} disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;



/*import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';
import api from '../api';

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
  </div>
);

const EmptyState = () => (
  <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
    No data available
  </div>
);

const ChartCard = ({ title, children, loading }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
    {loading ? <LoadingSkeleton /> : children}
  </div>
);

const PieChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  const COLORS = ['#3B82F6', '#EAB308', '#A855F7', '#EC4899', '#10B981', '#EF4444', '#6B7280'];
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

const LineChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="applications" stroke="#3B82F6" dot={{ fill: '#3B82F6' }} strokeWidth={2} name="Applications" />
      </LineChart>
    </ResponsiveContainer>
  );
};

const VerticalBarChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="course" stroke="#64748b" style={{ fontSize: '12px' }} />
        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="rate" fill="#10B981" name="Placement Rate (%)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const HorizontalBarChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
        <YAxis dataKey="name" type="category" width={140} stroke="#64748b" style={{ fontSize: '12px' }} />
        <Tooltip />
        <Bar dataKey="count" fill="#3B82F6" name="Applications" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ statusCounts: [], monthlyTrend: [], placementByCourse: [], topCompanies: [] });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data: response } = await api.get('/super-admin/analytics');
        setData(response);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setData({ statusCounts: [], monthlyTrend: [], placementByCourse: [], topCompanies: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Application Status Distribution" loading={loading}>
          <PieChartComponent data={data.statusCounts} />
        </ChartCard>
        <ChartCard title="Monthly Application Trend (Last 12 Months)" loading={loading}>
          <LineChartComponent data={data.monthlyTrend} />
        </ChartCard>
        <ChartCard title="Placement Rate by Course" loading={loading}>
          <VerticalBarChartComponent data={data.placementByCourse} />
        </ChartCard>
        <ChartCard title="Top Hiring Companies" loading={loading}>
          <HorizontalBarChartComponent data={data.topCompanies} />
        </ChartCard>
      </div>
    </div>
  );
}*/