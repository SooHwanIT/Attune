import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock3,
  Hash,
  Loader2,
  MessageSquare,
  PieChart as PieChartIcon,
  RotateCcw,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getCounselingReportDetailApi,
  listCounselingSessionsApi,
  type CounselingReportDetail,
  type CounselingSessionSummary,
} from "../utils/counselingApi";
import { toApiError } from "../utils/httpClient";

type RangePreset = "all" | "7d" | "30d" | "90d" | "thisMonth" | "month" | "custom";

type DateFilterState = {
  preset: RangePreset;
  month: string;
  from: string;
  to: string;
};

type SessionWithReport = {
  session: CounselingSessionSummary;
  report: CounselingReportDetail | null;
  reportError?: string;
};

type OverviewMetric = {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
};

type MonthlyStat = {
  monthKey: string;
  label: string;
  sessions: number;
  minutes: number;
  turns: number;
};

type TopicStat = {
  topic: string;
  count: number;
  minutes: number;
};

type EmotionStat = {
  emotion: string;
  count: number;
};

type KeywordStat = {
  keyword: string;
  count: number;
};

type RecentSessionView = {
  sessionId: number;
  dateLabel: string;
  timeLabel: string;
  type: string;
  topic: string;
  minutes: number;
  primaryEmotion: string;
  summary: string;
  hasReport: boolean;
};

type AnalysisViewModel = {
  totalSessions: number;
  totalMinutes: number;
  averageMinutes: number;
  totalTurns: number;
  topTopic: string;
  topEmotion: string;
  monthlyStats: MonthlyStat[];
  topicStats: TopicStat[];
  emotionStats: EmotionStat[];
  keywordStats: KeywordStat[];
  recentSessions: RecentSessionView[];
};

const INITIAL_FILTER: DateFilterState = {
  preset: "all",
  month: formatMonthInput(new Date()),
  from: "",
  to: "",
};

const RANGE_OPTIONS: Array<{ value: RangePreset; label: string }> = [
  { value: "all", label: "전체" },
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
  { value: "90d", label: "최근 90일" },
  { value: "thisMonth", label: "이번 달" },
];

const EMOTION_COLORS = ["#22C55E", "#38BDF8", "#F59E0B", "#A78BFA", "#F472B6", "#64748B", "#14B8A6"];

export default function AnalysisPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterState>(INITIAL_FILTER);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<SessionWithReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadAnalysisSource = async () => {
      setIsLoading(true);
      setError("");

      try {
        const sessionPage = await listCounselingSessionsApi(0, 100, "DESC");
        const detailResults = await Promise.all(
          sessionPage.content.map(async (session) => {
            try {
              const report = await getCounselingReportDetailApi(session.sessionId);
              return { session, report } satisfies SessionWithReport;
            } catch (detailError) {
              return {
                session,
                report: null,
                reportError: toApiError(detailError).message,
              } satisfies SessionWithReport;
            }
          })
        );

        if (active) {
          setSessions(detailResults);
        }
      } catch (loadError) {
        if (active) {
          setSessions([]);
          setError(toApiError(loadError).message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadAnalysisSource();

    return () => {
      active = false;
    };
  }, []);

  const filteredSessions = useMemo(() => {
    const byDate = filterSessionsByDate(sessions, dateFilter);
    const query = searchQuery.trim().toLowerCase();

    if (!query) return byDate;

    return byDate.filter(({ session, report }) => {
      const searchTarget = [
        session.topic,
        session.counselingType,
        report?.primaryEmotion,
        report?.keywords,
        report?.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(query);
    });
  }, [dateFilter, searchQuery, sessions]);

  const viewModel = useMemo(() => buildAnalysisViewModel(filteredSessions), [filteredSessions]);
  const reportErrorCount = filteredSessions.filter((item) => item.reportError).length;

  const overviewMetrics: OverviewMetric[] = [
    {
      title: "총 상담 횟수",
      value: `${viewModel.totalSessions}회`,
      helper: "선택 기간의 상담 세션",
      icon: <MessageSquare size={16} />,
    },
    {
      title: "총 상담 시간",
      value: `${viewModel.totalMinutes}분`,
      helper: "시작/종료 시간 기준",
      icon: <Clock3 size={16} />,
    },
    {
      title: "평균 상담 시간",
      value: `${viewModel.averageMinutes}분`,
      helper: "세션당 평균",
      icon: <CalendarDays size={16} />,
    },
    {
      title: "총 대화 턴",
      value: `${viewModel.totalTurns}턴`,
      helper: "리포트에 기록된 대화량",
      icon: <BarChart3 size={16} />,
    },
    {
      title: "주요 주제",
      value: viewModel.topTopic,
      helper: "가장 자주 다룬 주제",
      icon: <Tags size={16} />,
    },
    {
      title: "주요 감정",
      value: viewModel.topEmotion,
      helper: "가장 자주 기록된 감정",
      icon: <Sparkles size={16} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-base">
      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-8 md:px-8 md:py-10 lg:py-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">COUNSELING ANALYSIS</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl">나의 상담 분석</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  상담 기록을 바탕으로 자주 다룬 주제, 반복 키워드, 주요 감정, 월별 상담 패턴을 정리합니다.
                </p>
              </div>
              <Link
                to="/counsel/records"
                className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-green/40 hover:text-brand-green"
              >
                상담 기록 보기
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8 lg:py-10">
          <AnalysisDateRangeControl value={dateFilter} onChange={setDateFilter} />

          <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
            <label className="relative block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="주제, 상담 유형, 감정, 키워드로 검색"
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-green focus:bg-white"
              />
            </label>
          </section>

          {isLoading && (
            <section className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
              <Loader2 size={17} className="animate-spin text-brand-green" />
              상담 분석 데이터를 불러오는 중입니다.
            </section>
          )}

          {!isLoading && error && (
            <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              분석 데이터를 불러오지 못했습니다. {error}
            </section>
          )}

          {!isLoading && !error && (
            <>
              {reportErrorCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  일부 세션의 상세 리포트를 불러오지 못해 목록 데이터만 분석에 반영했습니다. 상세 리포트가 준비되면 감정,
                  키워드, 대화 턴 통계가 더 풍부해집니다.
                </div>
              )}

              {viewModel.totalSessions === 0 ? (
                <EmptyAnalysisState />
              ) : (
                <>
                  <section>
                    <div className="mb-4">
                      <h2 className="text-lg font-extrabold text-slate-900">주요 통계</h2>
                      <p className="mt-1 text-sm text-slate-600">선택한 기간에 남아 있는 상담 기록을 요약했습니다.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {overviewMetrics.map((metric) => (
                        <MetricCard key={metric.title} {...metric} />
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-5 lg:grid-cols-12">
                    <MonthlyCounselingChart data={viewModel.monthlyStats} />
                    <DominantEmotionPanel data={viewModel.emotionStats} />
                  </section>

                  <section className="grid gap-5 lg:grid-cols-12">
                    <TopicFrequencyChart data={viewModel.topicStats} />
                    <KeywordFrequencyPanel data={viewModel.keywordStats} />
                  </section>

                  <RecentSessionList sessions={viewModel.recentSessions} />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function AnalysisDateRangeControl({
  value,
  onChange,
}: {
  value: DateFilterState;
  onChange: (next: DateFilterState) => void;
}) {
  const updatePreset = (preset: RangePreset) => {
    onChange({ ...value, preset });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">분석 기간</h2>
          <p className="mt-1 text-xs text-slate-500">기록을 볼 기간을 선택하면 모든 차트와 목록이 함께 바뀝니다.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(INITIAL_FILTER)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={13} />
          초기화
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => updatePreset(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              value.preset === option.value
                ? "bg-brand-green text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500">월 선택</span>
          <input
            type="month"
            value={value.month}
            onChange={(event) => onChange({ ...value, preset: "month", month: event.target.value })}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-green focus:bg-white"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500">시작일</span>
          <input
            type="date"
            value={value.from}
            onChange={(event) => onChange({ ...value, preset: "custom", from: event.target.value })}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-green focus:bg-white"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500">종료일</span>
          <input
            type="date"
            value={value.to}
            onChange={(event) => onChange({ ...value, preset: "custom", to: event.target.value })}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-green focus:bg-white"
          />
        </label>
      </div>
    </section>
  );
}

function MetricCard({ title, value, helper, icon }: OverviewMetric) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-green/40 hover:bg-slate-50">
      <div className="flex items-center justify-between gap-3 text-slate-500">
        <p className="text-xs font-extrabold uppercase">{title}</p>
        <div className="text-brand-green">{icon}</div>
      </div>
      <p className="mt-3 line-clamp-2 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1.5 text-xs text-slate-600">{helper}</p>
    </article>
  );
}

function MonthlyCounselingChart({ data }: { data: MonthlyStat[] }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">월간 상담 통계</h2>
          <p className="mt-1 text-xs text-slate-600">월별 상담 횟수와 누적 상담 시간을 함께 확인합니다.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-brand-green">
          <BarChart3 size={13} />
          세션 / 시간
        </span>
      </div>
      <div className="h-80 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff" }}
              formatter={(value: number, name: string) => [
                name === "minutes" ? `${value}분` : `${value}회`,
                name === "minutes" ? "상담 시간" : "상담 횟수",
              ]}
            />
            <Bar dataKey="sessions" name="상담 횟수" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={22} />
            <Bar dataKey="minutes" name="상담 시간" fill="#38BDF8" radius={[4, 4, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function DominantEmotionPanel({ data }: { data: EmotionStat[] }) {
  const chartData = data.slice(0, 6);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-4">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <PieChartIcon size={18} className="text-brand-green" />
          <h2 className="text-lg font-extrabold text-slate-900">주요 감정</h2>
        </div>
        <p className="mt-1 text-xs text-slate-600">감정을 점수화하지 않고, 기록에 등장한 감정 라벨만 집계합니다.</p>
      </div>

      {chartData.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">아직 감정 기록이 없습니다.</p>
      ) : (
        <>
          <div className="h-56 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="count" nameKey="emotion" innerRadius={46} outerRadius={78} paddingAngle={4}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.emotion} fill={EMOTION_COLORS[index % EMOTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}회`, "기록 횟수"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {chartData.map((item, index) => (
              <div key={item.emotion} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[index % EMOTION_COLORS.length] }}
                  />
                  {item.emotion}
                </span>
                <span className="text-xs font-bold text-slate-500">{item.count}회</span>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

function TopicFrequencyChart({ data }: { data: TopicStat[] }) {
  const chartData = data.slice(0, 8).map((item) => ({
    ...item,
    label: item.topic.length > 10 ? `${item.topic.slice(0, 10)}...` : item.topic,
  }));

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-7">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">주제별 상담 빈도</h2>
        <p className="mt-1 text-xs text-slate-600">어떤 주제로 상담을 가장 자주 진행했는지 보여줍니다.</p>
      </div>
      <div className="h-80 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 12 }} width={96} />
            <Tooltip
              contentStyle={{ borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff" }}
              formatter={(value: number, name: string) => [
                name === "minutes" ? `${value}분` : `${value}회`,
                name === "minutes" ? "상담 시간" : "상담 횟수",
              ]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.topic ?? ""}
            />
            <Bar dataKey="count" name="상담 횟수" fill="#22C55E" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function KeywordFrequencyPanel({ data }: { data: KeywordStat[] }) {
  const topKeywords = data.slice(0, 12);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-5">
      <div className="mb-5 flex items-center gap-2">
        <Hash size={18} className="text-brand-green" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">반복 키워드</h2>
          <p className="mt-1 text-xs text-slate-600">상담 리포트에 남은 키워드를 빈도순으로 정리했습니다.</p>
        </div>
      </div>

      {topKeywords.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">아직 키워드 기록이 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {topKeywords.map((item) => (
            <span
              key={item.keyword}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-brand-green"
            >
              #{item.keyword}
              <span className="rounded-full bg-white px-1.5 text-[10px] text-slate-500">{item.count}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function RecentSessionList({ sessions }: { sessions: RecentSessionView[] }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">최근 세션</h2>
          <p className="mt-1 text-xs text-slate-600">최근 상담의 주제와 주요 기록을 빠르게 확인합니다.</p>
        </div>
        <Link to="/counsel/records" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-green hover:opacity-80">
          전체 기록
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="space-y-2">
        {sessions.slice(0, 5).map((session) => (
          <Link
            key={session.sessionId}
            to={`/counsel/records/${session.sessionId}`}
            className="group block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-brand-green/40 hover:bg-white"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold text-slate-900">{session.topic}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-brand-green">{session.type}</span>
                  {session.hasReport && (
                    <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] font-bold text-brand-green">
                      {session.primaryEmotion}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {session.dateLabel} {session.timeLabel} · {session.minutes}분
                </p>
                <p className="mt-2 line-clamp-1 text-xs text-slate-600">{session.summary}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition group-hover:text-brand-green">
                자세히
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}

function EmptyAnalysisState() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 text-center">
      <p className="text-sm font-bold text-slate-600">선택한 조건에 맞는 상담 기록이 없습니다.</p>
      <h2 className="mt-2 text-2xl font-extrabold text-slate-900">기간이나 검색어를 조정해 보세요.</h2>
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
          className="inline-flex items-center rounded-md border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          상담 기록 보기
        </Link>
      </div>
    </section>
  );
}

function buildAnalysisViewModel(items: SessionWithReport[]): AnalysisViewModel {
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime()
  );
  const topicCounter = new Map<string, { count: number; minutes: number }>();
  const emotionCounter = new Map<string, number>();
  const keywordCounter = new Map<string, number>();
  const monthlyCounter = new Map<string, MonthlyStat>();

  let totalMinutes = 0;
  let totalTurns = 0;

  sortedItems.forEach(({ session, report }) => {
    const minutes = getDurationMinutes(session.startedAt, session.endedAt);
    totalMinutes += minutes;
    totalTurns += report?.totalTurnCount ?? 0;

    const topicStat = topicCounter.get(session.topic) ?? { count: 0, minutes: 0 };
    topicCounter.set(session.topic, {
      count: topicStat.count + 1,
      minutes: topicStat.minutes + minutes,
    });

    const startedAt = new Date(session.startedAt);
    const monthKey = formatMonthInput(startedAt);
    const monthlyStat = monthlyCounter.get(monthKey) ?? {
      monthKey,
      label: `${startedAt.getFullYear()}.${String(startedAt.getMonth() + 1).padStart(2, "0")}`,
      sessions: 0,
      minutes: 0,
      turns: 0,
    };
    monthlyCounter.set(monthKey, {
      ...monthlyStat,
      sessions: monthlyStat.sessions + 1,
      minutes: monthlyStat.minutes + minutes,
      turns: monthlyStat.turns + (report?.totalTurnCount ?? 0),
    });

    collectEmotionLabels(report).forEach((emotion) => {
      emotionCounter.set(emotion, (emotionCounter.get(emotion) ?? 0) + 1);
    });

    parseKeywords(report?.keywords).forEach((keyword) => {
      keywordCounter.set(keyword, (keywordCounter.get(keyword) ?? 0) + 1);
    });
  });

  const topicStats = sortMapEntries(topicCounter).map(([topic, stat]) => ({
    topic,
    count: stat.count,
    minutes: stat.minutes,
  }));
  const emotionStats = sortCountMap(emotionCounter).map(([emotion, count]) => ({ emotion, count }));
  const keywordStats = sortCountMap(keywordCounter).map(([keyword, count]) => ({ keyword, count }));
  const monthlyStats = Array.from(monthlyCounter.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const recentSessions = sortedItems.map(({ session, report }) => toRecentSessionView(session, report));

  return {
    totalSessions: sortedItems.length,
    totalMinutes,
    averageMinutes: sortedItems.length > 0 ? Math.round(totalMinutes / sortedItems.length) : 0,
    totalTurns,
    topTopic: topicStats[0]?.topic ?? "-",
    topEmotion: emotionStats[0]?.emotion ?? "-",
    monthlyStats,
    topicStats,
    emotionStats,
    keywordStats,
    recentSessions,
  };
}

function filterSessionsByDate(items: SessionWithReport[], filter: DateFilterState): SessionWithReport[] {
  const now = new Date();
  const range = getDateRange(filter, now);
  if (!range) return items;

  return items.filter(({ session }) => {
    const startedAt = new Date(session.startedAt);
    return startedAt >= range.from && startedAt <= range.to;
  });
}

function getDateRange(filter: DateFilterState, now: Date): { from: Date; to: Date } | null {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (filter.preset === "all") return null;
  if (filter.preset === "thisMonth") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: endOfToday,
    };
  }
  if (filter.preset === "month" && filter.month) {
    const [year, month] = filter.month.split("-").map(Number);
    return {
      from: new Date(year, month - 1, 1),
      to: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }
  if (filter.preset === "custom") {
    const from = filter.from ? new Date(`${filter.from}T00:00:00`) : new Date(0);
    const to = filter.to ? new Date(`${filter.to}T23:59:59`) : endOfToday;
    return { from, to };
  }

  const days = filter.preset === "7d" ? 7 : filter.preset === "30d" ? 30 : 90;
  const from = new Date(endOfToday);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  return { from, to: endOfToday };
}

function collectEmotionLabels(report: CounselingReportDetail | null): string[] {
  if (!report) return [];

  const labels = [
    report.primaryEmotion,
    report.initialEmotion,
    report.finalEmotion,
    ...(report.stageDetails ?? []).flatMap((stage) => stage.emotionFlow ?? []),
  ];

  return labels.map(normalizeLabel).filter(Boolean);
}

function parseKeywords(keywords?: string): string[] {
  if (!keywords) return [];

  return keywords
    .split(/[,#\n]/)
    .map(normalizeLabel)
    .filter(Boolean);
}

function normalizeLabel(value?: string | null): string {
  return (value ?? "").trim();
}

function toRecentSessionView(session: CounselingSessionSummary, report: CounselingReportDetail | null): RecentSessionView {
  const startedAt = new Date(session.startedAt);
  const endedAt = new Date(session.endedAt);

  return {
    sessionId: session.sessionId,
    dateLabel: startedAt.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    timeLabel: `${startedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} - ${endedAt.toLocaleTimeString(
      "ko-KR",
      { hour: "2-digit", minute: "2-digit" }
    )}`,
    type: session.counselingType,
    topic: session.topic,
    minutes: getDurationMinutes(session.startedAt, session.endedAt),
    primaryEmotion: report?.primaryEmotion || "리포트 대기",
    summary: report?.summary || "상세 리포트가 아직 준비되지 않았습니다.",
    hasReport: Boolean(report),
  };
}

function getDurationMinutes(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(1, Math.round((end - start) / 60000));
}

function formatMonthInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function sortCountMap(map: Map<string, number>): Array<[string, number]> {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function sortMapEntries<T extends { count: number }>(map: Map<string, T>): Array<[string, T]> {
  return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
}
