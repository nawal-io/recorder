import React, { useRef } from 'react';
import {
  Monitor,
  Video,
  Mic,
  Volume2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { CameraBubble } from './CameraBubble';
import {
  BubblePosition,
  BubbleShape,
  BubbleSize,
  RecordingStatus,
} from '../types';

interface StageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraVideoRef: React.RefObject<HTMLVideoElement | null>;
  hasScreen: boolean;
  hasCamera: boolean;
  hasMic: boolean;
  recordingStatus: RecordingStatus;
  countdown: number;
  isCameraEnabled: boolean;
  isMirrored: boolean;
  bubbleSize: BubbleSize;
  bubbleShape: BubbleShape;
  bubblePosition: BubblePosition;
  micLevel: number;
  onPositionChange: (pos: BubblePosition) => void;
  onSizeChange: (size: BubbleSize) => void;
  onShapeChange: (shape: BubbleShape) => void;
  onToggleMirror: () => void;
  onCloseCamera: () => void;
  onRequestScreen: () => void;
  onRequestCamera: () => void;
  error: string | null;
  onClearError: () => void;
}

export const Stage: React.FC<StageProps> = ({
  canvasRef,
  cameraVideoRef,
  hasScreen,
  hasCamera,
  hasMic,
  recordingStatus,
  countdown,
  isCameraEnabled,
  isMirrored,
  bubbleSize,
  bubbleShape,
  bubblePosition,
  micLevel,
  onPositionChange,
  onSizeChange,
  onShapeChange,
  onToggleMirror,
  onCloseCamera,
  onRequestScreen,
  onRequestCamera,
  error,
  onClearError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRecording = recordingStatus === 'recording';
  const isCountdown = recordingStatus === 'countdown';

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#09090B] overflow-hidden">
      {/* Error banner notification if permissions failed */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-11/12 bg-[#1C1215] border border-rose-500/40 text-rose-200 text-xs sm:text-sm px-4 py-3 rounded-lg shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Notice</p>
              <p className="text-rose-200/90 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            onClick={onClearError}
            className="text-rose-400 hover:text-white p-1 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stage Canvas Frame (16:9 aspect container) */}
      <div
        ref={containerRef}
        id="recording-stage-container"
        className={`relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-[#0F0F12] border shadow-2xl transition-all duration-300 ${
          isRecording
            ? 'border-rose-500/70 shadow-rose-500/10 ring-1 ring-rose-500/30'
            : 'border-[#27272A] shadow-black/80'
        }`}
      >
        {/* Real-time HTML5 Canvas (Composite of Screen + Floating Webcam) */}
        <canvas
          ref={canvasRef}
          id="composite-canvas"
          className="w-full h-full object-contain block bg-[#09090B]"
        />

        {/* Live Interactive Draggable Camera Bubble */}
        {hasCamera && isCameraEnabled && (
          <CameraBubble
            containerRef={containerRef}
            cameraVideoRef={cameraVideoRef}
            cameraEnabled={isCameraEnabled}
            mirrored={isMirrored}
            size={bubbleSize}
            shape={bubbleShape}
            position={bubblePosition}
            isRecording={isRecording}
            micLevel={micLevel}
            onPositionChange={onPositionChange}
            onSizeChange={onSizeChange}
            onShapeChange={onShapeChange}
            onToggleMirror={onToggleMirror}
            onCloseCamera={onCloseCamera}
          />
        )}

        {/* Big 3-2-1 Countdown Overlay */}
        {isCountdown && (
          <div
            id="countdown-overlay"
            className="absolute inset-0 bg-[#09090B]/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-in fade-in duration-200"
          >
            <div className="w-28 h-28 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center mb-4">
              <span className="text-5xl font-bold text-zinc-100 font-mono animate-bounce">
                {countdown}
              </span>
            </div>
            <p className="text-zinc-400 font-medium text-xs tracking-wider uppercase">
              Get Ready to Record
            </p>
          </div>
        )}

        {/* Initial Prompt to Share Screen if not shared yet */}
        {!hasScreen && !isCountdown && (
          <div className="absolute inset-0 bg-[#0F0F12]/95 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full flex flex-col items-center">
              {/* Hero Icon */}
              <div className="w-14 h-14 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center text-indigo-400 mb-4 shadow-sm">
                <Monitor className="w-7 h-7" />
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 mb-2">
                Ready to Record Screen
              </h2>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed max-w-sm">
                Choose a screen, window, or tab to share. Your webcam bubble will float smoothly over your screen presentation.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto mb-6">
                <button
                  id="stage-share-screen-btn"
                  onClick={onRequestScreen}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Select Screen to Share</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {!hasCamera && (
                  <button
                    id="stage-enable-camera-btn"
                    onClick={onRequestCamera}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#1E1E22] text-zinc-200 font-medium text-sm border border-[#27272A] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-indigo-400" />
                    <span>Enable Webcam</span>
                  </button>
                )}
              </div>

              {/* Pro-tips banner */}
              <div className="w-full bg-[#141417] border border-[#27272A] rounded-lg p-3 text-left flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-300">Tips for Best Recording:</p>
                  <p>• In the browser prompt, check <strong>"Also share system audio"</strong> to capture video/music playback sound.</p>
                  <p>• Drag the webcam circle anywhere on screen to reposition it.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live badge in top-left when screen is shared */}
        {hasScreen && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="bg-[#0F0F12]/90 backdrop-blur-md border border-[#27272A] px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canvas 60FPS</span>
            </div>
            {canvasRef.current && canvasRef.current.width > 0 && (
              <div className="hidden sm:block bg-[#0F0F12]/90 backdrop-blur-md border border-[#27272A] px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-400">
                {canvasRef.current.width} × {canvasRef.current.height}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
