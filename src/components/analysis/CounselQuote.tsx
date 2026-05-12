import { useState } from 'react';
import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { emotionColorMap, getEmotionType, calculateEmotionScore } from '../../utils/analysisUtils';

interface CounselQuoteProps {
  items: Array<{
    role: 'user' | 'ai' | 'system';
    text: string;
    time?: string;
    highlighted?: boolean;
  }>;
  maxDisplay?: number;
}

export default function CounselQuote({
  items,
  maxDisplay = 5
}: CounselQuoteProps) {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, maxDisplay);
  const hasMore = items.length > maxDisplay;
  const averageEmotion =
    items.length > 0
      ? Math.round(items.reduce((sum, item) => sum + calculateEmotionScore(item.text), 0) / items.length)
      : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
      <h2 className="mb-1 text-xl font-bold text-slate-900">주요 상담 기록</h2>
      <p className="mb-6 text-sm text-slate-500">
        영향도 높은 메시지들의 모음입니다. 클릭하면 감정 분석을 확인할 수 있습니다.
      </p>

      <div className="space-y-3">
        {displayItems.map((item, idx) => {
          const emotionScore = calculateEmotionScore(item.text);
          const emotionType = getEmotionType(emotionScore);
          const emotionInfo = emotionColorMap[emotionType];
          const isUser = item.role === 'user';
          const isSystem = item.role === 'system';

          return (
            <div
              key={`${item.role}-${idx}`}
              className={`rounded-lg border p-4 transition-colors ${
                item.highlighted
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isUser ? (
                    <User size={14} className="text-brand-green" />
                  ) : isSystem ? (
                    <Bot size={14} className="text-slate-500" />
                  ) : (
                    <Bot size={14} className="text-brand-green" />
                  )}
                  <p className="text-xs font-bold uppercase text-slate-400">
                    {isUser ? '사용자' : isSystem ? '시스템' : 'AI'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.time && (
                    <span className="font-mono text-xs text-slate-400">
                      {item.time}
                    </span>
                  )}
                  {item.highlighted && (
                    <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-brand-green">
                      ⭐ 주목
                    </span>
                  )}
                </div>
              </div>

              <p
                className={`mb-3 text-sm leading-relaxed ${
                  isUser ? 'text-slate-900' : isSystem ? 'text-slate-600' : 'text-slate-700'
                }`}
              >
                "{item.text}"
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: emotionInfo.bgColor,
                    color: emotionInfo.color,
                  }}
                >
                  {emotionScore}% {['경고', '부정', '중립', '긍정'][
                    emotionScore < 30 ? 0 : emotionScore < 45 ? 1 : emotionScore < 65 ? 2 : 3
                  ]}
                </span>

                {isUser && (
                  <span className="text-xs text-slate-400">
                    💭 사용자의 감정 강도를 반영합니다
                  </span>
                )}
                {!isUser && (
                  <span className="text-xs text-slate-400">
                    💡 AI의 응답 톤을 분석합니다
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "상담 기록 접기" : "상담 기록 더보기"}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              접기
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              {items.length - maxDisplay}개 더보기
            </>
          )}
        </button>
      )}

      {/* 통계 */}
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6 text-sm">
        <div className="text-center">
          <p className="mb-1 text-xs text-slate-400">총 메시지</p>
          <p className="text-lg font-bold text-slate-900">{items.length}</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-xs text-slate-400">평균 감정</p>
          <p className="text-lg font-bold text-slate-900">{averageEmotion}%</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-xs text-slate-400">주목 메시지</p>
          <p className="text-lg font-bold text-slate-900">
            {items.filter(i => i.highlighted).length}
          </p>
        </div>
      </div>
    </div>
  );
}
