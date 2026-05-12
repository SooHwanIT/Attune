import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Zap, Clock, AlertCircle } from 'lucide-react';

const ACTION_PLAN_STORAGE_KEY = 'analysisActionPlanCompletedIds';

interface ActionItem {
  id: string;
  text: string;
  timing: string; // "오늘, 저녁" 등
  priority: 1 | 2 | 3; // 1 = 높음, 2 = 중간, 3 = 낮음
  difficulty: 'easy' | 'medium' | 'hard';
  expectedEffect?: string; // "감정 안정도 +15%" 등
}

interface ActionPlanProps {
  items: ActionItem[];
  onCheck?: (id: string) => void;
  completedIds?: string[];
  storageKey?: string;
}

export default function ActionPlan({
  items,
  onCheck,
  completedIds = [],
  storageKey = ACTION_PLAN_STORAGE_KEY,
}: ActionPlanProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(
    new Set(completedIds)
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(stored) as string[];
      const validIds = new Set(items.map((item) => item.id));
      setLocalCompleted(new Set(parsed.filter((id) => validIds.has(id))));
    } catch {
      setLocalCompleted(new Set(completedIds));
    } finally {
      setIsHydrated(true);
    }
  }, [completedIds, items]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(localCompleted)));
  }, [isHydrated, localCompleted, storageKey]);

  const handleCheck = (id: string) => {
    const newCompleted = new Set(localCompleted);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setLocalCompleted(newCompleted);
    onCheck?.(id);
  };

  const completionRate = Math.round(
    items.length > 0 ? (localCompleted.size / items.length) * 100 : 0
  );

  const difficultyInfo = {
    easy: { label: '쉬움', className: 'bg-slate-50 text-brand-green' },
    medium: { label: '중간', className: 'bg-slate-50 text-slate-600' },
    hard: { label: '어려움', className: 'bg-slate-50 text-slate-600' }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={20} className="text-brand-green" />
          <h2 className="text-xl font-bold text-slate-900">다음 단계</h2>
        </div>
        <p className="text-sm text-slate-500">
          상담을 기반으로 한 실행 가능한 3가지 행동 계획입니다.
        </p>
      </div>

      {/* 진행률 바 */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-600">달성 진행도</p>
          <p className="text-lg font-bold text-brand-green">{completionRate}%</p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-brand-green transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {localCompleted.size} / {items.length} 완료됨
        </p>
      </div>

      {/* 액션 아이템 리스트 */}
      <div className="space-y-3 mb-6">
        {items.map((item) => {
          const isCompleted = localCompleted.has(item.id);
          const difficulty = difficultyInfo[item.difficulty];

          return (
            <div
              key={item.id}
              className={`rounded-lg border-2 p-4 transition-all ${
                isCompleted
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              {/* 체크박스 & 텍스트 */}
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => handleCheck(item.id)}
                  aria-label={`${item.text} ${isCompleted ? '완료 해제' : '완료 체크'}`}
                  aria-pressed={isCompleted}
                  className="flex-shrink-0 mt-0.5 focus:outline-none"
                >
                  {isCompleted ? (
                    <CheckCircle2 size={24} className="text-brand-green" />
                  ) : (
                    <Circle
                      size={24}
                      className="text-slate-300 hover:text-slate-500"
                    />
                  )}
                </button>

                <div className="flex-1">
                  <p
                    className={`font-semibold text-sm leading-tight mb-2 ${
                      isCompleted
                        ? 'text-slate-400 line-through'
                        : 'text-slate-900'
                    }`}
                  >
                    {item.text}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    {/* 우선도 */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 font-bold text-brand-green">
                      {'⭐'.repeat(4 - item.priority)}
                      우선도 {item.priority}
                    </span>

                    {/* 시간 */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 font-semibold text-slate-600">
                      <Clock size={12} />
                      {item.timing}
                    </span>

                    {/* 난이도 */}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ${difficulty.className}`}>
                      {difficulty.label}
                    </span>
                  </div>

                  {/* 예상 효과 */}
                  {item.expectedEffect && (
                    <div className="mt-2 inline-block rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">
                      💡 예상 효과: {item.expectedEffect}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 격려 메시지 */}
      {completionRate === 100 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="mb-1 text-lg font-bold text-brand-green">🎉 축하합니다!</p>
          <p className="text-sm text-slate-600">
            모든 행동 계획을 완료했습니다. 다음 상담에서 더 깊은 진행을 할 수 있습니다.
          </p>
        </div>
      ) : completionRate > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-brand-green" />
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-900">
                좋은 진행 중이예요!
              </p>
              <p className="text-xs text-slate-500">
                남은 행동 계획을 차근차근 실천해 보세요.
                작은 성취가 모여 큰 변화를 만듭니다.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-brand-green" />
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-900">
                첫 번째 행동부터 시작하세요
              </p>
              <p className="text-xs text-slate-500">
                완벽함보다는 꾸준함이 중요합니다.
                아래 리스트 중 가장 쉬운 것부터 시작해 보세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <button className="mt-6 w-full rounded-lg bg-brand-green py-3 text-sm font-bold text-white transition-colors hover:opacity-90">
        📅 다음 상담 예약하기
      </button>

      {/* 작은 팁 */}
      <div className="mt-4 text-center text-xs text-slate-400">
        💡 팁: 계획이 잘 진행되지 않으면 우선도와 난이도를 조정해 보세요.
      </div>
    </div>
  );
}
