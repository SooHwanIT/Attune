import { ArrowRight, Zap } from 'lucide-react';
import type { TransitionPoint } from '../../utils/analysisUtils';
import { emotionColorMap, getEmotionType } from '../../utils/analysisUtils';

interface TransitionPointsProps {
  points: TransitionPoint[];
}

export default function TransitionPoints({ points }: TransitionPointsProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dark bg-dark-elevated p-6 text-center md:p-8">
        <p className="text-base/60">주목할 만한 감정 전환이 감지되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dark bg-dark-surface p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={20} className="text-brand-green" />
          <h2 className="text-xl font-bold text-base">감정 전환점</h2>
        </div>
        <p className="text-sm text-base/60">
          상담 중 급격한 감정 변화가 감지된 순간들입니다.
        </p>
      </div>

      <div className="space-y-3">
        {points.map((point, idx) => {
          const fromType = getEmotionType(point.fromEmotion);
          const toType = getEmotionType(point.toEmotion);
          const fromInfo = emotionColorMap[fromType];
          const toInfo = emotionColorMap[toType];
          const delta = point.toEmotion - point.fromEmotion;

          return (
            <div
              key={idx}
              className="rounded-lg border border-dark p-4 transition-colors hover:bg-dark-elevated"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase text-base/50">
                  {point.time}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    delta > 0
                      ? 'bg-dark-elevated text-brand-green'
                      : 'bg-dark-elevated text-base/70'
                  }`}
                >
                  {delta > 0 ? '⬆️' : '⬇️'} {Math.abs(delta)}%
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div
                    className="rounded-lg border p-3 text-center"
                    style={{
                      backgroundColor: fromInfo.bgColor,
                      borderColor: fromInfo.color
                    }}
                  >
                    <p className="mb-1 text-xs font-bold text-base/50">시작</p>
                    <p className="text-lg font-bold" style={{ color: fromInfo.color }}>
                      {point.fromEmotion}%
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <ArrowRight size={24} className="text-base/35" />
                </div>

                <div className="flex-1">
                  <div
                    className="rounded-lg border p-3 text-center"
                    style={{
                      backgroundColor: toInfo.bgColor,
                      borderColor: toInfo.color
                    }}
                  >
                    <p className="mb-1 text-xs font-bold text-base/50">변화 후</p>
                    <p className="text-lg font-bold" style={{ color: toInfo.color }}>
                      {point.toEmotion}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dark bg-dark-elevated p-3">
                <p className="mb-1 text-xs font-semibold text-base/50">🔍 전환 원인</p>
                <p className="text-sm text-base/70">{point.trigger}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-dark bg-dark-elevated p-4 pt-6">
        <p className="mb-1 text-xs font-semibold text-brand-green">💡 이것이 의미하는 것</p>
        <p className="text-sm text-base/70">
          이런 전환점들은 상담에서 "무엇이 효과적이었는가"를 보여줍니다.
          다음 상담에 비슷한 상황이 발생하면 이 전환점을 활용해 보세요.
        </p>
      </div>
    </div>
  );
}
