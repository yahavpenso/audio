import { AudioEffect, PanningEffect } from "@shared/schema";
import lamejs from "lamejs";

/**
 * Apply all audio effects to an audio buffer
 */
export async function applyAllEffects(
  audioBuffer: AudioBuffer,
  effects: AudioEffect[]
): Promise<AudioBuffer> {
  if (effects.length === 0) {
    return audioBuffer;
  }

  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Create effect chains
  let prevNode: AudioNode = source;

  // Apply each effect type
  const sortedEffects = [...effects].sort((a, b) => a.startTime - b.startTime);
  
  for (const effect of sortedEffects) {
    if (effect.type === "panning") {
      prevNode = createPanningEffect(offlineContext, prevNode, effect as PanningEffect);
    } else if (effect.type === "reverb") {
      prevNode = createReverbEffect(offlineContext, prevNode, effect);
    } else if (effect.type === "delay") {
      prevNode = createDelayEffect(offlineContext, prevNode, effect);
    } else if (effect.type === "eq") {
      prevNode = createEQEffect(offlineContext, prevNode, effect);
    } else if (effect.type === "compressor") {
      prevNode = createCompressorEffect(offlineContext, prevNode, effect);
    }
  }

  prevNode.connect(offlineContext.destination);
  source.start(0);

  return await offlineContext.startRendering();
}

function createPanningEffect(ctx: AudioContext | OfflineAudioContext, input: AudioNode, effect: any): AudioNode {
  const panner = ctx.createStereoPanner();
  const panValue = (effect.intensity / 100) * 2 - 1;
  
  panner.pan.setValueAtTime(0, effect.startTime);
  panner.pan.linearRampToValueAtTime(panValue, effect.startTime + effect.duration * 0.25);
  panner.pan.setValueAtTime(panValue, effect.startTime + effect.duration * 0.75);
  panner.pan.linearRampToValueAtTime(0, effect.startTime + effect.duration);
  
  input.connect(panner);
  return panner;
}

function createReverbEffect(ctx: AudioContext | OfflineAudioContext, input: AudioNode, effect: any): AudioNode {
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const convolverGain = ctx.createGain();
  
  const wetAmount = effect.dryWet / 100;
  dryGain.gain.value = 1 - wetAmount;
  wetGain.gain.value = wetAmount;
  
  // Create simple reverb using delay and feedback
  const delay = ctx.createDelay(effect.decay);
  const feedback = ctx.createGain();
  feedback.gain.value = 0.3;
  
  delay.delayTime.value = effect.decay / 4;
  
  input.connect(dryGain);
  input.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wetGain);
  
  // Merge dry and wet
  const merge = ctx.createGain();
  dryGain.connect(merge);
  wetGain.connect(merge);
  
  return merge;
}

function createDelayEffect(ctx: AudioContext | OfflineAudioContext, input: AudioNode, effect: any): AudioNode {
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const delayNode = ctx.createDelay(effect.delayTime * 2);
  const feedbackGain = ctx.createGain();
  
  const wetAmount = effect.dryWet / 100;
  dryGain.gain.value = 1 - wetAmount;
  wetGain.gain.value = wetAmount;
  feedbackGain.gain.value = effect.feedback / 100;
  
  delayNode.delayTime.value = effect.delayTime;
  
  input.connect(dryGain);
  input.connect(delayNode);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  delayNode.connect(wetGain);
  
  const merge = ctx.createGain();
  dryGain.connect(merge);
  wetGain.connect(merge);
  
  return merge;
}

function createEQEffect(ctx: AudioContext | OfflineAudioContext, input: AudioNode, effect: any): AudioNode {
  const lowShelf = ctx.createBiquadFilter();
  const mid = ctx.createBiquadFilter();
  const highShelf = ctx.createBiquadFilter();
  
  // Low shelf (bass)
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 200;
  lowShelf.gain.value = effect.lowGain;
  
  // Mid peaking
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 1;
  mid.gain.value = effect.midGain;
  
  // High shelf (treble)
  highShelf.type = "highshelf";
  highShelf.frequency.value = 3000;
  highShelf.gain.value = effect.highGain;
  
  input.connect(lowShelf);
  lowShelf.connect(mid);
  mid.connect(highShelf);
  
  return highShelf;
}

function createCompressorEffect(ctx: AudioContext | OfflineAudioContext, input: AudioNode, effect: any): AudioNode {
  if (!("createDynamicsCompressor" in ctx)) {
    return input; // Fallback if not supported
  }
  
  const compressor = (ctx as any).createDynamicsCompressor();
  compressor.threshold.value = effect.threshold;
  compressor.ratio.value = effect.ratio;
  compressor.attack.value = effect.attack;
  compressor.release.value = effect.release;
  
  input.connect(compressor);
  return compressor;
}

/**
 * Create real-time audio playback with all effects
 */
export function createRealtimeAudioSource(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  effects: AudioEffect[],
  startTime: number,
  volume: number
): { source: AudioBufferSourceNode; gainNode: GainNode } {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  let prevNode: AudioNode = source;

  // Apply effects in order
  for (const effect of effects) {
    if (effect.type === "panning") {
      prevNode = createPanningEffect(audioContext, prevNode, effect);
    } else if (effect.type === "reverb") {
      prevNode = createReverbEffect(audioContext, prevNode, effect);
    } else if (effect.type === "delay") {
      prevNode = createDelayEffect(audioContext, prevNode, effect);
    } else if (effect.type === "eq") {
      prevNode = createEQEffect(audioContext, prevNode, effect);
    } else if (effect.type === "compressor") {
      prevNode = createCompressorEffect(audioContext, prevNode, effect);
    }
  }

  prevNode.connect(gainNode);
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

  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

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
 * Export audio buffer to MP3 format
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

  return audioBuffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

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
