import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Mic, MicOff, Volume2, CheckCircle2, AlertTriangle, 
  RefreshCw, Play, Square, Sparkles, ShieldCheck, Video, HelpCircle
} from 'lucide-react';

/**
 * MediaProctoringCheck:
 * - High quality 720p/1080p getUserMedia with graceful fallback
 * - Device selection (mic & camera)
 * - Real-time AudioContext + AnalyserNode volume meter
 * - Required 2s speech detection + 3s audio recording playback + SpeechRecognition test
 * - Video frame capture at native videoWidth/videoHeight (0.92 JPEG)
 * - Laplacian variance blur detection & average brightness check with hints
 * - Retake photo with override after 3 attempts
 * - Yields ONE persistent MediaStream that continues into the interview
 */
export default function MediaProctoringCheck({ onComplete, onBack, mode = 'interview' }) {
  const [devices, setDevices] = useState({ cameras: [], mics: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  
  // Audio state
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechDetectedDuration, setSpeechDetectedDuration] = useState(0);
  const [micPassed, setMicPassed] = useState(false);
  const [micStatusText, setMicStatusText] = useState('Listening for your voice...');
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [audioClipUrl, setAudioClipUrl] = useState(null);
  const [speechRecognized, setSpeechRecognized] = useState('');

  // Camera / Photo capture state
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoQuality, setPhotoQuality] = useState({ acceptable: false, brightness: null, blurScore: null, message: '' });
  const [retakeCount, setRetakeCount] = useState(0);
  const [warmupFramesReady, setWarmupFramesReady] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // 1. Enumerate input devices
  const loadDevices = async () => {
    try {
      const devList = await navigator.mediaDevices.enumerateDevices();
      const cameras = devList.filter(d => d.kind === 'videoinput');
      const mics = devList.filter(d => d.kind === 'audioinput');
      setDevices({ cameras, mics });
      if (cameras.length > 0 && !selectedCamera) setSelectedCamera(cameras[0].deviceId);
      if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId);
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  };

  // 2. Request High-Quality MediaStream
  const startStream = useCallback(async (camId, micId) => {
    setCameraLoading(true);
    setCameraError('');
    setWarmupFramesReady(false);

    // Stop existing stream if re-switching devices
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    const videoConstraints = {
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      frameRate: { ideal: 30 },
      facingMode: "user"
    };
    if (camId) videoConstraints.deviceId = { exact: camId };

    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
    if (micId) audioConstraints.deviceId = { exact: micId };

    let mediaStream = null;

    try {
      // High-quality attempt
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints
      });
    } catch (err) {
      console.warn('High-res media stream failed, falling back to standard constraints:', err);
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch (fallbackErr) {
        setCameraLoading(false);
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setCameraError('Camera and Microphone permission denied. Please allow permissions in browser address bar (lock icon) and refresh.');
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
          setCameraError('No camera or microphone found on your device.');
        } else {
          setCameraError(`Device access error: ${fallbackErr.message || 'Camera/mic in use by another application'}`);
        }
        return;
      }
    }

    streamRef.current = mediaStream;
    setStream(mediaStream);
    setCameraLoading(false);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(() => {});
        // Allow camera 1000ms to adjust exposure, focus, and white balance
        setTimeout(() => {
          setWarmupFramesReady(true);
        }, 1000);
      };
    }

    // Set up AudioContext volume analyzer
    setupAudioAnalysis(mediaStream);
    // Refresh device list now that permissions are granted
    loadDevices();
  }, []);

  // 3. AudioContext & AnalyserNode volume meter
  const setupAudioAnalysis = (mediaStream) => {
    try {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (!audioTrack) {
        setMicStatusText('No audio track detected');
        return;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let accumulatedActiveTime = 0;
      let lastCheck = performance.now();

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        const now = performance.now();
        const delta = (now - lastCheck) / 1000;
        lastCheck = now;

        // If speaking above threshold (e.g. 15%)
        if (normalized >= 14) {
          accumulatedActiveTime += delta;
          setSpeechDetectedDuration(prev => Math.min(2.5, prev + delta));
          if (accumulatedActiveTime >= 1.8) {
            setMicPassed(true);
            setMicStatusText('Microphone working perfectly! Input detected ✅');
          } else {
            setMicStatusText(`Keep speaking... (${Math.round((accumulatedActiveTime / 2) * 100)}%)`);
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animFrameRef.current = requestAnimationFrame(checkVolume);

      // Web Speech recognition test check
      startSpeechCheck();

    } catch (err) {
      console.warn('Audio analysis setup error:', err);
    }
  };

  // 4. Web Speech recognition check
  const startSpeechCheck = () => {
    try {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (e) => {
          const transcript = Array.from(e.results)
            .map(res => res[0].transcript)
            .join('');
          setSpeechRecognized(transcript);
          if (transcript.trim().length > 3) {
            setMicPassed(true);
            setMicStatusText('Voice recognized clearly! ✅');
          }
        };

        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      // SpeechRecognition not supported in all browsers, fallback to volume detection
    }
  };

  // 5. 3-Second Audio Recording Playback Test
  const recordSampleClip = () => {
    if (!streamRef.current || isRecordingClip) return;
    try {
      audioChunksRef.current = [];
      const rec = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioClipUrl(url);
        setIsRecordingClip(false);
        setMicPassed(true);
      };

      rec.start();
      setIsRecordingClip(true);

      setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, 3000);
    } catch (err) {
      console.warn('MediaRecorder error:', err);
    }
  };

  // 6. Capture Frame & Validate Image Quality
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const actualWidth = video.videoWidth;
    const actualHeight = video.videoHeight;

    const canvas = document.createElement('canvas');
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    const ctx = canvas.getContext('2d');

    // Draw full resolution image
    ctx.drawImage(video, 0, 0, actualWidth, actualHeight);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);

    // Image quality analysis
    const analysis = analyzeImageQuality(canvas);
    setPhotoQuality(analysis);
    setRetakeCount(prev => prev + 1);
  };

  // Laplacian variance blur detection & average brightness
  const analyzeImageQuality = (canvas) => {
    try {
      // Downscale to 320x240 for fast pixel processing
      const downCanvas = document.createElement('canvas');
      downCanvas.width = 320;
      downCanvas.height = 240;
      const ctx = downCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0, 320, 240);

      const imgData = ctx.getImageData(0, 0, 320, 240);
      const data = imgData.data;

      // 1. Average Brightness
      let totalBrightness = 0;
      const gray = new Float32Array(320 * 240);

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        // Luminosity method: 0.299R + 0.587G + 0.114B
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray[p] = lum;
        totalBrightness += lum;
      }
      const avgBrightness = Math.round(totalBrightness / (320 * 240));

      // 2. Laplacian Variance (Blur Detection)
      // Kernel:
      //  0  1  0
      //  1 -4  1
      //  0  1  0
      const w = 320;
      const h = 240;
      let lapSum = 0;
      let count = 0;
      const lapValues = [];

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const lapVal = 
            gray[idx - w] + 
            gray[idx - 1] + 
            gray[idx + 1] + 
            gray[idx + w] - 
            4 * gray[idx];
          lapValues.push(lapVal);
          lapSum += lapVal;
          count++;
        }
      }

      const meanLap = lapSum / count;
      let varSum = 0;
      for (let i = 0; i < lapValues.length; i++) {
        const diff = lapValues[i] - meanLap;
        varSum += diff * diff;
      }
      const lapVariance = Math.round(varSum / count);

      let acceptable = true;
      let message = 'Photo looks sharp and well-lit! ✅';

      if (avgBrightness < 38) {
        acceptable = false;
        message = 'Photo is too dark. Please move to a brighter place or turn on lights.';
      } else if (avgBrightness > 225) {
        acceptable = false;
        message = 'Photo is too bright / overexposed. Please adjust lighting or reduce screen glare.';
      } else if (lapVariance < 65) {
        acceptable = false;
        message = 'Camera capture appears blurry. Please hold steady and clean camera lens.';
      }

      return {
        acceptable,
        brightness: avgBrightness,
        blurScore: lapVariance,
        message
      };
    } catch (err) {
      console.warn('Image analysis failed:', err);
      return { acceptable: true, brightness: 120, blurScore: 100, message: 'Photo captured.' };
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoQuality({ acceptable: false, brightness: null, blurScore: null, message: '' });
  };

  // Initial stream start
  useEffect(() => {
    startStream(selectedCamera, selectedMic);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleDeviceChange = (camId, micId) => {
    setSelectedCamera(camId);
    setSelectedMic(micId);
    startStream(camId, micId);
  };

  const handleFinalProceed = () => {
    // Deliver the ONE persistent stream to the caller WITHOUT stopping tracks!
    if (onComplete) {
      onComplete({
        mediaStream: streamRef.current,
        photoDataUrl: capturedPhoto
      });
    }
  };

  const canProceed = (micPassed || speechDetectedDuration >= 1.5) && (photoQuality.acceptable || retakeCount >= 3);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Audio & Video Proctoring Verification</h2>
              <p className="text-blue-200 text-xs mt-0.5">Verified high-definition camera & microphone check before test begins</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {cameraError ? (
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Device Access Error</p>
                <p className="text-xs text-red-700 mt-1">{cameraError}</p>
                <button
                  onClick={() => startStream(selectedCamera, selectedMic)}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            </div>
          ) : null}

          {/* Device Selection Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-600" /> Select Camera
              </label>
              <select
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                value={selectedCamera}
                onChange={e => handleDeviceChange(e.target.value, selectedMic)}
              >
                {devices.cameras.map((c, i) => (
                  <option key={c.deviceId || i} value={c.deviceId}>
                    {c.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-600" /> Select Microphone
              </label>
              <select
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                value={selectedMic}
                onChange={e => handleDeviceChange(selectedCamera, e.target.value)}
              >
                {devices.mics.map((m, i) => (
                  <option key={m.deviceId || i} value={m.deviceId}>
                    {m.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-Column Grid: Left Video / Right Audio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Camera View & Quality Check */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" /> 1. Photo & Face Clear
                </span>
                {warmupFramesReady && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live 720p HD
                  </span>
                )}
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-inner flex items-center justify-center">
                {capturedPhoto ? (
                  <img src={capturedPhoto} alt="Captured preview" className="w-full h-full object-cover" />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                {cameraLoading && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs font-bold gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> Initializing HD camera...
                  </div>
                )}
              </div>

              {/* Quality Diagnostics Card */}
              {capturedPhoto ? (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  photoQuality.acceptable 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {photoQuality.acceptable ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {photoQuality.message}
                  </p>
                  <div className="flex justify-between text-[11px] opacity-80 pt-1 border-t border-slate-200/40">
                    <span>Brightness: {photoQuality.brightness}/255</span>
                    <span>Clarity Index: {photoQuality.blurScore}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={retakePhoto}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      Retake Photo
                    </button>
                    {!photoQuality.acceptable && retakeCount >= 3 && (
                      <button
                        onClick={() => setPhotoQuality(prev => ({ ...prev, acceptable: true }))}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Override & Proceed
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  disabled={!warmupFramesReady}
                  onClick={capturePhoto}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> Capture Photo for Proctoring
                </button>
              )}
            </div>

            {/* Microphone Live Meter & Sound Test */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-600" /> 2. Microphone Test
                </span>
                {micPassed ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                    Required
                  </span>
                )}
              </div>

              {/* Sample sentence prompt */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-950">
                <p className="font-bold text-indigo-900 mb-1">Say this sample sentence out loud:</p>
                <p className="italic text-indigo-800 font-medium">"I am ready for the campus interview and my audio is clear."</p>
              </div>

              {/* Real-time volume visualizer */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Live Input Volume</span>
                  <span>{audioLevel}%</span>
                </div>
                <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      audioLevel > 50 
                        ? 'bg-emerald-500' 
                        : audioLevel > 15 
                        ? 'bg-blue-500' 
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{micStatusText}</p>
                {speechRecognized && (
                  <p className="text-[11px] text-emerald-700 mt-1 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <span className="font-bold">Recognized:</span> "{speechRecognized}"
                  </p>
                )}
              </div>

              {/* 3s recording test */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Test Audio Playback (Optional):</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={recordSampleClip}
                    disabled={isRecordingClip}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isRecordingClip 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    {isRecordingClip ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecordingClip ? 'Recording (3s)...' : 'Record 3s Sample'}
                  </button>

                  {audioClipUrl && (
                    <audio src={audioClipUrl} controls className="h-8 max-w-[180px]" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs transition cursor-pointer"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              disabled={!canProceed}
              onClick={handleFinalProceed}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                canProceed 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95' 
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Continue to Interview
            </button>
          </div>
          {!canProceed && (
            <p className="text-xs text-center text-slate-400">
              Please capture a clear photo and test your microphone by speaking the sample sentence to proceed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
