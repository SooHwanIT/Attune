import { useState } from "react";
import PreCounselModal from "../../components/PreCounselModal";

export default function PreCounselModalTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          PreCounselModal Test Page
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          상담 준비 모달 디자인 테스트
        </p>

        <button
          onClick={() => setIsModalOpen(!isModalOpen)}
          className="px-6 py-3 bg-brand-green text-white font-bold rounded-lg hover:bg-brand-green-dark transition"
        >
          {isModalOpen ? "모달 닫기" : "모달 열기"}
        </button>

        <PreCounselModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
