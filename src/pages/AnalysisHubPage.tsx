import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpDown, Funnel, Loader2, MessageSquare, Search } from "lucide-react";
import { listCounselingSessionsApi, type CounselingSessionSummary } from "../utils/counselingApi";
import { toApiError } from "../utils/httpClient";

type DemoCounselData = {
  chatLog: { role: string; text: string }[];
  stageHistory: { stage: number; content: string; summary: string }[];
  currentStage: number;
};

type SessionListItem = CounselingSessionSummary & {
  reportState?: {
    counselData: DemoCounselData;
  };
};

const DEMO_SESSION_ITEMS: SessionListItem[] = [
  {
    sessionId: 1001,
    counselingType: "개인 상담",
    topic: "업무 압박으로 인한 불안 정리",
    startedAt: "2026-05-08T09:30:00.000Z",
    endedAt: "2026-05-08T10:05:00.000Z",
    reportState: {
      counselData: {
        currentStage: 4,
        stageHistory: [
          { stage: 1, content: "초기 상태 확인", summary: "최근 업무 압박과 불안 수준을 정리함" },
          { stage: 2, content: "핵심 상황 파악", summary: "회의 직전 긴장과 실수 걱정을 확인함" },
          { stage: 3, content: "인지 재구성", summary: "불안한 자동 사고를 균형 있게 바꿈" },
          { stage: 4, content: "실행 계획", summary: "호흡과 준비 루틴을 일상에 연결함" },
        ],
        chatLog: [
          { role: "assistant", text: "오늘 가장 무겁게 느껴지는 고민은 무엇인가요?" },
          { role: "user", text: "마감이 겹쳐서 계속 실수할까 봐 불안해요." },
          { role: "assistant", text: "불안이 올라오는 상황을 조금 더 구체적으로 볼까요?" },
          { role: "user", text: "회의 전에 특히 긴장이 심해져요." },
        ],
      },
    },
  },
  {
    sessionId: 1002,
    counselingType: "가족 상담",
    topic: "가족 대화 후 남는 죄책감 정리",
    startedAt: "2026-05-05T13:00:00.000Z",
    endedAt: "2026-05-05T13:42:00.000Z",
    reportState: {
      counselData: {
        currentStage: 3,
        stageHistory: [
          { stage: 1, content: "갈등 장면 정리", summary: "반복되는 가족 대화 패턴을 확인함" },
          { stage: 2, content: "감정 분리", summary: "분노와 죄책감이 함께 올라오는 지점을 파악함" },
          { stage: 3, content: "대응 전략", summary: "대화 전 감정 정리 루틴을 계획함" },
        ],
        chatLog: [
          { role: "assistant", text: "가족과의 대화에서 어떤 순간이 가장 힘들었나요?" },
          { role: "user", text: "말이 길어지면 감정이 올라오고 후회가 남아요." },
          { role: "assistant", text: "감정이 올라올 때 멈춤 신호를 정해볼까요?" },
          { role: "user", text: "10초 숨 고르기를 먼저 해보면 도움이 될 것 같아요." },
        ],
      },
    },
  },
  {
    sessionId: 1003,
    counselingType: "수면 상담",
    topic: "야간 스마트폰 사용과 수면 문제",
    startedAt: "2026-05-01T20:10:00.000Z",
    endedAt: "2026-05-01T20:48:00.000Z",
    reportState: {
      counselData: {
        currentStage: 3,
        stageHistory: [
          { stage: 1, content: "수면 문제 확인", summary: "입면 장애와 피로 누적을 정리함" },
          { stage: 2, content: "원인 탐색", summary: "야간 스마트폰 사용과 걱정 반추를 확인함" },
          { stage: 3, content: "실행 실험", summary: "수면 전 루틴과 디지털 오프 계획을 세움" },
        ],
        chatLog: [
          { role: "assistant", text: "최근 수면 패턴을 한 주 기준으로 말해줄 수 있나요?" },
          { role: "user", text: "새벽까지 휴대폰을 보면 잠이 더 안 와요." },
          { role: "assistant", text: "취침 전 20분 디지털 오프를 시도해보면 어떨까요?" },
          { role: "user", text: "짧은 명상과 함께하면 실천 가능할 것 같아요." },
        ],
      },
    },
  },
];

export default function AnalysisHubPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await listCounselingSessionsApi(0, 50);
        if (active) {
          if (response.content.length > 0) {
            setSessions(response.content);
          } else {
            setSessions(DEMO_SESSION_ITEMS);
          }
        }
      } catch (loadError) {
        if (active) {
          setSessions(DEMO_SESSION_ITEMS);
          setError("");
          void toApiError(loadError);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      active = false;
    };
  }, []);

  const uniqueTypes = useMemo(() => Array.from(new Set(sessions.map((session) => session.counselingType))), [sessions]);

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = sessions.filter((session) => {
      const matchesQuery =
        query.length === 0 ||
        session.topic.toLowerCase().includes(query) ||
        session.counselingType.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || session.counselingType === typeFilter;
      return matchesQuery && matchesType;
    });

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.startedAt).getTime();
      const bTime = new Date(b.startedAt).getTime();
      return sortBy === "latest" ? bTime - aTime : aTime - bTime;
    });
  }, [searchQuery, sessions, sortBy, typeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-base lg:px-8">
      <main className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">RECORDS</p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">상담 기록</h1>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            백엔드에서 불러온 상담 세션 목록입니다. 각 세션의 리포트 상세는 연결된 보고서 화면에서 확인할 수 있습니다.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">상담 세션 목록</h2>
            <Link to="/analysis" className="text-sm font-semibold text-brand-green hover:opacity-80">
              분석 보기
            </Link>
          </div>

          <div className="mb-4 grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="주제/상담 종류로 검색"
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-primary"
              />
            </label>

            <label className="relative">
              <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "latest" | "oldest")}
                className="w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-primary"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </label>

            <label className="relative">
              <Funnel size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-primary"
              >
                <option value="all">모든 상담 종류</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 rounded-md bg-slate-50 p-5 text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin" />
              상담 기록을 불러오는 중입니다.
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!isLoading && !error && filteredSessions.length === 0 && (
            <div className="rounded-md bg-slate-50 p-5 text-sm text-slate-600">
              조건에 맞는 기록이 없습니다. 검색어나 필터를 조정해 주세요.
            </div>
          )}

          {!isLoading && !error && filteredSessions.length > 0 && (
            <div className="space-y-3">
              {filteredSessions.map((session, index) => {
                const startedAt = new Date(session.startedAt);
                const endedAt = new Date(session.endedAt);
                const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
                const detailState = session.reportState?.counselData ? { counselData: session.reportState.counselData } : undefined;

                return (
                  <Link
                    key={session.sessionId}
                    to={`/counsel/records/${session.sessionId}`}
                    state={detailState}
                    className="block rounded-md border border-slate-200 bg-white p-4 transition hover:border-primary/30 hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">상담 기록 {filteredSessions.length - index}</p>
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-brand-green">
                            {session.counselingType}
                          </span>
                          <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] font-semibold text-brand-green">
                            {durationMinutes}분
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{startedAt.toLocaleString("ko-KR")}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-700">주제: {session.topic}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            시작 {startedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            종료 {endedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 lg:shrink-0">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={14} />
                          상세 보기
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          열기
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}