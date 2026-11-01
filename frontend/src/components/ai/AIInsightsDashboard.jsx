import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Activity, Users, Target, Zap, AlertCircle, RefreshCw, Download, 
  Trophy, BookOpen, Plus, Trash2, Edit, Calendar, MapPin, 
  CheckCircle2, XCircle, Award, FileSpreadsheet, Sparkles, X, ChevronRight 
} from 'lucide-react';

export default function AIInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'hackathons' | 'workshops'

  // Analytics State
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hackathons State
  const [hackathons, setHackathons] = useState([]);
  const [showHackathonModal, setShowHackathonModal] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [hackathonForm, setHackathonForm] = useState({
    title: '',
    theme: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    mode: 'online',
    venueOrLink: 'Online Portal',
    teamSizeMin: 1,
    teamSizeMax: 4,
    maxParticipants: 150,
    branches: 'All',
    passingYears: '2026, 2027',
    prizes: '1st: ₹50,000, 2nd: ₹25,000',
    rules: 'Original code only. Automated plagiarism check.',
    skillsTargeted: 'Full Stack, AI/ML',
    organizerOrSponsor: 'JIMS Innovation & Placement Cell',
    bannerImage: ''
  });
  const [viewingRegistrations, setViewingRegistrations] = useState(null);
  const [recordingWinners, setRecordingWinners] = useState(null);
  const [winnerInputs, setWinnerInputs] = useState([
    { position: '1st Place Winner', teamName: '', prize: '₹50,000' },
    { position: '2nd Place Runner-Up', teamName: '', prize: '₹25,000' }
  ]);

  // Workshops State
  const [workshops, setWorkshops] = useState([]);
  const [suggestedWorkshops, setSuggestedWorkshops] = useState([]);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [workshopForm, setWorkshopForm] = useState({
    title: '',
    topic: '',
    targetSkill: '',
    targetStudentCount: 0,
    description: '',
    date: '',
    duration: '2 Hours',
    mode: 'online',
    venueOrLink: 'Google Meet',
    trainer: 'Industry Technical Specialist',
    capacity: 100
  });
  const [markingAttendance, setMarkingAttendance] = useState(null);
  const [attendedStudents, setAttendedStudents] = useState({});
  const [improvementScore, setImprovementScore] = useState(25);

  useEffect(() => {
    fetchInsights();
    fetchHackathons();
    fetchWorkshops();
    fetchSuggestedWorkshops();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/ai/insights');
      setInsights(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load AI Insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchHackathons = async () => {
    try {
      const res = await api.get('/events/hackathons');
      setHackathons(res.data.hackathons || []);
    } catch (err) {
      console.error('Failed to load hackathons', err);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const res = await api.get('/events/workshops');
      setWorkshops(res.data.workshops || []);
    } catch (err) {
      console.error('Failed to load workshops', err);
    }
  };

  const fetchSuggestedWorkshops = async () => {
    try {
      const res = await api.get('/events/workshops/skill-gap-suggestions');
      setSuggestedWorkshops(res.data.suggestions || []);
    } catch (err) {
      console.error('Failed to load skill gap suggestions', err);
    }
  };

  const downloadCSV = () => {
    if (!insights) return;
    let csvContent = 'AI Placement Analytics Report\n\n';
    csvContent += `Metrics,Value\n`;
    csvContent += `Average Resume Score,${insights.avgResumeScore}/100\n`;
    csvContent += `Placement Prediction,${insights.placementPrediction}%\n\n`;
    csvContent += `Top In-Demand Skills\n`;
    insights.topSkills?.forEach((skill, index) => {
      csvContent += `${index + 1},"${skill}"\n`;
    });
    csvContent += `\nSkill Gap Analysis\n`;
    csvContent += `Skill,Identified Gap\n`;
    insights.skillGapAnalysis?.forEach(gap => {
      const safeGap = gap.gap.replace(/"/g, '""');
      const safeSkill = gap.skill.replace(/"/g, '""');
      csvContent += `"${safeSkill}","${safeGap}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AI_Placement_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Hackathon Handlers ───────────────────────────────────────────────────
  const handleSaveHackathon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: hackathonForm.title,
        theme: hackathonForm.theme,
        description: hackathonForm.description,
        startDate: new Date(hackathonForm.startDate),
        endDate: new Date(hackathonForm.endDate),
        registrationDeadline: new Date(hackathonForm.registrationDeadline),
        mode: hackathonForm.mode,
        venueOrLink: hackathonForm.venueOrLink,
        teamSize: { min: Number(hackathonForm.teamSizeMin) || 1, max: Number(hackathonForm.teamSizeMax) || 4 },
        maxParticipants: Number(hackathonForm.maxParticipants) || 150,
        eligibility: {
          branches: hackathonForm.branches.split(',').map(s => s.trim()).filter(Boolean),
          passingYears: hackathonForm.passingYears.split(',').map(s => s.trim()).filter(Boolean)
        },
        prizes: hackathonForm.prizes,
        rules: hackathonForm.rules,
        skillsTargeted: hackathonForm.skillsTargeted.split(',').map(s => s.trim()).filter(Boolean),
        organizerOrSponsor: hackathonForm.organizerOrSponsor,
        bannerImage: hackathonForm.bannerImage
      };

      if (editingHackathon) {
        await api.put(`/events/hackathons/${editingHackathon._id}`, payload);
      } else {
        await api.post('/events/hackathons', payload);
      }
      setShowHackathonModal(false);
      setEditingHackathon(null);
      fetchHackathons();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save hackathon');
    }
  };

  const cancelHackathon = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this hackathon?')) return;
    try {
      await api.patch(`/events/hackathons/${id}/cancel`);
      fetchHackathons();
    } catch (err) {
      alert('Failed to cancel hackathon');
    }
  };

  const deleteHackathon = async (id) => {
    if (!window.confirm('Delete this hackathon and all team registrations?')) return;
    try {
      await api.delete(`/events/hackathons/${id}`);
      fetchHackathons();
    } catch (err) {
      alert('Failed to delete hackathon');
    }
  };

  const handleSaveWinners = async () => {
    if (!recordingWinners) return;
    try {
      await api.post(`/events/hackathons/${recordingWinners._id}/winners`, {
        winners: winnerInputs.filter(w => w.teamName.trim())
      });
      setRecordingWinners(null);
      fetchHackathons();
      alert('Winners recorded successfully and hackathon marked completed!');
    } catch (err) {
      alert('Failed to record winners');
    }
  };

  const handleIssueCertificates = async (hackathonId) => {
    try {
      await api.post(`/events/hackathons/${hackathonId}/certificates`);
      fetchHackathons();
      alert('Participation certificates issued to all registered students!');
    } catch (err) {
      alert('Failed to issue certificates');
    }
  };

  // ─── Workshop Handlers ────────────────────────────────────────────────────
  const openPrefilledWorkshop = (suggestion) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    setWorkshopForm({
      title: suggestion.suggestedTitle,
      topic: suggestion.suggestedTopic,
      targetSkill: suggestion.skill,
      targetStudentCount: suggestion.missingCount,
      description: `Targeted campus skill-enhancement workshop addressing platform deficiency in ${suggestion.skill}. Designed for ${suggestion.missingCount} eligible students.`,
      date: nextWeek.toISOString().slice(0, 16),
      duration: suggestion.duration || '2.5 Hours',
      mode: 'online',
      venueOrLink: 'https://meet.google.com/jims-placement-workshop',
      trainer: suggestion.trainer,
      capacity: suggestion.capacity || 100
    });
    setEditingWorkshop(null);
    setShowWorkshopModal(true);
  };

  const handleSaveWorkshop = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...workshopForm,
        date: new Date(workshopForm.date),
        capacity: Number(workshopForm.capacity) || 100,
        targetStudentCount: Number(workshopForm.targetStudentCount) || 0
      };

      if (editingWorkshop) {
        await api.put(`/events/workshops/${editingWorkshop._id}`, payload);
      } else {
        await api.post('/events/workshops', payload);
      }
      setShowWorkshopModal(false);
      setEditingWorkshop(null);
      fetchWorkshops();
      alert('Workshop published! Targeted students lacking this skill have been notified via in-app & email.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save workshop');
    }
  };

  const cancelWorkshop = async (id) => {
    if (!window.confirm('Cancel this workshop?')) return;
    try {
      await api.patch(`/events/workshops/${id}/cancel`);
      fetchWorkshops();
    } catch (err) {
      alert('Failed to cancel workshop');
    }
  };

  const deleteWorkshop = async (id) => {
    if (!window.confirm('Delete this workshop completely?')) return;
    try {
      await api.delete(`/events/workshops/${id}`);
      fetchWorkshops();
    } catch (err) {
      alert('Failed to delete workshop');
    }
  };

  const handleSaveAttendance = async () => {
    if (!markingAttendance) return;
    try {
      const attendedStudentIds = Object.keys(attendedStudents).filter(id => attendedStudents[id]);
      await api.patch(`/events/workshops/${markingAttendance._id}/attendance`, {
        attendedStudentIds,
        skillImprovementScore: Number(improvementScore) || 28
      });
      setMarkingAttendance(null);
      fetchWorkshops();
      alert(`Attendance recorded for ${attendedStudentIds.length} students! Measured skill improvement: +${improvementScore}%.`);
    } catch (err) {
      alert('Failed to record attendance');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-black tracking-tight text-white">AI Smart Insights & Interventions</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Platform analytics, hackathon drives, and skill-gap based training workshops.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 AI Analytics
            </button>
            <button
              onClick={() => setActiveTab('hackathons')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                activeTab === 'hackathons' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Hackathons ({hackathons.length})
            </button>
            <button
              onClick={() => setActiveTab('workshops')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                activeTab === 'workshops' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Skill-Gap Workshops ({workshops.length})
            </button>
          </div>

          {activeTab === 'analytics' && (
            <button 
              onClick={downloadCSV}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold border border-emerald-500/30 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}

          {activeTab === 'hackathons' && (
            <button
              onClick={() => {
                setEditingHackathon(null);
                setHackathonForm({
                  title: '',
                  theme: '',
                  description: '',
                  startDate: '',
                  endDate: '',
                  registrationDeadline: '',
                  mode: 'online',
                  venueOrLink: 'Online Portal',
                  teamSizeMin: 1,
                  teamSizeMax: 4,
                  maxParticipants: 150,
                  branches: 'All',
                  passingYears: '2026, 2027',
                  prizes: '1st: ₹50,000, 2nd: ₹25,000',
                  rules: 'Original code only.',
                  skillsTargeted: 'Full Stack, AI/ML',
                  organizerOrSponsor: 'JIMS Innovation & Placement Cell',
                  bannerImage: ''
                });
                setShowHackathonModal(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Hackathon
            </button>
          )}

          {activeTab === 'workshops' && (
            <button
              onClick={() => {
                setEditingWorkshop(null);
                setWorkshopForm({
                  title: '',
                  topic: '',
                  targetSkill: '',
                  targetStudentCount: 0,
                  description: '',
                  date: '',
                  duration: '2 Hours',
                  mode: 'online',
                  venueOrLink: 'Google Meet',
                  trainer: 'Industry Technical Specialist',
                  capacity: 100
                });
                setShowWorkshopModal(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Conduct Workshop
            </button>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: AI ANALYTICS & INSIGHTS                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6 rounded-3xl relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400"/> Average Resume ATS Score
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                  {insights?.avgResumeScore || 78}
                </h3>
                <span className="text-slate-500 pb-1 font-bold">/ 100</span>
              </div>
              <div className="mt-4 w-full bg-slate-700/50 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${insights?.avgResumeScore || 78}%` }}></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6 rounded-3xl relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400"/> Placement Conversion Projection
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                  {insights?.placementPrediction || 84}%
                </h3>
                <span className="text-slate-500 pb-1 font-medium">projected campus success</span>
              </div>
              <div className="mt-4 w-full bg-slate-700/50 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${insights?.placementPrediction || 84}%` }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top In-Demand Skills */}
            <div className="bg-slate-800/90 border border-slate-700/50 p-6 rounded-3xl shadow-md">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Top In-Demand Skills (from Active Job Drives)
              </h3>
              <div className="space-y-4">
                {(insights?.topSkills || ['React.js', 'Node.js', 'Python', 'Docker', 'AWS', 'SQL']).map((skill, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-6 text-slate-500 text-xs font-bold">{idx + 1}.</div>
                    <div className="flex-1 text-slate-300 font-semibold text-xs">{skill}</div>
                    <div className="w-1/2 bg-slate-700 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.max(15, 100 - (idx * 12))}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Skill Gap Analysis */}
            <div className="bg-slate-800/90 border border-slate-700/50 p-6 rounded-3xl shadow-md flex flex-col">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" /> Platform Skill Gap Analysis
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-72">
                {(insights?.skillGapAnalysis?.length ? insights.skillGapAnalysis : [
                  { skill: 'Docker', gap: '38% of candidate resumes lack containerization experience requested by cloud recruiter drives.' },
                  { skill: 'System Design', gap: 'Advanced architecture knowledge missing across 45% of MCA & B.Tech 2026 students.' },
                  { skill: 'DSA & Dynamic Programming', gap: 'Mock interview failure rate highest in medium-to-hard Leetcode DP questions.' }
                ]).map((gap, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-rose-500/20 flex gap-3 items-start">
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 text-2xs font-extrabold rounded-lg shrink-0">
                      {gap.skill}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {gap.gap}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: HACKATHON MANAGEMENT                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'hackathons' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map(h => (
              <div key={h._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wide ${
                      h.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                      h.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      h.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {h.status}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingHackathon(h); setHackathonForm({ ...h, startDate: h.startDate?.slice(0, 16), endDate: h.endDate?.slice(0, 16), registrationDeadline: h.registrationDeadline?.slice(0, 16), branches: h.eligibility?.branches?.join(', ') || 'All', passingYears: h.eligibility?.passingYears?.join(', ') || '2026', skillsTargeted: h.skillsTargeted?.join(', ') || '' }); setShowHackathonModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => cancelHackathon(h._id)} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-50"><XCircle className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteHackathon(h._id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <h3 className="font-black text-lg text-slate-900 leading-snug">{h.title}</h3>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">Theme: {h.theme}</p>

                  <div className="space-y-1.5 text-2xs text-slate-600 my-4 font-medium">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {h.mode?.toUpperCase()} • {h.venueOrLink}
                    </p>
                    <p className="text-emerald-700 font-bold">
                      🏆 {h.prizes}
                    </p>
                    <p className="text-slate-500">
                      👥 Teams: <span className="font-bold text-slate-800">{h.registrations?.length || 0} Registered</span> (Team size: {h.teamSize?.min}-{h.teamSize?.max})
                    </p>
                  </div>

                  {h.winners?.length > 0 && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-2xs space-y-1 mb-3">
                      <p className="font-extrabold text-amber-900 uppercase">🏆 Official Results Recorded</p>
                      {h.winners.map((w, i) => (
                        <p key={i} className="text-amber-800"><strong>{w.position}:</strong> {w.teamName} ({w.prize})</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setViewingRegistrations(h)}
                      className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-2xs"
                    >
                      View Teams ({h.registrations?.length || 0})
                    </button>
                    <a
                      href={`http://localhost:5000/api/events/hackathons/${h._id}/export-csv`}
                      className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-2xs flex items-center justify-center gap-1 text-center"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Export CSV
                    </a>
                  </div>

                  {h.status !== 'completed' ? (
                    <button
                      onClick={() => { setRecordingWinners(h); setWinnerInputs([{ position: '1st Place Winner', teamName: '', prize: '₹50,000' }, { position: '2nd Place Runner-Up', teamName: '', prize: '₹25,000' }]); }}
                      className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-2xs"
                    >
                      Record Winners / Results
                    </button>
                  ) : (
                    <button
                      onClick={() => handleIssueCertificates(h._id)}
                      className={`w-full py-2 rounded-xl font-bold text-2xs flex items-center justify-center gap-1 ${
                        h.certificatesIssued ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" /> {h.certificatesIssued ? 'Certificates Issued' : 'Issue Participation Certificates'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: SKILL-GAP BASED WORKSHOPS                                       */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'workshops' && (
        <div className="space-y-8">
          {/* Section: Suggested Workshops based on Missing Skills */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-4 border border-indigo-900/50">
            <div>
              <span className="text-2xs font-extrabold text-blue-300 uppercase tracking-wider bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                🎯 Automated Training Diagnostic
              </span>
              <h3 className="text-xl font-black mt-2">Suggested Workshops (Prefilled from Platform Skill Gap)</h3>
              <p className="text-xs text-slate-300">1-click to prefill and announce a targeted workshop directly to students missing the skill.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {suggestedWorkshops.map((sg, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-md text-2xs font-extrabold">
                        {sg.skill}
                      </span>
                      <span className="text-2xs text-amber-300 font-bold">
                        {sg.missingCount} students lacking
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-2 leading-snug">{sg.suggestedTitle}</h4>
                    <p className="text-2xs text-slate-300 mt-1 line-clamp-2">{sg.suggestedTopic}</p>
                  </div>
                  <button
                    onClick={() => openPrefilledWorkshop(sg)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    1-Click Post Workshop <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Active & Past Workshops Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  All Scheduled Campus Workshops ({workshops.length})
                </h3>
                <p className="text-xs text-slate-500">Track registrations, manage attendance, and measure post-workshop skill gains</p>
              </div>
              <button
                onClick={() => {
                  setEditingWorkshop(null);
                  setWorkshopForm({
                    title: '',
                    topic: '',
                    targetSkill: '',
                    targetStudentCount: 0,
                    description: '',
                    date: '',
                    duration: '2 Hours',
                    mode: 'online',
                    venueOrLink: 'Google Meet',
                    trainer: 'Industry Technical Specialist',
                    capacity: 100
                  });
                  setShowWorkshopModal(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Conduct Workshop
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs font-bold text-slate-400 uppercase">
                    <th className="pb-3 px-3">Workshop Title</th>
                    <th className="pb-3 px-3">Target Skill</th>
                    <th className="pb-3 px-3">Date & Mode</th>
                    <th className="pb-3 px-3">Trainer</th>
                    <th className="pb-3 px-3">Registrations</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {workshops.map(w => (
                    <tr key={w._id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {w.title}
                        <span className="text-2xs text-slate-400 block font-normal">{w.topic}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-2xs font-bold">
                          {w.targetSkill}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {new Date(w.date).toLocaleDateString()}
                        <span className="text-2xs text-slate-400 block">{w.mode?.toUpperCase()} • {w.duration}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-semibold">{w.trainer}</td>
                      <td className="py-3.5 px-3 font-bold text-blue-700">
                        {w.registeredStudents?.length || 0} / {w.capacity}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                          w.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                          w.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {w.status}
                        </span>
                        {w.skillImprovementScore > 0 && (
                          <span className="text-2xs text-emerald-600 font-bold block mt-0.5">+{w.skillImprovementScore}% Skill Gain</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingWorkshop(w);
                              setWorkshopForm({
                                ...w,
                                date: w.date ? new Date(w.date).toISOString().slice(0, 16) : '',
                                targetSkill: w.targetSkill || '',
                                capacity: w.capacity || 100,
                                trainer: w.trainer || ''
                              });
                              setShowWorkshopModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                            title="Edit Workshop"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setMarkingAttendance(w);
                              const map = {};
                              (w.registeredStudents || []).forEach(r => { map[String(r.student)] = r.attended; });
                              setAttendedStudents(map);
                              setImprovementScore(w.skillImprovementScore || 28);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-2xs font-bold"
                          >
                            Attendance
                          </button>
                          <button
                            onClick={() => cancelWorkshop(w._id)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded"
                            title="Cancel Workshop"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteWorkshop(w._id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete Workshop"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE / EDIT HACKATHON                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showHackathonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingHackathon ? 'Edit Hackathon Drive' : 'Create & Announce Campus Hackathon'}
              </h3>
              <button onClick={() => setShowHackathonModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHackathon} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Hackathon Title *</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.title}
                    onChange={e => setHackathonForm({ ...hackathonForm, title: e.target.value })}
                    placeholder="e.g. Smart India AI Hackathon"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Theme / Problem Statement *</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.theme}
                    onChange={e => setHackathonForm({ ...hackathonForm, theme: e.target.value })}
                    placeholder="e.g. Next-Gen Enterprise AI"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Start Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.startDate}
                    onChange={e => setHackathonForm({ ...hackathonForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">End Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.endDate}
                    onChange={e => setHackathonForm({ ...hackathonForm, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Registration Deadline *</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.registrationDeadline}
                    onChange={e => setHackathonForm({ ...hackathonForm, registrationDeadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Mode</label>
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white"
                    value={hackathonForm.mode}
                    onChange={e => setHackathonForm({ ...hackathonForm, mode: e.target.value })}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline (Campus Lab)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Venue / Portal Link</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.venueOrLink}
                    onChange={e => setHackathonForm({ ...hackathonForm, venueOrLink: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Max Participants</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.maxParticipants}
                    onChange={e => setHackathonForm({ ...hackathonForm, maxParticipants: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Prizes & Cash Awards</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.prizes}
                    onChange={e => setHackathonForm({ ...hackathonForm, prizes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Organizer / Sponsor</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={hackathonForm.organizerOrSponsor}
                    onChange={e => setHackathonForm({ ...hackathonForm, organizerOrSponsor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 uppercase mb-1">Description & Scope</label>
                <textarea
                  rows="3"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none resize-none"
                  value={hackathonForm.description}
                  onChange={e => setHackathonForm({ ...hackathonForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHackathonModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  {editingHackathon ? 'Update Hackathon' : 'Announce & Notify Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: POST WORKSHOP                                                   */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showWorkshopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full my-8 max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingWorkshop ? 'Edit Workshop' : 'Conduct Campus Workshop'}
                </h3>
                <p className="text-2xs text-blue-600 font-bold">
                  {workshopForm.targetSkill ? `Targeted intervention for: ${workshopForm.targetSkill}` : 'General Skill Development Workshop'}
                </p>
              </div>
              <button onClick={() => setShowWorkshopModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkshop} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Workshop Title *</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={workshopForm.title}
                    onChange={e => setWorkshopForm({ ...workshopForm, title: e.target.value })}
                    placeholder="e.g. Master System Design & Cloud Architecture"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Target Skill (Auto-invites deficient students)</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={workshopForm.targetSkill}
                    onChange={e => setWorkshopForm({ ...workshopForm, targetSkill: e.target.value })}
                    placeholder="e.g. Docker, Python, System Design"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 uppercase mb-1">Topic / Syllabus *</label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  value={workshopForm.topic}
                  onChange={e => setWorkshopForm({ ...workshopForm, topic: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                    value={workshopForm.date}
                    onChange={e => setWorkshopForm({ ...workshopForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                    value={workshopForm.duration}
                    onChange={e => setWorkshopForm({ ...workshopForm, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Mode</label>
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white"
                    value={workshopForm.mode}
                    onChange={e => setWorkshopForm({ ...workshopForm, mode: e.target.value })}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline (Auditorium)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Venue / Meet Link</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={workshopForm.venueOrLink}
                    onChange={e => setWorkshopForm({ ...workshopForm, venueOrLink: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1">Capacity</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    value={workshopForm.capacity}
                    onChange={e => setWorkshopForm({ ...workshopForm, capacity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 uppercase mb-1">Lead Trainer / Instructor</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  value={workshopForm.trainer}
                  onChange={e => setWorkshopForm({ ...workshopForm, trainer: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWorkshopModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Publish & Notify Targeted Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: MARK ATTENDANCE & SKILL IMPROVEMENT                             */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {markingAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Mark Workshop Attendance</h3>
                <p className="text-2xs text-slate-500">{markingAttendance.title}</p>
              </div>
              <button onClick={() => setMarkingAttendance(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {markingAttendance.registeredStudents?.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-xs">No registered students yet.</p>
              ) : (
                markingAttendance.registeredStudents.map(reg => {
                  const sId = String(reg.student);
                  const isChecked = Boolean(attendedStudents[sId]);
                  return (
                    <label key={sId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{reg.studentName || 'Student'}</p>
                        <p className="text-2xs text-slate-400">{reg.studentEmail || reg.branch}</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded"
                        checked={isChecked}
                        onChange={e => setAttendedStudents({ ...attendedStudents, [sId]: e.target.checked })}
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <label className="block text-2xs font-extrabold text-blue-900 uppercase">
                Post-Workshop Skill Improvement Score (% Gain)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold"
                value={improvementScore}
                onChange={e => setImprovementScore(e.target.value)}
                placeholder="28"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setMarkingAttendance(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
              >
                Save Attendance & Improvement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: VIEW REGISTERED TEAMS                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewingRegistrations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full my-8 max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Registered Teams</h3>
                <p className="text-2xs text-slate-500">{viewingRegistrations.title}</p>
              </div>
              <button onClick={() => setViewingRegistrations(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {viewingRegistrations.registrations?.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-xs">No teams registered yet.</p>
              ) : (
                viewingRegistrations.registrations.map((reg, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">Team: {reg.teamName}</span>
                      <span className="text-2xs text-slate-400">{new Date(reg.registeredAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-2xs text-slate-600">Leader: {reg.studentName} ({reg.studentEmail})</p>
                    {reg.teamMembers?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reg.teamMembers.map((m, mi) => (
                          <span key={mi} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-2xs text-slate-700">
                            👤 {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setViewingRegistrations(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: RECORD WINNERS                                                  */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {recordingWinners && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full my-8 max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Hackathon Winners</h3>
                <p className="text-2xs text-slate-500">{recordingWinners.title}</p>
              </div>
              <button onClick={() => setRecordingWinners(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {winnerInputs.map((w, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-700">{w.position}</span>
                  <input
                    type="text"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="Winning Team Name"
                    value={w.teamName}
                    onChange={e => {
                      const updated = [...winnerInputs];
                      updated[idx].teamName = e.target.value;
                      setWinnerInputs(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    placeholder="Prize amount (e.g. ₹50,000)"
                    value={w.prize}
                    onChange={e => {
                      const updated = [...winnerInputs];
                      updated[idx].prize = e.target.value;
                      setWinnerInputs(updated);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setRecordingWinners(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWinners}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
              >
                Save & Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
