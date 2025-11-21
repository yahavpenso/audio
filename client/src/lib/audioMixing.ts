import { AudioTrack } from "@shared/schema";

/**
 * Mix multiple audio tracks with volume and pan controls
 */
export async function mixAudioTracks(
  audioContext: OfflineAudioContext | AudioContext,
  tracks: Array<{
    buffer: AudioBuffer;
    volume: number; // 0-100
    pan: number; // -100 to 100
    isMuted: boolean;
    isSolo: boolean;
  }>
): Promise<AudioBuffer> {
  if (tracks.length === 0) {
    return audioContext.createBuffer(2, audioContext.sampleRate, audioContext.sampleRate);
  }

  // Check if any track is solo
  const hasSolo = tracks.some((t) => t.isSolo);
  const maxDuration = Math.max(...tracks.map((t) => t.buffer.duration));
  const sampleRate = tracks[0].buffer.sampleRate;
  const offlineContext = new OfflineAudioContext(
    2,
    Math.ceil(maxDuration * sampleRate),
    sampleRate
  );

  // Mix all tracks
  for (const track of tracks) {
    // Skip muted or non-solo tracks
    if (track.isMuted || (hasSolo && !track.isSolo)) continue;

    const source = offlineContext.createBufferSource();
    source.buffer = track.buffer;

    // Create gain node for volume
    const volumeGain = offlineContext.createGain();
    volumeGain.gain.value = track.volume / 100;

    // Create panner for stereo balance
    const panner = offlineContext.createStereoPanner();
    panner.pan.value = track.pan / 100; // Normalize -100 to 100 range

    source.connect(volumeGain);
    volumeGain.connect(panner);
    panner.connect(offlineContext.destination);

    source.start(0);
  }

  return await offlineContext.startRendering();
}

/**
 * Decode audio data (Base64) back to AudioBuffer
 */
export async function decodeAudioTrack(
  audioContext: AudioContext,
  base64Data: string
): Promise<AudioBuffer> {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return await audioContext.decodeAudioData(bytes.buffer);
  } catch (error) {
    console.error("Failed to decode audio track:", error);
    throw error;
  }
}

/**
 * Encode AudioBuffer to Base64 for storage
 */
export async function encodeAudioBuffer(buffer: AudioBuffer): Promise<string> {
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start(0);

  const renderedBuffer = await offlineContext.startRendering();

  // Create WAV blob from buffer
  const wavBlob = createWavBlob(renderedBuffer);

  // Convert blob to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(wavBlob);
  });
}

/**
 * Create WAV blob from AudioBuffer
 */
function createWavBlob(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = audioBuffer.length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Audio data
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
