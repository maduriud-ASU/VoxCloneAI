/**
 * Audio helper utilities for VoxClone Studio
 */
import { Mp3Encoder } from '@breezystack/lamejs';

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function downloadAudio(audioUrl: string, filename = 'voxclone-speech.wav') {
  const a = document.createElement('a');
  a.href = audioUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Converts any audio URL (WAV, blob, etc.) to an MP3 Blob using LAME MP3 Encoder.
 */
export async function convertAudioToMp3Blob(audioUrl: string, kbps = 128): Promise<Blob> {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const mp3Encoder = new Mp3Encoder(channels, sampleRate, kbps);

  const mp3DataParts: Uint8Array[] = [];
  const sampleBlockSize = 1152;

  if (channels === 1) {
    const channel0 = audioBuffer.getChannelData(0);
    // Convert float32 to int16
    const int16Samples = new Int16Array(channel0.length);
    for (let i = 0; i < channel0.length; i++) {
      const s = Math.max(-1, Math.min(1, channel0[i]));
      int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
      const chunk = int16Samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3Encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3DataParts.push(new Uint8Array(mp3buf));
      }
    }
  } else {
    const channel0 = audioBuffer.getChannelData(0);
    const channel1 = audioBuffer.getChannelData(1);
    const leftInt16 = new Int16Array(channel0.length);
    const rightInt16 = new Int16Array(channel1.length);

    for (let i = 0; i < channel0.length; i++) {
      const s0 = Math.max(-1, Math.min(1, channel0[i]));
      leftInt16[i] = s0 < 0 ? s0 * 0x8000 : s0 * 0x7fff;
      const s1 = Math.max(-1, Math.min(1, channel1[i]));
      rightInt16[i] = s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff;
    }

    for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
      const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3DataParts.push(new Uint8Array(mp3buf));
      }
    }
  }

  const endBuf = mp3Encoder.flush();
  if (endBuf.length > 0) {
    mp3DataParts.push(new Uint8Array(endBuf));
  }

  await audioCtx.close();
  return new Blob(mp3DataParts as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Downloads audio file specifically in either WAV or MP3 format with user feedback
 */
export async function downloadFormattedAudio(
  audioUrl: string,
  baseFilename: string,
  format: 'wav' | 'mp3'
): Promise<void> {
  const safeBase = baseFilename.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'wav') {
    // If the input is already a WAV data URL or blob, download directly
    if (audioUrl.startsWith('data:audio/wav') || audioUrl.endsWith('.wav')) {
      downloadAudio(audioUrl, `${safeBase}.wav`);
      return;
    }
    // Otherwise fetch and convert to WAV blob
    const res = await fetch(audioUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    downloadAudio(url, `${safeBase}.wav`);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  // MP3 conversion
  const mp3Blob = await convertAudioToMp3Blob(audioUrl);
  const mp3Url = URL.createObjectURL(mp3Blob);
  downloadAudio(mp3Url, `${safeBase}.mp3`);
  setTimeout(() => URL.revokeObjectURL(mp3Url), 10000);
}

// Generate a synthetic test audio WAV file using Web Audio API buffer (useful for sample previews)
export async function createSyntheticSampleAudio(type: 'warm' | 'deep' | 'bright'): Promise<string> {
  const sampleRate = 24000;
  const duration = 2.5; // seconds
  const totalSamples = sampleRate * duration;
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtxClass({ sampleRate });
  const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  const baseFreq = type === 'deep' ? 120 : type === 'bright' ? 240 : 170;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Harmonic envelope with speech-like modulation
    const speechEnvelope = Math.sin(Math.PI * (t / duration)) * (0.8 + 0.2 * Math.sin(6 * Math.PI * t));
    const tone =
      Math.sin(2 * Math.PI * baseFreq * t) * 0.5 +
      Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.125 +
      (Math.random() - 0.5) * 0.03; // breath noise

    channelData[i] = tone * speechEnvelope * 0.7;
  }

  const wavBlob = audioBufferToWavBlob(buffer);
  await audioCtx.close();
  return URL.createObjectURL(wavBlob);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  out.setUint32(0, 0x46464952, true); // "RIFF"
  out.setUint32(4, length - 8, true);
  out.setUint32(8, 0x45564157, true); // "WAVE"
  out.setUint32(12, 0x20746d66, true); // "fmt "
  out.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  out.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  out.setUint16(22, numOfChan, true);
  out.setUint32(24, sampleRate, true);
  out.setUint32(28, sampleRate * 2 * numOfChan, true); // ByteRate
  out.setUint16(32, numOfChan * 2, true); // BlockAlign
  out.setUint16(34, 16, true); // BitsPerSample
  out.setUint32(36, 0x61746164, true); // "data"
  out.setUint32(40, length - 44, true);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  pos = 44;
  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
