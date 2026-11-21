import React, { useState } from 'react';
import api from '../../api';
import { Sparkles, Copy, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const InterviewQuestionPanel = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [includeProfile, setIncludeProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('technical');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/ai/interview-questions', {
        jobTitle,
        requiredSkills: skillsArr,
        includeProfile,
        regenerate: true
      });
      
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            AI Interview Prep
          </h2>
          <p className="text-sm text-gray-500">Generate targeted practice questions</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
          <input 
            type="text" 
            placeholder="e.g. Frontend Developer" 
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma separated)</label>
          <input 
            type="text" 
            placeholder="e.g. React, Tailwind, Node.js" 
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            id="includeProfile" 
            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
            checked={includeProfile}
            onChange={(e) => setIncludeProfile(e.target.checked)}
          />
          <label htmlFor="includeProfile" className="text-sm text-gray-600">
            Tailor questions to my profile and experience
          </label>
        </div>
        
        {error && <div className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {error}</div>}

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              Generate Questions
            </>
          )}
        </button>
      </div>

      {questions && (
        <div className="mt-8 animate-fade-in-up">
          <div className="flex gap-2 border-b border-gray-200 pb-2 mb-4">
            {['technical', 'hr', 'scenario'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium tracking-wide text-sm capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {questions[activeTab]?.map((q, idx) => (
              <div key={idx} className="group relative bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-100">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1 pr-8 text-sm md:text-base">{q}</p>
                </div>
                <button 
                  onClick={() => handleCopy(q, idx)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Copy question"
                >
                  {copiedIndex === idx ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            ))}
            {(!questions[activeTab] || questions[activeTab].length === 0) && (
              <p className="text-gray-500 text-center py-4">No questions available for this category.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewQuestionPanel;
