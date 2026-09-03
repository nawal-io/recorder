import React from 'react';
import { X, Layers, Mic, Monitor, Move, Download } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0F0F12] border border-[#27272A] rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#27272A]">
          <h3 className="font-semibold text-zinc-100 text-base">
            How ScreenStudio Works
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-[#18181B] p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18181B] text-indigo-400 border border-[#27272A] shrink-0">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">1. Real Screen Capture</p>
              <p className="text-zinc-400 mt-0.5 text-xs leading-relaxed">
                Select your entire monitor, an application window, or a browser tab. To record system audio (like videos or music), check "Share system audio" in the browser dialog.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18181B] text-purple-400 border border-[#27272A] shrink-0">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">2. Draggable Floating Bubble</p>
              <p className="text-zinc-400 mt-0.5 text-xs leading-relaxed">
                Click and drag the circular camera bubble anywhere on the screen. Change size (Small, Medium, Large), toggle shapes, or mirror the camera anytime before and during recording.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18181B] text-emerald-400 border border-[#27272A] shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">3. Web Audio Mixing</p>
              <p className="text-zinc-400 mt-0.5 text-xs leading-relaxed">
                Microphone audio and shared system audio are mixed into a unified master stereo track in real time using the Web Audio API with speech detection visualization.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18181B] text-amber-400 border border-[#27272A] shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">4. Real-time Canvas Compositing</p>
              <p className="text-zinc-400 mt-0.5 text-xs leading-relaxed">
                Every frame blends your screen and floating camera overlay onto a hardware-accelerated 60FPS canvas, captured via MediaRecorder into a high-definition MP4 video stream.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18181B] text-blue-400 border border-[#27272A] shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">5. Instant Review & Download</p>
              <p className="text-zinc-400 mt-0.5 text-xs leading-relaxed">
                Preview your recording in the custom player with scrubbing and speed adjustments, then download your video file immediately without server upload delay.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#27272A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Got it, Let's Record!
          </button>
        </div>
      </div>
    </div>
  );
};
