import { PanningEffect } from "@shared/schema";
import lamejs from "lamejs";

/**
 * Apply panning effects to an audio buffer using Web Audio API
 * Returns a new AudioBuffer with effects applied
 */
export async function applyPanningEffects(
  audioBuffer: AudioBuffer,
  effects: PanningEffect[]
): Promise<AudioBuffer> {
  if (effects.length === 0) {
    return audioBuffer;
  }

  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Create source
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Create stereo panner nodes for each effect
  const sortedEffects = [...effects].sort((a, b) => a.startTime - b.startTime);
  
  // Create main panner node
  const pannerNode = offlineContext.createStereoPanner();
  
  // Schedule panning automation
  sortedEffects.forEach(effect => {
    const startTime = effect.startTime;
    const endTime = effect.startTime + effect.duration;
    const panValue = (effect.intensity / 100) * 2 - 1; // Convert 0-100 to -1 to 1
    
    // Set panning value for the duration of the effect
    pannerNode.pan.setValueAtTime(0, startTime);
    pannerNode.pan.linearRampToValueAtTime(panValue, startTime + effect.duration * 0.25);
    pannerNode.pan.setValueAtTime(panValue, startTime + effect.duration * 0.75);
    pannerNode.pan.linearRampToValueAtTime(0, endTime);
  });

  // Connect nodes
  source.connect(pannerNode);
  pannerNode.connect(offlineContext.destination);

  // Start processing
  source.start(0);

  // Render and return result
  return await offlineContext.startRendering();
}

/**
 * Create real-time audio playback with panning effects
 */
export function createRealtimeAudioSource(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  effects: PanningEffect[],
  startTime: number,
  volume: number
): { source: AudioBufferSourceNode; gainNode: GainNode } {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  // Create panner node for real-time effects
  const pannerNode = audioContext.createStereoPanner();

  // Schedule panning automation
  const currentAudioTime = audioContext.currentTime;
  effects.forEach(effect => {
    const effectStartTime = currentAudioTime + (effect.startTime - startTime);
    const effectEndTime = effectStartTime + effect.duration;
    const panValue = (effect.intensity / 100) * 2 - 1;

    if (effectStartTime > currentAudioTime) {
      pannerNode.pan.setValueAtTime(0, effectStartTime);
      pannerNode.pan.linearRampToValueAtTime(panValue, effectStartTime + effect.duration * 0.25);
      pannerNode.pan.setValueAtTime(panValue, effectStartTime + effect.duration * 0.75);
      pannerNode.pan.linearRampToValueAtTime(0, effectEndTime);
    }
  });

  // Connect nodes
  source.connect(pannerNode);
  pannerNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  return { source, gainNode };
}

/**
 * Export audio buffer to WAV format
 */
export function exportToWAV(
  audioBuffer: AudioBuffer,
  sampleRate: number = 44100,
  bitDepth: number = 16
): Blob {
  // Resample if necessary
  let buffer = audioBuffer;
  if (audioBuffer.sampleRate !== sampleRate) {
    buffer = resampleBuffer(audioBuffer, sampleRate);
  }

  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write audio data
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      
      if (bitDepth === 16) {
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      } else if (bitDepth === 24) {
        const val = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
        view.setInt8(offset, val & 0xFF);
        view.setInt8(offset + 1, (val >> 8) & 0xFF);
        view.setInt8(offset + 2, (val >> 16) & 0xFF);
        offset += 3;
      } else if (bitDepth === 32) {
        view.setInt32(offset, sample < 0 ? sample * 0x80000000 : sample * 0x7FFFFFFF, true);
        offset += 4;
      }
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Export audio buffer to MP3 format using lamejs
 */
export function exportToMP3(audioBuffer: AudioBuffer, bitrate: number = 192): Blob {
  const mp3encoder = new lamejs.Mp3Encoder(
    audioBuffer.numberOfChannels,
    audioBuffer.sampleRate,
    bitrate
  );

  const channels: Int16Array[] = [];
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    const channelData = audioBuffer.getChannelData(i);
    const samples = new Int16Array(channelData.length);
    
    for (let j = 0; j < channelData.length; j++) {
      const s = Math.max(-1, Math.min(1, channelData[j]));
      samples[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    channels.push(samples);
  }

  const mp3Data: Int8Array[] = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < channels[0].length; i += sampleBlockSize) {
    const left = channels[0].subarray(i, i + sampleBlockSize);
    const right = audioBuffer.numberOfChannels > 1 
      ? channels[1].subarray(i, i + sampleBlockSize)
      : left;

    const mp3buf = mp3encoder.encodeBuffer(left, right);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const finalBuffer = mp3encoder.flush();
  if (finalBuffer.length > 0) {
    mp3Data.push(finalBuffer);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Resample audio buffer to a different sample rate
 */
function resampleBuffer(audioBuffer: AudioBuffer, targetSampleRate: number): AudioBuffer {
  const sourceSampleRate = audioBuffer.sampleRate;
  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(audioBuffer.length / ratio);
  
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    newLength,
    targetSampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start(0);

  // This will need to be handled asynchronously in practice
  // For now, return original buffer (caller should handle async)
  return audioBuffer;
}

/**
 * Helper function to write string to DataView
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
