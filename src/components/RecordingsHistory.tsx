import React from 'react';
import { Download, Trash2, Play, Clock, HardDrive, X, Video } from 'lucide-react';
import { RecordedItem } from '../types';

interface RecordingsHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: RecordedItem[];
  onSelectRecording: (item: RecordedItem) => void;
  onDeleteRecording: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const RecordingsHistory: React.FC<RecordingsHistoryProps> = ({
  isOpen,
  onClose,
  recordings,
  onSelectRecording,
  onDeleteRecording,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B]/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0F0F12] border-l border-[#27272A] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">Session Recordings</h3>
            <span className="text-xs bg-[#18181B] text-zinc-400 border border-[#27272A] px-2 py-0.5 rounded-full font-mono">
              {recordings.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Recordings */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {recordings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <Video className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">No recordings yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Your completed takes will appear here during this session for quick review and download.
              </p>
            </div>
          ) : (
            recordings.map((item, index) => (
              <div
                key={item.id}
                className="bg-[#141417] border border-[#27272A] rounded-xl p-3.5 hover:border-[#3F3F46] transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">
                      Take #{recordings.length - index}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectRecording(item)}
                      className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                      title="Play / Review"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <a
                      href={item.url}
                      download={`recording-${item.id}.mp4`}
                      className="p-1.5 rounded-lg bg-[#18181B] hover:bg-[#1E1E22] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer"
                      title="Download (.mp4)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onDeleteRecording(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-2 border-t border-[#27272A] font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    {formatDuration(item.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-emerald-400" />
                    {formatBytes(item.size)}
                  </span>
                  <span>{item.resolution.width}p</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-indigo-300 font-sans font-medium ml-auto">
                    MP4
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
