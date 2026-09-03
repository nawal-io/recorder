export type RecordingStatus = 'idle' | 'preparing' | 'countdown' | 'recording' | 'paused' | 'stopped';

export type BubbleShape = 'circle' | 'squircle' | 'rounded';
export type BubbleSize = 'sm' | 'md' | 'lg';

export const BUBBLE_SIZE_FACTORS: Record<BubbleSize, number> = {
  sm: 0.18,
  md: 0.25,
  lg: 0.34,
};

export function calculateBubbleDiameter(
  containerWidth: number,
  containerHeight: number,
  size: BubbleSize
): number {
  const minDim = Math.min(containerWidth, containerHeight);
  return Math.round(minDim * BUBBLE_SIZE_FACTORS[size]);
}

export interface BubblePosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface CameraSettings {
  enabled: boolean;
  mirrored: boolean;
  size: BubbleSize;
  shape: BubbleShape;
  position: BubblePosition;
  showMicWave: boolean;
}

export interface AudioSettings {
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  micVolume: number; // 0 to 1
  systemVolume: number; // 0 to 1
}

export interface StreamResolution {
  width: number;
  height: number;
}

export interface RecordedItem {
  id: string;
  blob: Blob;
  url: string;
  duration: number; // seconds
  size: number; // bytes
  createdAt: number;
  mimeType: string;
  resolution: {
    width: number;
    height: number;
  };
}

export interface MediaDeviceInfoItem {
  deviceId: string;
  label: string;
}
