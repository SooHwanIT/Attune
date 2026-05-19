import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { audioPlayer } from "../../utils/audioPlayer";
import { synthesizeAcVoice, encodeAcVoiceWav } from "../../utils/acVoice";
import { createSessionRecord, saveSessionRecord } from "../../utils/sessionStore";
import { clearActiveCounselSocket, getActiveCounselSocket } from "../../utils/wsSession";
import { getCurrentUser } from "../../utils/auth";
import { ChevronRight, CornerDownLeft, MessageSquare, Mic, MicOff, Radio, Video, VideoOff, X } from "lucide-react";

const ThreeCounselScene = lazy(() => import("../../components/ThreeCounselScene"));
const TEST_LOG_PREFIX = "[CounselTest]";
const MEDIA_SEND_INTERVAL_MS = 2000;
const PROCESSING_TIMEOUT_MS = 20000;
const MAX_BINARY_PACKET_BYTES = 950_000;
const VIDEO_FRAME_MAX_WIDTH = 640;
const VIDEO_FRAME_MAX_HEIGHT = 360;
const INPUT_AUDIO_GAIN = 2.6;
const COUNSEL_AVATAR_URL = "/tomcat.vrm";
const COUNSEL_AVATAR_POSITION: [number, number, number] = [0, -0.45, 0.75];

function splitTextIntoSegments(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= 75) return [trimmed];
  // Split after . ? ! followed by whitespace, keeping punctuation with its sentence
  const parts = trimmed.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [trimmed];
}

interface Stage {
  id: number;
  label: string;
  isMainStage: boolean;
  description: string;
}

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

const LOADING_TIPS = [
  "이전 대화 내용을 분석해 맞춤형 상담을 준비하고 있어요.",
  "5단계 상담 과정을 통해 체계적으로 문제를 탐색해 나갈 거예요.",
  "편안한 자세로 앉아 깊게 숨을 한번 들이쉬어 보세요.",
  "오늘 나누고 싶은 이야기를 자유롭게 말씀해 주셔도 좋아요.",
  "자신의 감정을 솔직하게 표현할수록 더 도움이 될 수 있어요.",
  "상담 중 언제든지 원하실 때 이야기를 멈출 수 있어요.",
];

type ChatMessage = { role: string; text: string };

type StepStatus = {
  step: number;
  title?: string;
  goal?: string;
  currentQuestion?: string;
  questionIndex?: number;
  totalQuestions?: number;
  totalSteps?: number;
  complete?: boolean;
};

type CounselSocketPayload = {
  status?: string;
  message?: string;
  text?: string;
  transition?: string;
  step_status?: unknown;
};

type MediaSetupResult = {
  stream: MediaStream | null;
  hasAudioTrack: boolean;
  hasVideoTrack: boolean;
  warningMessage?: string;
};

async function requestMediaWithFallback(): Promise<MediaSetupResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      hasAudioTrack: false,
      hasVideoTrack: false,
      warningMessage: "현재 브라우저에서는 카메라/마이크 접근을 지원하지 않습니다.",
    };
  }

  const constraintCandidates: MediaStreamConstraints[] = [
    { video: true, audio: true },
    { video: true, audio: false },
    { video: false, audio: true },
  ];

  let lastError: unknown = null;
  for (const constraints of constraintCandidates) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const hasAudioTrack = stream.getAudioTracks().length > 0;
      const hasVideoTrack = stream.getVideoTracks().length > 0;
      return {
        stream,
        hasAudioTrack,
        hasVideoTrack,
        warningMessage:
          !hasAudioTrack || !hasVideoTrack
            ? "일부 장치만 사용할 수 있습니다. 가능한 장치로 상담을 계속 진행합니다."
            : undefined,
      };
    } catch (error) {
      lastError = error;
    }
  }

  const errorName = lastError instanceof DOMException ? lastError.name : "";
  return {
    stream: null,
    hasAudioTrack: false,
    hasVideoTrack: false,
    warningMessage:
      errorName === "NotAllowedError" || errorName === "SecurityError"
        ? "카메라/마이크 권한이 차단되었습니다. 브라우저 권한을 허용한 뒤 다시 시도해주세요."
        : "사용 가능한 카메라 또는 마이크를 찾지 못했습니다.",
  };
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

function toStepStatus(input: unknown): StepStatus | null {
  if (typeof input !== "object" || input === null) return null;

  const record = input as Record<string, unknown>;
  const step = readNumber(record, "step");
  if (!step) return null;

  return {
    step,
    title: readString(record, "title"),
    goal: readString(record, "goal"),
    currentQuestion: readString(record, "current_question"),
    questionIndex: readNumber(record, "question_idx"),
    totalQuestions: readNumber(record, "total_questions"),
    totalSteps: readNumber(record, "total_steps"),
    complete: readBoolean(record, "complete"),
  };
}

export default function CounselPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state as {
    sessionId?: string;
    wsClientId?: string;
    topic?: string;
    mood?: string;
    style?: "empathy" | "solution";
    content?: string;
  } | null;

  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("neutral");
  const [currentAnimation, setCurrentAnimation] = useState<
    "standMotion" | "idle" | "greeting" | "vSignCute" | "bangEmphasis" | "spinShowoff" | "modelConfident" | "squatTired"
  >("standMotion");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      role: "system",
      text: sessionData?.content ? `사용자의 고민: ${sessionData.content}` : "상담을 시작합니다.",
    },
  ]);
  const [stepStatus, setStepStatus] = useState<StepStatus | null>(null);
  const currentStage = stepStatus?.step ?? 1;
  const totalStages = stepStatus?.totalSteps ?? STAGES.length;
  const stageHistory: { stage: number; content: string; summary: string }[] = [];

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [shouldMountThreeScene, setShouldMountThreeScene] = useState(false);
  const [isWsReady, setIsWsReady] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [dialogueText, setDialogueText] = useState("");
  const [isDialogueTyping, setIsDialogueTyping] = useState(false);
  const [segmentState, setSegmentState] = useState<{ sourceText: string; index: number }>({ sourceText: "", index: 0 });
  const [isLogSidebarOpen, setIsLogSidebarOpen] = useState(false);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const counselSocketRef = useRef<WebSocket | null>(null);
  const setupSentRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSendIntervalRef = useRef<number | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const metricIntervalRef = useRef<number | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const lastAudioPreviewUrlRef = useRef<string | null>(null);
  const audioChunkCountRef = useRef(0);
  const videoFrameCountRef = useRef(0);
  const isListeningRef = useRef(false);
  const isMicOnRef = useRef(true);
  const endOfSpeechSentAtRef = useRef<number | null>(null);
  const hasSentEndOfSessionRef = useRef(false);
  const dialogueTimerStartRef = useRef<number | null>(null);
  const dialogueTimerIntervalRef = useRef<number | null>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  const logTest = useCallback((event: string, payload?: unknown) => {
    if (!import.meta.env.DEV) return;
    const time = new Date().toISOString();
    if (typeof payload === "undefined") {
      console.log(`${TEST_LOG_PREFIX} ${time} ${event}`);
      return;
    }
    console.log(`${TEST_LOG_PREFIX} ${time} ${event}`, payload);
  }, []);

  const getBytePreview = useCallback((buffer: ArrayBuffer, limit = 16) => {
    const bytes = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, limit)));
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(" ");
  }, []);

  const resetMetrics = useCallback(() => {
    audioChunkCountRef.current = 0;
    videoFrameCountRef.current = 0;
  }, []);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  const stopMetricTicker = useCallback(() => {
    if (metricIntervalRef.current) {
      window.clearInterval(metricIntervalRef.current);
      metricIntervalRef.current = null;
    }
  }, []);

  const stopProcessingTimeout = useCallback(() => {
    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, []);

  const startProcessingTimeout = useCallback(() => {
    stopProcessingTimeout();
    processingTimeoutRef.current = window.setTimeout(() => {
      logTest("소켓:처리중시간초과", {
        audioChunksPerSec: audioChunkCountRef.current,
        videoFramesPerSec: videoFrameCountRef.current,
      });
      setLoading(false);
      setChatLog((prev) => [
        ...prev,
        {
          role: "system",
          text: "응답 생성이 지연되고 있습니다. 잠시 후 다시 음성 입력을 시도해주세요.",
        },
      ]);
    }, PROCESSING_TIMEOUT_MS);
  }, [logTest, stopProcessingTimeout]);

  const startMetricTicker = useCallback(() => {
    stopMetricTicker();
    metricIntervalRef.current = window.setInterval(() => {
      logTest("스트림:1초전송현황", {
        audioChunksPerSec: audioChunkCountRef.current,
        videoFramesPerSec: videoFrameCountRef.current,
      });
      resetMetrics();
    }, 1000);
  }, [logTest, resetMetrics, stopMetricTicker]);

  useEffect(() => {
    const timerId = window.setTimeout(() => setShouldMountThreeScene(true), 120);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    const activeSession = getActiveCounselSocket();

    if (!activeSession || activeSession.socket.readyState !== WebSocket.OPEN) {
      window.alert("상담 서버 연결이 만료되었습니다. 다시 시도해주세요.");
      navigate("/counsel/prepare", { replace: true });
      return;
    }

    if (sessionData?.wsClientId && activeSession.clientId !== sessionData.wsClientId) {
      window.alert("상담 서버 세션이 일치하지 않습니다. 다시 시도해주세요.");
      clearActiveCounselSocket();
      navigate("/counsel/prepare", { replace: true });
      return;
    }

    counselSocketRef.current = activeSession.socket;
    const readyTimerId = window.setTimeout(() => setIsWsReady(true), 0);
    logTest("세션:연결완료", {
      clientId: activeSession.clientId,
      readyState: activeSession.socket.readyState,
    });

    return () => window.clearTimeout(readyTimerId);
  }, [navigate, sessionData?.wsClientId, logTest]);

  const sendJsonMessage = useCallback((payload: object) => {
    const socket = counselSocketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const messageType = payload && typeof payload === "object" && "type" in payload ? String((payload as { type?: unknown }).type) : "unknown";
    if (messageType !== "setup") {
      logTest("전송:JSON", payload);
    }
    socket.send(JSON.stringify(payload));
  }, [logTest]);

  const sendEndOfSession = useCallback(() => {
    if (hasSentEndOfSessionRef.current) return;
    hasSentEndOfSessionRef.current = true;

    if (counselSocketRef.current?.readyState === WebSocket.OPEN) {
      try {
        counselSocketRef.current.send(JSON.stringify({
          type: "control",
          data: "END_OF_SESSION",
          timestamp: Date.now() / 1000,
        }));
      } catch {
        // no-op
      }
    }
  }, []);

  const applyStepStatus = useCallback((payload: CounselSocketPayload) => {
    const nextStepStatus = toStepStatus(payload.step_status);
    if (nextStepStatus) {
      setStepStatus(nextStepStatus);
    }
  }, []);

  const downsampleTo16kHz = useCallback((input: Float32Array, sampleRate: number) => {
    if (sampleRate === 16000) return input;

    const ratio = sampleRate / 16000;
    const newLength = Math.max(1, Math.round(input.length / ratio));
    const output = new Float32Array(newLength);

    for (let i = 0; i < newLength; i += 1) {
      const sourceIndex = Math.min(input.length - 1, Math.round(i * ratio));
      output[i] = input[sourceIndex];
    }

    return output;
  }, []);

  const encodeWav16kMono = useCallback((samples: Float32Array) => {
    const sampleRate = 16000;
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
  }, []);

  const sendBinaryChunk = useCallback((typeHeader: number, payload: ArrayBuffer) => {
    const socket = counselSocketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const packet = new Uint8Array(1 + payload.byteLength);
    if (packet.byteLength > MAX_BINARY_PACKET_BYTES) {
      logTest("전송:바이너리크기초과", {
        typeHeader,
        packetBytes: packet.byteLength,
        maxBytes: MAX_BINARY_PACKET_BYTES,
      });
      return;
    }

    packet[0] = typeHeader;
    packet.set(new Uint8Array(payload), 1);
    logTest("전송:바이너리", {
      패킷종류: typeHeader === 0x01 ? "음성" : typeHeader === 0x02 ? "이미지" : `알 수 없음(${typeHeader})`,
      전체길이: packet.byteLength,
      헤더바이트: typeHeader,
      앞부분미리보기: getBytePreview(packet.buffer),
    });
    socket.send(packet.buffer);
  }, [getBytePreview, logTest]);

  const flushAudioQueue = useCallback(() => {
    if (!audioQueueRef.current.length) return;

    const totalLength = audioQueueRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;

    for (const chunk of audioQueueRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    audioQueueRef.current = [];

    const rawBytes = new Uint8Array(merged.byteLength);
    rawBytes.set(new Uint8Array(merged.buffer));
    sendBinaryChunk(0x01, rawBytes.buffer);
    audioChunkCountRef.current += 1;

    const wavBuffer = encodeWav16kMono(merged);
    const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });

    if (lastAudioPreviewUrlRef.current) {
      URL.revokeObjectURL(lastAudioPreviewUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(audioBlob);
    lastAudioPreviewUrlRef.current = previewUrl;

    (window as typeof window & { __counselLastAudioUrl?: string; __counselPlayLastAudio?: () => void }).__counselLastAudioUrl = previewUrl;
    (window as typeof window & { __counselLastAudioUrl?: string; __counselPlayLastAudio?: () => void }).__counselPlayLastAudio = () => {
      const player = new Audio(previewUrl);
      void player.play();
    };

    logTest("전송:음성재생URL", {
      url: previewUrl,
      durationSec: Number((merged.length / 16000).toFixed(2)),
      sampleCount: merged.length,
      playHint: "콘솔에서 __counselPlayLastAudio() 실행",
    });
  }, [encodeWav16kMono, logTest, sendBinaryChunk]);

  const sendVideoFrame = useCallback(async () => {
    if (!isCamOn || !userVideoRef.current || userVideoRef.current.readyState < 2) return;

    const video = userVideoRef.current;
    const canvas = videoCanvasRef.current ?? document.createElement("canvas");
    videoCanvasRef.current = canvas;
    const sourceWidth = video.videoWidth || 320;
    const sourceHeight = video.videoHeight || 240;
    const scale = Math.min(1, VIDEO_FRAME_MAX_WIDTH / sourceWidth, VIDEO_FRAME_MAX_HEIGHT / sourceHeight);
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.65);
    });

    if (!blob) return;
    const buffer = await blob.arrayBuffer();
    sendBinaryChunk(0x02, buffer);
    videoFrameCountRef.current += 1;
  }, [isCamOn, sendBinaryChunk]);

  const stopSpeechStream = useCallback((sendEndOfSpeech: boolean) => {
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (audioSendIntervalRef.current) {
      window.clearInterval(audioSendIntervalRef.current);
      audioSendIntervalRef.current = null;
    }
    flushAudioQueue();
    audioQueueRef.current = [];
    stopMetricTicker();
    stopProcessingTimeout();

    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current.onaudioprocess = null;
      audioProcessorRef.current = null;
    }

    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        // no-op
      });
      audioContextRef.current = null;
    }

    if (sendEndOfSpeech) {
      const sentAt = performance.now();
      endOfSpeechSentAtRef.current = sentAt;
      sendJsonMessage({
        type: "control",
        data: "END_OF_SPEECH",
        timestamp: Date.now() / 1000,
      });
      setLoading(true);
      startProcessingTimeout();
      logTest("audio:endOfSpeechSent", {
        sentAtMs: Number(sentAt.toFixed(2)),
      });
    }

    logTest("스트림:종료", {
      remainingAudioChunks: audioChunkCountRef.current,
      remainingVideoFrames: videoFrameCountRef.current,
    });
    resetMetrics();
    isListeningRef.current = false;
    setIsListening(false);
  }, [flushAudioQueue, logTest, resetMetrics, sendJsonMessage, startProcessingTimeout, stopMetricTicker, stopProcessingTimeout]);

  const startSpeechStream = useCallback(async () => {
    if (!streamRef.current || !counselSocketRef.current || counselSocketRef.current.readyState !== WebSocket.OPEN) {
      setChatLog((prev) => [...prev, { role: "system", text: "서버 연결 또는 마이크 장치가 준비되지 않았습니다." }]);
      return;
    }

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(streamRef.current);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      audioSourceRef.current = source;
      audioProcessorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!isListeningRef.current || !isMicOnRef.current) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleTo16kHz(inputData, audioContext.sampleRate);
        const boosted = new Float32Array(downsampled.length);
        for (let i = 0; i < downsampled.length; i += 1) {
          boosted[i] = Math.max(-1, Math.min(1, downsampled[i] * INPUT_AUDIO_GAIN));
        }
        audioQueueRef.current.push(boosted);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      audioSendIntervalRef.current = window.setInterval(() => {
        flushAudioQueue();
      }, MEDIA_SEND_INTERVAL_MS);

      if (isCamOn) {
        videoIntervalRef.current = window.setInterval(() => {
          sendVideoFrame().catch(() => {
            // no-op
          });
        }, MEDIA_SEND_INTERVAL_MS);
      }

      resetMetrics();
      startMetricTicker();
      isListeningRef.current = true;
      setIsListening(true);
      setLoading(false);
      logTest("스트림:시작", {
        sampleRate: audioContext.sampleRate,
        inputGain: INPUT_AUDIO_GAIN,
        audioIntervalMs: MEDIA_SEND_INTERVAL_MS,
        videoIntervalMs: isCamOn ? MEDIA_SEND_INTERVAL_MS : null,
      });
    } catch (error) {
      logTest("스트림:시작실패", error);
      setChatLog((prev) => [...prev, { role: "system", text: "음성 스트리밍 시작에 실패했습니다." }]);
      stopSpeechStream(false);
    }
  }, [downsampleTo16kHz, flushAudioQueue, isCamOn, logTest, resetMetrics, sendVideoFrame, startMetricTicker, stopSpeechStream]);

  useEffect(() => {
    let isCancelled = false;

    const getMedia = async () => {
      const media = await requestMediaWithFallback();
      if (isCancelled) {
        media.stream?.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = media.stream;
      setIsCamOn(media.hasVideoTrack);
      setIsMicOn(media.hasAudioTrack);
      isMicOnRef.current = media.hasAudioTrack;

      if (media.warningMessage) {
        setChatLog((prev) => [...prev, { role: "system", text: media.warningMessage || "" }]);
      }

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = media.stream;
      }
    };

    getMedia().catch(() => {
      if (isCancelled) return;
      setIsCamOn(false);
      setIsMicOn(false);
      isMicOnRef.current = false;
      setChatLog((prev) => [
        ...prev,
        { role: "system", text: "장치 확인 중 오류가 발생했습니다. 권한과 연결 상태를 확인해주세요." },
      ]);
    });

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (lastAudioPreviewUrlRef.current) {
        URL.revokeObjectURL(lastAudioPreviewUrlRef.current);
        lastAudioPreviewUrlRef.current = null;
      }
    };
  }, []);

  // StrictMode는 "마운트→cleanup→재마운트"를 실행하므로,
  // setTimeout으로 cleanup을 지연시켜 재마운트 시 취소할 수 있게 함.
  const pendingCleanupRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingCleanupRef.current !== null) {
      window.clearTimeout(pendingCleanupRef.current);
      pendingCleanupRef.current = null;
    }

    return () => {
      pendingCleanupRef.current = window.setTimeout(() => {
        pendingCleanupRef.current = null;

        sendEndOfSession();
        clearActiveCounselSocket();
        stopSpeechStream(false);

        if (counselSocketRef.current?.readyState === WebSocket.OPEN) {
          try {
            counselSocketRef.current.close(1000, "Component unload");
          } catch {
            // no-op
          }
        }
      }, 0);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      // refs를 직접 사용하여 최신 함수 호출
      if (hasSentEndOfSessionRef.current) return;
      hasSentEndOfSessionRef.current = true;

      if (counselSocketRef.current?.readyState === WebSocket.OPEN) {
        try {
          counselSocketRef.current.send(JSON.stringify({
            type: "control",
            data: "END_OF_SESSION",
            timestamp: Date.now() / 1000,
          }));
        } catch {
          // no-op
        }
      }
      clearActiveCounselSocket();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  useEffect(() => {
    if (!isWsReady || !counselSocketRef.current || setupSentRef.current) return;

    sendJsonMessage({
      type: "setup",
      data: {
        topic: sessionData?.topic || "기타",
        mood: sessionData?.mood || "neutral",
        content: sessionData?.content || "",
      },
      session_id: sessionData?.wsClientId,
      timestamp: Date.now() / 1000,
    });
    setupSentRef.current = true;
    logTest("소켓:설정전송", {
      topic: sessionData?.topic,
      mood: sessionData?.mood,
      hasContent: Boolean(sessionData?.content),
      wsClientId: sessionData?.wsClientId,
    });
  }, [isWsReady, sendJsonMessage, logTest, sessionData?.topic, sessionData?.mood, sessionData?.content, sessionData?.wsClientId]);

  useEffect(() => {
    const socket = counselSocketRef.current;
    if (!socket || !isWsReady) return;

    const handleMessage = async (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as CounselSocketPayload;

        if (payload.status === "connected") {
          logTest("소켓:연결메시지", { message: payload.message });
          setChatLog((prev) => [...prev, { role: "system", text: payload.message || "상담실에 입장하였습니다." }]);
          return;
        }

        if (payload.status === "initial_questions") {
          logTest("소켓:초기질문");
          applyStepStatus(payload);
          const message = payload.message || "상담을 시작하겠습니다.";
          setChatLog((prev) => [...prev, { role: "assistant", text: message }]);
          setCurrentAnimation("standMotion");
          setIsSessionReady(true);
          try {
            const samples = await synthesizeAcVoice(message);
            const wavBuffer = encodeAcVoiceWav(samples);
            await audioPlayer.play(wavBuffer);
          } catch {
            // no-op
          }
          return;
        }

        if (payload.status === "processing") {
          logTest("소켓:처리중");
          setLoading(true);
          startProcessingTimeout();
          setChatLog((prev) => [...prev, { role: "system", text: payload.message || "답변 생성 중..." }]);
          return;
        }

        if (payload.status === "stt_done") {
          logTest("소켓:음성인식완료", {
            test: payload.text,
            hasText: Boolean(payload.text),
            textLength: payload.text?.length ?? 0,
          });
          setChatLog((prev) => [...prev, { role: "user", text: payload.text || "(인식 결과 없음)" }]);
          return;
        }

        if (payload.status === "response") {
          const responseReceivedAt = performance.now();
          const endOfSpeechSentAt = endOfSpeechSentAtRef.current;
          if (typeof endOfSpeechSentAt === "number") {
            const latencyMs = responseReceivedAt - endOfSpeechSentAt;
            console.log(
              `${TEST_LOG_PREFIX} latency:endOfSpeechToResponse ${latencyMs.toFixed(1)}ms`
            );
            logTest("latency:endOfSpeechToResponse", {
              latencyMs: Number(latencyMs.toFixed(1)),
              endOfSpeechSentAtMs: Number(endOfSpeechSentAt.toFixed(2)),
              responseReceivedAtMs: Number(responseReceivedAt.toFixed(2)),
            });
            endOfSpeechSentAtRef.current = null;
          }

          logTest("소켓:응답", {
            messageLength: payload.message?.length ?? 0,
          });
          applyStepStatus(payload);
          stopProcessingTimeout();
          const message = payload.message || "응답이 도착했습니다.";
          setChatLog((prev) => [...prev, { role: "assistant", text: message }]);
          setLoading(false);
          setEmotion("neutral");

          try {
            const samples = await synthesizeAcVoice(message);
            const wavBuffer = encodeAcVoiceWav(samples);
            await audioPlayer.play(wavBuffer);
          } catch {
            // no-op
          }

          return;
        }

        if (
          payload.status === "awaiting_empathy" ||
          payload.status === "awaiting_transition" ||
          payload.status === "awaiting_completion" ||
          payload.status === "step_changed"
        ) {
          if (payload.status === "step_changed") {
            const newStep = toStepStatus(payload.step_status);
            if (newStep) {
              setChatLog((prev) => [
                ...prev,
                { role: "stage_change", text: `${newStep.step}단계 · ${newStep.title ?? "단계 변경"}` },
              ]);
            }
          }

          applyStepStatus(payload);
          setLoading(false);

          if (payload.status === "step_changed" && payload.transition === "counseling_complete") {
            sendEndOfSession();
            setChatLog((prev) => [
              ...prev,
              { role: "system", text: "상담이 완료되었습니다. 리포트를 준비하고 있습니다." },
            ]);
          }
          return;
        }
      } catch {
        logTest("소켓:비JSON수신");
      }
    };

    const handleClose = (event: CloseEvent) => {
      logTest("소켓:종료", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      setIsWsReady(false);
      setIsListening(false);
      stopSpeechStream(false);
      stopProcessingTimeout();
      setLoading(false);
      setChatLog((prev) => [
        ...prev,
        {
          role: "system",
          text:
            event.code === 1008
              ? "상담 세션 인증이 만료되었습니다. 다시 입장해주세요."
              : "상담 서버 연결이 종료되었습니다. 다시 입장해주세요.",
        },
      ]);
    };

    const handleError = () => {
      logTest("소켓:오류");
      setIsWsReady(false);
      stopSpeechStream(false);
      stopProcessingTimeout();
      setLoading(false);
      setChatLog((prev) => [...prev, { role: "system", text: "상담 서버 연결에 문제가 발생했습니다." }]);
    };

    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);
    };
  }, [isWsReady, applyStepStatus, logTest]);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => (track.enabled = !isMicOn));
      const nextMicState = !isMicOn;
      setIsMicOn(nextMicState);
      isMicOnRef.current = nextMicState;
      logTest("UI:마이크토글", { isMicOn: nextMicState });
      if (!nextMicState && isListening) {
        stopSpeechStream(true);
      }
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => (track.enabled = !isCamOn));
      const nextCamState = !isCamOn;
      setIsCamOn(nextCamState);
      logTest("UI:카메라토글", { isCamOn: nextCamState });

      if (!nextCamState && videoIntervalRef.current) {
        window.clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }

      if (nextCamState && isListening && !videoIntervalRef.current) {
        videoIntervalRef.current = window.setInterval(() => {
          sendVideoFrame().catch(() => {
            // no-op
          });
        }, MEDIA_SEND_INTERVAL_MS);
      }
    }
  };

  const startListening = () => {
    if (isListening) {
      stopSpeechStream(true);
      return;
    }
    if (!isMicOn || loading) return;

    startSpeechStream().catch(() => {
      // no-op
    });
  };

  const cleanupBeforeExit = () => {
    setShowExitModal(false);
    audioPlayer.stop();
    sendEndOfSession();
    clearActiveCounselSocket();
    stopSpeechStream(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    logTest("정리:완료");
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

  const fallbackStageInfo = STAGES[Math.max(0, Math.min(STAGES.length - 1, currentStage - 1))];
  const currentStageInfo = {
    label: stepStatus?.title ?? fallbackStageInfo?.label ?? "상담 진행",
    description: stepStatus?.goal ?? stepStatus?.currentQuestion ?? fallbackStageInfo?.description ?? "상담을 진행하고 있습니다.",
  };
  const stageProgress = Math.min(100, Math.max(0, (currentStage / Math.max(totalStages, 1)) * 100));
  const voiceStatusLabel = isListening ? "음성 인식 중" : loading ? "응답을 준비하는 중" : isMicOn ? "마이크 준비됨" : "마이크가 꺼져 있음";
  const shouldHideVrmModel = import.meta.env.DEV && import.meta.env.VITE_HIDE_VRM_MODEL === "true";
  const dialogueSource = [...chatLog].reverse().find((m) => m.role !== "system" && m.role !== "stage_change") ?? chatLog[0];

  const currentUser = getCurrentUser();
  const userNickname = currentUser?.name ?? "사용자";

  const dialogueSpeaker =
    dialogueSource?.role === "assistant"
      ? "0613inuinu1"
      : dialogueSource?.role === "user"
      ? `나(${userNickname})`
      : "상담";
  const isSpeakerUser = dialogueSource?.role === "user";

  const sourceText = dialogueSource?.text ?? "";
  const dialogueSegments = useMemo(() => splitTextIntoSegments(sourceText), [sourceText]);
  const segmentIndex = segmentState.sourceText === sourceText ? segmentState.index : 0;
  const currentSegmentText = dialogueSegments[segmentIndex] ?? sourceText;
  const hasMoreSegments = segmentIndex < dialogueSegments.length - 1;

  const clearDialogueTimers = useCallback(() => {
    if (dialogueTimerStartRef.current !== null) {
      window.clearTimeout(dialogueTimerStartRef.current);
      dialogueTimerStartRef.current = null;
    }
    if (dialogueTimerIntervalRef.current !== null) {
      window.clearInterval(dialogueTimerIntervalRef.current);
      dialogueTimerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearDialogueTimers();
    const nextText = currentSegmentText;

    dialogueTimerStartRef.current = window.setTimeout(() => {
      dialogueTimerStartRef.current = null;
      setDialogueText("");

      if (!nextText) {
        setIsDialogueTyping(false);
        return;
      }

      let index = 0;
      setIsDialogueTyping(true);
      dialogueTimerIntervalRef.current = window.setInterval(() => {
        index += 1;
        setDialogueText(nextText.slice(0, index));
        if (index >= nextText.length) {
          if (dialogueTimerIntervalRef.current !== null) {
            window.clearInterval(dialogueTimerIntervalRef.current);
            dialogueTimerIntervalRef.current = null;
          }
          setIsDialogueTyping(false);
        }
      }, 28);
    }, 0);

    return clearDialogueTimers;
  // currentSegmentText changes when sourceText changes OR segmentIndex advances
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSegmentText]);

  const advanceDialogue = useCallback(() => {
    if (isDialogueTyping) {
      clearDialogueTimers();
      setDialogueText(currentSegmentText);
      setIsDialogueTyping(false);
    } else if (hasMoreSegments) {
      setSegmentState({ sourceText, index: segmentIndex + 1 });
    }
  }, [isDialogueTyping, clearDialogueTimers, currentSegmentText, hasMoreSegments, sourceText, segmentIndex]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advanceDialogue();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [advanceDialogue]);

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [chatLog]);

  useEffect(() => {
    if (isSessionReady) return;
    const id = window.setInterval(() => {
      setLoadingTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [isSessionReady]);

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

        {!isSessionReady && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="flex w-[min(480px,80%)] flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white px-10 py-10 shadow-2xl text-center">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-green" />
              </div>

              <div className="space-y-1.5">
                <p className="text-base font-bold text-slate-900 leading-snug">
                  사용자의 이전 요청을 기반으로<br />상담 세션을 만들고 있어요
                </p>
                <p className="text-sm font-medium text-slate-400">잠시만 기다려 주세요</p>
              </div>

              <div className="w-full border-t border-slate-100 pt-4 min-h-[3rem]">
                <p
                  key={loadingTipIndex}
                  className="animate-tip-fade-in text-sm leading-relaxed text-brand-green"
                >
                  💡 {LOADING_TIPS[loadingTipIndex]}
                </p>
              </div>
            </div>
          </div>
        )}

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
              {shouldMountThreeScene && !shouldHideVrmModel ? (
                <Suspense fallback={<div className="h-full w-full bg-slate-100" />}>
                  <ThreeCounselScene
                    emotion={emotion}
                    currentAnimation={currentAnimation}
                    avatarUrl={COUNSEL_AVATAR_URL}
                    avatarPosition={COUNSEL_AVATAR_POSITION}
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
            </div>

            {isSessionReady && (
              <div
                className="absolute bottom-4 left-1/2 z-30 w-[min(720px,calc(100%-160px))] -translate-x-1/2 cursor-pointer select-none"
                onClick={advanceDialogue}
                role="button"
                tabIndex={0}
                aria-label="다음 대사 보기"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
              >
                <div className="relative mx-auto w-full max-w-[720px]">
                  {/* Speaker label — green for AI, indigo for user */}
                  <div
                    className={`mb-[-12px] ml-8 inline-flex rounded-full border-4 px-4 py-1 text-sm font-extrabold text-white ${
                      isSpeakerUser
                        ? "border-indigo-500 bg-indigo-500 shadow-[0_8px_18px_rgba(99,102,241,0.25)]"
                        : "border-brand-green bg-brand-green shadow-[0_8px_18px_rgba(30,215,96,0.2)]"
                    }`}
                  >
                    {dialogueSpeaker}
                  </div>
                  {/* Bubble */}
                  <div
                    className={`relative rounded-[36px] border-[5px] bg-[rgba(255,255,255,0.98)] px-6 py-5 shadow-[0_12px_0_rgba(0,0,0,0.06),0_24px_50px_rgba(0,0,0,0.1)] backdrop-blur-md ${
                      isSpeakerUser ? "border-indigo-400" : "border-brand-green"
                    }`}
                  >
                    <p className="min-h-[4.2rem] text-[1.08rem] leading-[1.75] text-slate-900 [text-shadow:0_1px_0_rgba(255,255,255,0.8)] sm:text-[1.2rem]">
                      {dialogueText}
                      {isDialogueTyping && (
                        <span className="ml-1 inline-block animate-pulse align-middle text-slate-400">|</span>
                      )}
                    </p>
                    {/* Enter mark: visible when more segments remain and typing finished */}
                    {hasMoreSegments && !isDialogueTyping && (
                      <div className="absolute bottom-4 right-6 animate-bounce text-brand-green">
                        <CornerDownLeft size={18} />
                      </div>
                    )}
                    {/* Dim arrow when nothing pending */}
                    {!hasMoreSegments && !isDialogueTyping && (
                      <div className="absolute bottom-4 right-6 text-slate-300">
                        <span className="inline-block text-lg leading-none">▼</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  <span>카메라 OFF</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded bg-slate-400/50 px-2 py-0.5 text-[9px] font-semibold text-white">나</div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 pt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-gradient-to-r from-brand-green via-brand-green-dark to-brand-green transition-all duration-300"
                style={{ width: `${stageProgress}%` }}
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
                  onClick={startListening}
                  disabled={!isMicOn || (loading && !isListening)}
                  className={`inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all shadow-sm ${
                    isListening
                      ? "border-brand-green bg-brand-green text-white shadow-[0_10px_24px_rgba(30,215,96,0.3)] ring-1 ring-brand-green"
                      : "border-brand-green bg-brand-green text-white hover:border-brand-green hover:bg-brand-green-dark"
                  } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none`}
                  title={isListening ? "음성 종료" : "음성 입력"}
                >
                  <Radio size={15} />
                  {isListening ? "듣는 중" : "음성 입력"}
                </button>
                <p className="text-[10px] font-medium tracking-wide text-slate-500">{voiceStatusLabel}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── 로그 사이드바 ───
           버튼(36px) + 패널(300px) = 336px 단일 컨테이너, right:0 고정
           닫힘: translateX(300px) → 버튼 36px만 우측 벽에 노출
           열림: translateX(0)    → 전체 슬라이드인, 버튼이 패널 좌측에 딱 붙음 */}
      <div
        style={{
          transform: isLogSidebarOpen ? "translateX(0)" : "translateX(300px)",
          transition: "transform 380ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="fixed right-0 top-0 h-screen z-[101] flex"
      >
        {/* 토글 탭 – 컨테이너 좌측, ㄷ 형태 */}
        <button
          onClick={() => setIsLogSidebarOpen((v) => !v)}
          className="self-center shrink-0 w-9 h-20 flex flex-col items-center justify-center gap-1.5 bg-white border-l border-t border-b border-slate-300 rounded-l-xl shadow-xl text-slate-500 hover:text-brand-green transition-colors"
          aria-label={isLogSidebarOpen ? "로그 닫기" : "로그 열기"}
        >
          {isLogSidebarOpen ? (
            <ChevronRight size={17} />
          ) : (
            <>
              <MessageSquare size={15} />
              <span className="text-[8px] font-bold tracking-widest text-slate-400">LOG</span>
            </>
          )}
        </button>

        {/* 패널 */}
        <div className="w-[300px] h-full flex flex-col bg-white shadow-2xl border-l border-slate-200">
          {/* 헤더 */}
          <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <MessageSquare size={12} className="text-brand-green" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">채팅 로그</span>
            </div>
            <button
              onClick={() => setIsLogSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* 메시지 목록 */}
          <div ref={logScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
            {chatLog.map((msg, i) => {
              if (msg.role === "stage_change") {
                return (
                  <div key={i} className="flex items-center gap-1.5 py-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="shrink-0 text-[10px] font-bold text-slate-400 px-1 whitespace-nowrap">
                      ─── {msg.text} ───
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                );
              }
              if (msg.role === "assistant") {
                const sentences = splitTextIntoSegments(msg.text);
                return (
                  <div key={i} className="flex flex-col gap-1 items-start">
                    <span className="text-[9px] font-semibold text-brand-green ml-2">AI 상담사</span>
                    {sentences.map((s, si) => (
                      <div key={si} className="max-w-[248px] rounded-2xl rounded-tl-sm px-3 py-2 bg-[#e8faf0] border border-brand-green/20">
                        <p className="text-[11px] leading-relaxed text-slate-800 break-words">{s}</p>
                      </div>
                    ))}
                  </div>
                );
              }
              if (msg.role === "user") {
                const sentences = splitTextIntoSegments(msg.text);
                return (
                  <div key={i} className="flex flex-col gap-1 items-end">
                    <span className="text-[9px] font-semibold text-indigo-500 mr-2">나({userNickname})</span>
                    {sentences.map((s, si) => (
                      <div key={si} className="max-w-[248px] rounded-2xl rounded-tr-sm px-3 py-2 bg-indigo-50 border border-indigo-100">
                        <p className="text-[11px] leading-relaxed text-slate-800 break-words">{s}</p>
                      </div>
                    ))}
                  </div>
                );
              }
              if (msg.role === "system") {
                return (
                  <div key={i} className="flex justify-center py-0.5">
                    <span className="text-[9px] text-slate-400 text-center leading-tight px-1">{msg.text}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
