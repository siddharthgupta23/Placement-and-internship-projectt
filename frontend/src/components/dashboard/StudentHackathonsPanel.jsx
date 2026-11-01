import { useState, useEffect } from 'react';
import api from '../../api';
import { Trophy, Calendar, MapPin, Users, Award, CheckCircle2, Plus, Trash2, X, ExternalLink } from 'lucide-react';

export default function StudentHackathonsPanel() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringHackathon, setRegisteringHackathon] = useState(null);
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    members: [{ name: '', email: '', rollNo: '' }]
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      const res = await api.get('/events/hackathons');
      setHackathons(res.data.hackathons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    if (!registeringHackathon) return;
    setSubmitting(true);
    try {
      await api.post(`/events/hackathons/${registeringHackathon._id}/register`, {
        teamName: teamForm.teamName,
        teamMembers: teamForm.members.filter(m => m.name.trim())
      });
      setMessage('🎉 Team registration successful! Details sent to your email.');
      setRegisteringHackathon(null);
      fetchHackathons();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register team');
    } finally {
      setSubmitting(false);
    }
  };

  const addMemberField = () => {
    if (teamForm.members.length >= (registeringHackathon?.teamSize?.max || 4)) return;
    setTeamForm({
      ...teamForm,
      members: [...teamForm.members, { name: '', email: '', rollNo: '' }]
    });
  };

  const removeMemberField = (idx) => {
    setTeamForm({
      ...teamForm,
      members: teamForm.members.filter((_, i) => i !== idx)
    });
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-semibold animate-pulse">Loading campus hackathons...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-7 sm:p-9 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-2xs font-bold uppercase tracking-wider">
            🏆 Campus Hackathons & Innovation Sprints
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">Hackathon Hub</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Compete in university & corporate hackathons. Build real-world products, showcase team synergy, and earn cash prizes and verified merit certificates.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {message}
        </div>
      )}

      {hackathons.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          No hackathons currently open. Check back shortly for our next campus build sprint!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map(h => {
            const isCompleted = h.status === 'completed';

            return (
              <div key={h._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-2xs font-extrabold uppercase">
                      {h.organizerOrSponsor}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-blue-50 text-blue-700">
                      {h.status}
                    </span>
                  </div>

                  <h3 className="font-black text-lg text-slate-900 leading-snug">{h.title}</h3>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">Problem Statement: {h.theme}</p>

                  <div className="space-y-1.5 text-2xs text-slate-600 my-4 font-medium">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {h.mode?.toUpperCase()} • {h.venueOrLink}
                    </p>
                    <p className="text-emerald-700 font-black text-xs">
                      🏆 {h.prizes}
                    </p>
                    <p className="text-slate-500">
                      👥 Team Size: <span className="font-bold text-slate-800">{h.teamSize?.min} to {h.teamSize?.max} members</span>
                    </p>
                    <p className="text-orange-600 font-semibold">
                      ⏰ Register by: {new Date(h.registrationDeadline).toLocaleDateString()}
                    </p>
                  </div>

                  {h.winners?.length > 0 && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-2xs space-y-1 mb-3">
                      <p className="font-extrabold text-amber-900 uppercase">🏆 Official Winners</p>
                      {h.winners.map((w, i) => (
                        <p key={i} className="text-amber-800"><strong>{w.position}:</strong> {w.teamName} ({w.prize})</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  {!isCompleted && (
                    <button
                      onClick={() => {
                        setRegisteringHackathon(h);
                        setTeamForm({ teamName: '', members: [{ name: '', email: '', rollNo: '' }] });
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Register Team / Individual
                    </button>
                  )}
                  {isCompleted && (
                    <div className="text-center py-2 text-2xs font-bold text-slate-500 bg-slate-50 rounded-xl">
                      Sprint Concluded • {h.certificatesIssued ? 'Certificates Ready' : 'Awaiting Certificates'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Registration Modal */}
      {registeringHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Register for Hackathon</h3>
                <p className="text-2xs text-slate-500">{registeringHackathon.title}</p>
              </div>
              <button onClick={() => setRegisteringHackathon(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterTeam} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 uppercase mb-1">Team Name *</label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  placeholder="e.g. CodeCraft Innovators"
                  value={teamForm.teamName}
                  onChange={e => setTeamForm({ ...teamForm, teamName: e.target.value })}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-600 uppercase">Team Members ({teamForm.members.length}/{registeringHackathon.teamSize?.max || 4})</label>
                  {teamForm.members.length < (registeringHackathon.teamSize?.max || 4) && (
                    <button
                      type="button"
                      onClick={addMemberField}
                      className="text-blue-600 hover:text-blue-800 text-2xs font-bold"
                    >
                      + Add Member
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {teamForm.members.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xs font-extrabold text-slate-500">MEMBER {idx + 1} {idx === 0 ? '(LEADER)' : ''}</span>
                        {idx > 0 && (
                          <button type="button" onClick={() => removeMemberField(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          required
                          type="text"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          placeholder="Full Name"
                          value={m.name}
                          onChange={e => {
                            const updated = [...teamForm.members];
                            updated[idx].name = e.target.value;
                            setTeamForm({ ...teamForm, members: updated });
                          }}
                        />
                        <input
                          type="email"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          placeholder="Student Email"
                          value={m.email}
                          onChange={e => {
                            const updated = [...teamForm.members];
                            updated[idx].email = e.target.value;
                            setTeamForm({ ...teamForm, members: updated });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRegisteringHackathon(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Team Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
