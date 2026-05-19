const OUTPUT_SAMPLE_RATE = 16000;
const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const MEDIAL_COUNT = 21;
const FINAL_COUNT = 28;

const CHOSEONG_SAMPLE_BASE_PATH = "/assets/tts/initials";

const CHOSEONG_SAMPLE_FILES = [
  { symbol: "ㄱ", file: "giyeok.wav" },
  { symbol: "ㄲ", file: "ssang_giyeok.wav" },
  { symbol: "ㄴ", file: "nieun.wav" },
  { symbol: "ㄷ", file: "digeut.wav" },
  { symbol: "ㄸ", file: "ssang_digeut.wav" },
  { symbol: "ㄹ", file: "rieul.wav" },
  { symbol: "ㅁ", file: "mieum.wav" },
  { symbol: "ㅂ", file: "bieup.wav" },
  { symbol: "ㅃ", file: "ssang_bieup.wav" },
  { symbol: "ㅅ", file: "siot.wav" },
  { symbol: "ㅆ", file: "ssang_siot.wav" },
  { symbol: "ㅇ", file: "ieung.wav" },
  { symbol: "ㅈ", file: "jieut.wav" },
  { symbol: "ㅉ", file: "ssang_jieut.wav" },
  { symbol: "ㅊ", file: "chieut.wav" },
  { symbol: "ㅋ", file: "kieuk.wav" },
  { symbol: "ㅌ", file: "tieut.wav" },
  { symbol: "ㅍ", file: "pieup.wav" },
  { symbol: "ㅎ", file: "hieut.wav" },
] as const;

let decodeAudioContext: AudioContext | null = null;
const choseongSampleCache = new Map<string, Float32Array>();

function getDecodeAudioContext(): AudioContext {
  if (decodeAudioContext) return decodeAudioContext;
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  decodeAudioContext = new AudioContextCtor();
  return decodeAudioContext;
}

function audioBufferToMono(buffer: AudioBuffer): Float32Array {
  const first = buffer.getChannelData(0);
  if (buffer.numberOfChannels === 1) return new Float32Array(first);

  const second = buffer.getChannelData(1);
  const mixed = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i += 1) {
    mixed[i] = (first[i] + second[i]) * 0.5;
  }
  return mixed;
}

function resampleLinear(input: Float32Array, sourceRate: number, targetRate: number): Float32Array {
  if (!input.length || sourceRate === targetRate) return new Float32Array(input);

  const ratio = targetRate / sourceRate;
  const outputLength = Math.max(1, Math.floor(input.length * ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const sourcePos = i / ratio;
    const left = Math.floor(sourcePos);
    const right = Math.min(input.length - 1, left + 1);
    const frac = sourcePos - left;
    output[i] = input[left] * (1 - frac) + input[right] * frac;
  }

  return output;
}

function applyPitchShiftByPlaybackRate(input: Float32Array, pitchRate: number): Float32Array {
  if (!input.length) return new Float32Array(0);

  const outputLength = Math.max(1, Math.floor(input.length / pitchRate));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const sourcePos = i * pitchRate;
    const left = Math.floor(sourcePos);
    const right = Math.min(input.length - 1, left + 1);
    const frac = sourcePos - left;
    output[i] = input[left] * (1 - frac) + input[right] * frac;
  }

  const fadeInLength = Math.max(1, Math.floor(output.length * 0.08));
  const fadeOutStart = Math.max(0, output.length - Math.floor(output.length * 0.12));

  for (let i = 0; i < output.length; i += 1) {
    if (i < fadeInLength) {
      output[i] *= i / fadeInLength;
      continue;
    }
    if (i >= fadeOutStart) {
      const remain = output.length - i;
      const fadeOutLength = output.length - fadeOutStart;
      output[i] *= remain / Math.max(1, fadeOutLength);
    }
  }

  return output;
}

function decomposeHangul(char: string): { initial: number; medial: number; final: number } | null {
  if (!char) return null;
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_LAST) return null;

  const syllableIndex = code - HANGUL_BASE;
  const initial = Math.floor(syllableIndex / (MEDIAL_COUNT * FINAL_COUNT));
  const medial = Math.floor((syllableIndex % (MEDIAL_COUNT * FINAL_COUNT)) / FINAL_COUNT);
  const final = syllableIndex % FINAL_COUNT;

  return { initial, medial, final };
}

function createFallbackPulse(initialIndex: number): Float32Array {
  const durationSec = 0.04;
  const length = Math.max(1, Math.floor(durationSec * OUTPUT_SAMPLE_RATE));
  const output = new Float32Array(length);
  const frequency = 400 + initialIndex * 12;

  for (let i = 0; i < length; i += 1) {
    const t = i / OUTPUT_SAMPLE_RATE;
    const envelope =
      Math.min(1, i / (OUTPUT_SAMPLE_RATE * 0.003)) *
      Math.max(0, (length - i) / (OUTPUT_SAMPLE_RATE * 0.02));
    output[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.15;
  }

  return output;
}

async function loadChoseongSampleByIndex(initialIndex: number): Promise<Float32Array> {
  const sampleMeta = CHOSEONG_SAMPLE_FILES[initialIndex];
  if (!sampleMeta) return new Float32Array(0);

  if (choseongSampleCache.has(sampleMeta.symbol)) {
    return choseongSampleCache.get(sampleMeta.symbol) ?? new Float32Array(0);
  }

  const sampleUrl = `${CHOSEONG_SAMPLE_BASE_PATH}/${sampleMeta.file}`;
  const response = await fetch(sampleUrl);
  if (!response.ok) {
    throw new Error(`초성 샘플 로드 실패: ${sampleMeta.symbol} (${sampleUrl})`);
  }

  const fileBytes = await response.arrayBuffer();
  const decoded = await getDecodeAudioContext().decodeAudioData(fileBytes.slice(0));
  const mono = audioBufferToMono(decoded);
  const normalized = resampleLinear(mono, decoded.sampleRate, OUTPUT_SAMPLE_RATE);
  choseongSampleCache.set(sampleMeta.symbol, normalized);
  return normalized;
}

export async function synthesizeAcVoice(text: string): Promise<Float32Array> {
  const trimmed = text.trim();
  if (!trimmed) return new Float32Array(0);

  const output: number[] = [];
  const pushSilence = (durationSec: number) => {
    const sampleCount = Math.max(1, Math.floor(durationSec * OUTPUT_SAMPLE_RATE));
    for (let i = 0; i < sampleCount; i += 1) output.push(0);
  };

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];

    if (/\s/.test(char)) {
      pushSilence(0.03);
      continue;
    }

    if (/[.,!?~]/.test(char)) {
      pushSilence(0.1);
      continue;
    }

    if (/[,;:]/.test(char)) {
      pushSilence(0.06);
      continue;
    }

    const syllable = decomposeHangul(char);
    if (!syllable) {
      pushSilence(0.015);
      continue;
    }

    let rawSample: Float32Array;
    try {
      rawSample = await loadChoseongSampleByIndex(syllable.initial);
    } catch {
      rawSample = createFallbackPulse(syllable.initial);
    }

    const randomPitchRate = 1.1 + Math.random() * 0.28;
    const pitched = applyPitchShiftByPlaybackRate(rawSample, randomPitchRate);
    const randomGain = 0.78 + Math.random() * 0.3;

    for (let i = 0; i < pitched.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, pitched[i] * randomGain));
      output.push(sample);
    }

    pushSilence(0.008 + Math.random() * 0.014);
  }

  return Float32Array.from(output);
}

export function encodeAcVoiceWav(samples: Float32Array): ArrayBuffer {
  const sampleRate = OUTPUT_SAMPLE_RATE;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return buffer;
}
