import { BubblePosition, BubbleShape, BubbleSize, calculateBubbleDiameter } from '../types';

export interface RenderFrameParams {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  screenVideo: HTMLVideoElement | null;
  cameraVideo: HTMLVideoElement | null;
  cameraEnabled: boolean;
  mirrored: boolean;
  bubblePosition: BubblePosition;
  bubbleSize: BubbleSize;
  bubbleShape: BubbleShape;
  isRecording: boolean;
  micLevel: number;
}

export function renderCompositeFrame({
  canvas,
  ctx,
  screenVideo,
  cameraVideo,
  cameraEnabled,
  mirrored,
  bubblePosition,
  bubbleSize,
  bubbleShape,
  isRecording,
  micLevel,
}: RenderFrameParams): void {
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Screen Video
  if (screenVideo && screenVideo.readyState >= 2 && screenVideo.videoWidth > 0) {
    ctx.drawImage(screenVideo, 0, 0, width, height);
  } else {
    // Elegant placeholder background if screen stream is loading or empty
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Subtle dot grid pattern
    ctx.fillStyle = '#1C1C20';
    const gridSize = 36;
    for (let x = 18; x < width; x += gridSize) {
      for (let y = 18; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. Draw Floating Camera Bubble Overlay
  if (cameraEnabled) {
    const bubbleDiameter = calculateBubbleDiameter(width, height, bubbleSize);
    const bubbleRadius = bubbleDiameter / 2;

    const cornerRadius =
      bubbleShape === 'squircle'
        ? bubbleDiameter * 0.28
        : bubbleShape === 'rounded'
        ? bubbleDiameter * 0.16
        : bubbleRadius;

    // Convert normalized percentage (0 - 100) to canvas pixel coordinates
    const margin = Math.max(12, Math.min(width, height) * 0.015);
    const minCenterX = bubbleRadius + margin;
    const maxCenterX = width - bubbleRadius - margin;
    const minCenterY = bubbleRadius + margin;
    const maxCenterY = height - bubbleRadius - margin;

    const rawCenterX = (bubblePosition.x / 100) * width;
    const rawCenterY = (bubblePosition.y / 100) * height;

    const centerX = Math.max(minCenterX, Math.min(maxCenterX, rawCenterX));
    const centerY = Math.max(minCenterY, Math.min(maxCenterY, rawCenterY));

    // Audio reactivity wave / ring if mic is picking up voice
    if (micLevel > 12) {
      const ringExpansion = (micLevel / 100) * (bubbleDiameter * 0.14);
      const waveAlpha = Math.min(0.6, micLevel / 130);

      ctx.save();
      ctx.beginPath();
      if (bubbleShape === 'circle') {
        ctx.arc(centerX, centerY, bubbleRadius + ringExpansion, 0, Math.PI * 2);
      } else {
        const r = bubbleRadius + ringExpansion;
        const cR = cornerRadius + ringExpansion * 0.5;
        drawRoundedRectPath(ctx, centerX - r, centerY - r, r * 2, r * 2, cR);
      }
      ctx.fillStyle = isRecording ? `rgba(244, 63, 94, ${waveAlpha * 0.35})` : `rgba(99, 102, 241, ${waveAlpha * 0.35})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isRecording ? `rgba(244, 63, 94, ${waveAlpha})` : `rgba(99, 102, 241, ${waveAlpha})`;
      ctx.stroke();
      ctx.restore();
    }

    // Draw shadow underneath camera bubble
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = Math.min(24, Math.max(10, bubbleDiameter * 0.08));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(3, bubbleDiameter * 0.03);

    // Create clipping path for the bubble
    ctx.beginPath();
    if (bubbleShape === 'circle') {
      ctx.arc(centerX, centerY, bubbleRadius, 0, Math.PI * 2);
    } else {
      drawRoundedRectPath(
        ctx,
        centerX - bubbleRadius,
        centerY - bubbleRadius,
        bubbleDiameter,
        bubbleDiameter,
        cornerRadius
      );
    }
    ctx.fillStyle = '#0F0F12';
    ctx.fill();
    ctx.restore(); // restore shadow

    // Now clip and draw the camera video feed
    ctx.save();
    ctx.beginPath();
    if (bubbleShape === 'circle') {
      ctx.arc(centerX, centerY, bubbleRadius, 0, Math.PI * 2);
    } else {
      drawRoundedRectPath(
        ctx,
        centerX - bubbleRadius,
        centerY - bubbleRadius,
        bubbleDiameter,
        bubbleDiameter,
        cornerRadius
      );
    }
    ctx.clip();

    const hasVideoData = cameraVideo && cameraVideo.videoWidth > 0;
    if (hasVideoData) {
      if (cameraVideo.paused) {
        cameraVideo.play().catch(() => {});
      }
      const camW = cameraVideo.videoWidth;
      const camH = cameraVideo.videoHeight;
      const cropSize = Math.min(camW, camH);
      const cropX = (camW - cropSize) / 2;
      const cropY = (camH - cropSize) / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      if (mirrored) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        cameraVideo,
        cropX,
        cropY,
        cropSize,
        cropSize,
        -bubbleRadius,
        -bubbleRadius,
        bubbleDiameter,
        bubbleDiameter
      );
      ctx.restore();
    } else {
      // Fallback placeholder inside bubble
      ctx.fillStyle = '#141417';
      ctx.fillRect(centerX - bubbleRadius, centerY - bubbleRadius, bubbleDiameter, bubbleDiameter);
      ctx.fillStyle = '#71717A';
      ctx.font = `600 ${Math.max(13, bubbleDiameter * 0.12)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Camera...', centerX, centerY);
    }
    ctx.restore(); // restore clip

    // Draw stylish outer rim / border
    ctx.save();
    ctx.beginPath();
    if (bubbleShape === 'circle') {
      ctx.arc(centerX, centerY, bubbleRadius, 0, Math.PI * 2);
    } else {
      drawRoundedRectPath(
        ctx,
        centerX - bubbleRadius,
        centerY - bubbleRadius,
        bubbleDiameter,
        bubbleDiameter,
        cornerRadius
      );
    }
    ctx.lineWidth = Math.max(2.5, bubbleDiameter * 0.02);
    ctx.strokeStyle = isRecording ? '#F43F5E' : '#6366F1';
    ctx.stroke();

    // Subtle inner rim highlight
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();
    ctx.restore();
  }
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
