import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mic, MicOff, Radio, Video, VideoOff, X } from "lucide-react";
import { createSessionRecord, saveSessionRecord } from "../../utils/sessionStore";
import { audioPlayer } from "../../utils/audioPlayer";

const ThreeCounselScene = lazy(() => import("../../components/ThreeCounselScene"));

interface Stage {
  id: number;
  label: string;
  isMainStage: boolean;
  description: string;
}

type ChatMessage = { role: string; text: string };

type DemoTurn = {
  user: string;
  assistant: string;
  emotion: string;
  animation: "idle" | "greeting" | "vSignCute" | "bangEmphasis" | "spinShowoff" | "modelConfident" | "squatTired" | "standMotion";
  stage: {
    content: string;
    summary: string;
  };
};
type HangulSyllable = {
  initial: number;
  medial: number;
  final: number;
};

const STAGES: Stage[] = [
  { id: 1, label: "상황 이해", isMainStage: true, description: "현재 상황과 배경에 대해 자세히 이야기해 주세요." },
  { id: 2, label: "감정 파악", isMainStage: false, description: "어떤 감정을 느끼고 있는지 알려주세요." },
  { id: 3, label: "원인 분석", isMainStage: false, description: "이런 상황이 생긴 원인을 생각해 봅시다." },
  { id: 4, label: "핵심 문제", isMainStage: true, description: "가장 중요한 문제가 무엇인지 파악해 봅시다." },
  { id: 5, label: "과거 경험", isMainStage: false, description: "비슷한 상황을 경험한 적이 있나요?" },
  { id: 6, label: "자원 탐색", isMainStage: false, description: "당신의 강점과 자원을 찾아봅시다." },
  { id: 7, label: "해결방안 모색", isMainStage: true, description: "해결할 수 있는 방법들을 함께 생각해 봅시다." },
  { id: 8, label: "행동 계획", isMainStage: false, description: "구체적인 행동 계획을 세워봅시다." },
  { id: 9, label: "실행 준비", isMainStage: false, description: "실제로 실행하기 위한 준비를 합시다." },
  { id: 10, label: "마무리 및 정리", isMainStage: true, description: "상담을 정리하고 추후 계획을 세워봅시다." },
];

const DEMO_TURNS: DemoTurn[] = [
  {
    user: "최근 업무 마감이 겹쳐서 계속 긴장돼요.",
    assistant: "압박이 겹치는 지점을 먼저 나눠서 보면, 지금 당장 조정할 수 있는 부분이 보일 거예요.",
    emotion: "anxious",
    animation: "bangEmphasis",
    stage: {
      content: "업무 압박",
      summary: "현재 부담이 커진 상황을 정리함",
    },
  },
  {
    user: "밤에 생각이 많아져서 잠이 잘 안 와요.",
    assistant: "수면 전 루틴을 짧고 반복 가능하게 만들면, 몸이 쉬는 신호를 더 잘 받아들일 수 있어요.",
    emotion: "sad",
    animation: "squatTired",
    stage: {
      content: "수면 문제",
      summary: "걱정이 잠을 방해하는 패턴을 확인함",
    },
  },
  {
    user: "이 상황을 정리해서 실행할 수 있는 계획이 필요해요.",
    assistant: "좋아요. 오늘은 아주 작은 행동 한 가지를 먼저 정하고, 그다음 단계로 이어가 보죠.",
    emotion: "calm",
    animation: "modelConfident",
    stage: {
      content: "행동 계획",
      summary: "실행 가능한 한 가지 계획을 구체화함",
    },
  },
];

const MODEL_OPTIONS = [
  { label: "0613cococo1", value: "/0613cococo1.vrm" },
  { label: "0613inuinu1", value: "/0613inuinu1.vrm" },
  { label: "maromage_01", value: "/maromage_01.vrm" },
  { label: "avatar", value: "/avatar.vrm" },
  { label: "tomcat", value: "/tomcat.vrm" },
] as const;

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

function getDecodeAudioContext() {
  if (decodeAudioContext) return decodeAudioContext;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  decodeAudioContext = new AudioContextCtor();
  return decodeAudioContext;
}

function audioBufferToMono(buffer: AudioBuffer): Float32Array {
  const first = buffer.getChannelData(0);
  if (buffer.numberOfChannels === 1) {
    return new Float32Array(first);
  }

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

function createFallbackPulse(initialIndex: number): Float32Array {
  const durationSec = 0.04;
  const length = Math.max(1, Math.floor(durationSec * OUTPUT_SAMPLE_RATE));
  const output = new Float32Array(length);
  const frequency = 400 + initialIndex * 12;

  for (let i = 0; i < length; i += 1) {
    const t = i / OUTPUT_SAMPLE_RATE;
    const envelope = Math.min(1, i / (OUTPUT_SAMPLE_RATE * 0.003)) * Math.max(0, (length - i) / (OUTPUT_SAMPLE_RATE * 0.02));
    output[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.15;
  }

  return output;
}

async function synthesizeAnimalCrossingStyleVoice(text: string): Promise<Float32Array> {
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

function encodeWavMono(samples: Float32Array, sampleRate: number): ArrayBuffer {
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

function decomposeHangul(char: string): HangulSyllable | null {
  if (!char) return null;
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_LAST) return null;

  const syllableIndex = code - HANGUL_BASE;
  const initial = Math.floor(syllableIndex / (MEDIAL_COUNT * FINAL_COUNT));
  const medial = Math.floor((syllableIndex % (MEDIAL_COUNT * FINAL_COUNT)) / FINAL_COUNT);
  const final = syllableIndex % FINAL_COUNT;

  return { initial, medial, final };
}

export default function CounselTestPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("neutral");
  const [currentAnimation, setCurrentAnimation] = useState<"standMotion" | "idle" | "greeting" | "vSignCute" | "bangEmphasis" | "spinShowoff" | "modelConfident" | "squatTired">("standMotion");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      role: "system",
      text: "더미 상담 모드입니다. 서버 없이 화면과 모델만 확인할 수 있습니다.",
    },
  ]);
  const [currentStage, setCurrentStage] = useState(1);
  const [stageHistory, setStageHistory] = useState<{ stage: number; content: string; summary: string }[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [shouldMountThreeScene, setShouldMountThreeScene] = useState(false);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>(MODEL_OPTIONS[0].value);
  const [modelPosition, setModelPosition] = useState<[number, number, number]>([0, -0.4, 0]);
  const [testSpeakText, setTestSpeakText] = useState("");
  const [isTestSpeaking, setIsTestSpeaking] = useState(false);
  const [showTestComponents, setShowTestComponents] = useState(true);
  const [dialogueText, setDialogueText] = useState("");
  const [isDialogueTyping, setIsDialogueTyping] = useState(false);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const demoTimerRef = useRef<number | null>(null);
  const demoTurnIndexRef = useRef(0);

  useEffect(() => {
    const timerId = window.setTimeout(() => setShouldMountThreeScene(true), 120);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      } catch {
        setIsCamOn(false);
        setIsMicOn(false);
      }
    };

    getMedia();

    return () => {
      clearDemoTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const clearDemoTimer = useCallback(() => {
    if (demoTimerRef.current) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }, []);

  const stopDemoTurn = useCallback(() => {
    clearDemoTimer();
    setLoading(false);
    setIsListening(false);
  }, [clearDemoTimer]);

  const updateModelPosition = (axisIndex: 0 | 1 | 2, value: number) => {
    setModelPosition((prev) => {
      const next: [number, number, number] = [...prev] as [number, number, number];
      next[axisIndex] = value;
      return next;
    });
  };

  const startDemoTurn = useCallback(() => {
    if (!isMicOn || loading || isListening) return;

    const turn = DEMO_TURNS[demoTurnIndexRef.current % DEMO_TURNS.length];
    demoTurnIndexRef.current += 1;

    setIsListening(true);
    setLoading(true);
    setCurrentAnimation("standMotion");
    setEmotion("neutral");
    setChatLog((prev) => [...prev, { role: "user", text: turn.user }]);

    clearDemoTimer();
    demoTimerRef.current = window.setTimeout(() => {
      setChatLog((prev) => [...prev, { role: "assistant", text: turn.assistant }]);
      setStageHistory((prev) => [...prev, { stage: currentStage, content: turn.stage.content, summary: turn.stage.summary }]);
      setCurrentStage((prev) => Math.min(STAGES.length, prev + 1));
      setCurrentAnimation("standMotion");
      setEmotion(turn.emotion);
      stopDemoTurn();
    }, 1200);
  }, [clearDemoTimer, currentStage, isListening, isMicOn, loading, stopDemoTurn]);

  const handleTestSpeak = useCallback(async () => {
    const text = testSpeakText.trim();
    if (!text || isTestSpeaking) return;

    setIsTestSpeaking(true);
    setCurrentAnimation("standMotion");
    setEmotion("happy");
    setChatLog((prev) => [...prev, { role: "assistant", text }]);

    try {
      await audioPlayer.resumeContext();
      const samples = await synthesizeAnimalCrossingStyleVoice(text);
      const wavBuffer = encodeWavMono(samples, OUTPUT_SAMPLE_RATE);

      await audioPlayer.play(wavBuffer, () => {
        setIsTestSpeaking(false);
        setCurrentAnimation("standMotion");
        setEmotion("neutral");
      });

      setTestSpeakText("");
    } catch {
      setIsTestSpeaking(false);
      setCurrentAnimation("standMotion");
      setEmotion("neutral");
    }
  }, [isTestSpeaking, testSpeakText]);

  const toggleMic = () => {
    if (streamRef.current) {
      const nextMicState = !isMicOn;
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextMicState;
      });
      setIsMicOn(nextMicState);

      if (!nextMicState && isListening) {
        stopDemoTurn();
      }
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      const nextCamState = !isCamOn;
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextCamState;
      });
      setIsCamOn(nextCamState);
    }
  };

  const cleanupBeforeExit = () => {
    setShowExitModal(false);
    stopDemoTurn();
    clearDemoTimer();
    audioPlayer.stop();
    setIsTestSpeaking(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleExitTo = (path: "/" | "/analysis") => {
    cleanupBeforeExit();

    if (path === "/analysis") {
      const sessionRecord = createSessionRecord({
        chatLog,
        stageHistory,
        currentStage,
      });
      saveSessionRecord(sessionRecord);
      navigate(`/analysis/session/${sessionRecord.sessionId}`);
      return;
    }

    navigate(path);
  };

  const currentStageInfo = STAGES[currentStage - 1];
  const voiceStatusLabel = isTestSpeaking
    ? "테스트 발화 재생 중"
    : isListening
      ? "더미 음성 입력 중"
      : loading
        ? "응답을 준비하는 중"
        : isMicOn
          ? "마이크 준비됨"
          : "마이크가 꺼져 있음";
  const dialogueSource = [...chatLog].reverse().find((message) => message.role !== "system") ?? chatLog[0];
  const dialogueSpeaker = dialogueSource?.role === "assistant" ? "0613inuinu1" : dialogueSource?.role === "user" ? "나" : "상담";

  useEffect(() => {
    const nextText = dialogueSource?.text ?? "";
    setDialogueText("");

    if (!nextText) {
      setIsDialogueTyping(false);
      return;
    }

    let index = 0;
    setIsDialogueTyping(true);
    const timerId = window.setInterval(() => {
      index += 1;
      setDialogueText(nextText.slice(0, index));
      if (index >= nextText.length) {
        window.clearInterval(timerId);
        setIsDialogueTyping(false);
      }
    }, 28);

    return () => window.clearInterval(timerId);
  }, [dialogueSource?.text]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900 font-sans">
      {showExitModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">상담을 종료할까요?</h2>
            <p className="mt-2 text-sm text-slate-600">종료 후 이동할 페이지를 선택해주세요.</p>
            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                onClick={() => handleExitTo("/")}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                메인으로 이동
              </button>
              <button
                onClick={() => handleExitTo("/analysis")}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                기록으로 이동
              </button>
            </div>
            <button
              onClick={() => setShowExitModal(false)}
              className="mt-4 w-full rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-dark"
            >
              계속 상담하기
            </button>
          </div>
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        style={{ width: "min(86vw, 1500px)", height: "min(94vh, calc(86vw * 0.66))" }}
      >
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green shadow" />
            <h1 className="text-sm font-semibold tracking-[0.06em] text-slate-900">ATTUNE COUNSEL STUDIO</h1>
          </div>
          <button
            onClick={() => setShowExitModal(true)}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="상담 닫기"
          >
            <X size={16} />
          </button>
        </header>

        <div className="relative flex h-[calc(100%-56px)] flex-col">
          <div className="relative flex-1 overflow-hidden bg-slate-50">
            <div className="absolute inset-0">
              <img
                src="/assets/image/backgoundimage.png"
                alt="상담 배경"
                className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-center blur-[1.6px] saturate-[0.6] brightness-[1.05]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(240,240,240,0.35)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_62%,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.1)_26%,rgba(200,200,200,0.15)_86%)]" />
              {shouldMountThreeScene ? (
                <Suspense fallback={<div className="h-full w-full bg-slate-100" />}>
                  <ThreeCounselScene
                    emotion={emotion}
                    currentAnimation={currentAnimation}
                    avatarUrl={selectedModelUrl}
                    avatarPosition={modelPosition}
                  />
                </Suspense>
              ) : (
                <div className="h-full w-full bg-slate-100" />
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/55 to-transparent" />

            <div className="absolute left-6 top-6 z-20 w-[360px] rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md backdrop-blur-sm">
              <p className="text-[11px] font-semibold tracking-[0.06em] text-slate-500">CURRENT STAGE</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{currentStageInfo?.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{currentStageInfo?.description}</p>
              {showTestComponents && (
                <>
                  <label className="mt-3 block text-[11px] font-semibold tracking-[0.06em] text-slate-500">
                    MODEL
                    <select
                      value={selectedModelUrl}
                      onChange={(e) => setSelectedModelUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                    >
                      {MODEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-slate-500">표정</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(
                        [
                          { key: "happy", label: "😊" },
                          { key: "angry", label: "😠" },
                          { key: "sad", label: "😢" },
                          { key: "calm", label: "😌" },
                        ] as const
                      ).map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setEmotion(preset.key)}
                          className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                            emotion === preset.key
                              ? "border border-brand-green/40 bg-slate-50 text-slate-900"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-brand-green/40 hover:bg-slate-50"
                          }`}
                          title={`감정: ${preset.key}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {([
                      { label: "X", index: 0 as const },
                      { label: "Y", index: 1 as const },
                      { label: "Z", index: 2 as const },
                    ]).map((axis) => (
                      <label key={axis.label} className="block text-[10px] font-medium text-slate-500">
                        <div className="mb-1 flex items-center justify-between">
                          <span>{axis.label}</span>
                          <span>{modelPosition[axis.index].toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={-2}
                          max={2}
                          step={0.01}
                          value={modelPosition[axis.index]}
                          onChange={(e) => updateModelPosition(axis.index, Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer accent-brand-green"
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 z-30 w-[min(720px,calc(100%-2rem))] -translate-x-1/2">
              <div className="relative mx-auto w-full max-w-[720px]">
                <div className="mb-[-12px] ml-8 inline-flex rounded-full border-4 border-brand-green bg-brand-green px-4 py-1 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(30,215,96,0.2)]">
                  {dialogueSpeaker}
                </div>
                <div className="relative rounded-[36px] border-[5px] border-brand-green bg-[rgba(255,255,255,0.98)] px-6 py-5 shadow-[0_12px_0_rgba(30,215,96,0.1),0_24px_50px_rgba(0,0,0,0.1)] backdrop-blur-md">
                  <p className="min-h-[4.2rem] text-[1.08rem] leading-[1.75] text-slate-900 [text-shadow:0_1px_0_rgba(255,255,255,0.8)] sm:text-[1.2rem]">
                    {dialogueText}
                    {isDialogueTyping && <span className="ml-1 inline-block animate-pulse align-middle text-slate-400">|</span>}
                  </p>
                  <div className="absolute bottom-4 right-6 text-brand-green">
                    <span className="inline-block animate-bounce text-lg leading-none">▼</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-20 h-40 w-28 overflow-hidden rounded-xl border border-brand-green bg-white shadow-[0_14px_28px_rgba(30,215,96,0.15)]">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${!isCamOn ? "hidden" : ""}`}
              />
              {!isCamOn && (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-xs text-slate-500">
                  <VideoOff size={20} className="mb-2" />
                  <span>캠메라 OFF</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded bg-slate-400/50 px-2 py-0.5 text-[9px] font-semibold text-white">나</div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 pt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-gradient-to-r from-brand-green via-brand-green-dark to-brand-green transition-all duration-300"
                style={{ width: `${(currentStage / STAGES.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
                <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Device</span>
                <div className="h-5 w-px bg-slate-200" />
                <button
                  onClick={toggleMic}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                    isMicOn
                      ? "border-brand-green bg-white text-slate-900 shadow-sm"
                      : "border-slate-200 bg-slate-100 text-slate-500 hover:border-brand-green/40 hover:bg-white"
                  }`}
                  title={isMicOn ? "마이크 끄기" : "마이크 켜기"}
                >
                  {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                  <span>마이크</span>
                </button>

                <button
                  onClick={toggleCam}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                    isCamOn
                      ? "border-brand-green bg-white text-slate-900 shadow-sm"
                      : "border-slate-200 bg-slate-100 text-slate-500 hover:border-brand-green/40 hover:bg-white"
                  }`}
                  title={isCamOn ? "카메라 끄기" : "카메라 켜기"}
                >
                  {isCamOn ? <Video size={14} /> : <VideoOff size={14} />}
                  <span>카메라</span>
                </button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={startDemoTurn}
                  disabled={!isMicOn || loading}
                  className={`inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all shadow-sm ${
                    isListening
                      ? "border-brand-green bg-brand-green text-white shadow-[0_10px_24px_rgba(30,215,96,0.3)] ring-1 ring-brand-green"
                      : "border-brand-green bg-brand-green text-white hover:border-brand-green hover:bg-brand-green-dark"
                  } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none`}
                  title="더미 상담 시작"
                >
                  <Radio size={15} />
                  {isListening ? "듣는 중" : "음성 입력"}
                </button>
                <p className="text-[10px] font-medium tracking-wide text-slate-500">{voiceStatusLabel}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowTestComponents((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm transition hover:border-brand-green/40 hover:bg-white hover:text-slate-900"
                title={showTestComponents ? "테스트 컴포넌트 숨기기" : "테스트 컴포넌트 보이기"}
              >
                {showTestComponents ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showTestComponents ? "테스트 컴포넌트 끄기" : "테스트 컴포넌트 보기"}</span>
              </button>
            </div>

            {showTestComponents && (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={testSpeakText}
                    onChange={(e) => setTestSpeakText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleTestSpeak();
                      }
                    }}
                    placeholder="테스트 발화 텍스트를 입력하세요"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-200 placeholder:text-slate-400 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleTestSpeak();
                    }}
                    disabled={!testSpeakText.trim() || isTestSpeaking}
                    className="shrink-0 rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    발화
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  초성 샘플 파일 경로: public/assets/tts/initials/*.wav
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}