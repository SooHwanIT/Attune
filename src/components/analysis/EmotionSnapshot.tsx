import { ArrowRight, Activity } from 'lucide-react';
import { getEmotionType } from '../../utils/analysisUtils';

interface EmotionSnapshotProps {
  initialEmotion: number;
  finalEmotion: number;
  shift: { value: number; direction: 'up' | 'down' | 'stable' };
}

export default function EmotionSnapshot({
  initialEmotion,
  finalEmotion,
  shift,
}: EmotionSnapshotProps) {
  const initialType = getEmotionType(initialEmotion);
  const finalType = getEmotionType(finalEmotion);

  // 감정별 디자인 매핑 (배경 틴트를 /5, /10 수준으로 낮춰서 은은하게 변경)
  const emotionMap = {
    positive: { label: '행복', emoji: '😊', color: 'text-brand-green', bg: 'bg-brand-green/10' },
    neutral: { label: '중립', emoji: '😐', color: 'text-slate-700', bg: 'bg-white' },
    negative: { label: '우울', emoji: '😟', color: 'text-red-400', bg: 'bg-red-500/5' },
    alert: { label: '불안', emoji: '😨', color: 'text-amber-400', bg: 'bg-amber-500/5' },
  } as const;

  const initialTheme = emotionMap[initialType];
  const finalTheme = emotionMap[finalType];

  return (
    <section className="space-y-4">
      {/* 상단 헤더 영역 - 추천 콘텐츠 헤더와 스타일 통일 */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-brand-green" />
          <h2 className="text-lg font-bold text-slate-900">세션 감정 스냅샷</h2>
        </div>
        {shift.direction !== 'stable' && (
          <span className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60">
            
          </span>
        )}
      </div>

      {/* 메인 감정 카드 - 주변 컴포넌트와 동일한 bg-white/[0.02], border-white/10 적용 */}
      <div className="relative flex w-full overflow-hidden rounded-xl bg-white border border-slate-200 h-40">
        
        {/* 왼쪽: 상담 전 (과거 상태) - 40% 영역으로 살짝 넓히고 배경을 더 어둡게 눌러줌 */}
        <div className="relative flex w-[40%] flex-col items-center justify-between border-r border-slate-200 bg-slate-50 p-3 pt-4 overflow-hidden group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 z-10">상담 전</p>
          
          {/* 과거 이모지는 흑백 처리 + 투명도로 희미하게 표현 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-[70px] opacity-10 grayscale filter transition-transform duration-500 group-hover:scale-110 leading-none">
              {initialTheme.emoji}
            </span>
          </div>

          <div className="z-10 flex flex-col items-center mb-1">
            <span className="text-sm font-semibold text-slate-400">{initialTheme.label}</span>
          </div>
        </div>

        {/* 오른쪽: 상담 후 (현재 상태) - 60% 영역 */}
        <div className={`relative flex w-[60%] flex-col justify-center p-5 pl-8 overflow-hidden ${finalTheme.bg}`}>
          
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              현재 감정
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${finalTheme.color}`}>
                {finalTheme.label}
              </span>
            </div>
          </div>

          {/* 현재 이모지 (Bleeding Effect 유지) */}
          <div className="absolute -right-6 -bottom-6">
            <span className="text-[120px] leading-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.4)] transform rotate-[-5deg]">
              {finalTheme.emoji}
            </span>
          </div>
        </div>

        {/* 중앙 화살표 인디케이터 - 다크 테마에 맞게 색상 수정 */}
        <div className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg">
          <ArrowRight size={14} className="text-slate-500" />
        </div>

      </div>
    </section>
  );
}