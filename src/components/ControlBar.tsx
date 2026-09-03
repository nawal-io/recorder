import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MonitorUp,
  Settings2,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { RecordingStatus, BubbleSize, BubbleShape } from '../types';

interface ControlBarProps {
  recordingStatus: RecordingStatus;
  elapsedSeconds: number;
  hasScreen: boolean;
  hasCamera: boolean;
  hasMic: boolean;
  isCameraEnabled: boolean;
  micLevel: number;
  bubbleSize: BubbleSize;
  bubbleShape: BubbleShape;
  onStartRecording: (withCountdown?: boolean) => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onCancelCountdown: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onRequestScreen: () => void;
  onSizeChange: (size: BubbleSize) => void;
  onShapeChange: (shape: BubbleShape) => void;
  onToggleMirror: () => void;
  isMirrored: boolean;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  recordingStatus,
  elapsedSeconds,
  hasScreen,
  hasMic,
  isCameraEnabled,
  micLevel,
  bubbleSize,
  bubbleShape,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onCancelCountdown,
  onToggleMic,
  onToggleCamera,
  onRequestScreen,
  onSizeChange,
  onShapeChange,
  onToggleMirror,
  isMirrored,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const isRecording = recordingStatus === 'recording';
  const isPaused = recordingStatus === 'paused';
  const isCountdown = recordingStatus === 'countdown';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      {/* Settings popup panel */}
      {showSettingsDrawer && (
        <div className="bg-[#0F0F12]/95 backdrop-blur-xl border border-[#27272A] rounded-xl p-4 shadow-2xl w-80 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#27272A]">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Camera Overlay Options
            </span>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-zinc-400 hover:text-zinc-200 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Size picker */}
          <div className="mb-3">
            <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
              Bubble Size
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#09090B] p-1 rounded-lg border border-[#27272A]">
              {(['sm', 'md', 'lg'] as BubbleSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onSizeChange(s)}
                  className={`py-1 text-xs font-medium rounded-md transition-all uppercase ${
                    bubbleSize === s
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}
                </button>
              ))}
            </div>
          </div>

          {/* Shape picker */}
          <div className="mb-3">
            <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
              Bubble Shape
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#09090B] p-1 rounded-lg border border-[#27272A]">
              {(['circle', 'squircle', 'rounded'] as BubbleShape[]).map((shp) => (
                <button
                  key={shp}
                  onClick={() => onShapeChange(shp)}
                  className={`py-1 text-xs font-medium rounded-md transition-all capitalize ${
                    bubbleShape === shp
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {shp}
                </button>
              ))}
            </div>
          </div>

          {/* Mirror toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-300">Mirror Webcam</span>
            <button
              onClick={onToggleMirror}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isMirrored ? 'bg-indigo-600' : 'bg-[#27272A]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  isMirrored ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Dock */}
      <div className="bg-[#0F0F12]/95 backdrop-blur-xl border border-[#27272A] rounded-full px-3 py-2 shadow-2xl shadow-black/80 flex items-center gap-2">
        {/* Select / Change Screen */}
        <button
          id="select-screen-btn"
          onClick={onRequestScreen}
          disabled={isRecording || isCountdown}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
            hasScreen
              ? 'bg-[#141417] hover:bg-[#1E1E22] text-zinc-200 border border-[#27272A]'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm animate-pulse'
          } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={hasScreen ? 'Change Screen / Window' : 'Select Screen to Record'}
        >
          <MonitorUp className="w-4 h-4" />
          <span className="hidden sm:inline">
            {hasScreen ? 'Change Screen' : 'Share Screen'}
          </span>
        </button>

        <div className="w-[1px] h-5 bg-[#27272A]" />

        {/* Toggle Mic */}
        <button
          id="toggle-mic-btn"
          onClick={onToggleMic}
          className={`relative p-2.5 rounded-full transition-all cursor-pointer ${
            hasMic
              ? 'bg-[#141417] hover:bg-[#1E1E22] text-zinc-200 border border-[#27272A]'
              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25'
          }`}
          title={hasMic ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {hasMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          {hasMic && micLevel > 15 && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0F0F12]"
              title={`Level: ${micLevel}%`}
            />
          )}
        </button>

        {/* Toggle Camera */}
        <button
          id="toggle-camera-btn"
          onClick={onToggleCamera}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
            isCameraEnabled
              ? 'bg-[#141417] hover:bg-[#1E1E22] text-zinc-200 border border-[#27272A]'
              : 'bg-[#18181B] hover:bg-[#1E1E22] text-zinc-400 border border-[#27272A]'
          }`}
          title={isCameraEnabled ? 'Hide Camera Bubble' : 'Show Camera Bubble'}
        >
          {isCameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
        </button>

        {/* Camera overlay styling toggle */}
        <button
          id="toggle-settings-btn"
          onClick={() => setShowSettingsDrawer((prev) => !prev)}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
            showSettingsDrawer
              ? 'bg-indigo-600 text-white'
              : 'bg-[#141417] hover:bg-[#1E1E22] text-zinc-400 hover:text-zinc-200 border border-[#27272A]'
          }`}
          title="Camera Bubble Layout & Size"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-[#27272A]" />

        {/* Recording Controls */}
        {recordingStatus === 'idle' && (
          <button
            id="start-recording-btn"
            onClick={() => onStartRecording(true)}
            className="flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>Record</span>
          </button>
        )}

        {isCountdown && (
          <button
            id="cancel-countdown-btn"
            onClick={onCancelCountdown}
            className="px-3.5 py-2 rounded-full bg-[#18181B] hover:bg-[#1E1E22] text-zinc-200 text-xs font-medium border border-[#27272A] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Cancel</span>
          </button>
        )}

        {(isRecording || isPaused) && (
          <div className="flex items-center gap-2">
            {/* Timer badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141417] border border-[#27272A] rounded-full font-mono text-xs font-medium text-rose-300">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            {/* Pause / Resume */}
            {isRecording ? (
              <button
                id="pause-recording-btn"
                onClick={onPauseRecording}
                className="p-2.5 rounded-full bg-[#141417] hover:bg-[#1E1E22] text-amber-300 border border-[#27272A] transition-colors cursor-pointer"
                title="Pause recording"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="resume-recording-btn"
                onClick={onResumeRecording}
                className="p-2.5 rounded-full bg-[#141417] hover:bg-[#1E1E22] text-emerald-300 border border-[#27272A] transition-colors cursor-pointer"
                title="Resume recording"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {/* Stop & Finish */}
            <button
              id="stop-recording-btn"
              onClick={onStopRecording}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Stop and export recording"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Finish</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
