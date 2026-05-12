import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChartLine,
  CircleDashed,
  Compass,
  MessageSquare,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getEmotionDistribution,
  getOverviewStats,
  getShiftDistribution,
  getTopicMetrics,
  listSessionRecords,
  type CounselSessionRecord,
} from "../utils/sessionStore";

type RangeFilter = "all" | "30d" | "7d";

const RANGE_OPTIONS: Array<{ value: RangeFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "30d", label: "최근 30일" },
  { value: "7d", label: "최근 7일" },
];

function filterByRange(records: CounselSessionRecord[], range: RangeFilter): CounselSessionRecord[] {
  if (range === "all") return records;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const cutoff = range === "7d" ? now - 7 * dayMs : now - 30 * dayMs;
  return records.filter((record) => new Date(record.createdAt).getTime() >= cutoff);
}

export default function AnalysisPage() {
  const [range, setRange] = useState<RangeFilter>("all");
  const allRecords = useMemo(() => listSessionRecords(), []);

  const records = useMemo(() => filterByRange(allRecords, range), [allRecords, range]);
  const overview = useMemo(() => getOverviewStats(records), [records]);
  const emotionDistribution = useMemo(() => getEmotionDistribution(records), [records]);
  const shiftDistribution = useMemo(() => getShiftDistribution(records), [records]);
  const topicMetrics = useMemo(() => getTopicMetrics(records), [records]);

  const weekInsight = useMemo(() => {
    if (records.length === 0) {
      return {
        highlight: "분석 가능한 상담 기록이 아직 없습니다.",
        risk: "첫 상담을 완료하면 누적 변화 리포트가 자동 생성됩니다.",
      };
    }

    const topTopic = topicMetrics[0]?.topic ?? "주제 없음";
    const trendDirection =
      shiftDistribution.up.percentage >= shiftDistribution.down.percentage ? "회복" : "부담";
    return {
      highlight: `최근 데이터에서 '${topTopic}' 주제가 가장 자주 나타났고 전반 흐름은 ${trendDirection} 방향입니다.`,
      risk:
        shiftDistribution.down.percentage >= 34
          ? "감정 하강 비율이 높아 다음 상담에서 하강 트리거를 우선 점검하는 것이 좋습니다."
          : "급격한 하강 비율은 낮은 편이며 현재 루틴을 유지하며 점검하면 좋습니다.",
    };
  }, [records.length, shiftDistribution.down.percentage, shiftDistribution.up.percentage, topicMetrics]);

  const recommendedActions = useMemo(() => {
    if (records.length === 0) {
      return [
        "상담 1회를 완료해 첫 기준선을 만드세요.",
        "상담 후 바로 분석 페이지에서 변화 기준을 확인하세요.",
        "기록 페이지에서 핵심 문장을 1개 저장해두세요.",
      ];
    }

    const firstTopic = topicMetrics[0]?.topic ?? "주제 없음";
    const secondTopic = topicMetrics[1]?.topic ?? "감정 관리";
    return [
      `${firstTopic} 관련 상황이 반복될 때 사용할 멈춤 루틴을 1개 정하세요.`,
      `${secondTopic} 맥락에서 도움이 된 행동을 다음 7일 동안 2회 이상 재실행하세요.`,
      "하강이 있었던 세션을 열어 다음 세션 질문 1개를 미리 작성하세요.",
    ];
  }, [records.length, topicMetrics]);

  const trendChartData = useMemo(() => {
    return overview.trend.map((point, index) => ({
      ...point,
      sessions: point.sessions,
      rollingAvg: Math.round(
        overview.trend.slice(Math.max(0, index - 1), index + 1).reduce((sum, item) => sum + item.avgEmotion, 0) /
          overview.trend.slice(Math.max(0, index - 1), index + 1).length
      ),
    }));
  }, [overview.trend]);

  const topicBarData = useMemo(() => {
    return topicMetrics.slice(0, 6).map((topic) => ({
      topic: topic.topic.length > 8 ? `${topic.topic.slice(0, 8)}…` : topic.topic,
      fullTopic: topic.topic,
      count: topic.count,
      emotion: topic.avgEmotion,
      stability: topic.avgStability,
    }));
  }, [topicMetrics]);

  const emotionRadarData = useMemo(
    () => [
      { name: "긍정", value: emotionDistribution.positive },
      { name: "중립", value: emotionDistribution.neutral },
      { name: "부정", value: emotionDistribution.negative },
    ],
    [emotionDistribution]
  );

  if (records.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-base">
        <main>
          <section className="mb-4 border-b border-slate-200 bg-white px-4 py-8 text-base md:px-8 md:py-10 lg:py-12">
            <div className="mx-auto max-w-6xl">
              <p className="text-xs font-semibold tracking-[0.25em] text-slate-600">LONG-TERM ANALYSIS</p>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">누적 변화 분석</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-slate-900">
                여러 상담 기록을 기반으로 감정 변화 추세와 회복 패턴을 확인하는 공간입니다.
              </p>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
            <section className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">아직 누적 분석 데이터가 없습니다.</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">첫 상담을 시작해 기준선을 만들어보세요.</h2>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/counsel/prepare"
                  className="inline-flex items-center gap-2 rounded-md bg-brand-green px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
                >
                  상담 시작하기
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/counsel/records"
                  className="inline-flex items-center rounded-md border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  상담 기록 보기
                </Link>
              </div>
            </section>
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
            <p className="text-xs font-semibold tracking-[0.25em] text-slate-600">LONG-TERM ANALYSIS</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">누적 변화 분석</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-slate-900">
              여러 상담 기록을 기반으로 감정/안정도/전환 패턴을 추적하고 다음 실천 포인트를 정리합니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    range === option.value
                      ? "bg-brand-green text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">
          <section>
            <h2 className="mb-1 text-lg font-extrabold text-slate-900">주요 통계</h2>
            <p className="mb-5 text-sm text-slate-600">누적 상담 데이터를 한눈에 확인하세요.</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <MetricCard title="세션 수" value={`${overview.totalSessions}`} helper="누적 상담" icon={<MessageSquare size={16} />} />
              <MetricCard title="평균 감정" value={`${overview.avgEmotion}%`} helper="전체 평균" icon={<Sparkles size={16} />} />
              <MetricCard title="평균 안정도" value={`${overview.avgStability}%`} helper="변화 안정성" icon={<Compass size={16} />} />
              <MetricCard title="전환 빈도" value={`${overview.avgTransitions}`} helper="세션당 평균" icon={<ChartLine size={16} />} />
              <MetricCard title="완료율" value={`${overview.completionRate}%`} helper="단계 진행률" icon={<CalendarDays size={16} />} />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-12">
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 lg:col-span-8">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">감정 추세 그래프</h2>
                  <p className="mt-1 text-xs text-slate-600">선형 추세와 이동 평균으로 회복 흐름을 읽습니다.</p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-brand-green">
                  <CircleDashed size={13} /> 선형 + 이동평균
                </span>
              </div>
              <div className="h-80 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendChartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff" }}
                      formatter={(value: number, name: string) => [
                        `${value}${name === "sessions" ? "회" : "%"}`,
                        name === "avgEmotion" ? "평균 감정" : name === "rollingAvg" ? "이동 평균" : "세션 수",
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="avgEmotion" name="평균 감정" stroke="#22C55E" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="rollingAvg" name="이동 평균" stroke="#38BDF8" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                    <Bar dataKey="sessions" name="세션 수" fill="#CBD5E1" barSize={18} radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-4">
              <h2 className="text-lg font-extrabold text-slate-900">감정 분포</h2>
              <p className="mt-1 text-xs text-slate-600">누적 세션의 감정 비중을 확인합니다.</p>
              <div className="mt-5 h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={emotionRadarData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {emotionRadarData.map((entry) => (
                        <Cell key={entry.name} fill={entry.name === "긍정" ? "#22C55E" : entry.name === "중립" ? "#64748B" : "#F59E0B"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-extrabold">
                <div className="rounded-lg bg-emerald-50/50 border border-emerald-200/50 px-2 py-2 text-center text-emerald-700">상승 {shiftDistribution.up.percentage}%</div>
                <div className="rounded-lg bg-slate-50/50 border border-slate-200/50 px-2 py-2 text-center text-slate-700">유지 {shiftDistribution.stable.percentage}%</div>
                <div className="rounded-lg bg-amber-50/50 border border-amber-200/50 px-2 py-2 text-center text-amber-700">하강 {shiftDistribution.down.percentage}%</div>
              </div>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-12">
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 lg:col-span-7">
              <h2 className="text-lg font-extrabold text-slate-900">주제별 분석</h2>
              <p className="mt-1 text-xs text-slate-600">빈도와 감정 강도를 함께 읽는 상호 비교 그래프입니다.</p>
              <div className="mt-5 h-72 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicBarData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis type="category" dataKey="topic" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 12 }} width={80} />
                    <Tooltip
                      contentStyle={{ borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff" }}
                      formatter={(value: number, name: string) => [
                        `${value}${name === "count" ? "회" : "%"}`,
                        name === "count" ? "빈도" : name === "emotion" ? "감정" : "안정도",
                      ]}
                      labelFormatter={(label) => `${label} 주제`}
                    />
                    <Legend />
                    <Bar dataKey="count" name="빈도" fill="#22C55E" radius={[0, 4, 4, 0]} barSize={18} />
                    <Bar dataKey="emotion" name="감정" fill="#38BDF8" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 lg:col-span-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">이번 주 인사이트</h3>
                <p className="mt-1 text-xs text-slate-600">주요 패턴과 권장 행동을 정리했습니다.</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200/50 bg-emerald-50/50 p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-emerald-700" />
                    <p className="text-xs leading-6 text-emerald-900">{weekInsight.highlight}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-4">
                  <div className="flex items-start gap-2">
                    <TriangleAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-700" />
                    <p className="text-xs leading-6 text-amber-900">{weekInsight.risk}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-extrabold text-slate-900">다음 7일 권장 액션</h4>
                <ul className="mt-3 space-y-2">
                  {recommendedActions.map((action, idx) => (
                    <li key={action} className="flex items-start gap-2.5 text-xs leading-6 text-secondary">
                      <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/20 text-[10px] font-bold text-brand-green">{idx + 1}</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">최근 상담 세션</h2>
                <p className="mt-1 text-xs text-slate-600">세부 내용을 확인하려면 각 항목을 클릭하세요.</p>
              </div>
              <Link to="/counsel/records" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-green hover:opacity-80">
                전체 기록 보기
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-2">
              {records.slice(0, 4).map((record) => {
                const latestSummary =
                  record.stageHistory[record.stageHistory.length - 1]?.summary ||
                  record.chatLog.find((msg) => msg.role === "user")?.text ||
                  "요약 정보가 없습니다.";

                return (
                  <Link
                    key={record.sessionId}
                    to={`/analysis/session/${record.sessionId}`}
                    className="group block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-200 hover:border-brand-green/40 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-slate-900">{new Date(record.createdAt).toLocaleString("ko-KR")}</p>
                      <p className="text-xs text-slate-600">
                        감정 {record.metrics.averageEmotion}% · 안정 {record.metrics.stabilityScore}%
                      </p>
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-xs text-slate-600 group-hover:text-slate-900">{latestSummary}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, helper, icon }: { title: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <article className="group rounded-lg border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-brand-green/40 hover:bg-slate-50">
      <div className="flex items-center justify-between text-slate-600">
        <p className="text-xs font-extrabold uppercase">{title}</p>
        <div className="text-brand-green group-hover:text-brand-green/80">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1.5 text-xs text-slate-600">{helper}</p>
    </article>
  );
}
