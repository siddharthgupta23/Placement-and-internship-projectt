import { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Target, Sparkles, AlertCircle, CheckCircle, ExternalLink, 
  BookOpen, TrendingUp, Plus, Trash2, ShieldCheck, Zap 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell 
} from 'recharts';

const SkillGapPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState('');
  const [newProficiency, setNewProficiency] = useState('Intermediate');
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchSkillGap();
  }, []);

  const fetchSkillGap = async () => {
    try {
      const res = await api.get('/skill-gap/analysis');
      setData(res.data);
      if (res.data.roleAnalyses?.length > 0) {
        setSelectedRole(res.data.roleAnalyses[0]);
      }
    } catch (err) {
      console.error('Failed to fetch skill gap analysis', err);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim() || !data) return;

    const trimmed = newSkill.trim().toLowerCase();
    const updatedSkills = [...new Set([...(data.studentSkills || []), trimmed])];
    const updatedProficiencies = [
      ...(data.skillProficiencies || []).filter(p => p.skill !== trimmed),
      { skill: trimmed, level: newProficiency }
    ];

    try {
      await api.post('/skill-gap/skills', {
        skills: updatedSkills,
        skillProficiencies: updatedProficiencies
      });
      setNewSkill('');
      fetchSkillGap();
    } catch (err) {
      alert('Failed to update skill profile');
    }
  };

  const removeSkill = async (skillToRemove) => {
    if (!data) return;
    const updatedSkills = data.studentSkills.filter(s => s !== skillToRemove);
    const updatedProficiencies = (data.skillProficiencies || []).filter(p => p.skill !== skillToRemove);

    try {
      await api.post('/skill-gap/skills', {
        skills: updatedSkills,
        skillProficiencies: updatedProficiencies
      });
      fetchSkillGap();
    } catch (err) {
      alert('Failed to remove skill');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 animate-pulse text-slate-500">
        <Target className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" />
        <p className="font-semibold">Analyzing market demand against your profile...</p>
      </div>
    );
  }

  if (!data) return null;

  const chartData = (data.roleAnalyses || []).slice(0, 5).map(r => ({
    role: r.role.length > 18 ? r.role.substring(0, 16) + '...' : r.role,
    match: r.matchPercentage,
    gap: r.gapPercentage
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Market Alignment Engine
          </div>
          <h2 className="text-3xl font-extrabold">Skill Gap Analysis & Career Roadmap</h2>
          <p className="mt-2 text-blue-100/80 text-sm max-w-xl">
            Compare your verified skills against live recruiter requirements, AI mock interview feedback, and aptitude test weaknesses.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shrink-0 min-w-[180px]">
          <div className="text-4xl font-black text-white">{data.avgReadinessScore}%</div>
          <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mt-1">Average Readiness</div>
        </div>
      </div>

      {/* Grid: Skill Profile Manager & Role Match Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1 Col: Skill Profile */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-bold text-slate-900 flex items-center justify-between">
            <span>My Skills Portfolio</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
              {data.studentSkills?.length || 0} Skills
            </span>
          </h3>

          <form onSubmit={addSkill} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500"
                placeholder="e.g. Docker, TypeScript"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
              />
              <select
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                value={newProficiency}
                onChange={e => setNewProficiency(e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Skill to Profile
            </button>
          </form>

          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
            {data.studentSkills?.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-semibold"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="hover:text-red-600 text-slate-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Role-by-Role Gap Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" /> Match Percentage Across Open Target Roles
          </h3>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="role" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="match" name="Match %" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.match >= 75 ? '#10b981' : (entry.match >= 50 ? '#3b82f6' : '#f59e0b')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Role selector pill list */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.roleAnalyses?.slice(0, 6).map(r => (
              <button
                key={r.jobId}
                onClick={() => setSelectedRole(r)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedRole?.jobId === r.jobId
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r.role} ({r.matchPercentage}%)
              </button>
            ))}
          </div>

          {/* Selected Role Detailed Comparison */}
          {selectedRole && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedRole.role}</h4>
                  <p className="text-slate-500">{selectedRole.company} • Package: {selectedRole.salary}</p>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                  selectedRole.matchPercentage >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedRole.matchPercentage}% Match ({selectedRole.gapPercentage}% Gap)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 mb-2">
                    <CheckCircle className="w-4 h-4" /> Matched Skills ({selectedRole.matchedSkills?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRole.matchedSkills?.map((s, idx) => (
                      <span key={idx} className="bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-amber-700 flex items-center gap-1 mb-2">
                    <AlertCircle className="w-4 h-4" /> Missing Skills to Learn ({selectedRole.missingSkills?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRole.missingSkills?.map((s, idx) => (
                      <span key={idx} className="bg-amber-100/70 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Learning Resources for Missing Skills */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" /> Curated Learning Roadmaps for High-Demand Gaps
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.overallMissingSkills?.map((item, idx) => (
            <div key={idx} className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-slate-900 capitalize">{item.skill}</span>
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.demandCount} Jobs Require This
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-blue-900 mb-1">{item.learningResource?.title}</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{item.suggestedAction}</p>
              </div>

              <a
                href={item.learningResource?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-800 pt-2 border-t border-slate-200/60"
              >
                <span>Access Course / Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillGapPanel;
