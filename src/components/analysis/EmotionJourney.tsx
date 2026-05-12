import { useMemo, useState } from 'react';
import { Bot, ChevronDown, ChevronUp, User } from 'lucide-react';
import { emotionColorMap, getEmotionType } from '../../utils/analysisUtils';

export interface CounselingEvent {
  id: string;
  time: string;
  emotionScore: number;
  topic: string;
  userText: string;
  aiText?: string;
  deltaFromPrev: number;
  importanceScore: number;
  priority: 'high' | 'medium' | 'low';
  actionTitle: string;
  actionReason: string;
  nextSessionPrompt: string;
  highlighted?: boolean;
}

interface EmotionJourneyProps {
  events: CounselingEvent[];
  maxVisible?: number;
}

export default function EmotionJourney({
  events,
  maxVisible = 4,
}: EmotionJourneyProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleEvents = expanded ? events : events.slice(0, maxVisible);
  const hasMore = events.length > maxVisible;

  const summary = useMemo(() => {
    if (events.length === 0) {
      return {
        start: null,
        end: null,
        strongestShift: null,
      };
    }

    const start = events[0].emotionScore;
    const end = events[events.length - 1].emotionScore;
    const strongestShift = events.reduce((acc, cur) => {
      if (!acc || Math.abs(cur.deltaFromPrev) > Math.abs(acc.deltaFromPrev)) return cur;
      return acc;
    }, events[0]);

    return {
      start,
      end,
      strongestShift,
    };
  }, [events]);

  const topEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => b.importanceScore - a.importanceScore)
      .slice(0, 3);
  }, [events]);

  const priorityTone: Record<CounselingEvent['priority'], string> = {
    high: 'bg-slate-50 text-brand-green',
    medium: 'bg-slate-50 text-slate-600',
    low: 'bg-slate-50 text-slate-500',
  };


  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
      <div className="mb-6">
        <h2 className="mb-1 text-xl font-bold text-slate-900">상담 흐름 타임라인</h2>
        <p className="text-sm text-slate-500">감정 변화와 핵심 상담 기록을 시간축 하나로 통합해 보여줍니다.</p>
      </div>

      {summary.start !== null && summary.end !== null && (
        <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">시작 -&gt; 종료</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {summary.start}% -&gt; {summary.end}%
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">최대 전환</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {summary.strongestShift ? `${summary.strongestShift.deltaFromPrev > 0 ? '+' : ''}${summary.strongestShift.deltaFromPrev}%` : '-'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">핵심 이벤트</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{events.length}개</p>
          </div>
        </div>
      )}

      {topEvents.length > 0 && (
        <section className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">핵심 변화 3개</h3>
          <p className="mt-1 text-xs text-slate-500">중요도 기반으로 다음 행동과 다음 세션 연결 포인트를 자동 정리했습니다.</p>
          <div className="mt-3 space-y-2.5">
            {topEvents.map((event) => (
              <article key={`top-${event.id}`} className="rounded-lg border border-dark bg-dark-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{event.topic}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityTone[event.priority]}`}>
                    {event.priority === 'high' ? '우선순위 높음' : event.priority === 'medium' ? '우선순위 중간' : '우선순위 낮음'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">중요도 {event.importanceScore}점 · {event.time}</p>
                <p className="mt-2 text-sm text-slate-600">"{event.userText}"</p>
                <div className="mt-2 rounded-md bg-slate-50 p-2">
                  <p className="text-xs font-semibold text-brand-green">실행 연결: {event.actionTitle}</p>
                  <p className="text-xs text-slate-500">{event.actionReason}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="relative space-y-3 border-l-2 border-slate-200 pl-5">
        {visibleEvents.map((event) => {
          const emotionType = getEmotionType(event.emotionScore);
          const emotionInfo = emotionColorMap[emotionType];
          const deltaLabel =
            event.deltaFromPrev > 0
              ? `+${event.deltaFromPrev}% 상승`
              : event.deltaFromPrev < 0
              ? `${event.deltaFromPrev}% 하강`
              : '변화 없음';

          return (
            <article
              key={event.id}
              className={`relative rounded-xl border p-4 ${
                event.highlighted ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div
                className="absolute -left-[29px] top-4 h-3.5 w-3.5 rounded-full border-2 border-background bg-white"
                style={{ borderColor: emotionInfo.color }}
                aria-hidden
              />

              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400">{event.time}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: emotionInfo.bgColor, color: emotionInfo.color }}>
                    {event.emotionScore}%
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityTone[event.priority]}`}>
                    {event.priority === 'high' ? '핵심' : event.priority === 'medium' ? '중요' : '참고'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400">{deltaLabel}</span>
              </div>

              <p className="mb-2 text-xs font-semibold text-slate-400">주제: {event.topic}</p>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-green">
                  <User size={13} /> 사용자
                </div>
                <p className="text-sm leading-relaxed text-slate-600">"{event.userText}"</p>
              </div>

              {event.aiText && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-green">
                    <Bot size={13} /> AI 응답
                  </div>
                  <p className="text-sm leading-relaxed text-base/70">"{event.aiText}"</p>
                </div>
              )}

              <div className="mt-2 grid gap-2 rounded-lg border border-dark bg-dark-elevated p-3 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-base/50">실행 연결</p>
                  <p className="text-xs font-semibold text-base">{event.actionTitle}</p>
                  <p className="text-xs text-base/60">{event.actionReason}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-base/50">다음 세션 인수인계</p>
                  <p className="text-xs text-base/70">{event.nextSessionPrompt}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dark bg-dark-surface px-3 py-1.5 text-xs font-semibold text-base/70 hover:bg-dark-elevated"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} /> 접기
            </>
          ) : (
            <>
              <ChevronDown size={14} /> {events.length - maxVisible}개 더보기
            </>
          )}
        </button>
      )}
    </div>
  );
}
