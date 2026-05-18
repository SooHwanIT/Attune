import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getVoice } from "../../utils/api";
import { audioPlayer } from "../../utils/audioPlayer";
import { createSessionRecord, saveSessionRecord } from "../../utils/sessionStore";
import { clearActiveCounselSocket, getActiveCounselSocket } from "../../utils/wsSession";
import { Mic, MicOff, Radio, Video, VideoOff, X } from "lucide-react";

const ThreeCounselScene = lazy(() => import("../../components/ThreeCounselScene"));
const TEST_LOG_PREFIX = "[CounselTest]";
const MEDIA_SEND_INTERVAL_MS = 2000;
const INPUT_AUDIO_GAIN = 2.6;
const COUNSEL_AVATAR_URL = "/tomcat.vrm";
const COUNSEL_AVATAR_POSITION: [number, number, number] = [0, -0.45, 0.75];

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

type ChatMessage = { role: string; text: string };

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
  const currentStage = 1;
  const stageHistory: { stage: number; content: string; summary: string }[] = [];

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [shouldMountThreeScene, setShouldMountThreeScene] = useState(false);
  const [isWsReady, setIsWsReady] = useState(false);
  const [dialogueText, setDialogueText] = useState("");
  const [isDialogueTyping, setIsDialogueTyping] = useState(false);
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
    }, 20000);
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
    setIsWsReady(true);
    logTest("세션:연결완료", {
      clientId: activeSession.clientId,
      readyState: activeSession.socket.readyState,
    });
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
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

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
  }, [flushAudioQueue, logTest, resetMetrics, sendJsonMessage, stopMetricTicker, stopProcessingTimeout]);

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
      startProcessingTimeout();
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
  }, [downsampleTo16kHz, flushAudioQueue, isCamOn, logTest, resetMetrics, sendVideoFrame, startMetricTicker, startProcessingTimeout, stopSpeechStream]);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopSpeechStream(false);
    };
  }, [stopSpeechStream]);

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
        const payload = JSON.parse(event.data);

        if (payload.status === "connected") {
          logTest("소켓:연결메시지", { message: payload.message });
          setChatLog((prev) => [...prev, { role: "system", text: payload.message || "상담실에 입장하였습니다." }]);
          return;
        }

        if (payload.status === "initial_questions") {
          logTest("소켓:초기질문");
          const message = payload.message || "상담을 시작하겠습니다.";
          setChatLog((prev) => [...prev, { role: "assistant", text: message }]);
          setCurrentAnimation("greeting");
          try {
            const audioData = await getVoice(message);
            await audioPlayer.play(audioData);
          } catch {
            // no-op
          }
          return;
        }

        if (payload.status === "processing") {
          logTest("소켓:처리중");
          setLoading(true);
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
          stopProcessingTimeout();
          const message = payload.message || "응답이 도착했습니다.";
          setChatLog((prev) => [...prev, { role: "assistant", text: message }]);
          setLoading(false);
          setEmotion("neutral");

          try {
            const audioData = await getVoice(message);
            await audioPlayer.play(audioData);
          } catch {
            // no-op
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
    };

    const handleError = () => {
      logTest("소켓:오류");
      setIsWsReady(false);
    };

    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);
    };
  }, [isWsReady, getVoice, logTest, stopProcessingTimeout]);

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
    if (counselSocketRef.current?.readyState === WebSocket.OPEN) {
      const endPayload = {
        type: "control",
        data: "END_OF_SESSION",
        timestamp: Date.now() / 1000,
      };
      try {
        counselSocketRef.current.send(JSON.stringify(endPayload));
      } catch {
        // no-op
      }
    }
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

  const currentStageInfo = STAGES[currentStage - 1];
  const voiceStatusLabel = isListening ? "음성 인식 중" : loading ? "응답을 준비하는 중" : isMicOn ? "마이크 준비됨" : "마이크가 꺼져 있음";
  const shouldHideVrmModel = import.meta.env.DEV && import.meta.env.VITE_HIDE_VRM_MODEL === "true";
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-dark-base text-base">
      {showExitModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-foreground/10 p-4">
          <div className="w-full max-w-md rounded-lg bg-dark-surface p-6 border border-dark">
            <h2 className="text-lg font-extrabold text-base">상담을 종료할까요?</h2>
            <p className="mt-2 text-sm text-base/70">종료 후 이동할 페이지를 선택해주세요.</p>
            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                onClick={() => handleExitTo("/")}
                className="rounded-md border border-dark px-4 py-2.5 text-sm font-semibold text-base/80 transition hover:bg-dark-elevated"
              >
                메인으로 이동
              </button>
              <button
                onClick={() => handleExitTo("/analysis")}
                className="rounded-md border border-dark px-4 py-2.5 text-sm font-semibold text-base/80 transition hover:bg-dark-elevated"
              >
                기록으로 이동
              </button>
            </div>
            <button
              onClick={() => setShowExitModal(false)}
              className="mt-4 w-full rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              계속 상담하기
            </button>
          </div>
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-lg border border-dark bg-dark-elevated"
        style={{ width: "min(94vw, 1700px)", height: "min(88vh, calc(94vw * 0.6))" }}
      >
        <header className="flex h-14 items-center justify-between border-b border-slate-200/80 bg-dark-surface/95 px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
            <h1 className="text-sm font-semibold tracking-wide text-base">ATTUNE COUNSEL STUDIO</h1>
          </div>
          <button
            onClick={() => setShowExitModal(true)}
            className="rounded-md p-2 text-base/70 transition hover:bg-dark-elevated"
            aria-label="상담 닫기"
          >
            <X size={16} />
          </button>
        </header>

        <div className="relative flex h-[calc(100%-56px)] flex-col">
          <div className="relative flex-1 overflow-hidden bg-dark-elevated">
            <div className="absolute inset-0">
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
            <div className="absolute left-4 top-4 z-20 w-[360px] rounded-lg bg-dark-surface p-3 border border-dark">
              <p className="text-[11px] font-semibold tracking-wide text-base/70">CURRENT STAGE</p>
              <p className="mt-1 text-sm font-bold text-base">{currentStageInfo?.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-base/70">{currentStageInfo?.description}</p>
            </div>

            <div className="absolute bottom-4 left-1/2 z-30 w-[min(720px,calc(100%-2rem))] -translate-x-1/2">
              <div className="relative mx-auto w-full max-w-[720px]">
                <div className="mb-[-12px] ml-8 inline-flex rounded-full border-4 border-foreground bg-brand-green px-4 py-1 text-sm font-extrabold text-white">
                  {dialogueSpeaker}
                </div>
                <div className="relative rounded-lg border-2 border-foreground bg-dark-elevated px-6 py-5">
                  <p className="min-h-[4.2rem] text-[1.08rem] leading-[1.75] text-base sm:text-[1.2rem]">
                    {dialogueText}
                    {isDialogueTyping && <span className="ml-1 inline-block animate-pulse align-middle">|</span>}
                  </p>
                  <div className="absolute bottom-4 right-6 text-base/70">
                    <span className="inline-block animate-bounce text-lg leading-none">▼</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-20 h-40 w-28 overflow-hidden rounded-md border border-dark bg-dark-surface">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${!isCamOn ? "hidden" : ""}`}
              />
              {!isCamOn && (
                <div className="flex h-full w-full flex-col items-center justify-center bg-dark-elevated text-xs text-base/70">
                  <VideoOff size={20} className="mb-2" />
                  <span>카메라 OFF</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded bg-foreground/80 px-2 py-0.5 text-[9px] font-semibold text-white">나</div>
            </div>
          </div>

          <div className="border-t border-dark bg-dark-surface px-4 pt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-dark-elevated">
              <div
                className="h-full bg-brand-green transition-all duration-300"
                style={{ width: `${(currentStage / STAGES.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="border-t border-dark bg-dark-surface px-4 py-3">
            <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
              <div className="flex items-center gap-2 rounded-md bg-dark-elevated px-2.5 py-2">
                <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-base/60">Device</span>
                <div className="h-5 w-px bg-border" />
                <button
                  onClick={toggleMic}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    isMicOn
                      ? "bg-brand-green text-white"
                      : "bg-dark-surface text-base/70 border border-dark hover:bg-dark-elevated"
                  }`}
                  title={isMicOn ? "마이크 끄기" : "마이크 켜기"}
                >
                  {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                  <span>마이크</span>
                </button>

                <button
                  onClick={toggleCam}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    isCamOn
                      ? "bg-brand-green text-white"
                      : "bg-dark-surface text-base/70 border border-dark hover:bg-dark-elevated"
                  }`}
                  title={isCamOn ? "카메라 끄기" : "카메라 켜기"}
                >
                  {isCamOn ? <Video size={14} /> : <VideoOff size={14} />}
                  <span>카메라</span>
                </button>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={startListening}
                  disabled={!isMicOn || (loading && !isListening)}
                  className={`inline-flex min-w-[180px] items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-transform ${
                    isListening
                      ? "bg-brand-green text-white scale-105"
                      : "bg-foreground text-white hover:scale-105"
                  } disabled:cursor-not-allowed disabled:bg-dark-elevated disabled:text-base/60`}
                  title={isListening ? "음성 종료" : "음성 입력"}
                >
                  <Radio size={15} />
                  {isListening ? "듣는 중" : "음성 입력"}
                </button>
                <p className="text-[10px] font-medium tracking-wide text-base/70">{voiceStatusLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
