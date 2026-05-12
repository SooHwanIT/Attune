import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, ChevronDown, MessageSquare, Zap, Heart } from "lucide-react";
import EmotionSnapshot from "../components/analysis/EmotionSnapshot";
import AISessionInsight from "../components/analysis/AISessionInsight";
import {
  extractEmotionScores,
  calculateStabilityScore,
  calculateEmotionShift,
  extractTopicSeries,
  extractKeywordInsights,
} from "../utils/analysisUtils";
import { getSessionRecordById } from "../utils/sessionStore";
import { getRecommendedContentsByTopics } from "../utils/recommendedContents";

type CounselData = {
  chatLog: { role: string; text: string }[];
  stageHistory: { stage: number; content: string; summary: string }[];
  currentStage: number;
};

const CBT_STAGES = [
  {
    step: 1,
    title: "공감 형성",
    subtitle: "현재 상태 확인",
  },
  {
    step: 2,
    title: "문제 탐색",
    subtitle: "구체적 상황 파악",
  },
  {
    step: 3,
    title: "사고 전환",
    subtitle: "관점의 재구성",
  },
  {
    step: 4,
    title: "행동 계획",
    subtitle: "작은 실천 설계",
  },
  {
    step: 5,
    title: "마무리",
    subtitle: "통찰 및 다짐",
  },
];

const DUMMY_COUNSEL_DATA: CounselData = {
  // ... 기존 chatLog 유지 ...
  chatLog: [
    { role: "assistant", text: "안녕하세요. 오늘 어떤 마음으로 오셨나요?" },
    { role: "user", text: "요즘 업무가 몰리면서 자꾸 불안해지고 잠도 잘 못 자요." },
    { role: "assistant", text: "현재 기분이 어떠신가요? 가장 힘들 때를 생각해 보세요." },
    { role: "user", text: "주로 저녁에 불안해지고, 아침에는 조금 나아져요." },
    { role: "assistant", text: "최근 가장 부담이 컸던 순간을 하나만 떠올려볼까요?" },
    { role: "user", text: "회의에서 실수할까 봐 말수가 줄고, 끝나고도 계속 떠올라요." },
    { role: "assistant", text: "그 상황에서 스스로에게 어떤 말을 가장 많이 했는지 기억나시나요?" },
    { role: "user", text: "나는 준비가 부족하다는 생각을 계속 했어요." },
    { role: "assistant", text: "그런 생각이 정말 사실일까요? 실제로 준비한 부분은?" },
    { role: "user", text: "음... 사실 지난주에 자료도 준비했고 리허설도 했는데..." },
    { role: "assistant", text: "그렇군요! 더 객관적으로 보니 어때세요?" },
    { role: "user", text: "네, 제가 조금 자책한 것 같아요. 실제로는 충분히 준비했네요." },
    { role: "assistant", text: "좋아요. 다음부터는 이런 긍정적 관점을 유지하려면?" },
    { role: "user", text: "회의 전날 밤에 제 준비 사항을 체크리스트로 정리해야겠어요." },
    { role: "assistant", text: "완벽합니다! 작은 루틴이 큰 변화를 만듭니다." },
    { role: "user", text: "네, 감사합니다. 이제 조금 마음이 놓여요." },
    { role: "assistant", text: "오늘 상담을 통해 배운 점을 정리해보겠습니다." },
    { role: "user", text: "네, 좋습니다." },
    { role: "assistant", text: "당신은 이미 충분히 준비할 능력이 있습니다. 오늘의 약속을 지켜주세요!" },
  ],
  stageHistory: [
    { stage: 1, content: "공감 형성", summary: "현재 스트레스와 불안 수준을 파악함" },
    { stage: 2, content: "문제 탐색", summary: "불안을 유발하는 핵심 장면을 식별함" },
    { stage: 3, content: "사고 전환", summary: "부정적 자동 사고를 대체 문장으로 전환함" },
    { stage: 4, content: "행동 계획", summary: "호흡/준비 루틴을 일상 계획에 연결함" },
    { stage: 5, content: "마무리", summary: "오늘의 핵심을 정리하고 변화를 다짐함" },
  ],
  currentStage: 5,
};

// 5단계 아코디언 컴포넌트
const CounselStageAccordion = ({ stages }: { stages: typeof CBT_STAGES }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(1); // 초기값 1로 설정하여 첫 스텝 열어두기

  // 여러 감정의 흐름을 배열로 반환
  const getEmotionFlowForStep = (step: number): string[] => {
    const emotionFlows: { [key: number]: string[] } = {
      1: ["불안", "경계", "위축", "안도"],
      2: ["안도", "긴장", "수치심", "우울", "답답함"],
      3: ["답답함", "혼란", "깨달음", "희망"],
      4: ["희망", "의심", "수용", "의지"],
      5: ["의지", "평온", "자신감", "행복"],
    };
    return emotionFlows[step] || ["중립"];
  };

  // 매우 구체적인 상담 내용 더미 데이터
  const getStepContent = (step: number): string => {
    const contents: { [key: number]: string } = {
      1: "내담자는 최근 큰 프로젝트를 맡으며 극심한 압박감을 호소함. 수면 장애와 함께 출근 전 심장이 두근거리는 신체화 증상을 겪고 있음. 상담사는 내담자의 고통에 깊이 공감하며, 이러한 반응이 과도한 스트레스 상황에서 나타날 수 있는 자연스러운 방어 기제임을 설명하여 정서적 환기와 안도감을 제공함.",
      2: "가장 불안이 극대화되는 '주간 보고 회의' 상황을 구체적으로 탐색함. 내담자는 '팀원들이 내 발표를 비웃을 것 같다', '한 번 실수하면 내 평가는 바닥으로 떨어질 것이다'라는 파국화(Catastrophizing)와 독심술(Mind-reading)의 인지적 오류를 보임. 불안의 근원이 완벽주의에 있음을 식별함.",
      3: "과거 성공적으로 발표를 마쳤던 경험을 떠올리며 인지 재구성을 시도함. '실수하면 끝이다'라는 자동 사고를 '실수는 누구나 할 수 있으며, 내 전체 능력을 결정하지 않는다'는 대안 사고로 전환함. 증거 찾기 기법을 통해 부정적 예측의 논리적 허점을 스스로 발견하도록 유도함.",
      4: "주간 보고 회의 전날 밤 적용할 수 있는 구체적인 행동 루틴을 수립함. 1) 4-7-8 심호흡 3회 실시, 2) 예상 질문 3가지와 답변 키워드만 메모장에 작성하기, 3) '완벽하지 않아도 괜찮다'는 자기 자비(Self-compassion) 문장 낭독하기를 구체적인 실천 계획으로 정함.",
      5: "오늘 세션에서 다룬 핵심 통찰(불안은 준비 부족이 아닌 완벽주의에서 비롯됨)을 다시 한번 요약함. 내담자가 스스로 도출해낸 행동 계획을 실천할 수 있도록 강하게 격려하며, 다음 세션 전까지 매일 감정 일기를 작성하는 과제를 부여하고 세션을 긍정적으로 마무리함.",
    };
    return contents[step] || "";
  };

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const isExpanded = expandedStep === stage.step;
        const emotions = getEmotionFlowForStep(stage.step);

        return (
          // 컴포넌트 전체를 감싸는 래퍼: 확장 시 전체 테두리와 배경색이 변경됨
          <div
            key={stage.step}
            className={`overflow-hidden rounded-xl border transition-all duration-300 ${
              isExpanded
                ? "border-brand-green/40 bg-slate-50"
                : "border-slate-200 bg-white hover:border-brand-green/30"
            }`}
          >
            {/* 아코디언 헤더 (버튼) */}
            <button
              onClick={() => setExpandedStep(isExpanded ? null : stage.step)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-xs transition-colors ${
                    isExpanded
                      ? "bg-brand-green text-white"
                      : "bg-brand-green/20 text-brand-green"
                  }`}
                >
                  {stage.step}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{stage.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stage.subtitle}</p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`flex-shrink-0 text-brand-green transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* 아코디언 내부 콘텐츠 */}
            {isExpanded && (
              <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* 헤더와 콘텐츠 사이의 구분선 */}
                <div className="mb-4 h-px w-full bg-slate-200" />
                
                <div className="space-y-5">
                  {/* 단계 설명 */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-green mb-2">상담 내용</p>
                    <p className="text-[13px] leading-relaxed text-slate-600">
                      {getStepContent(stage.step)}
                    </p>
                  </div>

                  {/* 감정 변화 플로우 */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-green mb-2">감정 변화</p>
                    <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      {emotions.map((emotion, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-slate-900">
                            {emotion}
                          </span>
                          {idx < emotions.length - 1 && (
                            <ArrowRight size={14} className="text-slate-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function SessionAnalysisPage() {
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const counselData = location.state?.counselData as CounselData | undefined;
  const persistedSession = sessionId ? getSessionRecordById(sessionId) : null;
  const activeCounselData = persistedSession ?? counselData ?? DUMMY_COUNSEL_DATA;

  const analysisData = useMemo(() => {
    if (!activeCounselData || activeCounselData.chatLog.length === 0) {
      return {
        emotionScores: [],
        times: [],
        stabilityScore: 50,
        emotionShift: { value: 0, direction: "stable" as const },
        topicSeries: [],
        keywordInsights: [],
        messages: activeCounselData?.chatLog || [],
        aiSummary: "상담 데이터가 없습니다.",
      };
    }

    const { scores, times } = extractEmotionScores(activeCounselData.chatLog);
    const stability = calculateStabilityScore(scores);
    const shift = calculateEmotionShift(scores);
    const topicSeries = extractTopicSeries(activeCounselData.chatLog);
    const keywordInsights = extractKeywordInsights(activeCounselData.chatLog, 12);

    const aiSummary =
      shift.direction === "up"
        ? `초반 ${scores[0]}%의 불안에서 시작해 종료 시 ${scores[scores.length - 1]}%로 개선되었습니다.`
        : shift.direction === "down"
        ? "초반의 긍정적 감정에서 점차 하강하는 추세를 보였습니다."
        : "상담 과정에서 감정이 안정적으로 유지되었습니다.";

    return {
      emotionScores: scores,
      times,
      stabilityScore: stability,
      emotionShift: shift,
      topicSeries,
      keywordInsights,
      messages: activeCounselData.chatLog,
      aiSummary,
    };
  }, [activeCounselData]);

  const recommendedContents = useMemo(() => {
    const topicsFromSession = persistedSession
      ? Object.keys(persistedSession.metrics.topicCounts)
      : Array.from(new Set(analysisData.topicSeries));

    return getRecommendedContentsByTopics(topicsFromSession, 4);
  }, [persistedSession, analysisData.topicSeries]);

  const sessionDateTitle = useMemo(() => {
    const baseDate = persistedSession?.createdAt ? new Date(persistedSession.createdAt) : new Date();
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, "0");
    const day = String(baseDate.getDate()).padStart(2, "0");
    return `${year}.${month}.${day} 상담 세션`;
  }, [persistedSession?.createdAt]);

  const initialEmotion = analysisData.emotionScores[0] ?? 50;
  const finalEmotion = analysisData.emotionScores[analysisData.emotionScores.length - 1] ?? 50;

  return (
    <div className="min-h-screen bg-slate-50 pb-8 text-base">
      <main>
        <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8 lg:py-4">
          {/* 상단 세션 요약 헤더 - Full Width */}
          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <MessageSquare size={20} className="text-brand-green" />
              {sessionDateTitle}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {/* 상담 소요 시간 */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">소요 시간</p>
                <p className="text-2xl font-bold text-slate-900">45</p>
                <p className="text-xs text-slate-500 mt-0.5">분</p>
              </div>

              {/* 대화량 */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">대화량</p>
                <p className="text-2xl font-bold text-slate-900">{activeCounselData.chatLog.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">개 메시지</p>
              </div>

              {/* 핵심 감정 */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">핵심 감정</p>
                <p className="text-2xl font-bold text-slate-900">불안</p>
                <p className="text-xs text-slate-500 mt-0.5">→ 안심</p>
              </div>
            </div>
          </section>

          {/* 2단 그리드 레이아웃 */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* 좌측: 상담 흐름 (메인) */}
            <div className="xl:col-span-7 space-y-5">
              {/* AI Session Insight */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={20} className="text-brand-green" />
                  <h2 className="text-lg font-bold text-slate-900">AI 상담 인사이트</h2>
                </div>
                <AISessionInsight
                  summary={{
                    emotion: { before: "불안함", after: "자신감" },
                    story: "업무 회의에서의 불안감과 자기 의심",
                    insight: "오늘 상담을 통해 당신의 불안감이 실은 준비 부족에서 비롯된 게 아니라, 완벽함을 추구하는 당신의 강점이라는 걸 발견했어요. 객관적 준비 상황 재평가 및 체크리스트 작성",
                    action: "회의 전 준비 사항을 일일이 확인하는 루틴 유지하기"
                  }}
                />
              </section>

              {/* 5단계 아코디언 */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={20} className="text-brand-green" />
                  <h2 className="text-lg font-bold text-slate-900">상담 흐름 (5단계 CBT)</h2>
                </div>
                <CounselStageAccordion stages={CBT_STAGES} />
              </section>

              {/* AI 키워드 분석 (좌측 최하단) */}
              {analysisData.keywordInsights.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={20} className="text-brand-green" />
                    <h2 className="text-lg font-bold text-slate-900">핵심 키워드</h2>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap gap-2.5">
                    {analysisData.keywordInsights.slice(0, 12).map((keyword) => (
                      <span
                        key={`${keyword.keyword}-${keyword.category}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-brand-green hover:border-brand-green/40 hover:bg-brand-green/10 transition cursor-default"
                      >
                        #{keyword.keyword}
                        <span className="text-[10px] text-slate-500 opacity-70 bg-slate-200 px-1.5 rounded-md">{keyword.count}</span>
                      </span>
                    ))}
                  </div>
                  </div>
                </section>
              )}
            </div>

            {/* 우측: Sticky 사이드바 */}
            <div className="xl:col-span-5 space-y-5 xl:sticky xl:top-4 xl:h-fit">
              {/* AI 감정 분석 */}
              {analysisData.emotionScores.length > 0 && (
                <EmotionSnapshot
                  initialEmotion={initialEmotion}
                  finalEmotion={finalEmotion}
                  shift={analysisData.emotionShift}
                />
              )}

              {/* 추천 콘텐츠 */}
              {recommendedContents.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <BookOpen size={20} className="text-brand-green" />
                      <h2 className="text-lg font-bold text-slate-900">추천 콘텐츠</h2>
                    </div>
                    <Link to="/contents" className="text-xs font-semibold text-brand-green hover:opacity-80 transition">
                      더보기
                    </Link>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    {recommendedContents.map((content) => (
                      <Link
                        key={content.id}
                        to={`/contents/${content.id}`}
                        className="group block rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-brand-green/40 hover:bg-brand-green/5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-green/10 group-hover:bg-brand-green/20 transition">
                            <BookOpen size={16} className="text-brand-green" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-slate-900 mb-1">{content.title}</p>
                            <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed">{content.description}</p>
                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-brand-green">
                                {content.duration}
                              </span>
                              <ArrowRight size={14} className="text-brand-green flex-shrink-0 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}