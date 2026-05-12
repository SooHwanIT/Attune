import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Stage {
  id: number;
  label: string;
  isMainStage: boolean;
  description: string;
}

interface StageProgressProps {
  stages: Stage[];
  currentStage: number;
  onStageChange?: (stage: number) => void;
  onNextStage?: () => void;
}

const StageProgress: React.FC<StageProgressProps> = ({
  stages,
  currentStage,
  onStageChange,
  onNextStage,
}) => {
  const progressPercentage = (currentStage / stages.length) * 100;

  return (
    <div className="w-full border-b border-dark bg-dark-surface px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 프로그레스 바 영역 */}
        <div>
          <div className="relative h-28 flex items-center justify-center">
            {/* 배경 트랙 */}
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-dark-elevated"></div>

            {/* 진행도 채우기 */}
            <div
              className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-green transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            ></div>

            {/* 체크포인트 원들 */}
            <div className="relative w-full h-full flex items-center justify-between px-2">
              {stages.map((stage) => {
                const isCompleted = stage.id <= currentStage;
                const isCurrent = stage.id === currentStage;
                const isMainStage = stage.isMainStage;

                return (
                  <div
                    key={stage.id}
                    className="group relative z-10 flex cursor-pointer flex-col items-center"
                    onClick={() => onStageChange?.(stage.id)}
                    title={stage.label}
                  >
                    {/* 펄스 효과 (현재 단계) */}
                    {isCurrent && (
                      <div className="absolute inset-0 -m-2 animate-pulse rounded-full border-2 border-primary/40"></div>
                    )}

                    {/* 메인 원 */}
                    <div
                        className={`relative flex items-center justify-center rounded-full font-bold transition-all duration-300 ${
                        isCompleted
                          ? isMainStage
                              ? 'h-16 w-16 border-2 border-white bg-brand-green text-lg text-white hover:scale-110'
                              : 'h-12 w-12 border-2 border-white bg-brand-green/80 text-sm text-white hover:scale-105'
                          : isMainStage
                            ? 'h-16 w-16 border-2 border-primary bg-dark-surface text-lg text-brand-green hover:bg-dark-elevated'
                            : 'h-12 w-12 border-2 border-dark bg-dark-surface text-sm text-brand-green hover:bg-dark-elevated'
                      }`}
                    >
                      {isMainStage && stage.id}
                      {!isMainStage && isCompleted && '✓'}
                    </div>

                    {/* 라벨 */}
                    <div
                      className={`absolute top-full mt-3 whitespace-nowrap rounded-md px-2 py-1 text-center text-xs font-bold transition-all duration-200 ${
                        isCurrent
                          ? 'bg-brand-green text-white opacity-100'
                          : 'bg-dark-elevated text-brand-green opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {stage.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 진행도 텍스트 */}
          <div className="mt-12 text-center text-xs font-medium text-brand-green/70">
            {Math.round(progressPercentage)}% 진행 중
          </div>
        </div>

        {/* 현재 단계 정보 카드 */}
        <div className="flex items-start justify-between gap-6 rounded-lg border border-dark bg-dark-surface p-6 transition-colors duration-300 hover:bg-dark-elevated">
          <div className="flex-1 min-w-0">
            {/* 단계 배지 */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="rounded-full bg-dark-elevated px-3 py-1.5 text-xs font-bold text-brand-green">
                STEP {currentStage}/{stages.length}
              </span>
              {stages[currentStage - 1]?.isMainStage && (
                <span className="rounded-full bg-brand-green px-3 py-1.5 text-xs font-bold text-white">
                  ⭐ 핵심 단계
                </span>
              )}
            </div>

            {/* 단계 제목 */}
            <h3 className="mb-2 text-2xl font-bold text-brand-green">
              {stages[currentStage - 1]?.label}
            </h3>

            {/* 설명 */}
            <p className="text-sm leading-relaxed text-base/60">
              {stages[currentStage - 1]?.description}
            </p>
          </div>

          {/* 다음 버튼 */}
          <div className="flex-shrink-0">
            {currentStage < stages.length ? (
              <button
                onClick={onNextStage}
                className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition-colors duration-300 hover:opacity-90"
              >
                다음 단계
                <ChevronRight size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-brand-green/80 px-6 py-3 text-sm font-bold text-white">
                ✓ 완료
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageProgress;
