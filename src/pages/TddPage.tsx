import { useMemo, useState } from "react";
import { tddData, type TddImportance, type TddStatus } from "../data/tddData";

const STATUS_COLOR: Record<TddStatus, string> = {
  완료: "text-emerald-400",
  구현중: "text-amber-400",
  미구현: "text-rose-400",
};

const IMPORTANCE_STYLE: Record<TddImportance, string> = {
  상: "text-white font-semibold",
  중: "text-[#b3b3b3]",
  하: "text-[#535353]",
};

export default function TddPage() {
  const [activeTab, setActiveTab] = useState(tddData[0].id);

  const currentCategory = tddData.find((c) => c.id === activeTab)!;

  const stats = useMemo(() => {
    const all = tddData.flatMap((c) => c.items);
    return {
      total: all.length,
      done: all.filter((i) => i.status === "완료").length,
      inProgress: all.filter((i) => i.status === "구현중").length,
      notDone: all.filter((i) => i.status === "미구현").length,
    };
  }, []);

  const completionPct = Math.round((stats.done / stats.total) * 100);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#121212] text-white">

      {/* Top bar: title + stats + progress */}
      <div className="flex-shrink-0 px-8 pt-6 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#1ed760]">TDD</p>
            <h1 className="text-lg font-extrabold">진행 현황</h1>
            <p className="text-xs text-[#535353]">Attune AI Care</p>
          </div>

          <div className="flex items-center gap-8">
            {[
              { label: "전체", value: stats.total, color: "text-white" },
              { label: "완료", value: stats.done, color: "text-emerald-400" },
              { label: "구현중", value: stats.inProgress, color: "text-amber-400" },
              { label: "미구현", value: stats.notDone, color: "text-rose-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <span className={`text-xl font-extrabold ${s.color}`}>{s.value}</span>
                <span className="text-xs text-[#535353]">{s.label}</span>
              </div>
            ))}

            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <div className="w-20 h-0.5 bg-white/10">
                <div
                  className="h-full bg-[#1ed760] transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#1ed760]">{completionPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex gap-0 border-b border-white/10 px-8 overflow-x-auto">
        {tddData.map((cat) => {
          const done = cat.items.filter((i) => i.status === "완료").length;
          const pct = Math.round((done / cat.items.length) * 100);
          const active = cat.id === activeTab;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                active
                  ? "border-[#1ed760] text-white"
                  : "border-transparent text-[#535353] hover:text-[#b3b3b3]"
              }`}
            >
              <span>{cat.icon} {cat.name}</span>
              <span className={`text-xs ${pct === 100 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Table — fills remaining height */}
      <div className="flex-1 overflow-y-auto px-8">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#121212]">
            <tr className="border-b border-white/10">
              <th className="py-3 text-left text-xs font-semibold text-[#535353] w-8">#</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-[#535353]">테스트 항목</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-[#535353] w-16">중요도</th>
              <th className="py-3 text-center text-xs font-semibold text-[#535353] w-20">구현도</th>
            </tr>
          </thead>
          <tbody>
            {currentCategory.items.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <td className="py-3 text-xs text-[#535353]">{idx + 1}</td>
                <td className="py-3 px-4 text-[#ececec] leading-snug">{item.question}</td>
                <td className={`py-3 px-4 text-center text-xs ${IMPORTANCE_STYLE[item.importance]}`}>
                  {item.importance}
                </td>
                <td className={`py-3 text-center text-xs font-semibold ${STATUS_COLOR[item.status]}`}>
                  {item.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
