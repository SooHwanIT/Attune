
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-lg text-slate-600 mb-4">페이지를 찾을 수 없습니다.</p>
        <Link to="/" className="text-[#00C362] font-semibold">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
