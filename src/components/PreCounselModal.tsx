import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CloudRain,
  Edit3,
  HeartHandshake,
  HeartPulse,
  Mic,
  Moon,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Video,
  Waves,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clearActiveCounselSocket, setActiveCounselSocket } from "../utils/wsSession";
import { startCounselingSessionApi } from "../utils/counselingApi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
};

type Step = "welcome" | "topic" | "mood" | "content" | "device";
type DeviceCheckState = "idle" | "checking" | "ready" | "error";
type PermissionState = "unknown" | "prompt" | "granted" | "denied";

type TopicOption = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type MoodOption = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  toneClassName: string;
};

type StepMeta = {
  label: string;
  title: string;
  description: string;
  tip: string;
  icon: LucideIcon;
};

type ContentPrompt = {
  id: string;
  label: string;
  placeholder: string;
};

const COUNSEL_WS_BASE_URL = import.meta.env.VITE_COUNSEL_WS_BASE_URL?.replace(/\/+$/, "") ?? "";
const DEV_LOG_PREFIX = "[PreCounselModal]";
const CUSTOM_TOPIC_LABEL = "직접 입력";

const STEPS: Step[] = ["welcome", "topic", "mood", "content", "device"];
const PROGRESS_STEPS: Step[] = ["topic", "mood", "content", "device"];

const STEP_META: Record<Step, StepMeta> = {
  welcome: {
    label: "준비",
    title: "상담 준비를 시작해요",
    description: "몇 가지 정보를 알려주시면 상담 흐름을 더 자연스럽게 맞출 수 있어요.",
    tip: "선택은 1분 안에 끝낼 수 있고, 부담스럽지 않은 만큼만 작성해도 괜찮아요.",
    icon: HeartHandshake,
  },
  topic: {
    label: "STEP 1",
    title: "오늘 이야기할 주제",
    description: "가장 가까운 고민 영역을 선택해 주세요. 꼭 정확하지 않아도 괜찮아요.",
    tip: "원하는 항목이 없다면 직접 입력을 선택해 짧게 적어주세요.",
    icon: Target,
  },
  mood: {
    label: "STEP 2",
    title: "지금의 마음 상태",
    description: "상담사가 처음 대화를 열 때 참고할 수 있도록 현재 마음에 가까운 상태를 골라주세요.",
    tip: "감정 강도는 서버 계약 확인 후 추가하고, 지금은 감정 이름만 안전하게 전달합니다.",
    icon: HeartPulse,
  },
  content: {
    label: "STEP 3",
    title: "상담 전에 전하고 싶은 이야기",
    description: "상황, 감정, 원하는 도움 중 하나만 적어도 상담 시작에 충분한 단서가 됩니다.",
    tip: "최소 10자 이상 입력하면 다음 단계로 이동할 수 있어요.",
    icon: Edit3,
  },
  device: {
    label: "STEP 4",
    title: "카메라와 마이크 확인",
    description: "상담을 시작하기 전에 브라우저 권한과 장치 상태를 확인합니다.",
    tip: "카메라가 부담스럽다면 확인 후 끄고 시작할 수 있어요.",
    icon: Video,
  },
};

const TOPIC_OPTIONS: TopicOption[] = [
  {
    id: "work",
    label: "직장/학업 스트레스",
    description: "업무 압박, 시험, 성과 부담",
    icon: BriefcaseBusiness,
  },
  {
    id: "relationship",
    label: "관계 고민",
    description: "가족, 연인, 친구, 동료와의 갈등",
    icon: UserRound,
  },
  {
    id: "anxiety",
    label: "불안/걱정",
    description: "반복되는 걱정과 긴장감",
    icon: Waves,
  },
  {
    id: "depression",
    label: "우울/무기력",
    description: "기운 저하, 의욕 감소, 공허함",
    icon: CloudRain,
  },
  {
    id: "self-esteem",
    label: "자존감",
    description: "자기비난, 위축감, 비교감",
    icon: Sparkles,
  },
  {
    id: "career",
    label: "진로/미래",
    description: "선택, 방향성, 앞으로의 계획",
    icon: Route,
  },
  {
    id: "sleep",
    label: "수면/건강",
    description: "불면, 피로, 몸의 긴장",
    icon: Moon,
  },
  {
    id: "custom",
    label: CUSTOM_TOPIC_LABEL,
    description: "내 상황에 맞는 주제를 직접 작성",
    icon: Edit3,
  },
];

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: "anxious",
    label: "불안해요",
    description: "걱정이 많고 긴장이 쉽게 풀리지 않아요.",
    icon: Waves,
    toneClassName: "bg-sky-500/15 text-sky-200",
  },
  {
    id: "tired",
    label: "지쳐있어요",
    description: "에너지가 부족하고 쉬어도 개운하지 않아요.",
    icon: Moon,
    toneClassName: "bg-violet-500/15 text-violet-200",
  },
  {
    id: "sad",
    label: "우울해요",
    description: "마음이 가라앉고 의욕이 잘 생기지 않아요.",
    icon: CloudRain,
    toneClassName: "bg-blue-500/15 text-blue-200",
  },
  {
    id: "angry",
    label: "화가 나요",
    description: "억울함, 짜증, 분노가 자주 올라와요.",
    icon: Zap,
    toneClassName: "bg-rose-500/15 text-rose-200",
  },
  {
    id: "confused",
    label: "혼란스러워요",
    description: "생각이 복잡하고 무엇부터 봐야 할지 모르겠어요.",
    icon: CircleHelp,
    toneClassName: "bg-amber-500/15 text-amber-100",
  },
  {
    id: "neutral",
    label: "이야기하고 싶어요",
    description: "큰 감정은 아니지만 차분히 정리해보고 싶어요.",
    icon: HeartHandshake,
    toneClassName: "bg-emerald-500/15 text-emerald-100",
  },
];

const CONTENT_PROMPTS: ContentPrompt[] = [
  {
    id: "when",
    label: "언제부터 그랬나요?",
    placeholder: "예: 최근 2주 정도 업무가 몰리면서 잠들기 전까지 계속 걱정이 이어져요.",
  },
  {
    id: "hardest",
    label: "가장 힘든 순간은?",
    placeholder: "예: 사람들과 대화한 뒤에 제가 실수한 말을 계속 떠올리게 되는 순간이 가장 힘들어요.",
  },
  {
    id: "goal",
    label: "얻고 싶은 도움은?",
    placeholder: "예: 불안이 올라올 때 어떻게 진정하면 좋을지 같이 정리해보고 싶어요.",
  },
];

export default function PreCounselModal({ isOpen, onClose, initialTopic }: Props) {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState(CONTENT_PROMPTS[0].id);
  const counselingStyle = "empathy" as const;
  const [counselContent, setCounselContent] = useState("");
  const [deviceCheckState, setDeviceCheckState] = useState<DeviceCheckState>("idle");
  const [deviceError, setDeviceError] = useState("");
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicAvailable, setIsMicAvailable] = useState<boolean | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null);
  const [hasMicTrack, setHasMicTrack] = useState(false);
  const [hasCameraTrack, setHasCameraTrack] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [hasCheckedDevices, setHasCheckedDevices] = useState(false);
  const [isConnectingSocket, setIsConnectingSocket] = useState(false);
  const [isStartingCounsel, setIsStartingCounsel] = useState(false);
  const [socketError, setSocketError] = useState("");
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  const selectedPrompt = useMemo(
    () => CONTENT_PROMPTS.find((prompt) => prompt.id === selectedPromptId) ?? CONTENT_PROMPTS[0],
    [selectedPromptId]
  );

  const topicValue = selectedTopic === CUSTOM_TOPIC_LABEL ? customTopic.trim() : selectedTopic;
  const isTopicValid = Boolean(topicValue && topicValue.trim().length >= 2);
  const isContentValid = counselContent.trim().length >= 10;
  const stepNumber = STEPS.indexOf(currentStep);
  const progressPercent = currentStep === "welcome" ? 0 : (PROGRESS_STEPS.indexOf(currentStep) / (PROGRESS_STEPS.length - 1)) * 100;

  const logDebug = useCallback((event: string, payload?: unknown) => {
    if (!import.meta.env.DEV) return;
    const time = new Date().toISOString();
    if (typeof payload === "undefined") {
      console.log(`${DEV_LOG_PREFIX} ${time} ${event}`);
      return;
    }
    console.log(`${DEV_LOG_PREFIX} ${time} ${event}`, payload);
  }, []);

  const stopPreviewStream = useCallback(() => {
    logDebug("stopPreviewStream:start", {
      hasPreviewStream: Boolean(previewStreamRef.current),
    });

    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }

    logDebug("stopPreviewStream:done");
  }, [logDebug]);

  const requestDevicePreview = useCallback(async () => {
    logDebug("deviceCheck:start", {
      currentStep,
      hasCheckedDevices,
    });

    if (!navigator.mediaDevices?.getUserMedia) {
      setDeviceCheckState("error");
      setDeviceError("현재 브라우저가 카메라와 마이크 확인을 지원하지 않습니다.");
      setPermissionState("denied");
      setHasCheckedDevices(true);
      logDebug("deviceCheck:unsupported", { reason: "getUserMedia unavailable" });
      return;
    }

    setDeviceCheckState("checking");
    setDeviceError("");
    setPermissionState("prompt");

    // ✅ CRITICAL FIX: 루프 전 기존 스트림을 즉시 정리
    stopPreviewStream();

    try {
      let hasVideoInput: boolean | null = null;
      let hasAudioInput: boolean | null = null;

      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          hasVideoInput = devices.some((device) => device.kind === "videoinput");
          hasAudioInput = devices.some((device) => device.kind === "audioinput");
          logDebug("deviceCheck:enumerateDevices", {
            total: devices.length,
            hasVideoInput,
            hasAudioInput,
            devices: devices.map((device) => ({
              kind: device.kind,
              label: device.label,
              deviceId: device.deviceId,
            })),
          });
        } catch (enumError) {
          logDebug("deviceCheck:enumerateDevicesFailed", enumError);
          // 계속 진행
        }
      }

      let stream: MediaStream | null = null;
      let lastError: unknown = null;
      const constraintCandidates: MediaStreamConstraints[] = [
        { video: true, audio: true },
        { video: true, audio: false },
        { video: false, audio: true },
      ];

      for (const constraints of constraintCandidates) {
        try {
          logDebug("deviceCheck:getUserMediaAttempt", constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          logDebug("deviceCheck:getUserMediaSuccess", constraints);
          break;
        } catch (error) {
          // ✅ CRITICAL FIX: 루프 중 생성된 stream이 있으면 정리
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            stream = null;
          }
          lastError = error;
          const errName = error instanceof DOMException ? error.name : "unknown";
          logDebug("deviceCheck:getUserMediaFailed", {
            constraints,
            errName,
          });
        }
      }

      if (!stream) {
        throw lastError ?? new Error("Unable to access media devices");
      }

      previewStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      const hasVideoTrack = Boolean(videoTrack);
      const hasAudioTrack = Boolean(audioTrack);

      if (!hasVideoTrack && !hasAudioTrack) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("No usable media tracks");
      }

      setIsCameraEnabled(Boolean(videoTrack?.enabled));
      setIsMicEnabled(Boolean(audioTrack?.enabled));
      setHasCameraTrack(hasVideoTrack);
      setHasMicTrack(hasAudioTrack);
      setIsCameraAvailable(hasVideoInput ?? hasVideoTrack);
      setIsMicAvailable(hasAudioInput ?? hasAudioTrack);
      setPermissionState("granted");

      if ((hasVideoInput ?? false) && !hasVideoTrack) {
        setDeviceError("카메라는 감지되었지만 현재 영상 신호를 받을 수 없습니다. 다른 앱에서 사용 중인지 확인해 주세요.");
      }

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.onloadedmetadata = () => {
          logDebug("deviceCheck:videoMetadataLoaded");
          void previewVideoRef.current?.play().catch(() => {
            logDebug("deviceCheck:videoPlayBlocked");
          });
        };
      }

      setDeviceCheckState("ready");
      setHasCheckedDevices(true);
      logDebug("deviceCheck:ready", {
        hasVideoTrack,
        hasAudioTrack,
        hasVideoInput,
        hasAudioInput,
      });
    } catch (error) {
      console.error("Failed to access media devices", error);
      // ✅ CRITICAL FIX: 에러 발생 시에도 스트림 정리 확실히
      stopPreviewStream();
      setDeviceCheckState("error");
      const errName = error instanceof DOMException ? error.name : "";
      if (errName === "NotAllowedError" || errName === "SecurityError") {
        setPermissionState("denied");
        setDeviceError("카메라 또는 마이크 권한이 차단되었습니다. 브라우저 설정에서 권한을 허용한 뒤 다시 확인해 주세요.");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setPermissionState("denied");
        setDeviceError("연결된 카메라나 마이크를 찾지 못했습니다. 장치 연결 상태를 확인해 주세요.");
      } else {
        setPermissionState("prompt");
        setDeviceError("카메라와 마이크 상태 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setHasCheckedDevices(true);
      logDebug("deviceCheck:error", { errName, error });
    }
  }, [currentStep, hasCheckedDevices, logDebug, stopPreviewStream]);

  const toggleMic = useCallback(() => {
    const audioTrack = previewStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicEnabled(audioTrack.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = previewStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraEnabled(videoTrack.enabled);
  }, []);

  const connectCounselSocket = useCallback(async (ticketId: string) => {
    setSocketError("");
    setIsConnectingSocket(true);

    if (!COUNSEL_WS_BASE_URL) {
      setSocketError("상담 서버 주소가 설정되지 않았습니다. VITE_COUNSEL_WS_BASE_URL 값을 확인해 주세요.");
      setIsConnectingSocket(false);
      throw new Error("Missing VITE_COUNSEL_WS_BASE_URL");
    }

    const wsUrl = `${COUNSEL_WS_BASE_URL}/${encodeURIComponent(ticketId)}`;
    const socket = new WebSocket(wsUrl);
    logDebug("socket:connectStart", { ticketId, wsUrl });

    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        let cleanup = () => {
          // Assigned after handlers are declared.
        };
        const timeoutId = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          logDebug("socket:timeout", { ms: 8000, ticketId });
          reject(new Error("상담 서버 연결 시간이 초과되었습니다."));
        }, 8000);

        cleanup = () => {
          window.clearTimeout(timeoutId);
          socket.removeEventListener("open", handleOpen);
          socket.removeEventListener("message", handleMessage);
          socket.removeEventListener("error", handleError);
          socket.removeEventListener("close", handleClose);
        };

        const finalizeReject = (error: Error) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(error);
        };

        const handleOpen = () => {
          logDebug("socket:open", { ticketId, readyState: socket.readyState });
        };

        const handleMessage = (event: MessageEvent<string>) => {
          logDebug("socket:messageRaw", event.data);
          try {
            const payload: unknown = JSON.parse(event.data);
            logDebug("socket:messageParsed", payload);
            if (isConnectedSocketPayload(payload)) {
              if (settled) return;
              settled = true;
              cleanup();
              logDebug("socket:connectedAck", payload);
              resolve();
              return;
            }
            if (isAuthFailedSocketPayload(payload)) {
              finalizeReject(new Error(payload.message || "상담 세션 인증에 실패했습니다."));
            }
          } catch {
            logDebug("socket:messageParseFailed", event.data);
          }
        };

        const handleError = () => {
          logDebug("socket:errorEvent", { ticketId, readyState: socket.readyState });
          finalizeReject(new Error("상담 서버 연결에 실패했습니다."));
        };

        const handleClose = (event: CloseEvent) => {
          logDebug("socket:closeEvent", {
            ticketId,
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          finalizeReject(new Error("상담 서버 연결이 종료되었습니다."));
        };

        socket.addEventListener("open", handleOpen);
        socket.addEventListener("message", handleMessage);
        socket.addEventListener("error", handleError);
        socket.addEventListener("close", handleClose);
      });

      setActiveCounselSocket(socket, ticketId);
      logDebug("socket:storedInSession", { ticketId });
      return ticketId;
    } catch (error) {
      try {
        socket.close();
      } catch {
        // 연결 실패 후 정리 과정에서 발생하는 예외는 사용자 액션에 영향을 주지 않습니다.
      }
      clearActiveCounselSocket(false);
      logDebug("socket:connectFailed", { ticketId, error });
      throw error;
    } finally {
      setIsConnectingSocket(false);
      logDebug("socket:connectEnd", { ticketId });
    }
  }, [logDebug]);

  const handleNext = useCallback(async () => {
    if (isStartingCounsel) return;

    logDebug("step:nextClicked", {
      currentStep,
      topicValue,
      selectedMood,
      contentLength: counselContent.trim().length,
      deviceCheckState,
      isConnectingSocket,
      isStartingCounsel,
    });

    if (currentStep === "welcome") {
      setCurrentStep("topic");
      return;
    }

    if (currentStep === "topic" && isTopicValid) {
      setCurrentStep("mood");
      return;
    }

    if (currentStep === "mood" && selectedMood) {
      setCurrentStep("content");
      return;
    }

    if (currentStep === "content" && isContentValid) {
      setCurrentStep("device");
      return;
    }

    if (currentStep !== "device" || deviceCheckState !== "ready" || !topicValue || !selectedMood) {
      return;
    }

    setIsStartingCounsel(true);
    setSocketError("");

    try {
      const ticketResponse = await startCounselingSessionApi();
      const wsClientId = await connectCounselSocket(ticketResponse.ticketId);
      logDebug("step:socketReadyNavigate", { wsClientId, ticketId: ticketResponse.ticketId });

      stopPreviewStream();
      onClose();
      navigate("/counsel", {
        state: {
          sessionId: ticketResponse.ticketId,
          local: true,
          topic: topicValue,
          mood: selectedMood,
          style: counselingStyle,
          content: counselContent.trim(),
          wsClientId,
          ticketId: ticketResponse.ticketId,
          device: {
            micEnabled: isMicEnabled,
            cameraEnabled: isCameraEnabled,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "상담 시작에 실패했습니다.";
      setSocketError(message);
      logDebug("step:socketConnectFailed", { message, error });
      // ✅ CAUTION FIX: window.alert 제거 - DeviceCheckStep에서 socketError로 표시됨
    } finally {
      setIsStartingCounsel(false);
    }
  }, [
    connectCounselSocket,
    counselContent,
    counselingStyle,
    currentStep,
    deviceCheckState,
    isCameraEnabled,
    isConnectingSocket,
    isContentValid,
    isMicEnabled,
    isStartingCounsel,
    isTopicValid,
    logDebug,
    navigate,
    onClose,
    selectedMood,
    stopPreviewStream,
    topicValue,
  ]);

  const handleBack = useCallback(() => {
    logDebug("step:backClicked", { currentStep });
    if (currentStep === "topic") setCurrentStep("welcome");
    if (currentStep === "mood") setCurrentStep("topic");
    if (currentStep === "content") setCurrentStep("mood");
    if (currentStep === "device") setCurrentStep("content");
  }, [currentStep, logDebug]);

  const isNextDisabled =
    isStartingCounsel ||
    (currentStep === "topic" && !isTopicValid) ||
    (currentStep === "mood" && !selectedMood) ||
    (currentStep === "content" && !isContentValid) ||
    (currentStep === "device" && (deviceCheckState !== "ready" || isConnectingSocket));

  useEffect(() => {
    if (!isOpen) return;

    if (!initialTopic) {
      return;
    }

    const hasMatchingTopic = TOPIC_OPTIONS.some((topic) => topic.label === initialTopic);
    if (hasMatchingTopic) {
      setSelectedTopic(initialTopic);
      setCustomTopic("");
      return;
    }

    setSelectedTopic(CUSTOM_TOPIC_LABEL);
    setCustomTopic(initialTopic);
  }, [initialTopic, isOpen]);

  useEffect(() => {
    if (isOpen && currentStep === "device" && !hasCheckedDevices) {
      requestDevicePreview();
      return;
    }

    if (currentStep !== "device") {
      stopPreviewStream();
    }
  }, [currentStep, hasCheckedDevices, isOpen, requestDevicePreview, stopPreviewStream]);

  useEffect(() => {
    if (!isOpen) {
      stopPreviewStream();
      setCurrentStep("welcome");
      setDeviceCheckState("idle");
      setDeviceError("");
      setSocketError("");
      setIsConnectingSocket(false);
      setIsStartingCounsel(false);
      setPermissionState("unknown");
      setIsMicAvailable(null);
      setIsCameraAvailable(null);
      setHasMicTrack(false);
      setHasCameraTrack(false);
      setHasCheckedDevices(false);
      setIsMicEnabled(true);
      setIsCameraEnabled(true);
    }
  }, [isOpen, stopPreviewStream]);

  useEffect(() => {
    return () => {
      stopPreviewStream();
    };
  }, [stopPreviewStream]);

  useEffect(() => {
    logDebug("step:changed", {
      currentStep,
      hasCheckedDevices,
      deviceCheckState,
      isConnectingSocket,
    });
  }, [currentStep, deviceCheckState, hasCheckedDevices, isConnectingSocket, logDebug]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-3 backdrop-blur-sm sm:p-5">
      <button
        type="button"
        aria-label="상담 준비 모달 닫기"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pre-counsel-modal-title"
        className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-lg sm:h-[800px] sm:max-h-[calc(100vh-40px)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)]">
          <MemoizedStepInfoPanel
            currentStep={currentStep}
            stepNumber={stepNumber}
            selectedTopic={selectedTopic}
            customTopic={customTopic}
            selectedMood={selectedMood}
            selectedPromptId={selectedPromptId}
            counselContent={counselContent}
          />

          <div className="flex min-h-0 flex-col bg-white">
            <header className="border-b border-slate-100/40 bg-gradient-to-b from-white to-slate-50/20 px-5 py-4 sm:px-7">
              <StepIndicator currentStep={currentStep} progressPercent={progressPercent} />
            </header>

            <main className="min-h-0 flex-1 px-5 py-5 sm:px-7 sm:py-6">
              {currentStep === "welcome" && <WelcomeStep />}

              {currentStep === "topic" && (
                <TopicSelectionStep
                  selectedTopic={selectedTopic}
                  customTopic={customTopic}
                  onSelectTopic={setSelectedTopic}
                  onChangeCustomTopic={setCustomTopic}
                />
              )}

              {currentStep === "mood" && (
                <MoodSelectionStep selectedMood={selectedMood} onSelectMood={setSelectedMood} />
              )}

              {currentStep === "content" && (
                <ContentInputStep
                  content={counselContent}
                  selectedPrompt={selectedPrompt}
                  selectedPromptId={selectedPromptId}
                  onChangeContent={setCounselContent}
                  onSelectPrompt={setSelectedPromptId}
                />
              )}

              {currentStep === "device" && (
                <DeviceCheckStep
                  previewVideoRef={previewVideoRef}
                  deviceCheckState={deviceCheckState}
                  deviceError={deviceError}
                  socketError={socketError}
                  permissionState={permissionState}
                  isMicEnabled={isMicEnabled}
                  isCameraEnabled={isCameraEnabled}
                  isMicAvailable={isMicAvailable}
                  isCameraAvailable={isCameraAvailable}
                  hasMicTrack={hasMicTrack}
                  hasCameraTrack={hasCameraTrack}
                  onToggleMic={toggleMic}
                  onToggleCamera={toggleCamera}
                  onRequestDevicePreview={requestDevicePreview}
                />
              )}
            </main>

            <ModalFooter
              currentStep={currentStep}
              isNextDisabled={isNextDisabled}
              isConnectingSocket={isConnectingSocket || isStartingCounsel}
              onBack={handleBack}
              onNext={handleNext}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function isConnectedSocketPayload(payload: unknown): payload is { status: "connected" } {
  return typeof payload === "object" && payload !== null && "status" in payload && payload.status === "connected";
}

function isAuthFailedSocketPayload(payload: unknown): payload is { status: "auth_failed"; message?: string } {
  return typeof payload === "object" && payload !== null && "status" in payload && payload.status === "auth_failed";
}

function StepInfoPanel({
  currentStep,
  stepNumber,
  selectedTopic,
  customTopic,
  selectedMood,
  selectedPromptId,
  counselContent,
}: {
  currentStep: Step;
  stepNumber: number;
  selectedTopic: string | null;
  customTopic: string;
  selectedMood: string | null;
  selectedPromptId: string;
  counselContent: string;
}) {
  const meta = STEP_META[currentStep];
  const Icon = meta.icon;
  
  // 선택 정보 조회 헬퍼
  const getTopicLabel = useCallback(() => {
    if (!selectedTopic) return null;
    if (selectedTopic === CUSTOM_TOPIC_LABEL) return customTopic;
    const topic = TOPIC_OPTIONS.find(t => t.label === selectedTopic);
    return topic?.label || null;
  }, [selectedTopic, customTopic]);
  
  const getMoodLabel = useCallback(() => {
    if (!selectedMood) return null;
    const mood = MOOD_OPTIONS.find(m => m.id === selectedMood);
    return mood?.label || null;
  }, [selectedMood]);
  
  const getMoodDescription = useCallback(() => {
    if (!selectedMood) return null;
    const mood = MOOD_OPTIONS.find(m => m.id === selectedMood);
    return mood?.description || null;
  }, [selectedMood]);
  
  const getMoodIcon = useCallback(() => {
    if (!selectedMood) return null;
    const mood = MOOD_OPTIONS.find(m => m.id === selectedMood);
    return mood?.icon || null;
  }, [selectedMood]);
  
  const getPromptLabel = useCallback(() => {
    const prompt = CONTENT_PROMPTS.find(p => p.id === selectedPromptId);
    return prompt?.label || null;
  }, [selectedPromptId]);

  return (
    <aside className="relative flex overflow-hidden border-r border-slate-100/40 bg-gradient-to-b from-slate-50 to-white p-7 text-slate-900 flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,215,96,0.08),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(83,157,245,0.04),transparent_28%),linear-gradient(155deg,rgba(0,0,0,0.01),transparent_46%)]" />
      <div className="absolute bottom-16 left-0 right-0 h-96 rounded-t-3xl border-t border-slate-200/20 bg-gradient-to-t from-brand-green/6 via-brand-green/3 to-transparent" />

      <div className="relative z-10 flex h-full flex-col overflow-y-auto">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
          
          상담 준비
        </div>

        <div className="mt-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-green text-white shadow-lg">
            <Icon size={28} />
          </div>
          <p className="mt-6 text-xs font-bold uppercase text-brand-green">{meta.label}</p>
          <h2 id="pre-counsel-modal-title" className="mt-3 text-3xl font-extrabold leading-tight text-slate-900">
            {meta.title}
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">{meta.description}</p>
        </div>

        {/* 선택 정보 표시 */}
        {currentStep !== "welcome" && (
          <div className="mt-6 space-y-4">
            <p className="text-xs font-bold uppercase text-slate-500">선택된 정보</p>
            
            {/* Topic 정보 */}
            {getTopicLabel() && (
              <div className="rounded-lg border border-slate-200/60 bg-white/80 p-3">
                <p className="text-xs font-semibold text-slate-600">📌 주제</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{getTopicLabel()}</p>
              </div>
            )}
            
            {/* Mood 정보 */}
            {selectedMood && (
              <div className="rounded-lg border border-slate-200/60 bg-white/80 p-3">
                <p className="text-xs font-semibold text-slate-600">💭 마음 상태</p>
                <div className="mt-2 flex items-center gap-2">
                  {getMoodIcon() && (() => {
                    const MoodIcon = getMoodIcon() as LucideIcon;
                    return <MoodIcon size={16} className="text-slate-600" />;
                  })()}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{getMoodLabel()}</p>
                    <p className="text-xs text-slate-500">{getMoodDescription()}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content Prompt & Content 정보 */}
            {counselContent && getPromptLabel() && (
              <div className="rounded-lg border border-slate-200/60 bg-white/80 p-3">
                <p className="text-xs font-semibold text-slate-600">✍️ 작성 내용</p>
                <p className="mt-2 text-xs font-medium text-slate-700">{getPromptLabel()}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-700">{counselContent}</p>
              </div>
            )}
          </div>
        )}

        <div className="relative z-10 mt-auto pt-6">
          <p className="text-xs font-semibold text-slate-500">
            {currentStep === "welcome" ? "상담 준비 전 안내" : `${Math.max(stepNumber, 1)} / 4 단계 진행 중`}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {PROGRESS_STEPS.map((step, index) => {
              const isActive = step === currentStep;
              const isCompleted = PROGRESS_STEPS.indexOf(currentStep) > index;
              return (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-colors ${
                    isActive || isCompleted ? "bg-brand-green" : "bg-white/15"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

const MemoizedStepInfoPanel = memo(StepInfoPanel);

function StepIndicator({ currentStep, progressPercent }: { currentStep: Step; progressPercent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-brand-green">{STEP_META[currentStep].label}</p>
          <h3 className="mt-1 truncate text-lg font-extrabold text-white sm:text-xl">{STEP_META[currentStep].title}</h3>
        </div>
        <div className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 sm:flex">
          {PROGRESS_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-1.5">
              <span className={step === currentStep ? "text-brand-green" : "text-white/45"}>{index + 1}</span>
              {index < PROGRESS_STEPS.length - 1 && <ChevronRight size={12} />}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-green transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

function WelcomeStep() {
  const cards = [
    {
      title: "주제 선택",
      description: "오늘 다루고 싶은 고민 영역을 고릅니다.",
      icon: Target,
    },
    {
      title: "마음 상태",
      description: "현재 감정에 가까운 카드를 선택합니다.",
      icon: HeartPulse,
    },
    {
      title: "장치 확인",
      description: "상담 시작 전 카메라와 마이크를 점검합니다.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-brand-green">편안한 시작을 위한 짧은 준비</p>
        <h3 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
          상담사가 처음부터 맥락을 이해할 수 있게 도와드릴게요.
        </h3>
        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          주제, 현재 마음, 전하고 싶은 내용을 간단히 알려주시면 상담의 첫 질문이 더 자연스럽게 이어집니다.
        </p>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-lg border border-slate-100/50 bg-slate-50/50 p-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                <Icon size={20} />
              </div>
              <h4 className="mt-4 text-sm font-semibold text-slate-900">{card.title}</h4>
              <p className="mt-2 text-xs leading-5 text-slate-600">{card.description}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TopicSelectionStep({
  selectedTopic,
  customTopic,
  onSelectTopic,
  onChangeCustomTopic,
}: {
  selectedTopic: string | null;
  customTopic: string;
  onSelectTopic: (topic: string) => void;
  onChangeCustomTopic: (topic: string) => void;
}) {
  const isCustomSelected = selectedTopic === CUSTOM_TOPIC_LABEL;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900">어떤 이야기를 나누고 싶으신가요?</h3>
        <p className="mt-2 text-sm text-slate-600">카드를 선택하면 다음 단계로 이동할 준비가 됩니다.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TOPIC_OPTIONS.map((topic) => {
          const Icon = topic.icon;
          const isSelected = selectedTopic === topic.label;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic.label)}
              className={`group flex min-h-[104px] items-start gap-3 rounded-lg border p-4 text-left transition ${
                isSelected
                  ? "border-brand-green bg-brand-green/8 text-slate-900"
                  : "border-slate-200/60 bg-slate-50/50 text-slate-700 hover:border-brand-green/30 hover:bg-white"
              }`}
            >
              <span
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition ${
                  isSelected ? "bg-brand-green text-white" : "bg-slate-100/70 text-slate-600"
                }`}
              >
                <Icon size={21} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{topic.label}</span>
                <span className="mt-1.5 block text-xs leading-5 text-slate-600">{topic.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {isCustomSelected && (
        <label className="block rounded-lg border border-brand-green/20 bg-brand-green/5 p-4">
          <span className="text-sm font-semibold text-slate-900">직접 입력</span>
          <input
            value={customTopic}
            onChange={(event) => onChangeCustomTopic(event.target.value)}
            placeholder="예: 발표 불안, 가족과의 대화, 반복되는 걱정"
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
          <span className="mt-2 block text-xs text-slate-500">2자 이상 입력하면 다음 단계로 이동할 수 있어요.</span>
        </label>
      )}
    </div>
  );
}

function MoodSelectionStep({
  selectedMood,
  onSelectMood,
}: {
  selectedMood: string | null;
  onSelectMood: (mood: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900">지금 마음에 가장 가까운 상태를 골라주세요.</h3>
        <p className="mt-2 text-sm text-slate-600">
          감정 강도는 별도 전송하지 않고, 선택한 감정 이름만 기존 WebSocket 계약에 맞춰 전달합니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MOOD_OPTIONS.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => onSelectMood(mood.id)}
              className={`flex min-h-[116px] items-start gap-4 rounded-lg border p-4 text-left transition ${
                isSelected
                  ? "border-brand-green bg-brand-green/8 text-slate-900"
                  : "border-slate-200/60 bg-slate-50/50 text-slate-700 hover:border-brand-green/30 hover:bg-white"
              }`}
            >
              <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-brand-green text-white" : "bg-slate-100/70 text-slate-600"}`}>
                <Icon size={23} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  {mood.label}
                  {isSelected && <CheckCircle2 size={16} className="text-brand-green" />}
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-600">{mood.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContentInputStep({
  content,
  selectedPrompt,
  selectedPromptId,
  onChangeContent,
  onSelectPrompt,
}: {
  content: string;
  selectedPrompt: ContentPrompt;
  selectedPromptId: string;
  onChangeContent: (content: string) => void;
  onSelectPrompt: (promptId: string) => void;
}) {
  const trimmedLength = content.trim().length;
  const isValid = trimmedLength >= 10;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900">상담 전에 알아두면 좋은 내용을 적어주세요.</h3>
        <p className="mt-2 text-sm text-slate-600">아래 질문 중 하나를 기준으로 짧게 시작해도 충분합니다.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelectPrompt(prompt.id)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              selectedPromptId === prompt.id
                ? "border-brand-green/50 bg-brand-green text-white"
                : "border-slate-200/60 bg-slate-50 text-slate-600 hover:border-brand-green/30 hover:bg-white"
            }`}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="sr-only">상담 내용 입력</span>
        <textarea
          value={content}
          onChange={(event) => onChangeContent(event.target.value)}
          placeholder={selectedPrompt.placeholder}
          rows={8}
          className="h-[200px] w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
        />
      </label>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-100/50 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs font-semibold ${isValid ? "text-brand-green" : "text-slate-500"}`}>
          {isValid ? "좋아요. 이 내용으로 상담을 시작할 수 있어요." : "조금만 더 적어주시면 상담 흐름을 잡기 쉬워요."}
        </p>
        <p className="text-xs font-semibold text-slate-400">{trimmedLength}자 입력됨 / 최소 10자</p>
      </div>
    </div>
  );
}

function DeviceCheckStep({
  previewVideoRef,
  deviceCheckState,
  deviceError,
  socketError,
  permissionState,
  isMicEnabled,
  isCameraEnabled,
  isMicAvailable,
  isCameraAvailable,
  hasMicTrack,
  hasCameraTrack,
  onToggleMic,
  onToggleCamera,
  onRequestDevicePreview,
}: {
  previewVideoRef: React.RefObject<HTMLVideoElement | null>;
  deviceCheckState: DeviceCheckState;
  deviceError: string;
  socketError: string;
  permissionState: PermissionState;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isMicAvailable: boolean | null;
  isCameraAvailable: boolean | null;
  hasMicTrack: boolean;
  hasCameraTrack: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onRequestDevicePreview: () => void;
}) {
  const isChecking = deviceCheckState === "checking";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900">장치 상태를 확인하고 시작할게요.</h3>
        <p className="mt-2 text-sm text-slate-600">권한 요청이 보이면 허용을 눌러주세요. 확인 후 카메라와 마이크는 직접 끌 수 있습니다.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="overflow-hidden rounded-lg border border-slate-200/60 bg-slate-100">
          <div className="relative aspect-video min-h-[260px]">
            <video ref={previewVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            {(deviceCheckState !== "ready" || !hasCameraTrack || !isCameraEnabled) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 px-6 text-center backdrop-blur-sm">
                <div>
                  <Camera size={34} className="mx-auto text-slate-400" />
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    {isChecking
                      ? "장치 상태를 확인하고 있습니다."
                      : !hasCameraTrack
                        ? "카메라 영상이 없습니다."
                        : !isCameraEnabled
                          ? "카메라가 꺼져 있습니다."
                          : "카메라 미리보기를 불러오지 못했습니다."}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">마이크만으로도 상담 진행은 가능할 수 있습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-100/50 bg-slate-50/30 p-3 xl:border-l xl:border-t-0 xl:rounded-none">
          <h4 className="text-xs font-semibold text-slate-600">장치 상태</h4>
          <DeviceStatusCard
            icon={Video}
            title="카메라"
            isEnabled={isCameraEnabled}
            isAvailable={isCameraAvailable}
            hasTrack={hasCameraTrack}
            onToggle={onToggleCamera}
            disabled={deviceCheckState !== "ready" || !isCameraAvailable || !hasCameraTrack}
          />
          <DeviceStatusCard
            icon={Mic}
            title="마이크"
            isEnabled={isMicEnabled}
            isAvailable={isMicAvailable}
            hasTrack={hasMicTrack}
            onToggle={onToggleMic}
            disabled={deviceCheckState !== "ready" || !isMicAvailable || !hasMicTrack}
          />

          <button
            type="button"
            onClick={onRequestDevicePreview}
            disabled={isChecking}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={isChecking ? "animate-spin" : ""} />
            다시 확인
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {permissionState === "denied" && (
          <StatusMessage tone="error" message="브라우저 주소창의 권한 아이콘에서 카메라와 마이크 접근을 허용해 주세요." />
        )}
        {deviceCheckState === "ready" && (
          <StatusMessage tone="success" message="장치 확인이 완료되었습니다. 상담 시작 버튼을 누르면 서버 연결을 준비합니다." />
        )}
        {deviceCheckState === "error" && deviceError && <StatusMessage tone="error" message={deviceError} />}
        {deviceCheckState === "ready" && deviceError && <StatusMessage tone="warning" message={deviceError} />}
        {socketError && <StatusMessage tone="error" message={socketError} />}
      </div>
    </div>
  );
}

function DeviceStatusCard({
  icon: Icon,
  title,
  isEnabled,
  isAvailable,
  hasTrack,
  disabled,
  onToggle,
}: {
  icon: LucideIcon;
  title: string;
  isEnabled: boolean;
  isAvailable: boolean | null;
  hasTrack: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const statusLabel = isAvailable === false ? "장치 없음" : hasTrack ? (isEnabled ? "켜짐" : "꺼짐") : "확인 필요";
  const statusClassName =
    isAvailable === false ? "text-semantic-negative" : hasTrack && isEnabled ? "text-brand-green" : "text-slate-500";

  return (
    <article className="rounded-lg border border-slate-100/50 bg-slate-50/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Icon size={18} />
          {title}
        </div>
        <span className={`text-xs font-semibold ${statusClassName}`}>{statusLabel}</span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="mt-3 min-h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isAvailable === false ? `${title} 미감지` : !hasTrack ? `${title} 신호 없음` : isEnabled ? `${title} 끄기` : `${title} 켜기`}
      </button>
    </article>
  );
}

function StatusMessage({ tone, message }: { tone: "success" | "warning" | "error"; message: string }) {
  const toneClassName = {
    success: "border-brand-green/20 bg-brand-green/8 text-brand-green",
    warning: "border-semantic-warning/20 bg-semantic-warning/8 text-semantic-warning",
    error: "border-semantic-negative/20 bg-semantic-negative/8 text-semantic-negative",
  }[tone];
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <p className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${toneClassName}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function ModalFooter({
  currentStep,
  isNextDisabled,
  isConnectingSocket,
  onBack,
  onNext,
}: {
  currentStep: Step;
  isNextDisabled: boolean;
  isConnectingSocket: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const nextLabel =
    currentStep === "welcome"
      ? "상담 준비 시작하기"
      : currentStep === "device"
        ? isConnectingSocket
          ? "상담 서버 연결 중..."
          : "상담 시작하기"
        : "다음";

  return (
    <footer className="border-t border-slate-100/50 bg-gradient-to-b from-white to-slate-50/30 px-5 py-4 sm:px-7">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {currentStep !== "welcome" && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] sm:min-w-32"
          >
            <ArrowLeft size={17} />
            이전
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-green px-6 py-3 text-sm font-extrabold text-dark-base transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 sm:min-w-44"
        >
          {nextLabel}
          <ArrowRight size={17} />
        </button>
      </div>
    </footer>
  );
}
