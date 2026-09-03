import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  FlipHorizontal,
  Circle,
  Square,
  Sparkles,
  Move,
  X,
  Volume2,
} from 'lucide-react';
import {
  BubblePosition,
  BubbleShape,
  BubbleSize,
  calculateBubbleDiameter,
} from '../types';

interface CameraBubbleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cameraVideoRef: React.RefObject<HTMLVideoElement | null>;
  cameraEnabled: boolean;
  mirrored: boolean;
  size: BubbleSize;
  shape: BubbleShape;
  position: BubblePosition;
  isRecording: boolean;
  micLevel: number;
  onPositionChange: (pos: BubblePosition) => void;
  onSizeChange: (size: BubbleSize) => void;
  onShapeChange: (shape: BubbleShape) => void;
  onToggleMirror: () => void;
  onCloseCamera: () => void;
}

export const CameraBubble: React.FC<CameraBubbleProps> = ({
  containerRef,
  cameraEnabled,
  mirrored,
  size,
  shape,
  position,
  isRecording,
  micLevel,
  onPositionChange,
  onSizeChange,
  onShapeChange,
  onToggleMirror,
  onCloseCamera,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragRafRef = useRef<number | null>(null);

  // Measure container size dynamically to match canvas geometry 1:1
  const [containerDimensions, setContainerDimensions] = useState({ width: 960, height: 540 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef]);

  // Calculate synchronized diameter
  const bubblePx = calculateBubbleDiameter(
    containerDimensions.width,
    containerDimensions.height,
    size
  );

  // Shape border-radius styling matching canvasRenderer
  const getBorderRadius = useCallback((): string => {
    switch (shape) {
      case 'squircle':
        return `${Math.round(bubblePx * 0.28)}px`;
      case 'rounded':
        return `${Math.round(bubblePx * 0.16)}px`;
      case 'circle':
      default:
        return '9999px';
    }
  }, [shape, bubblePx]);

  // Drag logic converting to percentage coordinates of stage with RAF throttling
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // don't drag if clicking internal control buttons
    }

    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    setIsDragging(true);

    const containerRect = container.getBoundingClientRect();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const initialPercentX = position.x;
    const initialPercentY = position.y;

    let targetX = initialPercentX;
    let targetY = initialPercentY;

    const scheduleUpdate = () => {
      if (dragRafRef.current) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        onPositionChange({ x: targetX, y: targetY });
      });
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;

      const deltaPercentX = (deltaX / containerRect.width) * 100;
      const deltaPercentY = (deltaY / containerRect.height) * 100;

      // Safe bounds matching canvas padding
      const margin = Math.max(12, Math.min(containerRect.width, containerRect.height) * 0.015);
      const marginPercentX = (margin / containerRect.width) * 100;
      const marginPercentY = (margin / containerRect.height) * 100;

      const halfBubbleWidthPercent = ((bubblePx / 2) / containerRect.width) * 100;
      const halfBubbleHeightPercent = ((bubblePx / 2) / containerRect.height) * 100;

      const minX = halfBubbleWidthPercent + marginPercentX;
      const maxX = 100 - halfBubbleWidthPercent - marginPercentX;
      const minY = halfBubbleHeightPercent + marginPercentY;
      const maxY = 100 - halfBubbleHeightPercent - marginPercentY;

      targetX = Math.max(minX, Math.min(maxX, initialPercentX + deltaPercentX));
      targetY = Math.max(minY, Math.min(maxY, initialPercentY + deltaPercentY));

      scheduleUpdate();
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      onPositionChange({ x: targetX, y: targetY });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Quick corner snap handlers
  const snapToCorner = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
    switch (corner) {
      case 'tl':
        onPositionChange({ x: 14, y: 18 });
        break;
      case 'tr':
        onPositionChange({ x: 86, y: 18 });
        break;
      case 'bl':
        onPositionChange({ x: 14, y: 82 });
        break;
      case 'br':
        onPositionChange({ x: 86, y: 82 });
        break;
    }
  };

  if (!cameraEnabled) return null;

  const borderRadius = getBorderRadius();

  return (
    <div
      ref={bubbleRef}
      id="floating-camera-bubble"
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        width: `${bubblePx}px`,
        height: `${bubblePx}px`,
        borderRadius,
      }}
      className={`absolute select-none touch-none cursor-grab active:cursor-grabbing z-30 transition-shadow group ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Interactive Overlay Box (transparent center allows canvas video to shine through with 0 latency) */}
      <div
        style={{ borderRadius }}
        className={`w-full h-full relative transition-all duration-150 ${
          showControls || isDragging
            ? isRecording
              ? 'ring-2 ring-rose-500 shadow-xl shadow-rose-500/25 bg-black/10'
              : 'ring-2 ring-indigo-400 shadow-xl shadow-indigo-500/25 bg-black/10'
            : 'ring-0 hover:ring-1 hover:ring-indigo-400/40'
        }`}
      >
        {/* Drag Handle Indicator in center on hover */}
        <div
          style={{ borderRadius }}
          className={`absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center pointer-events-none transition-opacity duration-150 ${
            showControls || isDragging ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-[#0F0F12]/95 text-zinc-200 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 shadow-lg border border-[#27272A]">
            <Move className="w-3 h-3 text-indigo-400" />
            <span>Drag</span>
          </div>
        </div>

        {/* Live Mic Indicator badge on bottom edge */}
        {micLevel > 15 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#09090B]/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#27272A] text-[10px] text-emerald-400 font-mono shadow-md pointer-events-none">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>{micLevel}%</span>
          </div>
        )}
      </div>

      {/* Contextual Floating Quick-Settings Toolbar */}
      <div
        className={`absolute -bottom-12 left-1/2 -translate-x-1/2 bg-[#0F0F12]/95 backdrop-blur-md border border-[#27272A] p-1.5 rounded-full shadow-2xl flex items-center gap-1 z-40 transition-all duration-200 ${
          showControls && !isDragging
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Toggle Mirror */}
        <button
          type="button"
          onClick={onToggleMirror}
          className={`p-1.5 rounded-full text-xs hover:bg-[#1E1E22] text-zinc-300 transition-colors ${
            mirrored ? 'bg-indigo-600/30 text-indigo-300' : ''
          }`}
          title={mirrored ? 'Mirrored (Click to unmirror)' : 'Unmirrored (Click to mirror)'}
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-[#27272A]" />

        {/* Size switcher */}
        <button
          type="button"
          onClick={() => onSizeChange(size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'sm')}
          className="p-1.5 rounded-full text-xs hover:bg-[#1E1E22] text-zinc-300 transition-colors flex items-center gap-0.5"
          title={`Size: ${size.toUpperCase()} (Click to toggle)`}
        >
          {size === 'lg' ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
          <span className="text-[10px] font-bold uppercase">{size}</span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#27272A]" />

        {/* Shape switcher */}
        <button
          type="button"
          onClick={() =>
            onShapeChange(shape === 'circle' ? 'squircle' : shape === 'squircle' ? 'rounded' : 'circle')
          }
          className="p-1.5 rounded-full text-xs hover:bg-[#1E1E22] text-zinc-300 transition-colors"
          title={`Shape: ${shape}`}
        >
          {shape === 'circle' && <Circle className="w-3.5 h-3.5" />}
          {shape === 'squircle' && <Sparkles className="w-3.5 h-3.5" />}
          {shape === 'rounded' && <Square className="w-3.5 h-3.5" />}
        </button>

        <div className="w-[1px] h-3.5 bg-[#27272A]" />

        {/* Quick Snap to Corner */}
        <button
          type="button"
          onClick={() => snapToCorner('br')}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E22] transition-colors"
          title="Snap to Bottom-Right"
        >
          BR
        </button>
        <button
          type="button"
          onClick={() => snapToCorner('bl')}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E22] transition-colors"
          title="Snap to Bottom-Left"
        >
          BL
        </button>

        <div className="w-[1px] h-3.5 bg-[#27272A]" />

        {/* Hide Camera */}
        <button
          type="button"
          onClick={onCloseCamera}
          className="p-1.5 rounded-full text-xs hover:bg-rose-500/20 text-rose-400 transition-colors"
          title="Hide camera bubble"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
