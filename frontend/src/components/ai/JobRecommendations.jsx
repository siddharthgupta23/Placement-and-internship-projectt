import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Sparkles, Briefcase, ChevronRight, AlertCircle, MapPin, Building, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const JobRecommendations = ({ studentId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/ai/recommend-jobs/${studentId}`);
      if (res.data && res.data.recommendations) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AI job recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [studentId]);

  const getColorByMatch = (percentage) => {
    if (percentage >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (percentage >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-teal-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              Smart Matches
            </h2>
            <p className="text-sm text-gray-500">AI-curated opportunities for your profile</p>
          </div>
        </div>
        <button 
          onClick={fetchRecommendations} 
          disabled={loading}
          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4 border border-gray-100 flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mt-3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-red-500 bg-red-50 rounded-xl">
          <AlertCircle className="w-10 h-10 mb-2 opacity-80" />
          <p>{error}</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 bg-gray-50 rounded-xl">
          <Briefcase className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium text-gray-700">No matches found yet</p>
          <p className="text-sm mt-1">Update your skills and resume to get personalized recommendations.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {recommendations.map((rec, idx) => {
            const { job, matchPercentage, reasons } = rec;
            const colors = getColorByMatch(matchPercentage);
            
            return (
              <div key={idx} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:border-teal-200 bg-white shadow-sm hover:shadow-md transition-all">
                {/* Match indicator */}
                <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 shrink-0 justify-between sm:justify-start">
                  <div className={`relative flex items-center justify-center w-14 h-14 rounded-full border-4 ${colors.border} ${colors.bg}`}>
                    <span className={`text-sm font-bold ${colors.text}`}>{matchPercentage}%</span>
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text} sm:mt-1`}>Match</span>
                </div>
                
                {/* Job details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 leading-tight block truncate group-hover:text-teal-600 transition-colors">
                    {job.role || job.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Building className="w-3 h-3"/> {job.company?.name || 'Company'}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {job.location || 'Remote'}</span>
                  </div>
                  
                  {/* AI Reasons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reasons?.map((reason, rIdx) => (
                      <span key={rIdx} className="inline-flex text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center justify-end sm:justify-center mt-3 sm:mt-0 shrink-0">
                  {/* Add actual link dynamically when available */}
                  <div className="p-2 rounded-full text-gray-400 group-hover:text-teal-600 group-hover:bg-teal-50 transition-colors cursor-pointer">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;
