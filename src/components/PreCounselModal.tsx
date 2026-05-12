import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, X, Mic, Video, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { clearActiveCounselSocket, setActiveCounselSocket } from "../utils/wsSession";
import { startCounselingSessionApi } from "../utils/counselingApi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
};

type Step = "welcome" | "topic" | "mood" | "content" | "device";

const COUNSEL_WS_BASE_URL = import.meta.env.VITE_COUNSEL_WS_BASE_URL?.replace(/\/+$/, "") ?? "";

const DEV_LOG_PREFIX = "[PreCounselModal]";

export default function PreCounselModal({ isOpen, onClose, initialTopic }: Props) {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const counselingStyle: "empathy" = "empathy";
  const [counselContent, setCounselContent] = useState<string>("");
  const [deviceCheckState, setDeviceCheckState] = useState<"idle" | "checking" | "ready" | "error">("idle");
  const [deviceError, setDeviceError] = useState("");
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicAvailable, setIsMicAvailable] = useState<boolean | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null);
  const [hasMicTrack, setHasMicTrack] = useState(false);
  const [hasCameraTrack, setHasCameraTrack] = useState(false);
  const [permissionState, setPermissionState] = useState<"unknown" | "prompt" | "granted" | "denied">("unknown");
  const [hasCheckedDevices, setHasCheckedDevices] = useState(false);
  const [isConnectingSocket, setIsConnectingSocket] = useState(false);
  const [socketError, setSocketError] = useState("");
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && initialTopic) {
      setSelectedTopic(initialTopic);
    }
  }, [initialTopic, isOpen]);

  const logDebug = useCallback((event: string, payload?: unknown) => {
    if (!import.meta.env.DEV) return;
    const time = new Date().toISOString();
    if (typeof payload === "undefined") {
      console.log(`${DEV_LOG_PREFIX} ${time} ${event}`);
      return;
    }
    console.log(`${DEV_LOG_PREFIX} ${time} ${event}`, payload);
  }, []);

  const moods = useMemo(
    () => [
      { id: "happy", emoji: "😊", label: "좋음" },
      { id: "calm", emoji: "🙂", label: "평온" },
      { id: "anxious", emoji: "😟", label: "불안" },
      { id: "sad", emoji: "😢", label: "우울" },
      { id: "angry", emoji: "😠", label: "화남" },
    ],
    []
  );

  const topics = useMemo(
    () => [
      "직장 스트레스",
      "불면증 케어",
      "이별과 상실",
      "자존감 회복",
      "대인관계",
      "진로 고민",
      "건강 문제",
      "기타",
    ],
    []
  );

  const getStepNumber = useCallback(() => {
    const steps: Step[] = ["welcome", "topic", "mood", "content", "device"];
    return steps.indexOf(currentStep);
  }, [currentStep]);

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
      setDeviceError("이 브라우저는 카메라/마이크 장치 확인을 지원하지 않습니다.");
      setPermissionState("denied");
      setHasCheckedDevices(true);
      logDebug("deviceCheck:unsupported", {
        reason: "getUserMedia unavailable",
      });
      return;
    }

    setDeviceCheckState("checking");
    setDeviceError("");
    setPermissionState("prompt");

    try {
      stopPreviewStream();
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
        } catch {
          // enumerateDevices 실패 시 실제 트랙 기준으로 상태를 판단합니다.
          logDebug("deviceCheck:enumerateDevicesFailed");
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
          lastError = error;
          const errName = error instanceof DOMException ? error.name : "unknown";
          logDebug("deviceCheck:getUserMediaFailed", {
            constraints,
            errName,
            error,
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
        logDebug("deviceCheck:noUsableTracks");
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
        setDeviceError("카메라는 감지되지만 현재 신호를 열 수 없습니다. 다른 앱에서 사용 중인지 확인 후 다시 확인해 주세요.");
      }

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.onloadedmetadata = () => {
          logDebug("deviceCheck:videoMetadataLoaded");
          void previewVideoRef.current?.play().catch(() => {
            // 사용자 제스처/브라우저 정책으로 재생이 막힐 수 있어 실패를 무시합니다.
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
      setDeviceCheckState("error");
      const errName = error instanceof DOMException ? error.name : "";
      if (errName === "NotAllowedError" || errName === "SecurityError") {
        setPermissionState("denied");
        setDeviceError("카메라/마이크 권한이 차단되었습니다. 브라우저 설정에서 권한을 허용한 뒤 다시 확인해주세요.");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setPermissionState("denied");
        setDeviceError("연결된 카메라/마이크를 찾지 못했습니다. 장치 연결 상태를 확인해주세요.");
      } else {
        setPermissionState("prompt");
        setDeviceError("카메라/마이크 상태 확인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
      setHasCheckedDevices(true);
      logDebug("deviceCheck:error", {
        errName,
        error,
      });
    }
  }, [stopPreviewStream, currentStep, hasCheckedDevices, logDebug]);

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
      setDeviceCheckState("idle");
      setDeviceError("");
      setSocketError("");
      setIsConnectingSocket(false);
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

  const buildClientId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const connectCounselSocket = useCallback(
    async () => {
      setSocketError("");
      setIsConnectingSocket(true);

      if (!COUNSEL_WS_BASE_URL) {
        setSocketError("상담 서버 주소가 설정되지 않았습니다. VITE_COUNSEL_WS_BASE_URL을 확인해주세요.");
        setIsConnectingSocket(false);
        throw new Error("Missing VITE_COUNSEL_WS_BASE_URL");
      }

      const clientId = buildClientId();
      const wsUrl = `${COUNSEL_WS_BASE_URL}/${encodeURIComponent(clientId)}`;
      const socket = new WebSocket(wsUrl);
      logDebug("socket:connectStart", {
        clientId,
        wsUrl,
      });

      try {
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const timeoutId = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            logDebug("socket:timeout", { ms: 8000, clientId });
            reject(new Error("상담 서버 연결 시간이 초과되었습니다."));
          }, 8000);

          const cleanup = () => {
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
            logDebug("socket:open", { clientId, readyState: socket.readyState });
          };

          const handleMessage = (event: MessageEvent<string>) => {
            logDebug("socket:messageRaw", event.data);
            try {
              const payload = JSON.parse(event.data);
              logDebug("socket:messageParsed", payload);
              if (payload?.status === "connected") {
                if (settled) return;
                settled = true;
                cleanup();
                logDebug("socket:connectedAck", payload);
                resolve();
              }
            } catch {
              // no-op
              logDebug("socket:messageParseFailed", event.data);
            }
          };

          const handleError = () => {
            logDebug("socket:errorEvent", {
              clientId,
              readyState: socket.readyState,
            });
            finalizeReject(new Error("상담 서버 연결에 실패했습니다."));
          };

          const handleClose = (event: CloseEvent) => {
            logDebug("socket:closeEvent", {
              clientId,
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

        setActiveCounselSocket(socket, clientId);
        logDebug("socket:storedInSession", { clientId });
        return clientId;
      } catch (error) {
        try {
          socket.close();
        } catch {
          // no-op
        }
        clearActiveCounselSocket(false);
        logDebug("socket:connectFailed", { clientId, error });
        throw error;
      } finally {
        setIsConnectingSocket(false);
        logDebug("socket:connectEnd", { clientId });
      }
    },
    [logDebug]
  );

  const handleNext = useCallback(async () => {
    logDebug("step:nextClicked", {
      currentStep,
      selectedTopic,
      selectedMood,
      contentLength: counselContent.length,
      deviceCheckState,
      isConnectingSocket,
    });
    if (currentStep === "welcome") {
      setCurrentStep("topic");
    } else if (currentStep === "topic" && selectedTopic) {
      setCurrentStep("mood");
    } else if (currentStep === "mood" && selectedMood) {
      setCurrentStep("content");
    } else if (currentStep === "content" && counselContent.length >= 10) {
      setCurrentStep("device");
    } else if (currentStep === "device") {
      if (deviceCheckState !== "ready") {
        return;
      }
      if (!selectedTopic || !selectedMood) {
        return;
      }

      try {
        const ticketResponse = await startCounselingSessionApi();
        const wsClientId = await connectCounselSocket();
        logDebug("step:socketReadyNavigate", { wsClientId, ticketId: ticketResponse.ticketId });

        stopPreviewStream();
        onClose();
        navigate("/counsel", {
          state: {
            sessionId: ticketResponse.ticketId,
            local: true,
            topic: selectedTopic,
            mood: selectedMood,
            style: counselingStyle,
            content: counselContent,
            wsClientId,
            ticketId: ticketResponse.ticketId,
            device: {
              micEnabled: isMicEnabled,
              cameraEnabled: isCameraEnabled,
            },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "상담 서버 연결에 실패했습니다.";
        setSocketError(message);
        logDebug("step:socketConnectFailed", { message, error });
        window.alert(message);
      }
    }
  }, [currentStep, selectedTopic, selectedMood, counselContent, onClose, navigate, counselingStyle, stopPreviewStream, deviceCheckState, isMicEnabled, isCameraEnabled, connectCounselSocket, isConnectingSocket, logDebug]);

  const handleBack = useCallback(() => {
    logDebug("step:backClicked", { currentStep });
    if (currentStep === "topic") {
      setCurrentStep("welcome");
    } else if (currentStep === "mood") {
      setCurrentStep("topic");
    } else if (currentStep === "content") {
      setCurrentStep("mood");
    } else if (currentStep === "device") {
      setCurrentStep("content");
    }
  }, [currentStep, logDebug]);

  useEffect(() => {
    logDebug("step:changed", {
      currentStep,
      hasCheckedDevices,
      deviceCheckState,
      isConnectingSocket,
    });
  }, [currentStep, hasCheckedDevices, deviceCheckState, isConnectingSocket, logDebug]);

  const stepNumber = getStepNumber();
  const progressPercent = (stepNumber / 4) * 100;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 will-change-transform">
      <div className="absolute inset-0 bg-foreground/10 transition-opacity cursor-pointer" onClick={onClose}></div>

      <div 
        className="relative z-10 flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-dark bg-dark-surface will-change-contents sm:h-auto sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-md p-2 text-base/40 transition hover:bg-dark-elevated hover:text-base/70 sm:right-4 sm:top-4"
        >
          <X size={24} />
        </button>

        {/* 프로그레스 바 */}
        {currentStep !== "welcome" && (
          <div className="h-1 bg-border will-change-auto">
            <div
              className="h-full bg-brand-green transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="p-5 sm:p-8 min-h-80 flex-1 overflow-y-auto will-change-auto">
          {/* STEP 0: 환영 메시지 */}
          {currentStep === "welcome" && (
            <div className="space-y-6 flex flex-col justify-center animate-fade-in">
              <div className="text-center space-y-3">
                <div className="text-4xl sm:text-5xl mb-4">🌟</div>
                <h2 className="text-2xl font-bold text-base sm:text-3xl">어서오세요!</h2>
                <p className="text-lg font-semibold text-brand-green sm:text-xl">AI 상담가 어튠이에요</p>
                <p className="mt-4 text-sm leading-relaxed text-base/60 sm:text-base">
                  오늘은 어떤 이야기를 나누고 싶으신가요?<br />
                  저와 함께 당신의 마음을 나누어봅시다.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: 주제 선택 */}
          {currentStep === "topic" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                  <p className="mb-2 text-xs text-base/50 sm:text-sm">STEP 1 / 3</p>
                  <h3 className="text-xl font-bold leading-snug text-base sm:text-2xl">
                  어떤 분야의 상담을 원하세요?
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 sm:pr-2">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`p-3.5 rounded-lg text-left text-sm font-semibold transition-all border-2 will-change-transform sm:text-base ${
                      selectedTopic === topic
                        ? "border-primary bg-dark-elevated text-brand-green"
                        : "border-dark bg-dark-surface text-base/70 hover:border-primary/30"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: 기분 선택 */}
          {currentStep === "mood" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="mb-2 text-xs text-base/50 sm:text-sm">STEP 2 / 3</p>
                <h3 className="text-xl font-bold leading-snug text-base sm:text-2xl">
                  {selectedTopic}에 대한 이야기를 하고싶군요!
                </h3>
                <p className="mt-2 text-sm text-base/60 sm:text-base">현재 기분은 어떠신가요?</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all will-change-transform ${
                      selectedMood === mood.id
                        ? "border-primary bg-brand-green text-white"
                        : "border-dark bg-dark-elevated text-base/70 hover:bg-dark-surface"
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl">{mood.emoji}</span>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold ${
                        selectedMood === mood.id ? "text-white" : "text-base/60"
                      }`}
                    >
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* STEP 3: 상담 내용 입력 */}
          {currentStep === "content" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="mb-2 text-xs text-base/50 sm:text-sm">STEP 3 / 4</p>
                <h3 className="text-xl font-bold leading-snug text-base sm:text-2xl">
                  거의 다 왔어요!
                </h3>
                <p className="mt-2 text-sm text-base/60 sm:text-base">상담하고 싶은 내용을 자유롭게 적어주세요</p>
              </div>
              <div className="space-y-2">
                <textarea
                  value={counselContent}
                  onChange={(e) => setCounselContent(e.target.value)}
                  placeholder="당신의 고민을 자유롭게 적어주세요..."
                  className="w-full resize-none rounded-lg border-2 border-dark p-4 text-sm will-change-auto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-base"
                  rows={6}
                />
                <div className="text-right text-xs text-base/50">
                  {counselContent.length}자 입력됨 (최소 10자)
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 카메라/마이크 설정 확인 */}
          {currentStep === "device" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="mb-2 text-xs text-base/50 sm:text-sm">STEP 4 / 4</p>
                <h3 className="text-xl font-bold leading-snug text-base sm:text-2xl">
                  카메라/마이크 설정 확인
                </h3>
                <p className="mt-2 text-sm text-base/60 sm:text-base">
                  상담 시작 전 장치 상태를 확인해주세요.
                </p>
              </div>

              <div className="rounded-lg border border-dark bg-dark-elevated p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-dark bg-dark-surface p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-base sm:text-base">
                        <Video size={18} />
                        카메라
                      </div>
                      {deviceCheckState === "ready" ? (
                        <span className={`text-xs font-bold ${isCameraAvailable === false ? "text-rose-600" : isCameraEnabled ? "text-brand-green" : "text-base/50"}`}>
                          {isCameraAvailable === false ? "장치 없음" : hasCameraTrack ? (isCameraEnabled ? "켜짐" : "꺼짐") : "사용 불가"}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-base/50">확인 필요</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      disabled={deviceCheckState !== "ready" || !isCameraAvailable || !hasCameraTrack}
                      className="mt-3 w-full rounded-lg border border-dark bg-dark-surface px-3 py-2 text-sm font-semibold text-base/70 transition-colors hover:bg-dark-elevated disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCameraAvailable === false
                        ? "카메라 미지원"
                        : !hasCameraTrack
                        ? "카메라 신호 없음"
                        : isCameraEnabled
                        ? "카메라 끄기"
                        : "카메라 켜기"}
                    </button>
                  </div>

                  <div className="rounded-lg border border-dark bg-dark-surface p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-base sm:text-base">
                        <Mic size={18} />
                        마이크
                      </div>
                      {deviceCheckState === "ready" ? (
                        <span className={`text-xs font-bold ${isMicAvailable === false ? "text-rose-600" : isMicEnabled ? "text-brand-green" : "text-base/50"}`}>
                          {isMicAvailable === false ? "장치 없음" : hasMicTrack ? (isMicEnabled ? "켜짐" : "꺼짐") : "사용 불가"}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-base/50">확인 필요</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={toggleMic}
                      disabled={deviceCheckState !== "ready" || !isMicAvailable || !hasMicTrack}
                      className="mt-3 w-full rounded-lg border border-dark bg-dark-surface px-3 py-2 text-sm font-semibold text-base/70 transition-colors hover:bg-dark-elevated disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isMicAvailable === false
                        ? "마이크 미지원"
                        : !hasMicTrack
                        ? "마이크 신호 없음"
                        : isMicEnabled
                        ? "마이크 끄기"
                        : "마이크 켜기"}
                    </button>
                  </div>
                </div>

                <div className="relative mt-4 aspect-video overflow-hidden rounded-lg border border-dark bg-foreground">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  {deviceCheckState !== "ready" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-700/60 px-4 text-center text-xs sm:text-sm text-white">
                      {deviceCheckState === "checking"
                        ? "장치 상태를 확인하고 있습니다..."
                        : isCameraAvailable === false
                        ? "카메라가 감지되지 않았습니다. 마이크만으로도 상담은 가능합니다."
                        : "카메라 미리보기를 불러올 수 없습니다."}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={requestDevicePreview}
                    disabled={deviceCheckState === "checking"}
                    className="inline-flex items-center gap-2 rounded-lg border border-dark bg-dark-surface px-3 py-2 text-sm font-semibold text-base/70 transition-colors hover:bg-dark-elevated disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    다시 확인
                  </button>

                  {permissionState === "denied" && (
                    <p className="text-xs text-base/50">브라우저 주소창의 권한 아이콘에서 카메라/마이크 접근을 허용해 주세요.</p>
                  )}

                  {deviceCheckState === "ready" && (
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green">
                      <CheckCircle2 size={16} />
                      카메라/마이크 확인 완료
                    </p>
                  )}

                  {deviceCheckState === "error" && (
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                      <AlertCircle size={16} />
                      {deviceError}
                    </p>
                  )}

                  {deviceCheckState === "ready" && deviceError && (
                    <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <AlertCircle size={14} />
                      {deviceError}
                    </p>
                  )}

                  {socketError && (
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                      <AlertCircle size={16} />
                      {socketError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-3 border-t border-dark bg-dark-elevated p-4 will-change-auto sm:p-6">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            {currentStep !== "welcome" && (
              <button
                onClick={handleBack}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dark px-4 py-3 font-bold text-base/70 transition-colors will-change-transform hover:bg-dark-surface disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
              >
                <ArrowLeft size={18} />
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={
                (currentStep === "topic" && !selectedTopic) ||
                (currentStep === "mood" && !selectedMood) ||
                (currentStep === "content" && counselContent.length < 10) ||
                (currentStep === "device" && (deviceCheckState !== "ready" || isConnectingSocket))
              }
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold transition will-change-transform sm:flex-1 ${
                currentStep === "topic" && !selectedTopic
                  ? "cursor-not-allowed bg-dark-elevated text-base/40"
                  : currentStep === "mood" && !selectedMood
                  ? "cursor-not-allowed bg-dark-elevated text-base/40"
                  : currentStep === "content" && counselContent.length < 10
                  ? "cursor-not-allowed bg-dark-elevated text-base/40"
                  : currentStep === "device" && (deviceCheckState !== "ready" || isConnectingSocket)
                  ? "cursor-not-allowed bg-dark-elevated text-base/40"
                  : "bg-brand-green text-white hover:opacity-90"
              }`}
            >
              {currentStep === "device" ? (
                <>
                  {isConnectingSocket ? "상담 서버 연결 중..." : "상담 시작하기"}
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  다음
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
