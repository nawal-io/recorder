export interface AudioMixerInstance {
  audioContext: AudioContext;
  destination: MediaStreamAudioDestinationNode;
  mixedStream: MediaStream;
  micGainNode: GainNode;
  systemGainNode: GainNode;
  analyserNode: AnalyserNode;
  updateMicTrack: (track: MediaStreamTrack | null) => void;
  updateSystemTrack: (track: MediaStreamTrack | null) => void;
  setMicVolume: (volume: number) => void;
  setSystemVolume: (volume: number) => void;
  getMicLevel: () => number;
  destroy: () => void;
}

export function createAudioMixer(): AudioMixerInstance {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();

  // Resume if suspended
  if (audioContext.state === 'suspended') {
    const resumeAudio = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
    };
    window.addEventListener('click', resumeAudio, { once: true });
    window.addEventListener('keydown', resumeAudio, { once: true });
  }

  const destination = audioContext.createMediaStreamDestination();

  // Mic pathway
  const micGainNode = audioContext.createGain();
  micGainNode.gain.value = 1.0;

  // Analyser for speech / waveform visualizer
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 64;
  analyserNode.smoothingTimeConstant = 0.8;

  // System audio pathway
  const systemGainNode = audioContext.createGain();
  systemGainNode.gain.value = 1.0;

  // Connect gains to destination
  micGainNode.connect(destination);
  systemGainNode.connect(destination);

  let currentMicSource: MediaStreamAudioSourceNode | null = null;
  let currentSystemSource: MediaStreamAudioSourceNode | null = null;
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

  function updateMicTrack(track: MediaStreamTrack | null) {
    if (currentMicSource) {
      try {
        currentMicSource.disconnect();
      } catch (e) {
        console.warn('Error disconnecting mic source:', e);
      }
      currentMicSource = null;
    }

    if (track && track.readyState === 'live') {
      try {
        const stream = new MediaStream([track]);
        currentMicSource = audioContext.createMediaStreamSource(stream);
        currentMicSource.connect(micGainNode);
        currentMicSource.connect(analyserNode);
      } catch (e) {
        console.warn('Failed to connect mic track to audio mixer:', e);
      }
    }
  }

  function updateSystemTrack(track: MediaStreamTrack | null) {
    if (currentSystemSource) {
      try {
        currentSystemSource.disconnect();
      } catch (e) {
        console.warn('Error disconnecting system audio source:', e);
      }
      currentSystemSource = null;
    }

    if (track && track.readyState === 'live') {
      try {
        const stream = new MediaStream([track]);
        currentSystemSource = audioContext.createMediaStreamSource(stream);
        currentSystemSource.connect(systemGainNode);
      } catch (e) {
        console.warn('Failed to connect system audio track to audio mixer:', e);
      }
    }
  }

  function setMicVolume(volume: number) {
    const clamped = Math.max(0, Math.min(2, volume));
    micGainNode.gain.setTargetAtTime(clamped, audioContext.currentTime, 0.05);
  }

  function setSystemVolume(volume: number) {
    const clamped = Math.max(0, Math.min(2, volume));
    systemGainNode.gain.setTargetAtTime(clamped, audioContext.currentTime, 0.05);
  }

  function getMicLevel(): number {
    if (!currentMicSource) return 0;
    try {
      analyserNode.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      return Math.min(100, Math.round((average / 255) * 100));
    } catch {
      return 0;
    }
  }

  function destroy() {
    if (currentMicSource) {
      try {
        currentMicSource.disconnect();
      } catch {}
      currentMicSource = null;
    }
    if (currentSystemSource) {
      try {
        currentSystemSource.disconnect();
      } catch {}
      currentSystemSource = null;
    }
    try {
      micGainNode.disconnect();
      systemGainNode.disconnect();
      analyserNode.disconnect();
      destination.disconnect();
    } catch {}

    if (audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
    }
  }

  return {
    audioContext,
    destination,
    mixedStream: destination.stream,
    micGainNode,
    systemGainNode,
    analyserNode,
    updateMicTrack,
    updateSystemTrack,
    setMicVolume,
    setSystemVolume,
    getMicLevel,
    destroy,
  };
}
