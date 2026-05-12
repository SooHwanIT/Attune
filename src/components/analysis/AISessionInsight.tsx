import { ArrowRight, Quote, CheckSquare } from 'lucide-react';

interface CounselingSummaryProps {
  summary: {
    emotion: { before: string; after: string };
    story: string;     // 구(舊) issue
    insight: string;   // 구(舊) counselorMessage + solution
    action: string;    // 구(舊) promise
  };
}

export default function CounselingSummaryInsight({ summary }: CounselingSummaryProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
      {/* 1. 감정의 기록 (Header) */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-sm font-bold text-slate-800">오늘의 상담 요약</h2>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-500">{summary.emotion.before}</span>
          <ArrowRight size={14} className="text-slate-300" />
          <span className="rounded bg-brand-green/10 px-2 py-1 text-brand-green">{summary.emotion.after}</span>
        </div>
      </div>

      {/* 메인 서사 영역 (그리드로 여백 확보) */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* 2. 우리의 이야기 (좌측) */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">오늘 털어놓은 고민</p>
          <p className="text-sm leading-relaxed text-slate-700">
            {summary.story}
          </p>
        </div>

        {/* 3. 어튠의 시선 (우측 - 배경색으로 온기 부여) */}
        <div className="rounded-lg bg-brand-green/5 p-5">
          <Quote size={16} className="mb-2 text-brand-green/40" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-green mb-2">어튠이 발견한 강점</p>
          <p className="text-sm leading-relaxed text-slate-800">
            {summary.insight}
          </p>
        </div>
      </div>

      {/* 4. 일상으로의 연결 (Footer - 별도 박스로 분리하여 액션 강조) */}
      <div className="mt-8 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <CheckSquare size={18} className="mt-0.5 text-brand-green shrink-0" />
        <div>
          <p className="text-xs font-bold text-slate-800">나를 위한 작은 실천</p>
          <p className="mt-1 text-sm text-slate-600">{summary.action}</p>
        </div>
      </div>
    </section>
  );
}