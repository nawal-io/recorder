import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RecordingStatus,
  CameraSettings,
  RecordedItem,
  BubblePosition,
  BubbleSize,
  BubbleShape,
} from '../types';
import { createAudioMixer, AudioMixerInstance } from '../utils/audioMixer';
import { renderCompositeFrame } from '../utils/canvasRenderer';

export function useScreenRecorder() {
  // Main recording state
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Device availability flags
  const [hasScreen, setHasScreen] = useState<boolean>(false);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMic, setHasMic] = useState<boolean>(false);
  const [hasSystemAudio, setHasSystemAudio] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);

  // Camera Settings
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    enabled: true,
    mirrored: true,
    size: 'md',
    shape: 'circle',
    position: { x: 86, y: 80 }, // default bottom-right
    showMicWave: true,
  });

  // Exported Recording
  const [lastRecording, setLastRecording] = useState<RecordedItem | null>(null);

  // Hidden/Internal DOM Elements & Streams
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioMixerRef = useRef<AudioMixerInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const animFrameIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const micIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep camera settings in ref for canvas loop without retriggering render loops
  const cameraSettingsRef = useRef(cameraSettings);
  cameraSettingsRef.current = cameraSettings;

  const recordingStatusRef = useRef(recordingStatus);
  recordingStatusRef.current = recordingStatus;

  const micLevelRef = useRef(micLevel);
  micLevelRef.current = micLevel;

  // Initialize hidden video elements
  useEffect(() => {
    // Ensure canvas has standard resolution immediately
    if (canvasRef.current && (canvasRef.current.width === 0 || canvasRef.current.width === 300)) {
      canvasRef.current.width = 1920;
      canvasRef.current.height = 1080;
    }

    if (!screenVideoRef.current) {
      const sVideo = document.createElement('video');
      sVideo.autoplay = true;
      sVideo.playsInline = true;
      sVideo.muted = true;
      screenVideoRef.current = sVideo;
    }

    if (!cameraVideoRef.current) {
      const cVideo = document.createElement('video');
      cVideo.autoplay = true;
      cVideo.playsInline = true;
      cVideo.muted = true;
      cameraVideoRef.current = cVideo;
    }

    // Initialize Web Audio mixer
    try {
      audioMixerRef.current = createAudioMixer();
    } catch (err) {
      console.warn('Web Audio API not fully available yet:', err);
    }

    // Mic meter polling interval (optimized to prevent high React render churn)
    micIntervalRef.current = setInterval(() => {
      if (audioMixerRef.current) {
        const level = audioMixerRef.current.getMicLevel();
        micLevelRef.current = level;
        setMicLevel((prev) => {
          if (Math.abs(prev - level) >= 4 || (prev === 0 && level > 0) || (prev > 0 && level === 0)) {
            return level;
          }
          return prev;
        });
      }
    }, 75);

    return () => {
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (audioMixerRef.current) audioMixerRef.current.destroy();

      // Clean stream tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Request Screen Capture
  const startScreenCapture = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported by your browser.');
      }

      // Stop previous screen stream if any
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 60, max: 60 },
        },
        audio: true, // system audio capture (if browser supports and user checks "Share audio")
      });

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play().catch(() => {});
      }

      // Check audio track in display media
      const audioTracks = stream.getAudioTracks();
      const hasSysAudio = audioTracks.length > 0;
      setHasSystemAudio(hasSysAudio);
      if (hasSysAudio && audioMixerRef.current) {
        audioMixerRef.current.updateSystemTrack(audioTracks[0]);
      }

      // Auto update canvas resolution based on screen video
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          // Screen share was ended by user from browser UI
          setHasScreen(false);
          if (canvasRef.current) {
            canvasRef.current.width = 1920;
            canvasRef.current.height = 1080;
          }
          if (recordingStatusRef.current === 'recording') {
            stopRecording();
          }
        };

        const settings = videoTrack.getSettings();
        if (canvasRef.current) {
          canvasRef.current.width = settings.width || 1920;
          canvasRef.current.height = settings.height || 1080;
        }
      }

      setHasScreen(true);
      return true;
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name !== 'NotAllowedError') {
        setError(e.message || 'Failed to capture screen.');
      }
      setHasScreen(false);
      return false;
    }
  }, []);

  // Request Camera & Mic
  const startCameraCapture = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      // Stop previous camera stream if any
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 60, min: 30 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.onloadedmetadata = () => {
          cameraVideoRef.current?.play().catch(() => {});
        };
        await cameraVideoRef.current.play().catch(() => {});
      }

      setHasCamera(stream.getVideoTracks().length > 0);

      const micTracks = stream.getAudioTracks();
      const hasMicrophone = micTracks.length > 0;
      setHasMic(hasMicrophone);

      if (hasMicrophone && audioMixerRef.current) {
        audioMixerRef.current.updateMicTrack(micTracks[0]);
      }

      setCameraSettings((prev) => ({ ...prev, enabled: true }));
      return true;
    } catch (err: unknown) {
      const e = err as Error;
      console.warn('Camera access issue:', e);
      if (e.name === 'NotAllowedError') {
        setError('Camera/Microphone permission was denied. Please allow access in your browser settings.');
      } else {
        setError(e.message || 'Could not connect to camera or microphone.');
      }
      return false;
    }
  }, []);

  // Toggle Microphone Mute
  const toggleMic = useCallback(() => {
    if (!cameraStreamRef.current) return;
    const micTracks = cameraStreamRef.current.getAudioTracks();
    if (micTracks.length > 0) {
      const newEnabled = !micTracks[0].enabled;
      micTracks.forEach((t) => {
        t.enabled = newEnabled;
      });
      setHasMic(newEnabled);
      if (audioMixerRef.current) {
        audioMixerRef.current.setMicVolume(newEnabled ? 1.0 : 0.0);
      }
    }
  }, []);

  // Toggle Camera Enabled / Visible
  const toggleCamera = useCallback(() => {
    if (!cameraStreamRef.current) {
      // If camera wasn't initiated yet, start it
      startCameraCapture();
      return;
    }
    const videoTracks = cameraStreamRef.current.getVideoTracks();
    const newEnabled = !cameraSettings.enabled;
    videoTracks.forEach((t) => {
      t.enabled = newEnabled;
    });
    setCameraSettings((prev) => ({ ...prev, enabled: newEnabled }));
  }, [cameraSettings.enabled, startCameraCapture]);

  // Adjust Camera Settings
  const setCameraPosition = useCallback((pos: BubblePosition) => {
    cameraSettingsRef.current.position = pos;
    setCameraSettings((prev) => ({ ...prev, position: pos }));
  }, []);

  const setCameraSize = useCallback((size: BubbleSize) => {
    cameraSettingsRef.current.size = size;
    setCameraSettings((prev) => ({ ...prev, size }));
  }, []);

  const setCameraShape = useCallback((shape: BubbleShape) => {
    cameraSettingsRef.current.shape = shape;
    setCameraSettings((prev) => ({ ...prev, shape }));
  }, []);

  const toggleMirror = useCallback(() => {
    cameraSettingsRef.current.mirrored = !cameraSettingsRef.current.mirrored;
    setCameraSettings((prev) => ({ ...prev, mirrored: !prev.mirrored }));
  }, []);

  // Real-time Canvas Rendering Loop
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If screen video has distinct dimension, ensure canvas matches
          const sVideo = screenVideoRef.current;
          if (sVideo && sVideo.videoWidth > 0) {
            if (canvas.width !== sVideo.videoWidth || canvas.height !== sVideo.videoHeight) {
              canvas.width = sVideo.videoWidth;
              canvas.height = sVideo.videoHeight;
            }
          }

          renderCompositeFrame({
            canvas,
            ctx,
            screenVideo: screenVideoRef.current,
            cameraVideo: cameraVideoRef.current,
            cameraEnabled: cameraSettingsRef.current.enabled && hasCamera,
            mirrored: cameraSettingsRef.current.mirrored,
            bubblePosition: cameraSettingsRef.current.position,
            bubbleSize: cameraSettingsRef.current.size,
            bubbleShape: cameraSettingsRef.current.shape,
            isRecording: recordingStatusRef.current === 'recording',
            micLevel: micLevelRef.current,
          });
        }
      }
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [hasCamera]);

  // Start actual recording logic (internal)
  const executeRecordingStart = useCallback(() => {
    if (!canvasRef.current) return;

    try {
      // 1. Capture stream from composited Canvas (60fps ideal, 30fps fallback)
      let canvasStream: MediaStream;
      try {
        canvasStream = canvasRef.current.captureStream(60);
      } catch {
        canvasStream = canvasRef.current.captureStream(30);
      }

      // 2. Mix in Audio Tracks from AudioMixer destination
      if (audioMixerRef.current) {
        const audioTracks = audioMixerRef.current.mixedStream.getAudioTracks();
        audioTracks.forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

      // 3. Supported MIME types check - prioritize MP4
      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1',
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: 6000000, // 6 Mbps for crisp screen and camera
      };
      if (selectedMime) {
        recorderOptions.mimeType = selectedMime;
      }

      const recorder = new MediaRecorder(canvasStream, recorderOptions);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = selectedMime || 'video/mp4';
        const fullBlob = new Blob(recordedChunksRef.current, {
          type: mime,
        });
        const url = URL.createObjectURL(fullBlob);

        const canvas = canvasRef.current;
        const newRecord: RecordedItem = {
          id: 'rec-' + Date.now(),
          blob: fullBlob,
          url,
          duration: elapsedSeconds,
          size: fullBlob.size,
          createdAt: Date.now(),
          mimeType: mime,
          resolution: {
            width: canvas ? canvas.width : 1920,
            height: canvas ? canvas.height : 1080,
          },
        };

        setLastRecording(newRecord);
        setRecordingStatus('stopped');

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };

      recorder.start(1000); // 1-second chunks
      setRecordingStatus('recording');
      setElapsedSeconds(0);

      // Start elapsed timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const e = err as Error;
      setError('Recording failed to start: ' + (e.message || 'Unknown error'));
      setRecordingStatus('idle');
    }
  }, [elapsedSeconds]);

  // Trigger Recording with optional 3s Countdown
  const startRecording = useCallback(
    async (withCountdown = true) => {
      // Ensure screen is captured
      if (!screenStreamRef.current || !hasScreen) {
        const success = await startScreenCapture();
        if (!success) {
          setError('Please share your screen before starting recording.');
          return;
        }
      }

      // If user hasn't enabled camera yet, attempt to capture camera if allowed
      if (!cameraStreamRef.current && cameraSettings.enabled) {
        await startCameraCapture().catch(() => {});
      }

      if (withCountdown) {
        setRecordingStatus('countdown');
        setCountdown(3);

        let count = 3;
        const countdownTimer = setInterval(() => {
          count -= 1;
          if (count > 0) {
            setCountdown(count);
          } else {
            clearInterval(countdownTimer);
            executeRecordingStart();
          }
        }, 1000);
      } else {
        executeRecordingStart();
      }
    },
    [hasScreen, startScreenCapture, cameraSettings.enabled, startCameraCapture, executeRecordingStart]
  );

  // Pause Recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);

  // Resume Recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  // Stop Recording
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')
    ) {
      mediaRecorderRef.current.stop();
      // onstop handler handles the rest
    } else {
      setRecordingStatus('idle');
    }
  }, []);

  // Cancel Countdown
  const cancelCountdown = useCallback(() => {
    setRecordingStatus('idle');
    setCountdown(3);
  }, []);

  // Reset back to Ready / Idle
  const resetRecording = useCallback(() => {
    setRecordingStatus('idle');
    setElapsedSeconds(0);
  }, []);

  return {
    recordingStatus,
    countdown,
    elapsedSeconds,
    error,
    clearError: () => setError(null),

    hasScreen,
    hasCamera,
    hasMic,
    hasSystemAudio,
    micLevel,

    cameraSettings,
    toggleMic,
    toggleCamera,
    toggleMirror,
    setCameraPosition,
    setCameraSize,
    setCameraShape,

    startScreenCapture,
    startCameraCapture,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelCountdown,
    resetRecording,

    lastRecording,
    setLastRecording,

    canvasRef,
    screenVideoRef,
    cameraVideoRef,
  };
}
