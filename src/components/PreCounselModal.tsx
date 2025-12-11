import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, ArrowRight, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PreCounselModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  
  // 상태 관리
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [counselingStyle, setCounselingStyle] = useState<"empathy" | "solution">("empathy");

  if (!isOpen) return null;

  // 상담 시작 핸들러
  const handleStart = () => {
    const sessionData = {
      mood: selectedMood,
      topic: selectedTopic,
      style: counselingStyle,
    };
    console.log("Session Config:", sessionData);
    onClose();
    navigate("/counsel");
  };

  const moods = [
    { id: "happy", emoji: "😊", label: "좋음" },
    { id: "calm", emoji: "🙂", label: "평온" },
    { id: "anxious", emoji: "😟", label: "불안" },
    { id: "sad", emoji: "😢", label: "우울" },
    { id: "angry", emoji: "😠", label: "화남" },
  ];

  const topics = [
    "💼 직장/커리어",
    "💔 연애/이별",
    "👨‍👩‍👧‍👦 가족/대인관계",
    "📉 자존감/성격",
    "🎓 학업/진로",
    "💤 수면/건강",
    "💰 경제적 문제",
    "😶 그냥 대화하고 싶어요",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              상담 시작하기
              <Sparkles size={16} className="text-[#00C362]" />
            </h2>
            <p className="text-sm text-slate-500 mt-1">AI가 맞춤형 상담사를 페르소나를 설정합니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Q1. 현재 기분은 어떠신가요?</h3>
            <div className="flex justify-between gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${
                    selectedMood === mood.id
                      ? "bg-[#E8F3EE] border-[#00C362] text-[#00C362] scale-105 shadow-sm"
                      : "bg-white border-gray-100 text-slate-400 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl filter drop-shadow-sm">{mood.emoji}</span>
                  <span className="text-xs font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Q2. 어떤 이야기를 나누고 싶으신가요?</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    selectedTopic === topic
                      ? "bg-slate-800 text-white border-slate-800 shadow-md"
                      : "bg-gray-50 text-slate-600 border-transparent hover:bg-gray-100"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Q3. 어떤 상담 방식을 선호하시나요?</h3>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setCounselingStyle("empathy")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  counselingStyle === "empathy"
                    ? "border-[#00C362] bg-[#E8F3EE] ring-1 ring-[#00C362]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                    counselingStyle === "empathy" ? "border-[#00C362] bg-[#00C362]" : "border-gray-300"
                  }`}
                >
                  {counselingStyle === "empathy" && <Check size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">공감과 경청</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">해결책보다는 제 이야기를 들어주고 위로해주세요.</p>
                </div>
              </div>

              <div
                onClick={() => setCounselingStyle("solution")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  counselingStyle === "solution"
                    ? "border-[#00C362] bg-[#E8F3EE] ring-1 ring-[#00C362]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                    counselingStyle === "solution" ? "border-[#00C362] bg-[#00C362]" : "border-gray-300"
                  }`}
                >
                  {counselingStyle === "solution" && <Check size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">현실적 조언</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">객관적인 분석과 실질적인 해결 방안이 필요해요.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleStart}
            disabled={!selectedMood || !selectedTopic}
            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              selectedMood && selectedTopic
                ? "bg-[#00C362] text-white hover:bg-[#00b35a] shadow-lg shadow-green-200 transform hover:-translate-y-0.5"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Attune AI와 대화 시작하기
            <ArrowRight size={20} />
          </button>
          {!selectedMood && !selectedTopic && (
            <p className="text-center text-xs text-red-400 mt-2 font-medium">
              * 원활한 상담을 위해 기분과 주제를 선택해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
