import { useState, useEffect } from 'react';
import api from '../../api';
import { 
  BookOpen, Bookmark, CheckCircle2, Search, Filter, 
  Sparkles, ExternalLink, Clock, Building2, User, FileText, 
  ArrowRight, Play 
} from 'lucide-react';

const InterviewPrepPanel = ({ onStartMockInterview }) => {
  const [resources, setResources] = useState([]);
  const [userProgress, setUserProgress] = useState({ bookmarked: [], completed: [] });
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, [activeCategory, difficulty, searchTerm]);

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (difficulty !== 'All') params.append('difficulty', difficulty);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await api.get(`/prep/resources?${params.toString()}`);
      setResources(res.data.resources || []);
      if (res.data.userProgress) {
        setUserProgress(res.data.userProgress);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (resourceId) => {
    try {
      const res = await api.post('/prep/toggle-bookmark', { resourceId });
      setUserProgress(prev => {
        const isB = res.data.isBookmarked;
        const nextB = isB 
          ? [...prev.bookmarked, resourceId]
          : prev.bookmarked.filter(id => id !== resourceId);
        return { ...prev, bookmarked: nextB };
      });
    } catch {
      alert('Error updating bookmark');
    }
  };

  const toggleComplete = async (resourceId) => {
    try {
      const res = await api.post('/prep/toggle-complete', { resourceId });
      setUserProgress(prev => {
        const isC = res.data.isCompleted;
        const nextC = isC 
          ? [...prev.completed, resourceId]
          : prev.completed.filter(id => id !== resourceId);
        return { ...prev, completed: nextC };
      });
    } catch {
      alert('Error updating progress');
    }
  };

  const completedCount = userProgress.completed.length;
  const totalCount = resources.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'technical_notes', label: '💻 Technical Deep-Dives' },
    { id: 'hr_bank', label: '🤝 HR & STAR Questions' },
    { id: 'company_questions', label: '🏢 Company-Specific Rounds' },
    { id: 'gd_topics', label: '🗣️ Group Discussions' },
    { id: 'resume_tips', label: '📄 Resume & ATS Mastery' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-400/30">
            📚 High-Yield Placement Knowledge Base
          </span>
          <h2 className="text-3xl font-extrabold">Interview Preparation Library</h2>
          <p className="mt-2 text-blue-100/80 text-sm max-w-xl">
            Company-wise question banks, behavioral frameworks, technical architectures, and curated notes with progress tracking.
          </p>
        </div>

        {/* Action Link to AI Mock Interview */}
        <button
          onClick={onStartMockInterview}
          className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2 text-sm shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch AI Mock Interview</span>
        </button>
      </div>

      {/* Progress Tracker Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-1/2">
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Preparation Completion Progress</span>
            <span className="text-blue-600">{completedCount} of {totalCount} completed ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4 text-amber-500" /> {userProgress.bookmarked.length} Bookmarked</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {completedCount} Mastered</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts, companies, or tags..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm outline-none focus:border-blue-500 shadow-xs"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
          No preparation resources match your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map(item => {
            const isBookmarked = userProgress.bookmarked.includes(item._id);
            const isCompleted = userProgress.completed.includes(item._id);

            return (
              <div 
                key={item._id} 
                className={`p-6 sm:p-7 rounded-3xl shadow-sm border transition flex flex-col justify-between ${
                  isCompleted ? 'bg-slate-50/70 border-emerald-200' : 'bg-white border-slate-200 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold">
                        {item.role || 'All Roles'}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {item.readingTimeMinutes || 5} min read
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBookmark(item._id)}
                        className={`p-1.5 rounded-lg border transition ${
                          isBookmarked 
                            ? 'bg-amber-50 text-amber-600 border-amber-300' 
                            : 'text-slate-400 hover:text-amber-500 border-slate-200'
                        }`}
                        title={isBookmarked ? "Bookmarked" : "Bookmark this topic"}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleComplete(item._id)}
                        className={`p-1.5 rounded-lg border transition ${
                          isCompleted 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-300' 
                            : 'text-slate-400 hover:text-emerald-500 border-slate-200'
                        }`}
                        title={isCompleted ? "Completed" : "Mark completed"}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
                  <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mb-4 line-clamp-4">
                    {item.content}
                  </div>

                  {item.sampleAnswer && (
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900 mb-4">
                      <span className="font-bold">Pro Tip / Sample Answer:</span> {item.sampleAnswer}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {item.tags?.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    item.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' : (item.difficulty === 'Hard' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')
                  }`}>
                    {item.difficulty}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InterviewPrepPanel;
