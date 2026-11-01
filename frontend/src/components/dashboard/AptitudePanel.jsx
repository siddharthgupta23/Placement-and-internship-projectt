import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api';
import useProctoring from '../../hooks/useProctoring';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight,
  BarChart2, RefreshCw, Eye, Flag, Shield, Camera, X
} from 'lucide-react';

const MAX_WARNINGS = 3;

// ─── Warning Modal ─────────────────────────────────────────────────────────────
function WarningModal({ message, count, max, onDismiss, isTerminated }) {
  const [countdown, setCountdown] = useState(10);
  useEffect(() => {
    if (isTerminated) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [isTerminated]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isTerminated ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-8 h-8 ${isTerminated ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isTerminated ? 'text-red-700' : 'text-amber-700'}`}>
          {isTerminated ? 'Session Terminated' : `Violation ${count}/${max}`}
        </h2>
        <p className="text-slate-700 mb-6">{message}</p>
        {!isTerminated && (
          <>
            <p className="text-slate-500 text-sm mb-4">Auto-returning to fullscreen in <strong>{countdown}s</strong></p>
            <button
              onClick={onDismiss}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition"
            >
              Return to Fullscreen Now
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Instructions Screen ───────────────────────────────────────────────────────
function InstructionsScreen({ test, onStart, onClose }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 sm:p-6 text-white flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Shield className="w-5 h-5 text-blue-200" />
            <h2 className="text-lg sm:text-xl font-bold">Assessment Instructions &amp; Rules</h2>
          </div>
          <p className="text-blue-100 text-xs sm:text-sm">{test?.title}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div className="text-xl sm:text-2xl font-bold text-blue-700">{test?.durationMinutes}m</div>
            <div className="text-xs text-slate-500">Duration</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">{test?.totalMarks}</div>
            <div className="text-xs text-slate-500">Total Marks</div>
          </div>
          <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
            <div className="text-xl sm:text-2xl font-bold text-rose-600">-{test?.negativeMarking || 0}</div>
            <div className="text-xs text-slate-500">Negative Marking</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Proctoring Rules (Strictly Enforced)
          </h3>
          <ul className="space-y-1 text-xs sm:text-sm text-amber-900">
            <li>✅ The assessment will enter <strong>fullscreen mode</strong> automatically.</li>
            <li>✅ <strong>Switching tabs, minimizing, or exiting fullscreen</strong> = 1 violation.</li>
            <li>✅ After <strong>3 violations</strong>, the test is auto-submitted immediately.</li>
            <li>✅ Right-click, copy/paste, and dev shortcuts are <strong>disabled</strong>.</li>
            <li>✅ Your violation log is recorded and visible to the TPO admin.</li>
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-slate-700 mb-2 text-xs sm:text-sm">General Instructions</h3>
          <ul className="space-y-1 text-xs sm:text-sm text-slate-600">
            <li>📌 Questions are randomized — each attempt gets an individual set.</li>
            <li>📌 Negative marking applies for incorrect submissions.</li>
            <li>📌 Unattempted questions carry zero penalty.</li>
            <li>📌 Timer is validated on server — page reload maintains official countdown.</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-blue-600"
          />
          <span className="text-xs sm:text-sm text-slate-700">
            I have read and agree to all rules and proctoring requirements. I will attempt this test with integrity.
          </span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm"
            >
              Cancel
            </button>
          )}
          <button
            disabled={!agreed}
            onClick={onStart}
            className={`flex-1 font-bold py-3 px-5 rounded-xl text-white transition text-sm ${
              agreed
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            Start Test in Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Question Navigator ────────────────────────────────────────────────────────
function QuestionNav({ total, current, answered, flagged, onGoTo }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const num = i + 1;
        const isCurrent = current === i;
        const isAnswered = answered.has(i);
        const isFlagged = flagged.has(i);
        return (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition border ${
              isCurrent ? 'bg-indigo-600 text-white border-indigo-600' :
              isFlagged ? 'bg-amber-100 text-amber-700 border-amber-400' :
              isAnswered ? 'bg-green-100 text-green-700 border-green-300' :
              'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}

// ─── Attempt History ───────────────────────────────────────────────────────────
function AttemptHistory({ attempts, stats, onReview }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Attempts', value: stats.total, color: 'blue' },
          { label: 'Best Score', value: `${stats.bestScore}%`, color: 'green' },
          { label: 'Avg Score', value: `${stats.avgScore}%`, color: 'purple' }
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-xl p-4 text-center`}>
            <div className={`text-2xl font-bold text-${s.color}-700`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attempts.map((att, idx) => (
              <tr key={att._id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-slate-500">{attempts.length - idx}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(att.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className="font-bold text-indigo-700">{att.percentage}%</span>
                  <span className="text-slate-400 text-xs ml-1">({att.totalScore}/{att.maxScore})</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    att.status === 'terminated' ? 'bg-red-100 text-red-700' :
                    att.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {att.status === 'terminated' ? '⛔ Terminated' : '✅ Completed'}
                  </span>
                  {att.violations?.length > 0 && (
                    <span className="ml-2 text-red-500 text-xs">{att.violations.length} violation{att.violations.length > 1 ? 's' : ''}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onReview(att._id)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition"
                  >
                    <Eye className="w-3 h-3" /> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Aptitude Panel ───────────────────────────────────────────────────────
export default function AptitudePanel() {
  const [view, setView] = useState('home'); // home | instructions | test | result | history | review
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [attemptStats, setAttemptStats] = useState({ total: 0, bestScore: 0, avgScore: 0 });
  const [reviewData, setReviewData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const testActiveRef = useRef(false);

  // Proctoring
  const {
    violations, warningCount, showWarningModal, warningMessage,
    dismissWarning, requestFullscreen, exitFullscreen, setSuppressViolations,
    stopProctoring, isTerminated: _isTerminated
  } = useProctoring({
    maxWarnings: MAX_WARNINGS,
    strictMode: false,
    cameraEnabled: false,
    enabled: view === 'test',
    onViolation: (type, count) => {
      if (count >= MAX_WARNINGS) {
        autoSubmit('Auto-submitted after 3 proctoring violations');
      }
    },
    onTerminate: ({ reason }) => {
      autoSubmit(reason);
    }
  });

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/aptitude/attempts');
      setAttemptHistory(data.attempts || []);
      setAttemptStats(data.stats || { total: 0, bestScore: 0, avgScore: 0 });
    } catch { /* silent */ }
  };

  const autoSubmit = useCallback(async () => {
    if (!testActiveRef.current || submitting) return;
    testActiveRef.current = false;
    stopProctoring();
    clearInterval(timerRef.current);
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
      const { data } = await api.post('/aptitude/submit', {
        attemptId,
        studentAnswers: answers,
        violations: violations.map(v => ({ type: v.type, timestamp: v.timestamp })),
        timeTakenSeconds: timeTaken
      });
      exitFullscreen();
      setResult(data);
      setView('result');
      loadHistory();
    } catch {
      setError('Failed to submit test.');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, violations, submitting, stopProctoring, exitFullscreen]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [testsRes, histRes] = await Promise.all([
          api.get('/aptitude/tests').catch(() => ({ data: { tests: [] } })),
          api.get('/aptitude/attempts').catch(() => ({ data: { attempts: [] } }))
        ]);
        if (mounted) {
          setTests(testsRes.data?.tests || []);
          setAttemptHistory(histRes.data?.attempts || []);
          setAttemptStats(histRes.data?.stats || { total: 0, bestScore: 0, avgScore: 0 });
        }
      } catch {
        if (mounted) setError('Failed to load tests.');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectTest = (test) => {
    setSelectedTest(test);
    setView('instructions');
  };

  const startTest = async () => {
    if (!selectedTest) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/aptitude/tests/${selectedTest._id}/start`);
      setQuestions(data.questions);
      setAttemptId(data.attemptId);
      setAnswers({});
      setFlagged(new Set());
      setCurrentQ(0);
      setTimeLeft(data.test.durationMinutes * 60);
      startTimeRef.current = Date.now();
      testActiveRef.current = true;
      setView('test');
      requestFullscreen();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start test. Please try again.');
      setView('home');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (view !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          autoSubmit('time_expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [view, autoSubmit]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswer = (qIdx, optIdx) => {
    const q = questions[qIdx];
    setAnswers(prev => ({ ...prev, [q._id]: optIdx }));
  };

  const toggleFlag = (qIdx) => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(qIdx) ? next.delete(qIdx) : next.add(qIdx);
      return next;
    });
  };

  const handleOpenSubmitConfirm = () => {
    setSuppressViolations(true);
    setShowConfirmModal(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
    setSuppressViolations(false);
  };

  const handleConfirmFinalSubmit = async () => {
    if (!testActiveRef.current || submitting) return;
    testActiveRef.current = false;
    stopProctoring();
    clearInterval(timerRef.current);
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
      const { data } = await api.post('/aptitude/submit', {
        attemptId,
        studentAnswers: answers,
        violations: violations.map(v => ({ type: v.type, timestamp: v.timestamp })),
        timeTakenSeconds: timeTaken
      });
      exitFullscreen();
      setResult(data);
      setView('result');
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit test.');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewAttempt = async (attemptId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/aptitude/attempts/${attemptId}`);
      setReviewData(data.attempt);
      setView('review');
    } catch { setError('Failed to load review.'); }
    finally { setLoading(false); }
  };

  const answeredSet = new Set(
    questions.map((q, i) => answers[q._id] !== undefined ? i : null).filter(i => i !== null)
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (view === 'instructions') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
        <div className="relative w-full max-w-2xl my-auto">
          <InstructionsScreen
            test={selectedTest}
            onStart={startTest}
            onClose={() => setView('home')}
          />
        </div>
      </div>
    );
  }

  if (view === 'test' && questions.length > 0) {
    const q = questions[currentQ];
    const timerColor = timeLeft < 120 ? 'text-red-600' : timeLeft < 300 ? 'text-amber-600' : 'text-green-700';

    return (
      <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col select-none">
        {/* Proctoring Warning Modal */}
        {showWarningModal && (
          <WarningModal
            message={warningMessage}
            count={warningCount}
            max={MAX_WARNINGS}
            onDismiss={dismissWarning}
            isTerminated={warningCount >= MAX_WARNINGS}
          />
        )}

        {/* Custom In-Page Submit Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Submit Your Aptitude Test?</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                You have answered <span className="font-bold text-slate-900">{answeredSet.size}</span> of <span className="font-bold text-slate-900">{questions.length}</span> questions. Once submitted, your answers will be scored immediately and recorded.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelSubmit}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition text-sm cursor-pointer"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinalSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition text-sm shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit Test'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-sm truncate max-w-xs">{selectedTest?.title}</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              Q {currentQ + 1}/{questions.length}
            </span>
            {warningCount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {warningCount}/{MAX_WARNINGS} violations
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timerColor}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Question Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{q.section}</span>
                    {q.topic && <span className="ml-2 text-xs text-slate-400">{q.topic}</span>}
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQ)}
                    className={`flex items-center gap-1 text-xs font-semibold transition ${flagged.has(currentQ) ? 'text-amber-600' : 'text-slate-400 hover:text-amber-500'}`}
                  >
                    <Flag className="w-4 h-4" />
                    {flagged.has(currentQ) ? 'Flagged' : 'Flag'}
                  </button>
                </div>
                <p className="text-slate-800 font-medium text-base leading-relaxed mb-6">{q.questionText}</p>
                <div className="space-y-3">
                  {q.options.map((opt, oi) => {
                    const selected = answers[q._id] === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(currentQ, oi)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                            : 'border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold mr-3 text-slate-400">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(c => c - 1)}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  ← Previous
                </button>
                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ(c => c + 1)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleOpenSubmitConfirm}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : '✅ Submit Test'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col w-64 bg-white border-l border-slate-200 p-4 overflow-y-auto gap-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Question Palette</h3>
              <QuestionNav
                total={questions.length}
                current={currentQ}
                answered={answeredSet}
                flagged={flagged}
                onGoTo={setCurrentQ}
              />
            </div>
            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span> Answered</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-amber-100 border border-amber-400 rounded"></span> Flagged</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-white border border-slate-200 rounded"></span> Not Answered</div>
            </div>
            <div className="mt-auto">
              <button
                onClick={handleOpenSubmitConfirm}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-60 text-sm cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'result' && result) {
    const { percentage, totalScore, maxScore, sectionScores, weakAreas, isTerminated: terminated, violationCount } = result;
    const pct = percentage || 0;
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className={`rounded-2xl p-8 text-center text-white ${pct >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : pct >= 40 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
          <div className="text-6xl font-black mb-1">{pct}%</div>
          <div className="text-xl font-semibold opacity-90">{totalScore}/{maxScore} Marks</div>
          {terminated && <div className="mt-2 bg-white/20 rounded-lg px-4 py-2 text-sm">⛔ Session was auto-submitted due to violations</div>}
          {violationCount > 0 && <div className="mt-1 text-sm opacity-80">{violationCount} proctoring violation{violationCount > 1 ? 's' : ''} logged</div>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Section-wise Scores</h3>
          <div className="space-y-3">
            {Object.entries(sectionScores || {}).map(([sec, { score, total }]) => (
              <div key={sec}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium text-slate-700">{sec}</span>
                  <span className="text-slate-500">{score}/{total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${total > 0 ? (score / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {weakAreas?.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <h3 className="font-bold text-red-800 mb-2">Weak Areas to Improve</h3>
            <div className="flex flex-wrap gap-2">
              {weakAreas.map(area => (
                <span key={area} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">{area}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setView('home'); loadHistory(); }} className="flex-1 border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition">
            Back to Tests
          </button>
          <button onClick={() => { setView('history'); }} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">
            View History
          </button>
        </div>
      </div>
    );
  }

  if (view === 'review' && reviewData) {
    const { detailedReview = [], violations: v = [] } = reviewData;
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Attempt Review</h2>
          <button onClick={() => setView('history')} className="text-sm text-indigo-600 hover:underline">← Back</button>
        </div>
        {v.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-red-700">Proctoring Violations: {v.length}</p>
            {v.map((vio, i) => <p key={i} className="text-xs text-red-600">{vio.type} — {new Date(vio.timestamp).toLocaleTimeString()}</p>)}
          </div>
        )}
        {detailedReview.map((q, i) => (
          <div key={i} className={`bg-white rounded-xl border-2 p-5 ${q.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-start gap-2 mb-3">
              {q.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
              <p className="text-slate-800 font-medium text-sm">{q.questionText}</p>
            </div>
            {q.options.map((opt, oi) => (
              <div key={oi} className={`text-sm px-3 py-1.5 rounded-lg mb-1 ${
                oi === q.correctOptionIndex ? 'bg-green-100 text-green-800 font-semibold' :
                oi === q.selectedOptionIndex && !q.isCorrect ? 'bg-red-100 text-red-800 line-through' :
                'text-slate-600'
              }`}>
                {String.fromCharCode(65 + oi)}. {opt}
              </div>
            ))}
            {q.explanation && (
              <div className="mt-2 bg-blue-50 text-blue-800 text-xs p-2 rounded-lg">💡 {q.explanation}</div>
            )}
          </div>
        ))}
        <button onClick={() => setView('history')} className="w-full border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition">
          ← Back to History
        </button>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Attempt History</h2>
          <button onClick={() => setView('home')} className="text-sm text-indigo-600 hover:underline">← Tests</button>
        </div>
        {attemptHistory.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No attempts yet. Take a test to see your history.</div>
        ) : (
          <AttemptHistory attempts={attemptHistory} stats={attemptStats} onReview={reviewAttempt} />
        )}
      </div>
    );
  }

  // ─── Home / Test List ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Aptitude Tests</h2>
          <p className="text-slate-500 text-sm mt-1">Randomized questions · Server-validated · Proctored</p>
        </div>
        {attemptHistory.length > 0 && (
          <button
            onClick={() => setView('history')}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            <BarChart2 className="w-4 h-4" /> History ({attemptStats.total})
          </button>
        )}
      </div>

      {/* Quick stats if has history */}
      {attemptHistory.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{attemptStats.total}</div>
            <div className="text-xs text-slate-500">Attempts</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{attemptStats.bestScore}%</div>
            <div className="text-xs text-slate-500">Best</div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-purple-700">{attemptStats.avgScore}%</div>
            <div className="text-xs text-slate-500">Average</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 animate-pulse text-slate-500">Loading tests...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No tests available.</div>
      ) : (
        <div className={`w-full ${tests.length === 1 ? 'flex justify-center' : 'grid md:grid-cols-2 gap-6'}`}>
          {tests.map(test => (
            <div
              key={test._id}
              className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-6 sm:p-7 ${
                tests.length === 1 ? 'w-full max-w-2xl' : 'w-full'
              }`}
            >
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl mb-2">{test.title}</h3>
              <p className="text-slate-600 text-sm mb-5 leading-relaxed">{test.description}</p>
              
              <div className="grid grid-cols-3 gap-3 mb-5 text-center text-xs">
                <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-2.5">
                  <div className="font-black text-blue-700 text-base">{test.durationMinutes}m</div>
                  <div className="text-slate-500 text-2xs font-semibold">Duration</div>
                </div>
                <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2.5">
                  <div className="font-black text-emerald-700 text-base">{test.totalMarks}</div>
                  <div className="text-slate-500 text-2xs font-semibold">Marks</div>
                </div>
                <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-2.5">
                  <div className="font-black text-rose-600 text-base">-{test.negativeMarking}</div>
                  <div className="text-slate-500 text-2xs font-semibold">Negative</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {(test.sections || []).map(s => (
                  <span
                    key={s}
                    className="bg-indigo-50 text-indigo-700 font-semibold text-xs px-3 py-1 rounded-full border border-indigo-100/60"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <button
                onClick={() => selectTest(test)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                Start Test <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
