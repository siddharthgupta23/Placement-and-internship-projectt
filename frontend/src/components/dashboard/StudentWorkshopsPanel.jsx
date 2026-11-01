import { useState, useEffect } from 'react';
import api from '../../api';
import { BookOpen, Calendar, MapPin, Users, CheckCircle2, Clock, ExternalLink, Sparkles } from 'lucide-react';

export default function StudentWorkshopsPanel() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const res = await api.get('/events/workshops');
      setWorkshops(res.data.workshops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (workshopId) => {
    setRegisteringId(workshopId);
    setMessage('');
    try {
      await api.post(`/events/workshops/${workshopId}/register`);
      setMessage('🎉 Successfully registered! Your seat has been reserved.');
      fetchWorkshops();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to register for workshop.';
      if (errMsg.toLowerCase().includes('already registered')) {
        setMessage('ℹ️ You are already registered for this workshop.');
        setWorkshops(prev => prev.map(w => w._id === workshopId ? { ...w, isRegistered: true } : w));
        setTimeout(() => setMessage(''), 4000);
      } else {
        alert(errMsg);
      }
    } finally {
      setRegisteringId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-semibold animate-pulse">Loading campus workshops...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-7 sm:p-9 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-2xs font-bold uppercase tracking-wider">
            📚 Campus Technical Workshops
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">Skill-Enhancement Masterclasses</h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-xl">
            Attend curated workshops aligned with active recruiter skill demands to dramatically boost your placement conversion rate.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {message}
        </div>
      )}

      {workshops.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          No campus workshops currently scheduled. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops.map(w => {
            const isCompleted = w.status === 'completed';
            const isCancelled = w.status === 'cancelled';

            return (
              <div key={w._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-2xs font-extrabold uppercase">
                      {w.targetSkill}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                      isCompleted ? 'bg-slate-100 text-slate-700' :
                      isCancelled ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {w.status}
                    </span>
                  </div>

                  <h3 className="font-black text-lg text-slate-900 leading-snug">{w.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{w.topic}</p>

                  <div className="space-y-1.5 text-2xs text-slate-600 my-4 font-medium">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(w.date).toLocaleString()} ({w.duration})
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {w.mode?.toUpperCase()} • {w.venueOrLink}
                    </p>
                    <p className="flex items-center gap-1.5 text-indigo-700 font-bold">
                      👤 Trainer: {w.trainer}
                    </p>
                    <p className="text-slate-400">
                      👥 Seats: {w.registeredStudents?.length || 0} / {w.capacity} Booked
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  {!isCompleted && !isCancelled && (
                    w.isRegistered ? (
                      <button
                        disabled
                        className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Seat Reserved
                      </button>
                    ) : (
                      <button
                        disabled={registeringId === w._id}
                        onClick={() => handleRegister(w._id)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {registeringId === w._id ? 'Reserving...' : '1-Click Reserve Seat'}
                      </button>
                    )
                  )}
                  {isCompleted && (
                    <div className="text-center py-2 text-2xs font-bold text-slate-400 bg-slate-50 rounded-xl">
                      Workshop Completed {w.skillImprovementScore ? `(+${w.skillImprovementScore}% Skill Gain)` : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
