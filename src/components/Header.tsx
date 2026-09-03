import React from 'react';
import {
  Video,
  Mic,
  MicOff,
  Monitor,
  Camera,
  CameraOff,
  Clock,
  History,
  HelpCircle,
} from 'lucide-react';
import { RecordingStatus } from '../types';

interface HeaderProps {
  recordingStatus: RecordingStatus;
  elapsedSeconds: number;
  hasScreen: boolean;
  hasCamera: boolean;
  hasMic: boolean;
  hasSystemAudio: boolean;
  micLevel: number;
  onToggleHistory: () => void;
  onOpenHelp: () => void;
  recordingsCount: number;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const Header: React.FC<HeaderProps> = ({
  recordingStatus,
  elapsedSeconds,
  hasScreen,
  hasCamera,
  hasMic,
  hasSystemAudio,
  micLevel,
  onToggleHistory,
  onOpenHelp,
  recordingsCount,
}) => {
  return (
    <header className="h-16 border-b border-[#27272A] bg-[#0F0F12]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-zinc-100 shadow-sm">
          <Video className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
              ScreenStudio
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              Loom Mode
            </span>
          </div>
          <p className="text-xs text-zinc-400 hidden sm:block">
            Screen + Floating Camera Compositor
          </p>
        </div>
      </div>

      {/* Recording Status & Timer */}
      <div className="flex items-center gap-3">
        {recordingStatus === 'recording' && (
          <div
            id="recording-indicator"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider">REC</span>
            <span className="text-xs font-mono font-medium tracking-wider text-rose-300">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        )}

        {recordingStatus === 'paused' && (
          <div
            id="paused-indicator"
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">PAUSED</span>
            <span className="text-xs font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        )}

        {recordingStatus === 'countdown' && (
          <div
            id="countdown-indicator"
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            <span className="text-xs font-medium">GETTING READY...</span>
          </div>
        )}

        {recordingStatus === 'idle' && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181B] border border-[#27272A] text-zinc-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Standby</span>
          </div>
        )}
      </div>

      {/* Stream Badges & Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Hardware Status Pills */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#141417] border border-[#27272A] rounded-lg p-1 text-xs">
          {/* Screen */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              hasScreen
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-500'
            }`}
            title={hasScreen ? 'Screen captured' : 'No screen captured'}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Screen</span>
          </div>

          {/* Camera */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              hasCamera
                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                : 'text-zinc-500'
            }`}
            title={hasCamera ? 'Webcam active' : 'Webcam inactive'}
          >
            {hasCamera ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            <span>Cam</span>
          </div>

          {/* Mic */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              hasMic
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                : 'text-zinc-500'
            }`}
            title={hasMic ? `Microphone on (Level: ${micLevel}%)` : 'Mic muted'}
          >
            {hasMic ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>Mic</span>
            {hasMic && (
              <span className="w-1.5 h-3 bg-[#18181B] rounded-sm overflow-hidden flex items-end ml-0.5">
                <span
                  className="w-full bg-purple-400 transition-all duration-75"
                  style={{ height: `${Math.min(100, micLevel * 1.5)}%` }}
                />
              </span>
            )}
          </div>

          {/* System Audio */}
          {hasSystemAudio && (
            <span
              className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]"
              title="System audio from screen capture is connected"
            >
              Sys Audio
            </span>
          )}
        </div>

        {/* History drawer button */}
        <button
          id="history-btn"
          onClick={onToggleHistory}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-[#141417] hover:bg-[#1E1E22] border border-[#27272A] rounded-lg transition-colors cursor-pointer"
          title="Past recordings in this session"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Takes</span>
          {recordingsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
              {recordingsCount}
            </span>
          )}
        </button>

        {/* Help info button */}
        <button
          id="help-btn"
          onClick={onOpenHelp}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181B] border border-transparent hover:border-[#27272A] rounded-lg transition-colors cursor-pointer"
          title="How it works & tips"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
