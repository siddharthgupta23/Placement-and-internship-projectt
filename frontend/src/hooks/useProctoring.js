import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useProctoring — shared proctoring hook for Aptitude Tests and Mock Interviews.
 *
 * Config options:
 *   maxWarnings       {number}   Max violations before auto-termination (default: 3)
 *   strictMode        {boolean}  true = immediate termination on first violation (for interviews)
 *   cameraEnabled     {boolean}  Whether to enable webcam monitoring
 *   onViolation       {fn}       Called with (violationType, count) on each violation
 *   onTerminate       {fn}       Called when maxWarnings reached or strict violation
 *   onCameraError     {fn}       Called if camera stream fails
 *
 * Returns:
 *   { violations, warningCount, showWarningModal, warningMessage,
 *     cameraStream, videoRef, dismissWarning, requestFullscreen,
 *     blockShortcuts }
 */
export default function useProctoring({
  maxWarnings = 3,
  strictMode = false,
  cameraEnabled = false,
  onViolation = () => {},
  onTerminate = () => {},
  onCameraError = () => {},
  enabled = true
} = {}) {
  const [violations, setViolations] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const terminatedRef = useRef(false);
  const suppressRef = useRef(false);
  const countRef = useRef(0); // sync ref for event handlers
  const blurTimerRef = useRef(null);

  const setSuppressViolations = useCallback((val) => {
    suppressRef.current = !!val;
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  const stopProctoring = useCallback(() => {
    terminatedRef.current = true;
    suppressRef.current = true;
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  // ─── Fullscreen request ────────────────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  }, []);

  const exitFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  // ─── Log and count a violation ────────────────────────────────────────────
  const logViolation = useCallback((type) => {
    if (!enabled || terminatedRef.current || suppressRef.current) return;

    const event = { type, timestamp: new Date().toISOString() };
    setViolations(prev => [...prev, event]);

    countRef.current += 1;
    const newCount = countRef.current;
    setWarningCount(newCount);
    onViolation(type, newCount);

    if (strictMode) {
      terminatedRef.current = true;
      onTerminate({ reason: type, violations: [...violations, event] });
      return;
    }

    if (newCount >= maxWarnings) {
      terminatedRef.current = true;
      setWarningMessage(`⛔ You have exceeded ${maxWarnings} violations. Your session has been auto-submitted.`);
      setShowWarningModal(true);
      onTerminate({ reason: 'max_violations_reached', violations: [...violations, event] });
    } else {
      setWarningMessage(`⚠️ Warning ${newCount} of ${maxWarnings}: ${getViolationMessage(type)} Return immediately!`);
      setShowWarningModal(true);
    }
  }, [enabled, strictMode, maxWarnings, onViolation, onTerminate, violations]);

  function getViolationMessage(type) {
    switch (type) {
      case 'tab_switch': return 'You switched to another tab or window.';
      case 'fullscreen_exit': return 'You exited fullscreen mode.';
      case 'window_blur': return 'The test window lost focus.';
      case 'visibility_hidden': return 'The page was hidden.';
      default: return 'A proctoring violation was detected.';
    }
  }

  // ─── Dismiss warning (re-enter fullscreen) ────────────────────────────────
  const dismissWarning = useCallback(() => {
    if (terminatedRef.current) return;
    setShowWarningModal(false);
    requestFullscreen();
  }, [requestFullscreen]);

  // ─── Keyboard/context blocking ────────────────────────────────────────────
  const blockShortcuts = useCallback((e) => {
    if (!enabled) return;
    const blockedKeys = ['F12', 'PrintScreen'];
    const blockedCombos = [
      { ctrl: true, keys: ['c', 'v', 'u', 's', 'p', 'a'] },
      { ctrl: true, shift: true, keys: ['i', 'j', 'c'] }
    ];

    if (blockedKeys.includes(e.key)) { e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (e.shiftKey && ['i', 'j', 'c'].includes(key)) { e.preventDefault(); return; }
      if (['c', 'v', 'u', 's', 'p', 'a'].includes(key) && !e.shiftKey) { e.preventDefault(); return; }
    }
  }, [enabled]);

  // ─── Event listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (suppressRef.current || terminatedRef.current) return;
      if (document.visibilityState === 'hidden') {
        logViolation('visibility_hidden');
      }
    };

    // Debounce blur events: ignore transient blurs (< 350ms) caused by UI modal focus or dialog switches
    const handleWindowBlur = () => {
      if (suppressRef.current || terminatedRef.current) return;
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => {
        if (!suppressRef.current && !terminatedRef.current) {
          logViolation('window_blur');
        }
      }, 350);
    };

    const handleWindowFocus = () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };

    const handleFullscreenChange = () => {
      if (suppressRef.current || terminatedRef.current) return;
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs && enabled && !terminatedRef.current) {
        logViolation('fullscreen_exit');
      }
    };

    const handleRightClick = (e) => { if (enabled && !suppressRef.current) e.preventDefault(); };
    const handleSelectStart = (e) => { if (enabled && !suppressRef.current) e.preventDefault(); };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', blockShortcuts);

    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', blockShortcuts);
    };
  }, [enabled, logViolation, blockShortcuts]);

  // ─── Camera setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraEnabled || !enabled) return;
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: "user" },
          audio: false
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (fallbackErr) {
          const msg = fallbackErr.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access to continue.'
            : 'Camera not available. Please check your device.';
          setCameraError(msg);
          onCameraError(msg);
        }
      }
    }

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [cameraEnabled, enabled, onCameraError]);

  // Attach stream to video ref when both are ready
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return {
    violations,
    warningCount,
    showWarningModal,
    warningMessage,
    cameraStream,
    cameraError,
    videoRef,
    dismissWarning,
    requestFullscreen,
    exitFullscreen,
    logViolation,
    setSuppressViolations,
    stopProctoring,
    isTerminated: terminatedRef.current
  };
}
