import { Link } from "react-router-dom";

export default function BusinessPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">기업 멤버십</h1>
        <p className="text-sm text-slate-600 mb-6">직원 심리 케어를 위한 기업 전용 플랜 및 견적을 확인하세요.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-bold">팀 플랜</h3>
            <p className="text-sm text-slate-500">소규모 팀용 패키지</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-bold">엔터프라이즈</h3>
            <p className="text-sm text-slate-500">대규모 조직 맞춤형 솔루션</p>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/" className="text-[#00C362] font-semibold">문의하기</Link>
        </div>
      </div>
    </div>
  );
}
