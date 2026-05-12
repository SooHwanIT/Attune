import { Hash, Sparkles } from "lucide-react";
import type { KeywordInsight } from "../../utils/analysisUtils";

interface KeywordTabsProps {
  items: KeywordInsight[];
}

export default function KeywordTabs({ items }: KeywordTabsProps) {
  const topKeywords = items.slice(0, 6);
  const topInsights = items.slice(0, 3);
  const emotionCount = items.filter((item) => item.category === "emotion").length;
  const actionCount = items.filter((item) => item.category === "action").length;

  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-2 flex items-center gap-2">
          <Hash size={18} className="text-brand-green" />
          <h2 className="text-lg font-semibold text-slate-900">AI 키워드 분석</h2>
        </div>
        <p className="text-sm text-slate-500">키워드를 추출할 상담 데이터가 부족합니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-brand-green" />
        <h2 className="text-lg font-semibold text-slate-900">AI 키워드 분석</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          감정 키워드 {emotionCount}개
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          실행 키워드 {actionCount}개
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {topKeywords.map((item) => (
          <span
            key={`${item.keyword}-${item.category}`}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-brand-green"
          >
            #{item.keyword}
            <span className="text-[10px] text-slate-400">{item.count}</span>
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {topInsights.map((item) => (
          <div key={`${item.keyword}-row`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.keyword}</p>
              <span className="text-xs font-semibold text-slate-400">언급 {item.count}회</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.insight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
