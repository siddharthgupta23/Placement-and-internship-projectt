import { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Star, MessageSquare, ThumbsUp, Flag, Plus, 
  Building2, User, ShieldCheck, CheckCircle2, Sparkles, Filter, MapPin 
} from 'lucide-react';

const CompanyReviewsPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review submission form
  const [form, setForm] = useState({
    companyId: '',
    overallRating: 5,
    processRating: 4,
    cultureRating: 4,
    salaryRating: 4,
    growthRating: 4,
    reviewTitle: '',
    interviewProcessReview: '',
    workCultureReview: '',
    salaryReview: '',
    tipsForStudents: '',
    isAnonymous: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId]);

  const fetchData = async () => {
    try {
      const [resReviews, resJobs] = await Promise.all([
        api.get('/reviews/all'),
        api.get('/jobs')
      ]);
      setReviews(resReviews.data.reviews || []);
      
      // Extract unique companies
      const uniqueComps = [];
      const seen = new Set();
      (resJobs.data.jobs || []).forEach(j => {
        if (j.company && !seen.has(j.company._id)) {
          seen.add(j.company._id);
          uniqueComps.push({ _id: j.company._id, name: j.company.name });
        }
      });
      setCompanies(uniqueComps);
      if (uniqueComps.length > 0 && !form.companyId) {
        setForm(prev => ({ ...prev, companyId: uniqueComps[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', form);
      alert('Review submitted successfully!');
      setShowReviewModal(false);
      setForm({
        companyId: companies[0]?._id || '',
        overallRating: 5,
        processRating: 4,
        cultureRating: 4,
        salaryRating: 4,
        growthRating: 4,
        reviewTitle: '',
        interviewProcessReview: '',
        workCultureReview: '',
        salaryReview: '',
        tipsForStudents: '',
        isAnonymous: true
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const reportReview = async (id) => {
    if (!window.confirm('Report this review for moderator review?')) return;
    try {
      await api.patch(`/reviews/${id}/report`, { reason: 'Flagged by peer' });
      alert('Review has been reported to administration.');
    } catch {
      alert('Error reporting review');
    }
  };

  const filteredReviews = selectedCompanyId === 'all' 
    ? reviews 
    : reviews.filter(r => r.company?._id === selectedCompanyId || r.company === selectedCompanyId);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-400/30">
            ⭐ Peer Experience & Campus Reviews
          </span>
          <h2 className="text-3xl font-extrabold">Company Reviews & Hiring Ratings</h2>
          <p className="mt-2 text-blue-100/80 text-sm max-w-xl">
            Read verified reviews from placed seniors and interview participants on rounds, culture, salary fairness, and career growth.
          </p>
        </div>

        <button
          onClick={() => setShowReviewModal(true)}
          className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Share My Interview Review
        </button>
      </div>

      {/* Filter by Company */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span>Showing {filteredReviews.length} Verified Reviews</span>
        </h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            className="w-full sm:w-auto p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
          >
            <option value="all">All Recruiting Companies</option>
            {companies.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading company reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
          No reviews available for this company yet. Be the first to share your interview experience!
        </div>
      ) : (
        <div className="space-y-5">
          {filteredReviews.map(rev => (
            <div key={rev._id} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4 hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{rev.reviewTitle}</h4>
                  <p className="text-xs font-semibold text-blue-700">{rev.company?.name || 'Recruiting Partner'}</p>
                  {rev.company?.headquarters?.city && (
                    <p className="text-2xs text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" /> HQ: {[rev.company.headquarters.city, rev.company.headquarters.state].filter(Boolean).join(', ')}
                      {rev.company?.branchLocations?.length > 0 && ` • Branches: ${rev.company.branchLocations.slice(0, 3).join(', ')}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rev.overallRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                    />
                  ))}
                  <span className="text-xs font-black text-amber-900 ml-1">{rev.overallRating}.0</span>
                </div>
              </div>

              {/* Sub-ratings Breakdown pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                <span>Process: ⭐ {rev.processRating || 4}/5</span>
                <span>Work Culture: ⭐ {rev.cultureRating || 4}/5</span>
                <span>Compensation: ⭐ {rev.salaryRating || 4}/5</span>
                <span>Growth: ⭐ {rev.growthRating || 4}/5</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <div>
                  <span className="font-bold text-slate-900">Interview Process:</span>
                  <p className="mt-0.5 text-slate-600">{rev.interviewProcessReview}</p>
                </div>

                {rev.workCultureReview && (
                  <div>
                    <span className="font-bold text-slate-900">Work Culture & Atmosphere:</span>
                    <p className="mt-0.5 text-slate-600">{rev.workCultureReview}</p>
                  </div>
                )}

                {rev.tipsForStudents && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900">
                    <span className="font-bold">Advice for Juniors:</span> {rev.tipsForStudents}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>
                  By {rev.isAnonymous ? 'Anonymous Student' : (rev.student?.name || 'Verified Senior')} • {new Date(rev.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => reportReview(rev._id)}
                  className="hover:text-red-600 flex items-center gap-1 transition"
                  title="Report inappropriate content"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-fade-in my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Write a Company Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Company *</label>
                <select
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none cursor-pointer"
                  value={form.companyId}
                  onChange={e => setForm({ ...form, companyId: e.target.value })}
                >
                  {companies.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Overall Rating (1 to 5 Stars) *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, overallRating: val })}
                      className="p-1"
                    >
                      <Star className={`w-6 h-6 ${val <= form.overallRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="font-bold text-sm text-slate-700 ml-2">{form.overallRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Review Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Great technical rounds and fast interview turnaround"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                  value={form.reviewTitle}
                  onChange={e => setForm({ ...form, reviewTitle: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Interview Process Details *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe number of rounds, question difficulty, and experience..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 resize-none"
                  value={form.interviewProcessReview}
                  onChange={e => setForm({ ...form, interviewProcessReview: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tips & Advice for Juniors</label>
                <textarea
                  rows="2"
                  placeholder="Topics to focus on, preparation strategies..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 resize-none"
                  value={form.tipsForStudents}
                  onChange={e => setForm({ ...form, tipsForStudents: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  checked={form.isAnonymous}
                  onChange={e => setForm({ ...form, isAnonymous: e.target.checked })}
                />
                <label htmlFor="anonymousCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Post anonymously (hide my name from public display)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReviewsPanel;
