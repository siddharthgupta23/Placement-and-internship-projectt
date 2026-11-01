import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api';
import useProctoring from '../../hooks/useProctoring';
import MediaProctoringCheck from './MediaProctoringCheck';
import { 
  Mic, MicOff, Send, AlertTriangle, CheckCircle, Camera, 
  ChevronRight, Shield, RotateCcw, Clock, Volume2, Maximize2
} from 'lucide-react';

const ROLES = ['Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Product Manager', 'Business Analyst', 'UI/UX Designer', 'Cloud Architect'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TYPES = ['Technical', 'HR', 'Behavioral', 'Mixed'];
const QUESTION_COUNTS = [5, 10, 15];

export default function MockInterviewPanel() {
  const [view, setView] = useState('config'); // config | instructions | interview | result | history
  const [config, setConfig] = useState({
    roleDomain: 'Full Stack Developer',
    difficulty: 'Medium',
    interviewType: 'Mixed',
    totalQuestionsTarget: 5
  });
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [answer, setAnswer] = useState('');
  const [thinking, setThinking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Persistent Media & Audio track monitoring
  const persistentStreamRef = useRef(null);
  const [micWarning, setMicWarning] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const speechRecognitionRef = useRef(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const liveVideoRef = useRef(null);

  // Proctoring — STRICT mode for interviews (immediate termination on tab switch)
  const { showWarningModal, warningMessage, violations, exitFullscreen, stopProctoring } = useProctoring({
    maxWarnings: 1,
    strictMode: true,
    cameraEnabled: false, // We manage the persistent high-def stream directly
    enabled: view === 'interview',
    onTerminate: async ({ reason }) => {
      if (sessionId) {
        try {
          await api.post('/mock-interview/terminate', {
            sessionId,
            reason: `terminated: ${reason}`
          });
        } catch { /* silent */ }
      }
      cleanupMediaStream();
      exitFullscreen();
      setView('terminated');
    }
  });

  const cleanupMediaStream = useCallback(() => {
    if (persistentStreamRef.current) {
      persistentStreamRef.current.getTracks().forEach(t => t.stop());
      persistentStreamRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch {}
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupMediaStream();
    };
  }, [cleanupMediaStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/mock-interview/sessions');
      setHistory(data.sessions || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // When entering interview view, attach the persistent stream and handle fullscreen persistence
  useEffect(() => {
    if (view !== 'interview') return;

    const attachStreamToVideo = () => {
      if (liveVideoRef.current && persistentStreamRef.current) {
        if (liveVideoRef.current.srcObject !== persistentStreamRef.current) {
          liveVideoRef.current.srcObject = persistentStreamRef.current;
        }
        liveVideoRef.current.play().catch(() => {});
      }
    };

    attachStreamToVideo();

    // Re-attach stream without interruption on fullscreen changes
    const handleFullscreenChange = () => {
      attachStreamToVideo();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Audio track live monitoring
    const stream = persistentStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.onended = () => setMicWarning('Microphone disconnected! Please check audio input.');
        audioTrack.onmute = () => setMicWarning('Microphone was muted by your operating system.');
        audioTrack.onunmute = () => setMicWarning('');
      }
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [view]);

  // Voice dictation using Web Speech API
  const toggleSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. You can type your answer.');
      return;
    }

    if (isListeningSpeech) {
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
      setIsListeningSpeech(false);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map(r => r[0].transcript)
          .join('');
        setAnswer(transcript);
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListeningSpeech(false);
      };

      rec.onend = () => {
        setIsListeningSpeech(false);
      };

      rec.start();
      speechRecognitionRef.current = rec;
      setIsListeningSpeech(true);
    } catch (err) {
      console.warn('Speech start error:', err);
      setIsListeningSpeech(false);
    }
  };

  // Called when MediaProctoringCheck completes verification
  const handleProctoringVerified = async ({ mediaStream, photoDataUrl }) => {
    persistentStreamRef.current = mediaStream;
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/mock-interview/start', {
        ...config,
        candidatePhoto: photoDataUrl
      });
      setSessionId(data.sessionId);
      setCurrentQuestion(data.currentQuestion);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setMessages([{ role: 'interviewer', content: data.currentQuestion }]);
      setCompleted(false);
      setResult(null);
      setAnswer('');
      setView('interview');

      // Request fullscreen safely
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      } catch (fsErr) {
        console.warn('Fullscreen request bypassed:', fsErr);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (!answer.trim() || thinking || completed) return;
    if (isListeningSpeech && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListeningSpeech(false);
    }

    const userAnswer = answer.trim();
    setAnswer('');
    setThinking(true);
    setRetryAvailable(false);
    setError('');

    setMessages(prev => [...prev, { role: 'candidate', content: userAnswer }]);

    try {
      const { data } = await api.post('/mock-interview/message', {
        sessionId,
        answer: userAnswer
      });

      if (data.completed) {
        setCompleted(true);
        setMessages(prev => [...prev, {
          role: 'interviewer',
          content: "Thank you! That concludes all your interview questions. Click 'Finish & Evaluate' below to generate your comprehensive feedback report."
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'interviewer', content: data.fullResponse }]);
        setCurrentQuestion(data.question);
        setQuestionIndex(data.questionIndex);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Network error. Please retry.';
      setError(errMsg);
      setRetryAvailable(true);
      setAnswer(userAnswer);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setThinking(false);
    }
  };

  const retryLastAnswer = () => {
    setError('');
    setRetryAvailable(false);
    sendAnswer();
  };

  const finishAndEvaluate = async () => {
    setEvaluating(true);
    setError('');
    stopProctoring();
    exitFullscreen();
    cleanupMediaStream();

    try {
      const { data } = await api.post('/mock-interview/evaluate', { sessionId });
      const finalResult = data.evaluation || data.session;
      if (!finalResult) {
        throw new Error('Evaluation result was empty.');
      }
      setResult(finalResult);
      setView('result');
      loadHistory();
    } catch (err) {
      console.error('[MockInterview] Evaluation error:', err);
      setError(err.response?.data?.error || err.message || 'Evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  // ─── Configuration Screen ──────────────────────────────────────────────────
  if (view === 'config') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in font-sans">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <span className="inline-block bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-blue-400/30">
              🎙️ AI Dynamic Mock Interview
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">Interactive Mock Interview</h2>
            <p className="mt-1 text-blue-100/80 text-sm">Real-time technical and behavioral interview with adaptive AI feedback</p>
          </div>
          <button
            onClick={() => setView('history')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white transition cursor-pointer"
          >
            Past Sessions
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <h3 className="font-extrabold text-slate-800 text-lg">Interview Setup</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Role / Domain</label>
              <select
                value={config.roleDomain}
                onChange={e => setConfig({ ...config, roleDomain: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setConfig({ ...config, difficulty: d })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        config.difficulty === d
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Interview Format</label>
                <div className="flex gap-2">
                  {TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setConfig({ ...config, interviewType: t })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        config.interviewType === t
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Number of Questions</label>
              <div className="flex gap-2">
                {QUESTION_COUNTS.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfig({ ...config, totalQuestionsTarget: n })}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      config.totalQuestionsTarget === n
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    {n} Questions (~{n * 3} min)
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setView('instructions')}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white font-extrabold py-4 rounded-2xl hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Shield className="w-5 h-5" /> Proceed to Device & Proctoring Check
          </button>
        </div>
      </div>
    );
  }

  // ─── Proctoring & Verification Screen ──────────────────────────────────────
  if (view === 'instructions') {
    return (
      <MediaProctoringCheck
        onComplete={handleProctoringVerified}
        onBack={() => setView('config')}
      />
    );
  }

  // ─── Terminated Screen ─────────────────────────────────────────────────────
  if (view === 'terminated') {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 animate-fade-in py-16 font-sans">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto border border-red-200">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-black text-red-700">Interview Terminated</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Your mock interview session was terminated because a proctoring violation was detected (such as tab switching or window defocus).
        </p>
        <p className="text-slate-500 text-xs">Your responses up to this point have been safely logged.</p>
        <button
          onClick={() => { setView('config'); loadHistory(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl transition cursor-pointer text-xs"
        >
          Start New Interview
        </button>
      </div>
    );
  }

  // ─── Interview Screen (Fullscreen Proctoring) ──────────────────────────────
  if (view === 'interview') {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans select-none">
        {/* Top Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-white font-black text-sm tracking-tight">{config.roleDomain} Interview</span>
            <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
              Question {questionIndex} of {totalQuestions}
            </span>
            <span className="text-slate-400 text-xs font-semibold">{config.difficulty} · {config.interviewType}</span>
          </div>

          <div className="flex items-center gap-4">
            {thinking && (
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold animate-pulse">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                <span>AI is analyzing your response...</span>
              </div>
            )}

            {/* Persistent Live HD Camera PIP Preview */}
            <div className="relative w-44 h-28 bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl shrink-0">
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] text-emerald-400 font-extrabold border border-emerald-500/30">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                HD PROCTOR
              </div>
            </div>
          </div>
        </div>

        {/* Warning Banner if Mic Disconnected */}
        {micWarning && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-center gap-2 font-bold animate-pulse">
            <AlertTriangle className="w-4 h-4" /> {micWarning}
          </div>
        )}

        {/* Chat / Question & Answers Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl rounded-3xl p-5 text-sm leading-relaxed shadow-md ${
                msg.role === 'interviewer'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs'
                  : 'bg-blue-600 text-white rounded-tr-xs'
              }`}>
                {msg.role === 'interviewer' && (
                  <div className="text-[11px] text-blue-400 mb-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>🤖 AI Interviewer</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-3xl rounded-tl-xs px-6 py-4 flex gap-2 items-center border border-slate-700">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-900/90 text-red-100 px-6 py-2.5 text-xs flex items-center justify-between font-bold border-t border-red-700">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</span>
            {retryAvailable && (
              <button
                onClick={retryLastAnswer}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="bg-slate-900 border-t border-slate-800 p-4">
          <div className="max-w-4xl mx-auto">
            {completed ? (
              <button
                onClick={finishAndEvaluate}
                disabled={evaluating}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold py-4 rounded-2xl hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-xl cursor-pointer text-sm"
              >
                {evaluating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI is grading technical knowledge, clarity & confidence...
                  </>
                ) : (
                  '✅ Finish Interview & View Report'
                )}
              </button>
            ) : (
              <div className="flex gap-3 items-end">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={thinking || completed}
                    rows={3}
                    placeholder="Type your answer, or click the mic button to speak your response... (Press Enter to submit)"
                    className="w-full bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-2xl px-4 py-3 text-sm resize-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
                  />
                  {isListeningSpeech && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                      <Mic className="w-3 h-3" /> Listening...
                    </div>
                  )}
                </div>

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  disabled={thinking || completed}
                  title={isListeningSpeech ? "Stop speech dictation" : "Speak your answer"}
                  className={`p-3.5 rounded-2xl transition cursor-pointer shrink-0 ${
                    isListeningSpeech 
                      ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isListeningSpeech ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-blue-400" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={sendAnswer}
                  disabled={!answer.trim() || thinking || completed}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-2xl transition disabled:opacity-40 shrink-0 cursor-pointer shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-2 text-center font-medium">
              Answer thoroughly in complete sentences · Dictate or type · Tab switching or exiting fullscreen will terminate session
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Result Screen ─────────────────────────────────────────────────────────
  if (view === 'result' && result) {
    const score = result.overallScore || 0;
    const cats = result.categoryScores || {};
    const CAT_LABELS = {
      technicalKnowledge: 'Technical Knowledge', communication: 'Communication',
      problemSolving: 'Problem Solving', confidenceClarity: 'Confidence & Clarity', relevance: 'Relevance'
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans pb-12">
        <div className={`rounded-3xl p-8 text-center text-white shadow-xl ${
          score >= 75 
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700' 
            : score >= 50 
            ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
            : 'bg-gradient-to-br from-red-600 to-rose-700'
        }`}>
          <div className="text-6xl font-black tracking-tight">{score}</div>
          <div className="text-lg opacity-90 font-bold">/ 100 Overall Score</div>
          <div className="mt-2 text-base font-semibold">{result.roleDomain} — {result.difficulty} Level</div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Competency Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(cats).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">{CAT_LABELS[key] || key}</span>
                  <span className="text-blue-700">{val}/100</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all" 
                    style={{ width: `${val}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6">
            <h3 className="font-extrabold text-emerald-900 text-sm mb-3">✅ Key Strengths</h3>
            <ul className="space-y-1.5">
              {(result.strengths || []).map((s, i) => (
                <li key={i} className="text-xs text-emerald-800 font-medium leading-relaxed">• {s}</li>
              ))}
            </ul>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6">
            <h3 className="font-extrabold text-rose-900 text-sm mb-3">🎯 Areas for Improvement</h3>
            <ul className="space-y-1.5">
              {(result.weaknesses || []).map((w, i) => (
                <li key={i} className="text-xs text-rose-800 font-medium leading-relaxed">• {w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Per-Question Detailed Feedback */}
        {(result.evaluations || []).length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">Question-by-Question Detailed Feedback</h3>
            <div className="space-y-4">
              {result.evaluations.map((ev, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Q{ev.questionIndex}</span>
                    <span className="font-bold text-slate-900 text-sm flex-1">{ev.question}</span>
                    <span className="text-blue-700 font-extrabold text-sm">{ev.score}/100</span>
                  </div>
                  {ev.whatWasGood && <p className="text-emerald-700 text-xs">✅ <span className="font-semibold">{ev.whatWasGood}</span></p>}
                  {ev.whatWasMissing && <p className="text-rose-700 text-xs">❌ <span className="font-semibold">{ev.whatWasMissing}</span></p>}
                  {ev.idealSampleAnswer && (
                    <details className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <summary className="cursor-pointer text-blue-700 font-bold">💡 Recommended Model Answer</summary>
                      <p className="mt-2 text-slate-700 leading-relaxed font-normal">{ev.idealSampleAnswer}</p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { setView('config'); loadHistory(); }}
            className="flex-1 border border-slate-300 text-slate-700 font-bold py-3.5 rounded-2xl hover:bg-slate-50 transition text-xs cursor-pointer"
          >
            ← Practice Another Role
          </button>
          <button
            onClick={() => setView('history')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition text-xs cursor-pointer shadow-md"
          >
            View Interview History
          </button>
        </div>
      </div>
    );
  }

  // ─── History Screen ────────────────────────────────────────────────────────
  if (view === 'history') {
    return (
      <div className="space-y-6 animate-fade-in font-sans max-w-3xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interview History</h2>
          <button
            onClick={() => setView('config')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            ← New Interview
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200">
            No completed sessions yet. Start your first interview session above!
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(s => (
              <div key={s._id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs hover:shadow-md transition">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                  s.status === 'terminated' 
                    ? 'bg-rose-100 text-rose-700' 
                    : !s.overallScore 
                    ? 'bg-slate-100 text-slate-500' 
                    : s.overallScore >= 75 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : s.overallScore >= 50 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {s.status === 'terminated' ? '⛔' : s.overallScore || '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{s.roleDomain}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s.difficulty} · {s.interviewType} · {new Date(s.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                  {s.status === 'terminated' && (
                    <div className="text-xs text-rose-600 mt-0.5 font-semibold">⛔ Session terminated due to violation</div>
                  )}
                </div>
                {s.status === 'completed' && (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                    Completed
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
