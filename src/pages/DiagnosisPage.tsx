
export default function DiagnosisPage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">자가진단</h1>
        <p className="text-sm text-slate-600 mb-6">간단한 질문으로 현재 심리 상태를 진단해보세요.</p>

        <div className="space-y-4">
          <div className="p-4 border rounded-md">질문 1: 최근 얼마나 자주 긴장하나요?</div>
          <div className="p-4 border rounded-md">질문 2: 수면 상태는 어떠한가요?</div>
          <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md">진단 시작</button>
        </div>
      </div>
    </div>
  );
}
