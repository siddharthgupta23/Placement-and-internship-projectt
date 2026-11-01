import { useState, useEffect } from 'react';
import api from '../../api';
import { 
  CheckCircle, XCircle, AlertTriangle, ShieldCheck, 
  Building2, Briefcase, ChevronRight, Filter, Info, ArrowRight 
} from 'lucide-react';

const EligibilityCheckerPanel = ({ onNavigateToJobs }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchEligibility();
  }, []);

  const fetchEligibility = async () => {
    try {
      const res = await api.get('/eligibility/check-all');
      setData(res.data);
      if (res.data.evaluations?.length > 0) {
        setSelectedJob(res.data.evaluations[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-semibold">Running campus eligibility checks...</div>;
  }

  if (!data) return null;

  const displayedJobs = onlyEligible
    ? data.evaluations.filter(e => e.isEligible)
    : data.evaluations;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-400/30">
            🔍 Multi-Factor Eligibility Diagnostic
          </span>
          <h2 className="text-3xl font-extrabold">Campus Eligibility Checker</h2>
          <p className="mt-2 text-blue-100/80 text-sm max-w-xl">
            Real-time compliance check across your CGPA ({data.studentInfo?.cgpa || 7.5}), active backlogs ({data.studentInfo?.backlogs || 0}), branch, and passing year.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shrink-0 min-w-[190px]">
          <div className="text-4xl font-black text-white">{data.eligibleCount} / {data.totalJobs}</div>
          <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mt-1">Eligible Open Roles</div>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="font-bold text-slate-900 text-base">
          Showing {displayedJobs.length} Opportunities
        </h3>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            checked={onlyEligible}
            onChange={e => setOnlyEligible(e.target.checked)}
          />
          <span>Show only jobs I am 100% eligible for</span>
        </label>
      </div>

      {/* Main Grid: Jobs list on left, detailed criterion diagnostic on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1 Col: Job list cards */}
        <div className="space-y-4 lg:col-span-1 max-h-[650px] overflow-y-auto pr-1">
          {displayedJobs.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              No jobs found matching your criteria.
            </div>
          ) : (
            displayedJobs.map(j => (
              <div
                key={j.jobId}
                onClick={() => setSelectedJob(j)}
                className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedJob?.jobId === j.jobId
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-700 truncate">{j.company}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      j.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {j.isEligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{j.role}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{j.location} • {j.salary}</p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
                  <span>{j.criteria.filter(c => c.passed).length} of {j.criteria.length} criteria met</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right 2 Cols: Detailed Checklist Card */}
        <div className="lg:col-span-2">
          {selectedJob ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-blue-600">{selectedJob.company}</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">{selectedJob.role}</h3>
                  <p className="text-xs text-slate-500">Location: {selectedJob.location} • Compensation: {selectedJob.salary}</p>
                </div>

                <span className={`px-4 py-1.5 rounded-2xl font-extrabold text-xs shadow-xs ${
                  selectedJob.isEligible ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedJob.isEligible ? '✓ Full Eligibility Confirmed' : '✕ Criteria Ineligible'}
                </span>
              </div>

              {/* Criterion Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Detailed Criteria Breakdown</h4>
                
                {selectedJob.criteria.map((c, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      c.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        {c.passed ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                        <span>{c.criterion}</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        c.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {c.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 mt-2">
                      <p><span className="font-semibold text-slate-700">Required:</span> {c.required}</p>
                      <p><span className="font-semibold text-slate-700">Your Value:</span> {c.studentValue}</p>
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-slate-500 border-t border-slate-200/50 pt-1.5">
                      {c.reason}
                    </p>
                  </div>
                ))}
              </div>

              {/* Skills Match Overview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800">Required Skills vs Profile Skills:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedJob.requiredSkills?.map((s, idx) => {
                    const matched = selectedJob.matchedSkills?.includes(s.toLowerCase());
                    return (
                      <span 
                        key={idx} 
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${
                          matched ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {matched ? '✓ ' : '✕ '} {s}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onNavigateToJobs}
                  className="px-6 py-3 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2"
                >
                  <span>Go to Job Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
              Select a job on the left to view its eligibility criteria checklist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EligibilityCheckerPanel;
