
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-base">
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="mb-2 text-6xl font-bold text-brand-green">404</h1>
          <p className="mb-4 text-lg text-slate-600">페이지를 찾을 수 없습니다.</p>
          <Link to="/" className="inline-block rounded-md bg-brand-green px-6 py-3 font-semibold text-white transition-colors hover:opacity-90">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
