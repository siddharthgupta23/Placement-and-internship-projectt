import { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Calendar, Clock, Video, MapPin, CheckCircle, AlertCircle, 
  User, Building2, ChevronRight, MessageSquare, Send, ExternalLink 
} from 'lucide-react';

const ScheduledInterviewsPanel = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await api.get('/interviews/my');
      setInterviews(res.data.interviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const respondToInterview = async (id, status) => {
    setResponding(true);
    try {
      await api.patch(`/interviews/${id}/respond`, {
        status,
        rescheduleReason,
        reschedulePreferredDate: preferredDate || null
      });
      setSelectedInterview(null);
      setRescheduleReason('');
      setPreferredDate('');
      fetchInterviews();
    } catch (err) {
      alert('Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Reschedule Requested': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-400/30">
            📅 Live Interview Operations
          </span>
          <h2 className="text-3xl font-extrabold">Scheduled Interviews</h2>
          <p className="mt-2 text-blue-100/80 text-sm max-w-xl">
            Track interview rounds, confirm meeting invites, join online video calls, or request rescheduling.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center shrink-0">
          <div className="text-3xl font-black">{interviews.length}</div>
          <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider mt-1">Total Scheduled</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading your interview schedule...</div>
      ) : interviews.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          No upcoming interviews scheduled yet. Once you are shortlisted by recruiters, your schedule will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map(item => (
            <div key={item._id} className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Round: {item.roundName}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{item.job?.role}</h3>
                  <p className="text-xs font-semibold text-blue-700">{item.company?.name || 'Recruiting Company'}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {new Date(item.interviewDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {item.interviewTime} ({item.durationMinutes || 45} mins)
                    </span>
                    <span className="flex items-center gap-1">
                      {item.mode === 'Online' ? <Video className="w-3.5 h-3.5 text-purple-600" /> : <MapPin className="w-3.5 h-3.5 text-emerald-600" />}
                      {item.mode} {item.mode === 'Online' ? '(Virtual Video Call)' : `(Venue: ${item.venue || 'Campus'})`}
                    </span>
                  </div>

                  {item.instructions && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl mt-3 border border-slate-100">
                      <span className="font-bold">Instructions:</span> {item.instructions}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2.5 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                  {item.mode === 'Online' && item.meetingLink && (
                    <a
                      href={item.meetingLink.startsWith('http') ? item.meetingLink : `https://${item.meetingLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Meeting</span>
                    </a>
                  )}

                  {item.status === 'Scheduled' && (
                    <>
                      <button
                        onClick={() => respondToInterview(item._id, 'Confirmed')}
                        disabled={responding}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle className="w-4 h-4" /> Confirm
                      </button>

                      <button
                        onClick={() => setSelectedInterview(item)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        Reschedule
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reschedule Modal Section */}
              {selectedInterview?._id === item._id && (
                <div className="mt-4 pt-4 border-t border-slate-100 p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Request Reschedule Slot
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      className="p-2 bg-white border border-slate-300 rounded-xl text-xs outline-none"
                      value={preferredDate}
                      onChange={e => setPreferredDate(e.target.value)}
                    />
                    <input
                      type="text"
                      className="p-2 bg-white border border-slate-300 rounded-xl text-xs outline-none"
                      placeholder="Reason for reschedule..."
                      value={rescheduleReason}
                      onChange={e => setRescheduleReason(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedInterview(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={responding}
                      onClick={() => respondToInterview(item._id, 'Reschedule Requested')}
                      className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                    >
                      Submit Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledInterviewsPanel;
