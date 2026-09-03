/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import { Header } from './components/Header';
import { Stage } from './components/Stage';
import { ControlBar } from './components/ControlBar';
import { PreviewModal } from './components/PreviewModal';
import { RecordingsHistory } from './components/RecordingsHistory';
import { HelpModal } from './components/HelpModal';
import { RecordedItem } from './types';

export default function App() {
  const {
    recordingStatus,
    countdown,
    elapsedSeconds,
    error,
    clearError,

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
    cameraVideoRef,
  } = useScreenRecorder();

  // Session recordings history
  const [recordings, setRecordings] = useState<RecordedItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<RecordedItem | null>(null);

  // When a new recording finishes, automatically add to history & show preview
  useEffect(() => {
    if (lastRecording) {
      setRecordings((prev) => {
        // avoid duplicate entry if already present
        if (prev.some((r) => r.id === lastRecording.id)) return prev;
        return [lastRecording, ...prev];
      });
      setPreviewItem(lastRecording);
    }
  }, [lastRecording]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is interacting with an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setPreviewItem(null);
        setIsHistoryOpen(false);
        setIsHelpOpen(false);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMic();
      } else if (e.key === 'c' || e.key === 'C') {
        toggleCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMic, toggleCamera]);

  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    if (previewItem?.id === id) {
      setPreviewItem(null);
    }
  };

  const handleRecordAnother = () => {
    setPreviewItem(null);
    resetRecording();
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Top Application Header */}
      <Header
        recordingStatus={recordingStatus}
        elapsedSeconds={elapsedSeconds}
        hasScreen={hasScreen}
        hasCamera={hasCamera}
        hasMic={hasMic}
        hasSystemAudio={hasSystemAudio}
        micLevel={micLevel}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        onOpenHelp={() => setIsHelpOpen(true)}
        recordingsCount={recordings.length}
      />

      {/* Main Viewport Stage with Canvas Compositor & Floating Camera Bubble */}
      <main className="flex-1 relative flex flex-col items-center justify-center">
        <Stage
          canvasRef={canvasRef}
          cameraVideoRef={cameraVideoRef}
          hasScreen={hasScreen}
          hasCamera={hasCamera}
          hasMic={hasMic}
          recordingStatus={recordingStatus}
          countdown={countdown}
          isCameraEnabled={cameraSettings.enabled}
          isMirrored={cameraSettings.mirrored}
          bubbleSize={cameraSettings.size}
          bubbleShape={cameraSettings.shape}
          bubblePosition={cameraSettings.position}
          micLevel={micLevel}
          onPositionChange={setCameraPosition}
          onSizeChange={setCameraSize}
          onShapeChange={setCameraShape}
          onToggleMirror={toggleMirror}
          onCloseCamera={toggleCamera}
          onRequestScreen={startScreenCapture}
          onRequestCamera={startCameraCapture}
          error={error}
          onClearError={clearError}
        />

        {/* Floating Bottom Dock Controls */}
        <ControlBar
          recordingStatus={recordingStatus}
          elapsedSeconds={elapsedSeconds}
          hasScreen={hasScreen}
          hasCamera={hasCamera}
          hasMic={hasMic}
          isCameraEnabled={cameraSettings.enabled}
          micLevel={micLevel}
          bubbleSize={cameraSettings.size}
          bubbleShape={cameraSettings.shape}
          onStartRecording={startRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onStopRecording={stopRecording}
          onCancelCountdown={cancelCountdown}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onRequestScreen={startScreenCapture}
          onSizeChange={setCameraSize}
          onShapeChange={setCameraShape}
          onToggleMirror={toggleMirror}
          isMirrored={cameraSettings.mirrored}
        />
      </main>

      {/* Post-Recording Review & Export Modal */}
      {previewItem && (
        <PreviewModal
          recording={previewItem}
          onClose={() => setPreviewItem(null)}
          onRecordAnother={handleRecordAnother}
        />
      )}

      {/* Side Drawer for Session Recordings History */}
      <RecordingsHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordings={recordings}
        onSelectRecording={(item) => {
          setPreviewItem(item);
          setIsHistoryOpen(false);
        }}
        onDeleteRecording={handleDeleteRecording}
      />

      {/* Guide & Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
