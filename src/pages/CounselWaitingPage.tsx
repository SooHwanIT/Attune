import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  MessageCircleHeart,
  Shield,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PreCounselModal from "../components/PreCounselModal";

// --- Types ---
interface LocationState {
  topic?: string;
}

interface StepType {
  title: string;
  desc: string;
  icon: LucideIcon;
}

// --- Constants ---
const STEPS: StepType[] = [
  {
    title: "상담 정보 확인",
    desc: "상담 절차, 예상 소요 시간, 이용 방법을 확인합니다.",
    icon: ClipboardList,
  },
  {
    title: "사전 질문 입력",
    desc: "상담 주제/현재 기분/원하는 상담 방식/상담 내용을 입력합니다.",
    icon: MessageCircleHeart,
  },
  {
    title: "실시간 상담 시작",
    desc: "입력한 내용을 바탕으로 상담이 즉시 시작됩니다.",
    icon: CheckCircle2,
  },
];

const TIPS = [
  "최소 10자 이상으로 고민을 구체적으로 입력하면 상담 품질이 좋아집니다.",
  "카메라/마이크 권한을 허용하면 더 자연스러운 상호작용이 가능합니다.",
  "상담 중 종료하면 분석/리포트 페이지로 바로 이동해 결과를 확인할 수 있습니다.",
];

// SERVICE_STRENGTHS는 섹션이 주석 처리되어 사용되지 않아 제거됨
// const SERVICE_STRENGTHS: StrengthType[] = [
//   {
//     title: "사전 고민 기반 맞춤 상담",
//     desc: "사전에 입력한 고민/기분/상담 방식을 바탕으로 상담의 방향을 먼저 설계합니다.",
//     icon: ClipboardList,
//   },
//   {
//     title: "5단계 주도 진행",
//     desc: "단계별 목표를 기반으로 흐름을 이끌어, 막히지 않는 능동형 상담을 제공합니다.",
//     icon: Bot,
//   },
//   {
//     title: "단계별 누적 인사이트",
//     desc: "각 단계에서 핵심 내용을 요약/축적해 다음 단계 질문의 정확도를 높입니다.",
//     icon: ListChecks,
//   },
// ];

// 예시 질문(examples) 데이터가 추가된 5단계 로드맵
const CBT_FIVE_STAGES = [
  {
    title: "공감 형성",
    short: "현재 상태 확인",
    desc: "본격적인 상담 전, 지금 가장 마음을 무겁게 하는 감정과 신체적인 불편함을 함께 나눕니다.",
    detail:
      "상담사는 당신의 이야기를 경청하며 안전한 대화 환경을 만듭니다. 편안하게 말을 꺼내는 것만으로도 긴장이 완화될 수 있습니다.",
    examples: [
      "지금 가장 당신의 마음을 무겁게 하는 감정은 어떤 것인가요?",
      "그 감정을 느낄 때 혹시 몸에서 느껴지는 긴장감이나 답답함도 있으신가요?",
    ],
  },
  {
    title: "문제 탐색",
    short: "구체적 상황 파악",
    desc: "막연한 불안을 구체적인 '사건'과 '생각'으로 분리하여 객관적으로 바라봅니다.",
    detail:
      "언제, 어디서, 어떤 일이 있었는지 정리하며 스스로도 몰랐던 감정의 트리거(Trigger)를 발견하는 과정입니다.",
    examples: [
      "최근에 그 감정을 가장 강하게 느꼈던 구체적인 상황을 하나만 이야기해 주실 수 있나요?",
      "그 순간, 머릿속에 가장 먼저 스쳐 지나간 생각은 무엇이었나요?",
    ],
  },
  {
    title: "사고 전환",
    short: "관점의 재구성",
    desc: "나를 괴롭히는 부정적인 생각의 틀을 깨고, 더 유연하고 건강한 해석을 찾습니다.",
    detail:
      "인지적 왜곡(과잉 일반화, 흑백논리 등)이 있는지 확인하고, '그럴 수도 있다'는 새로운 관점을 연습합니다.",
    examples: [
      "방금 말씀하신 그 생각이 100% 사실이라고 확신할 수 있는 증거가 있을까요?",
      "만약 당신이 가장 아끼는 친구가 똑같은 상황에 처했다면, 어떤 위로의 말을 해주고 싶으신가요?",
    ],
  },
  {
    title: "행동 계획",
    short: "작은 실천 설계",
    desc: "상담에서 얻은 통찰을 일상에 적용하기 위해 '오늘 바로 할 수 있는 일'을 정합니다.",
    detail:
      "거창한 목표가 아닌, 산책 10분 하기나 숨 고르기처럼 즉시 실행 가능한 작은 행동 습관을 함께 만듭니다.",
    examples: [
      "이 상황을 조금이라도 낫게 만들기 위해, 오늘 당장 실천해 볼 수 있는 아주 작은 행동은 무엇이 있을까요?",
      "마음이 답답해질 때 심호흡을 3번 하는 것부터 시작해 보는 건 어떨까요?",
    ],
  },
  {
    title: "마무리",
    short: "통찰 및 다짐",
    desc: "상담 내용을 요약하고, 스스로 발견한 내면의 힘을 확인하며 마무리합니다.",
    detail:
      "오늘 대화에서 가장 기억에 남는 문장을 가슴에 새기고, 변화를 향한 나만의 약속을 정립합니다.",
    examples: [
      "오늘 저와 나눈 대화 중에서 가장 기억에 남거나 마음이 편안해진 순간은 언제였나요?",
      "앞으로 비슷한 힘든 상황이 오면, 나 자신에게 어떤 응원의 말을 해주고 싶나요?",
    ],
  },
];

const ROADMAP_STEP_DURATION_MS = 6000;

// --- Sub Components ---
// StrengthCard는 SERVICE_STRENGTHS 섹션이 주석 처리되어 사용되지 않아 제거됨

const StepCard = ({ step, index }: { step: StepType; index: number }) => {
  const Icon = step.icon;
  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-brand-green/30 hover:bg-brand-green/5">
      <div className="absolute -top-2 left-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
        {index + 1}
      </div>
      <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
        <Icon size={16} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-900">{step.title}</p>
      <p className="mt-1.5 text-xs leading-5 text-slate-500">{step.desc}</p>
    </div>
  );
};

// --- Main Component ---
export default function CounselWaitingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRoadmapIndex, setActiveRoadmapIndex] = useState(0);
  const [roadmapProgress, setRoadmapProgress] = useState(0);
  const location = useLocation();
  const state = location.state as LocationState | null;
  const initialTopic = state?.topic;

  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout | null = null;
    const startTime = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / ROADMAP_STEP_DURATION_MS) * 100, 100);
      setRoadmapProgress(progress);

      if (progress < 100) {
        animationFrameId = window.requestAnimationFrame(animateProgress);
      } else {
        // 100% 도달 즉시 다음 단계로 전환
        setActiveRoadmapIndex((current) => (current + 1) % CBT_FIVE_STAGES.length);
      }
    };

    animationFrameId = window.requestAnimationFrame(animateProgress);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeRoadmapIndex]);

  const handleStepClick = (index: number) => {
    setActiveRoadmapIndex(index);
    // 게이지가 0%부터 다시 시작됨 (useEffect에서 처리)
  };

  return (
    <div className="min-h-screen bg-slate-50 text-base">
      <main>
        {/* 헤더 섹션 */}
        <section className="mb-4 bg-gradient-to-r from-[#dcfce7] via-[#bbf7d0] to-[#6ee7b7] px-4 py-5 text-slate-900 md:px-8 md:py-6 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold tracking-wide text-slate-600/75">COUNSEL PREP</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">
              상담 시작 전 안내
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700/80 md:text-base">
              사전 입력한 고민을 바탕으로 상담 흐름이 구성됩니다.
              절차와 이용 방법을 확인한 뒤 편안한 마음으로 상담을 시작하세요.
            </p>
          </div>
        </section>

        {/* 서비스 강점 섹션
        <section className="px-4 py-2 lg:px-8 lg:py-3">
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-900">우리 서비스의 핵심 상담 방식</h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  사전 질문으로 고민 맥락을 수집하고, 입력된 정보에 맞춰 인지행동치료(CBT) 기반의 5단계 시나리오를 구성합니다.
                  단순한 공감에서 나아가 실제 일상에 적용 가능한 행동 계획까지 도달합니다.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SERVICE_STRENGTHS.map((item) => (
                <StrengthCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        </section> */}

        {/* 상담 예상 정보 섹션 */}
        <section className="px-4 py-5 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-1 text-lg font-extrabold text-slate-900">상담 예상 정보</h2>
            <p className="mb-4 text-sm text-slate-500">평균 소요 시간, 데이터 보호, 상담 방식을 확인하세요.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-brand-green/30 hover:bg-brand-green/5">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                  <Timer size={16} />
                </div>
                <p className="text-sm font-bold text-slate-900">약 10~15분</p>
                <p className="mt-1 text-xs text-slate-600">평균 상담 시간</p>
              </div>

              <div className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-brand-green/30 hover:bg-brand-green/5">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                  <Shield size={16} />
                </div>
                <p className="text-sm font-bold text-slate-900">보호된 정보</p>
                <p className="mt-1 text-xs text-slate-600">상담 정보는 철저한 보안 정책에 따라 관리됩니다</p>
              </div>

              <div className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-brand-green/30 hover:bg-brand-green/5">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                  <MessageCircleHeart size={16} />
                </div>
                <p className="text-sm font-bold text-slate-900">공감 + 솔루션</p>
                <p className="mt-1 text-xs text-slate-600">안전한 환경에서 나만의 페이스로 진행됩니다</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3단계 절차 섹션 */}
        <section className="px-4 py-5 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-1 text-lg font-extrabold text-slate-900">상담 3단계 절차</h2>
            <p className="mb-4 text-sm text-slate-500">상담 시작부터 실시간 대화까지 3가지 준비 단계를 따릅니다.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <StepCard key={step.title} step={step} index={index} />
              ))}
            </div>

            {/* CBT 5단계 로드맵 */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-4">
              <h3 className="text-sm font-bold text-slate-900">5단계 심층 상담 로드맵</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                각 단계를 누르거나 일정 시간이 지나면 다음 단계로 넘어가며, 오른쪽에서 상세 설명이 전환됩니다.
              </p>

              <div className="mt-3 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch">
                <div className="space-y-1.5">
                  {CBT_FIVE_STAGES.map((stage, index) => {
                    const isActive = index === activeRoadmapIndex;
                    const isCompleted = index < activeRoadmapIndex;
                    const progressWidth = isCompleted ? 100 : isActive ? roadmapProgress : 0;

                    return (
                      <button
                        key={stage.title}
                        type="button"
                        onClick={() => handleStepClick(index)}
                        className={`group relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                          isActive
                            ? "border-brand-green/40 bg-brand-green/10"
                            : "border-slate-200 bg-slate-50 hover:border-brand-green/30 hover:bg-brand-green/5"
                        }`}
                      >
                        <div className="absolute inset-0">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-brand-green/6 via-brand-green/10 to-brand-green/12 transition-[width] duration-500 ease-out"
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>

                        <div className="relative z-10 flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${isActive ? "bg-brand-green text-white" : "bg-brand-green/15 text-brand-green"}`}>
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isActive ? "text-brand-green" : "text-slate-400"}`}>
                              STEP {index + 1}
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-slate-900">{stage.title}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                  <div key={activeRoadmapIndex} className="animate-fade-up">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-green">STEP {activeRoadmapIndex + 1}</p>
                        <h4 className="mt-0.5 text-base font-bold text-slate-900">{CBT_FIVE_STAGES[activeRoadmapIndex].title}</h4>
                      </div>
                    </div>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                      {CBT_FIVE_STAGES[activeRoadmapIndex].desc}
                    </p>

                    {/* 기본 설명 영역 */}
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">설명</p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        {CBT_FIVE_STAGES[activeRoadmapIndex].detail}
                      </p>
                    </div>

                    {/* AI 예시 질문 추가 영역 */}
                    <div className="mt-3 rounded-xl border border-brand-green/20 bg-brand-green/5 p-3 md:p-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">
                        <Bot size={14} /> 예시 질의
                      </div>
                      <div className="mt-2.5 flex flex-col gap-2">
                        {CBT_FIVE_STAGES[activeRoadmapIndex].examples.map((example, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-brand-green/10">
                            <span className="mt-0.5 flex-shrink-0 text-xs font-bold text-brand-green/60">Q.</span>
                            <p className="text-xs leading-5 text-slate-700">{example}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 상담 화면 미리보기 섹션 (하단 배치) */}
        <section className="px-4 py-5 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-1 text-lg font-extrabold text-slate-900">실제 상담은 이렇게 진행됩니다</h2>
            <p className="mb-4 text-sm text-slate-500">
              귀여운 고양이 상담사 '어튠'과 함께 편안한 분위기 속에서 대화하게 됩니다.
            </p>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
              {/* 이미지 영역 */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img 
                  src="/image_05a3a4.jpg" 
                  alt="상담 스튜디오 진행 화면" 
                  className="h-auto w-full object-cover opacity-95 transition-opacity hover:opacity-100"
                />
              </div>

              {/* 기능 설명 영역 */}
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-brand-green">실시간 진행 단계 확인</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    화면 좌측 상단에서 현재 상담이 5단계 중 어느 지점(예: 상황 이해, 사고 전환 등)을 지나고 있는지 명확히 알 수 있습니다.
                  </p>
                </div>
                
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-brand-green">자연스러운 음성 대화</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    하단의 '음성 입력' 버튼을 통해 실제 사람과 통화하듯 편하게 대답할 수 있으며, 정확한 자막이 함께 제공됩니다.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-brand-green">카메라 및 마이크 제어</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    부담스러울 때는 언제든 우측 하단과 하단 컨트롤러를 통해 카메라를 끄거나 마이크를 제어할 수 있는 안전한 환경입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 팁 및 시작 버튼 섹션 */}
        <section className="px-4 py-5 pb-16 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <h3 className="text-lg font-extrabold text-slate-900">상담 품질을 위한 이용 팁</h3>
            <div className="mt-4 space-y-2.5">
              {TIPS.map((tip, index) => (
                <div key={tip} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 transition-colors duration-200 hover:border-brand-green/30">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-400 shadow-sm">
                    {index + 1}
                  </div>
                  <p className="text-xs leading-5 text-slate-500">{tip}</p>
                </div>
              ))}
            </div>

            {/* 모바일 화면 대응: 버튼 가운데 정렬 및 너비 확대 */}
            <div className="mt-5 flex justify-center md:justify-start">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] md:w-auto"
              >
                상담 시작하기
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <PreCounselModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTopic={initialTopic}
      />
    </div>
  );
}