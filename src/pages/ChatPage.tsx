import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, StopCircle } from "lucide-react";

export default function ChatPageLLMStyle() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 1. Ref에 HTML 엘리먼트 타입 지정
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 초기 메시지
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "안녕하세요. Attune AI입니다. \n오늘 당신의 하루는 어땠나요? 마음에 담아둔 이야기가 있다면 편하게 들려주세요. 제가 경청하고 분석해 드릴게요.",
    },
  ]);

  // 스크롤 자동 이동
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 텍스트 영역 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. 사용자 메시지 추가
    const userMsg = {
      id: Date.now(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // 2. AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        text: "말씀해주셔서 감사합니다. \n\n지금 보내주신 내용을 바탕으로 실시간 분석을 진행하고 있습니다. 사용자가 느끼는 주된 감정은 '복합적인 불안'과 미래에 대한 '막연한 기대감'으로 보입니다. \n\n특히 직장생활과 관련된 부분에서 스트레스 지수가 다소 높게 감지되는데, 이 부분에 대해 조금 더 구체적인 상황을 이야기해주실 수 있을까요?",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 2000); 
  };

  // 2. 이벤트 객체 타입 지정
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800 relative">
      
      {/* 1. 헤더 */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 md:px-0 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              Attune AI
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Beta v1.2
              </span>
            </h1>
          </div>
          <div></div>
        </div>
      </header>

      {/* 2. 채팅 영역 */}
      <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
        <div className="max-w-3xl mx-auto px-4 md:px-0 py-8 space-y-10">
          
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} className={`flex gap-4 md:gap-6 ${isUser ? "justify-end" : ""}`}>
                
                {/* 아이콘 영역 */}
                <div className={`flex-shrink-0 flex items-start pt-1 ${isUser ? "order-2" : "order-1"}`}>
                  {isUser ? (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                      <User size={18} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-tr from-[#00C362] to-teal-500 rounded-full flex items-center justify-center text-white shadow-sm">
                      <Sparkles size={18} />
                    </div>
                  )}
                </div>

                {/* 메시지 내용 영역 */}
                <div className={`flex-1 space-y-2 ${isUser ? "order-1 text-right" : "order-2"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">
                      {isUser ? "You" : "Attune AI"}
                    </span>
                  </div>
                  
                  <div className={`text-[15px] leading-relaxed whitespace-pre-wrap prose prose-slate max-w-none ${
                      isUser 
                      ? "bg-[#f3f4f6] inline-block text-left px-5 py-3 rounded-2xl rounded-tr-sm" 
                      : "bg-transparent pl-0 pt-0"
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                        <p key={i} className={`${line === "" ? "h-4" : "mb-2 last:mb-0"}`}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 로딩 인디케이터 */}
          {loading && (
             <div className="flex gap-4 md:gap-6 animate-pulse">
                <div className="flex-shrink-0 pt-1">
                   <div className="w-8 h-8 bg-gradient-to-tr from-[#00C362]/50 to-teal-500/50 rounded-full flex items-center justify-center text-white">
                     <Sparkles size={18} />
                   </div>
                </div>
                <div className="flex-1 pt-2 space-y-2">
                   <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* 3. 입력 영역 */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pb-6 pt-10 z-20">
        <div className="max-w-3xl mx-auto px-4 md:px-0">
          <div className="relative flex items-end bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[26px] overflow-hidden focus-within:border-[#00C362]/50 focus-within:shadow-[0_8px_30px_rgb(0,195,98,0.15)] transition-all">
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Attune AI에게 메시지 보내기..."
              className="w-full pl-5 pr-16 py-4 bg-transparent border-none outline-none resize-none text-[15px] text-slate-800 placeholder:text-gray-400 max-h-[200px] overflow-y-auto scrollbar-hide"
              rows={1}
              style={{ minHeight: '56px' }} 
            />
            
            <div className="absolute right-2 bottom-2 flex gap-2">
                 {loading ? (
                     <button 
                        onClick={() => setLoading(false)}
                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                     >
                        <StopCircle size={20} />
                     </button>
                 ) : (
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`p-2 rounded-full transition-all ${
                        input.trim()
                            ? "bg-[#00C362] text-white hover:bg-[#00b35a]"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <Send size={20} className={input.trim() ? "ml-0.5" : ""} />
                    </button>
                 )}
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
             Attune AI는 실시간으로 감정 데이터를 분석하며, 부정확한 정보를 제공할 수 있습니다.
          </p>
        </div>
      </div>

    </div>
  );
}