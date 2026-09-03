import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Check,
  FileVideo,
  Clock,
  HardDrive,
  Monitor,
  X,
  Share2,
} from 'lucide-react';
import { RecordedItem } from '../types';

interface PreviewModalProps {
  recording: RecordedItem | null;
  onClose: () => void;
  onRecordAnother: () => void;
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

export const PreviewModal: React.FC<PreviewModalProps> = ({
  recording,
  onClose,
  onRecordAnother,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (recording && videoRef.current) {
      videoRef.current.src = recording.url;
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [recording]);

  if (!recording) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!duration && videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || recording.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = recording.url;
    const dateStr = new Date(recording.createdAt)
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '-');
    a.download = `recording-${dateStr}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(recording.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0F0F12] border border-[#27272A] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] text-emerald-400 flex items-center justify-center">
              <FileVideo className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                Recording Ready
              </h3>
              <p className="text-xs text-zinc-400">
                Review your video capture, playback, and export
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center group">
          <video
            ref={videoRef}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Big Play Overlay if paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
            >
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            </button>
          )}

          {/* Player Custom Control Strip (reveals on hover / playback) */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 opacity-90 group-hover:opacity-100 transition-opacity">
            {/* Scrubber slider */}
            <input
              type="range"
              min={0}
              max={duration || recording.duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all mb-2.5"
            />

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolume(val);
                      if (videoRef.current) {
                        videoRef.current.volume = val;
                        videoRef.current.muted = val === 0;
                        setIsMuted(val === 0);
                      }
                    }}
                    className="w-16 h-1 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <span className="font-mono text-zinc-400">
                  {formatDuration(currentTime)} / {formatDuration(duration || recording.duration)}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-[#18181B] border border-[#27272A] px-1.5 py-0.5 rounded text-[11px]">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`px-1.5 py-0.5 rounded ${
                        playbackRate === rate
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={toggleFullScreen}
                  className="hover:text-white transition-colors p-1"
                  title="Full screen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Metadata Bar */}
        <div className="px-5 py-3.5 bg-[#09090B] border-b border-[#27272A] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Duration</p>
              <p className="font-mono font-medium text-zinc-200">
                {formatDuration(recording.duration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">File Size</p>
              <p className="font-mono font-medium text-zinc-200">
                {formatBytes(recording.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <Monitor className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Resolution</p>
              <p className="font-mono font-medium text-zinc-200">
                {recording.resolution.width} × {recording.resolution.height}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <FileVideo className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Format</p>
              <p className="font-mono font-medium text-zinc-200">
                {recording.mimeType.includes('mp4') ? 'MP4 (H.264/AAC)' : 'MP4 Video'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F0F12]">
          <button
            id="record-another-btn"
            onClick={onRecordAnother}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#1E1E22] text-zinc-200 font-medium text-xs border border-[#27272A] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Record Another Take</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#1E1E22] text-zinc-300 font-medium text-xs border border-[#27272A] transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copy blob URL"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied URL</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              id="download-recording-btn"
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Video (.mp4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
