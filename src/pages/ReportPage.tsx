import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Download,
  Share2,
  Calendar,
  Clock3,
  MessageSquare,
  HeartPulse,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  ListChecks,
  Gauge,
  Moon,
  MessageCircleHeart,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getCounselingReportDetailApi, type CounselingReportDetail } from "../utils/counselingApi";
import { toApiError } from "../utils/httpClient";

type TrendPoint = {
  step: string;
  value: number;
};

type TranscriptItem = {
  role: "user" | "ai";
  text: string;
  highlighted?: boolean;
};

const emotionTrendData: TrendPoint[] = [
  { step: "도입", value: 32 },
  { step: "초반", value: 28 },
  { step: "중반", value: 48 },
  { step: "후반", value: 61 },
  { step: "마무리", value: 72 },
];

const keywordChips = ["마감", "두려움", "수면", "가족", "회복", "명상", "자책", "호흡", "중립"];

const topicTimelineItems = [
  { time: "00:00 ~ 04:20", topic: "직장 스트레스", note: "업무 압박과 긴장감 표현 집중" },
  { time: "04:21 ~ 08:50", topic: "가족 관계", note: "갈등 장면 회상으로 슬픔 반응 증가" },
  { time: "08:51 ~ 13:30", topic: "자기 위로", note: "회복 의지와 행동 계획 언급 증가" },
];

const transcriptItems: TranscriptItem[] = [
  { role: "user", text: "이번 주는 계속 마감 생각 때문에 잠들기가 어려웠어요.", highlighted: true },
  { role: "ai", text: "잠들기 직전 긴장감이 높아지는 패턴이 반복되는 것 같아요." },
  { role: "user", text: "가족과 대화한 날은 오히려 마음이 더 가벼워졌어요.", highlighted: true },
  { role: "ai", text: "가족 대화가 감정 완충 역할을 해준 것으로 보여요." },
  { role: "user", text: "오늘은 조금 숨이 트인 느낌이 있어요." },
];

const quickInsightItems = [
  { label: "감정 안정도", value: "72/100", icon: Gauge, tone: "text-brand-green bg-slate-50 border-slate-200" },
  { label: "수면 영향도", value: "중간", icon: Moon, tone: "text-slate-600 bg-white border-slate-200" },
  { label: "공감 반응", value: "좋음", icon: MessageCircleHeart, tone: "text-slate-600 bg-white border-slate-200" },
  { label: "실행 목표", value: "3개", icon: Target, tone: "text-slate-600 bg-white border-slate-200" },
];

const checkpointItems = [
  { title: "도입 구간", desc: "두려움 중심 표현이 빠르게 감지됨" },
  { title: "전환 구간", desc: "가족 대화 회상 후 슬픔 반응 완화" },
  { title: "마무리 구간", desc: "자기 위로 표현 증가, 중립 회복" },
];

export default function ReportPage() {
  const location = useLocation();
  const backendSessionId = useMemo(() => {
    const value = new URLSearchParams(location.search).get("sessionId");
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [location.search]);

  const counselData = location.state?.counselData as {
    chatLog: { role: string; text: string }[];
    stageHistory: { stage: number; content: string; summary: string }[];
    currentStage: number;
  } | undefined;

  const [backendReport, setBackendReport] = useState<CounselingReportDetail | null>(null);
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const riskData = useMemo(
    () => ({
      enabled: true,
      level: "주의",
      reason: "자책·무기력 관련 문구가 일시적으로 증가했습니다.",
    }),
    []
  );

  useEffect(() => {
    let active = true;

    const loadBackendReport = async () => {
      if (!backendSessionId) {
        setBackendReport(null);
        setBackendError("");
        setIsBackendLoading(false);
        return;
      }

      setIsBackendLoading(true);
      setBackendError("");

      try {
        const response = await getCounselingReportDetailApi(backendSessionId);
        if (active) {
          setBackendReport(response);
        }
      } catch (loadError) {
        if (active) {
          setBackendError(toApiError(loadError).message);
        }
      } finally {
        if (active) {
          setIsBackendLoading(false);
        }
      }
    };

    void loadBackendReport();

    return () => {
      active = false;
    };
  }, [backendSessionId]);

  if (backendSessionId) {
    return (
      <div className="min-h-screen bg-slate-50 text-base">
        <main>
          <section className="mb-4 border-b border-slate-200 bg-white px-4 py-8 text-base md:px-8 md:py-10 lg:py-12">
            <div className="mx-auto max-w-6xl">
              <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">ANALYSIS REPORT</p>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">상담 분석</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-slate-900">
                백엔드에서 불러온 상담 리포트 상세입니다.
              </p>
            </div>
          </section>

          <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {isBackendLoading && (
              <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
                리포트를 불러오는 중입니다.
              </section>
            )}

            {!isBackendLoading && backendError && (
              <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                {backendError}
              </section>
            )}

            {!isBackendLoading && !backendError && backendReport && (
              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
                <div className="rounded-lg bg-slate-50 p-5">
                  <p className="text-xs font-bold text-brand-green">백엔드 리포트 요약</p>
                  <p className="mt-2 text-xl font-extrabold leading-snug text-slate-900">{backendReport.summary}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold text-slate-400">상담 주제</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">{backendReport.topic}</p>
                    <p className="mt-2 text-sm text-slate-600">{backendReport.startedAt} ~ {backendReport.endedAt}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold text-slate-400">주요 감정</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">{backendReport.primaryEmotion || "-"}</p>
                    <p className="mt-2 text-sm text-slate-600">발행 시각: {backendReport.issuedAt}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-400">AI 피드백</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{backendReport.feedback}</p>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-base">
      <main>
        <section className="mb-4 border-b border-slate-200 bg-white px-4 py-8 text-base md:px-8 md:py-10 lg:py-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">ANALYSIS REPORT</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">상담 분석</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-slate-900">
              상담 흐름을 요약하고 핵심 전환 포인트를 확인해 다음 실천 계획으로 연결합니다.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <ReportTitleHeader />

          {counselData && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquare size={20} className="text-brand-green" />
              최근 상담 세션
            </h2>
            <div className="space-y-4">
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">핵심 단계</p>
                  <p className="text-base font-bold text-slate-900">
                    {counselData.stageHistory[counselData.stageHistory.length - 1]?.content ?? "상담 진행"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">대화량</p>
                  <p className="text-base font-bold text-slate-900">{counselData.chatLog.length}개 메시지</p>
                </div>
              </div>
              {counselData.chatLog.filter((m) => m.role === "user").length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase text-slate-400">최근 대화</p>
                  <div className="space-y-2">
                    {counselData.chatLog
                      .filter((m) => m.role === "user")
                      .slice(-3)
                      .map((msg, idx) => (
                        <p key={idx} className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                          • {msg.text}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
            </section>
          )}

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <AIOneLineSummary text="이번 상담은 두려움에서 시작해 중립과 회복 의지로 안정된 흐름을 보였습니다." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SessionSummaryCard />
              <CoreEmotionBadge emotion="두려움" detail="초반 고조, 후반 완화" />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickInsightItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`rounded-lg border p-4 ${item.tone}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">{item.label}</p>
                    <Icon size={15} />
                  </div>
                  <p className="text-lg font-extrabold mt-2">{item.value}</p>
                </div>
              );
            })}
          </section>

          <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
            <EmotionTrendChart data={emotionTrendData} />
            <InsightHighlightsPanel items={checkpointItems} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SentimentRatioDonut positive={36} neutral={42} negative={22} />
              <KeywordCloud chips={keywordChips} />
            </div>
          </section>

          <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
            {riskData.enabled && <RiskAlertIndicator level={riskData.level} reason={riskData.reason} />}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TopicTimeline items={topicTimelineItems} />
              <PatternSignalsCard />
            </div>
          </section>

          <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
            <HighlightedTranscript
              items={transcriptItems}
              open={showTranscript}
              onToggle={() => setShowTranscript((prev) => !prev)}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function ReportTitleHeader() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-brand-green">
            <Calendar size={13} />
            2026-03-22 · 12회차 상담 리포트
          </p>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">SuHwan 님 상담 리포트</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-dark px-3 py-2 text-xs font-bold hover:bg-dark-elevated">
            <Download size={14} />
            PDF 다운로드
          </button>
          <button className="inline-flex items-center gap-2 rounded-md border border-dark px-3 py-2 text-xs font-bold hover:bg-dark-elevated">
            <Share2 size={14} />
            공유
          </button>
        </div>
      </div>
    </section>
  );
}

function AIOneLineSummary({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold text-brand-green">AI 한 줄 요약</p>
      <p className="mt-2 text-xl font-extrabold leading-snug text-slate-900">{text}</p>
    </div>
  );
}

function SessionSummaryCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-400">세션 요약</p>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <p className="inline-flex items-center gap-2">
          <Clock3 size={14} className="text-slate-400" />총 상담 시간 13분 30초
        </p>
        <p className="inline-flex items-center gap-2">
          <MessageSquare size={14} className="text-slate-400" />메시지 20개 (사용자 12 / AI 8)
        </p>
      </div>
    </div>
  );
}

function CoreEmotionBadge({ emotion, detail }: { emotion: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-400">핵심 감정</p>
      <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-900">
        <HeartPulse size={14} />
        {emotion}
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function EmotionTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div>
      <h2 className="font-bold text-lg text-slate-900 mb-3">감정 변화 추이</h2>
      <div className="h-72 w-full border border-slate-200 rounded-[2px] p-3 bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
            <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: "2px", border: "1px solid #E5E7EB" }}
              itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#39A61B"
              strokeWidth={3}
              dot={{ r: 4, fill: "#39A61B", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InsightHighlightsPanel({ items }: { items: Array<{ title: string; desc: string }> }) {
  return (
    <div className="border border-slate-200 rounded-[2px] p-4 bg-[#FCFCFC]">
      <p className="text-sm font-bold text-slate-800 mb-3">상담 흐름 핵심 포인트</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.title} className="border border-slate-200 rounded-[2px] p-3 bg-white">
            <p className="text-xs font-bold text-[#2D7C14]">{item.title}</p>
            <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SentimentRatioDonut({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const bg = `conic-gradient(#22C55E 0% ${positive}%, #94A3B8 ${positive}% ${positive + neutral}%, #EF4444 ${positive + neutral}% 100%)`;

  return (
    <div className="border border-slate-200 rounded-[2px] p-5 bg-white">
      <h3 className="font-bold text-base text-slate-900 mb-4">감정 분포</h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40 rounded-full" style={{ background: bg }}>
          <div className="w-24 h-24 bg-white rounded-full m-auto mt-8"></div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-[#16A34A] font-bold">긍정 {positive}%</p>
          <p className="text-slate-500 font-bold">중립 {neutral}%</p>
          <p className="text-red-500 font-bold">부정 {negative}%</p>
        </div>
      </div>
    </div>
  );
}

function KeywordCloud({ chips }: { chips: string[] }) {
  return (
    <div className="border border-slate-200 rounded-[2px] p-5 bg-white">
      <h3 className="font-bold text-base text-slate-900 mb-4 inline-flex items-center gap-2">
        <Tag size={16} className="text-[#39A61B]" />
        핵심 키워드
      </h3>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="px-3 py-1.5 rounded-full border border-[#BFE8A8] bg-[#F4FBEF] text-[#2D7C14] text-xs font-bold">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function TopicTimeline({ items }: { items: Array<{ time: string; topic: string; note: string }> }) {
  return (
    <div>
      <h2 className="font-bold text-lg text-slate-900 mb-3 inline-flex items-center gap-2">
        <ListChecks size={18} className="text-[#39A61B]" />
        주제 타임라인
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.time} className="border border-slate-200 rounded-[2px] p-3 bg-white">
            <p className="text-xs font-bold text-slate-400">{item.time}</p>
            <p className="text-sm font-bold text-slate-800 mt-1">{item.topic}</p>
            <p className="text-sm text-slate-600 mt-1">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternSignalsCard() {
  return (
    <div className="border border-slate-200 rounded-[2px] p-5 bg-[#FAFAFA]">
      <h2 className="font-bold text-lg text-slate-900 mb-4">대화 구조 신호</h2>
      <div className="space-y-3 text-sm">
        <div className="p-3 rounded-[2px] border border-slate-200 bg-white">
          <p className="font-bold text-slate-800">반복 패턴</p>
          <p className="text-slate-600 mt-1">"마감 전날"과 "취침 전"에 두려움 키워드가 반복됩니다.</p>
        </div>
        <div className="p-3 rounded-[2px] border border-slate-200 bg-white">
          <p className="font-bold text-slate-800">완충 요인</p>
          <p className="text-slate-600 mt-1">가족 관련 대화 이후 감정 곡선이 완만해지는 경향이 보입니다.</p>
        </div>
        <div className="p-3 rounded-[2px] border border-slate-200 bg-white">
          <p className="font-bold text-slate-800">행동 연결성</p>
          <p className="text-slate-600 mt-1">행동 계획을 언급한 직후 부정 표현 빈도가 낮아졌습니다.</p>
        </div>
      </div>
    </div>
  );
}

function RiskAlertIndicator({ level, reason }: { level: string; reason: string }) {
  return (
    <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-[2px] p-4">
      <p className="text-sm font-bold text-[#9A3412] inline-flex items-center gap-2">
        <AlertTriangle size={16} />
        위험 알림 · 위험도 {level}
      </p>
      <p className="text-sm text-[#7C2D12] mt-2">{reason}</p>
    </div>
  );
}

function HighlightedTranscript({
  items,
  open,
  onToggle,
}: {
  items: TranscriptItem[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-slate-200 rounded-[2px] overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-[#FAFAFA] border-b border-slate-200 text-left flex items-center justify-between"
      >
        <span className="text-sm font-bold text-slate-800">상세 대화 보기</span>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`p-3 rounded-[2px] border text-sm ${
                item.highlighted ? "border-[#86EFAC] bg-[#F0FDF4] text-slate-800" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
