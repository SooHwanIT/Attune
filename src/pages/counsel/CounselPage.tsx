import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Avatar from "../../components/Avatar";
import { getAIResponse, getVoice } from "../../utils/api";
import { audioPlayer } from "../../utils/audioPlayer";
import { Mic, MicOff, Video, VideoOff, Send, PhoneOff } from "lucide-react"; // 아이콘 추가

export default function CounselPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("neutral");
  const [currentAnimation, setCurrentAnimation] = useState<
    "idle" | "greeting" | "pose1" | "pose2" | "pose3" | "pose4" | "pose5"
  >("idle");
  const [chatLog, setChatLog] = useState<{ role: string; text: string }[]>([]);
  
  // --- [기존] 로딩 상태 ---
  const [pageLoading, setPageLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // --- [추가] 미디어(캠/마이크) 상태 관리 ---
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isListening, setIsListening] = useState(false); // 음성 인식 중인지 여부
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- [추가] Web Speech API (음성 인식) 설정 ---
  // @ts-ignore (TypeScript에서 SpeechRecognition 타입을 인식 못할 경우를 대비)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false; // 한 문장 끝나면 인식 종료
      recognition.current.lang = "ko-KR"; // 한국어 설정
      recognition.current.interimResults = false;

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript); // 인식되자마자 바로 전송 (대화하는 느낌)
        setIsListening(false);
      };

      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // --- [추가] 카메라/마이크 스트림 가져오기 ---
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
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setIsCamOn(false);
        setIsMicOn(false);
      }
    };

    // 페이지 로딩이 끝나면 미디어 요청
    if (!pageLoading) {
      getMedia();
    }

    return () => {
      // 컴포넌트 언마운트 시 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [pageLoading]);

  // --- [추가] 마이크/카메라 토글 핸들러 ---
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => (track.enabled = !isMicOn));
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => (track.enabled = !isCamOn));
      setIsCamOn(!isCamOn);
    }
  };

  // 음성 인식 시작
  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  // --- 기존 로직 ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          setTimeout(() => setPageLoading(false), 800);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const getLoadingText = (pct: number) => {
    if (pct < 30) return "AI 상담사를 연결하고 있습니다...";
    if (pct < 70) return "카메라와 마이크 권한을 확인 중입니다..."; // 텍스트 변경
    if (pct < 100) return "상담 환경을 구성하는 중입니다...";
    return "준비 완료!";
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    setInput("");
    setLoading(true);
    setChatLog((prev) => [...prev, { role: "user", text: textToSend }]);

    const detected = detectAnimationFromText(textToSend);
    if (detected) setCurrentAnimation(detected);

    await audioPlayer.resumeContext();

    try {
      const aiResponse = await getAIResponse(textToSend);
      setChatLog((prev) => [...prev, { role: "assistant", text: aiResponse.text }]);
      setEmotion(aiResponse.emotion);

      const audioData = await getVoice(aiResponse.text);
      
      const animationCycleInterval = setInterval(() => {
        const animations: Array<"idle" | "greeting" | "pose1" | "pose2" | "pose3" | "pose4" | "pose5"> = [
          "greeting", "pose1", "pose2", "pose3", "pose4", "pose5"
        ];
        const randomAnim = animations[Math.floor(Math.random() * animations.length)];
        setCurrentAnimation(randomAnim);
      }, 1500);

      await audioPlayer.play(audioData, () => {
        clearInterval(animationCycleInterval);
        setCurrentAnimation("idle");
        setEmotion("neutral");
      });

    } catch (e) {
      console.error(e);
      setChatLog((prev) => [...prev, { role: "system", text: "오류가 발생했습니다." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  function detectAnimationFromText(text: string): "idle" | "greeting" | "pose1" | "pose2" | "pose3" | "pose4" | "pose5" | null {
    const t = text.toLowerCase();
    if (/(회전|spin|돌아|돌려)/.test(t)) return "pose3";
    if (/(안녕|반가워)/.test(t)) return "greeting";
    // ... 기존 감지 로직
    return null;
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 font-sans text-slate-800 relative">
      
      {/* 로딩 모달 */}
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md transition-opacity duration-500">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-[#E8F3EE] rounded-full flex items-center justify-center text-3xl mb-6 mx-auto animate-bounce">
              📷
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Attune AI</h2>
            <p className="text-sm text-slate-500 mb-6 h-5">{getLoadingText(progress)}</p>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-[#00C362] rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                 <div className="absolute top-0 right-0 bottom-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00C362] flex items-center justify-center text-white text-lg shadow-sm">
            🤖
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-sm tracking-tight">Attune AI Care</h1>
            <p className="text-slate-500 text-[10px] font-medium">Video Call Session</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-red-50 text-red-500 text-xs font-bold rounded border border-red-100 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE
            </span>
            <button className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      </header>

      {/* 메인 콘텐츠 (Split View) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto lg:p-6 gap-6">
        
        {/* 왼쪽: 채팅 영역 (보조 수단으로 유지) */}
        <div className="hidden lg:flex flex-1 lg:flex-[0.4] bg-white lg:rounded-2xl lg:shadow-sm border border-gray-100 flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-white">
             <span className="text-xs font-bold text-slate-400">CHAT LOG</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scrollbar-hide">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2 text-xs leading-relaxed shadow-sm ${
                   msg.role === "user" ? "bg-[#00C362] text-white rounded-xl rounded-tr-none" : "bg-gray-100 text-slate-700 rounded-xl rounded-tl-none"
                }`}>
                    {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 오른쪽: 3D 아바타 & 화상 통화 메인 화면 */}
        <div className="flex-1 lg:rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 bg-gradient-to-b from-[#E8F3EE] to-white group">
          
          {/* 감정 상태 인디케이터 */}
          <div className="absolute top-6 left-6 z-10 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 text-xs font-bold text-slate-700 flex items-center gap-2">
             <span>{emotion === 'neutral' ? '😐' : '😊'}</span>
             <span className="capitalize">{emotion}</span>
          </div>

          {/* 3D Canvas */}
          <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [0, -0.2, 1.6], fov: 42 }}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[2, 2, 2]} intensity={0.8} color="#ffffff" />
            <spotLight position={[-2, 4, 5]} angle={0.5} penumbra={1} intensity={0.5} color="#00C362" />
            <Avatar url="/avatar.vrm" currentEmotion={emotion} currentAnimation={currentAnimation} />
            <OrbitControls target={[0, 0.25, 0]} enablePan={false} />
          </Canvas>

          {/* --- [추가] 사용자 웹캠 (PIP 스타일) --- */}
          <div className="absolute bottom-24 right-6 w-32 h-44 md:w-48 md:h-64 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 transition-all hover:scale-105">
             <video 
                ref={userVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transform scale-x-[-1] ${!isCamOn ? 'hidden' : ''}`}
             />
             {!isCamOn && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-slate-900">
                    <VideoOff size={24} />
                    <span className="text-xs mt-2">Camera Off</span>
                </div>
             )}
             <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white font-medium backdrop-blur-sm">
                나 (Me)
             </div>
          </div>

          {/* --- [추가] 하단 컨트롤 바 (영상 통화 스타일) --- */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-30">
             
             {/* 마이크 토글 */}
             <button 
                onClick={toggleMic}
                className={`p-4 rounded-full shadow-lg transition-all ${
                    isMicOn ? "bg-white text-slate-700 hover:bg-gray-100" : "bg-red-500 text-white hover:bg-red-600"
                }`}
             >
                {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
             </button>

             {/* 카메라 토글 */}
             <button 
                onClick={toggleCam}
                className={`p-4 rounded-full shadow-lg transition-all ${
                    isCamOn ? "bg-white text-slate-700 hover:bg-gray-100" : "bg-red-500 text-white hover:bg-red-600"
                }`}
             >
                {isCamOn ? <Video size={24} /> : <VideoOff size={24} />}
             </button>

             {/* 음성 인식 (말하기) 버튼 */}
             <button 
                onClick={startListening}
                disabled={loading || isListening}
                className={`p-6 rounded-full shadow-xl transition-all scale-110 ${
                   isListening 
                    ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200" 
                    : "bg-[#00C362] text-white hover:bg-[#00b35a]"
                }`}
             >
                {/* 로딩 중이면 스피너, 듣는 중이면 파형, 대기 중이면 마이크 */}
                {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <Mic size={28} className={isListening ? "animate-bounce" : ""} />
                )}
             </button>
             
             {/* 통화 종료 (나가기) */}
             <button className="p-4 rounded-full bg-red-100 text-red-500 hover:bg-red-200 shadow-lg transition-all">
                <PhoneOff size={24} />
             </button>
          </div>

          {/* 텍스트 입력창 (백업용, 평소엔 숨겨져 있거나 작게 표시) */}
          <div className="absolute bottom-6 right-auto left-6 hidden lg:flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-xl border border-white/50 shadow-sm w-64">
             <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="텍스트로 대화하기..."
                className="bg-transparent border-none text-sm outline-none w-full px-2"
             />
             <button onClick={() => handleSend()} className="p-1.5 bg-[#00C362] rounded-lg text-white">
                <Send size={14} />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}