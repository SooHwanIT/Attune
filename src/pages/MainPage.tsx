import React, { useState } from "react";
import { Link } from "react-router-dom";
import PreCounselModal from "../components/PreCounselModal";

export default function MainPage() {
    const [isPreModalOpen, setIsPreModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
      
      {/* 1. 최상단 녹색 배너 */}
      <div className="bg-[#00C362] text-white px-4 py-3 flex items-center justify-center text-sm font-medium relative">
        <div className="flex gap-2 items-center">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">EVENT</span>
            <span>지금 가입하면 AI 심리 정밀 분석 리포트가 무료!</span>
        </div>
        <button className="absolute right-4 text-white/80 hover:text-white">✕</button>
      </div>

      {/* 2. 네비게이션 바 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
                        {/* 로고 */}
                        <Link to="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
                            Attune <span className="text-[#00C362] text-sm font-normal ml-1">AI Care</span>
                        </Link>
                        {/* 메뉴 */}
                        <nav className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
                              <button onClick={() => setIsPreModalOpen(true)} className="hover:text-[#00C362]">AI 상담하기</button>
                              <Link to="/report" className="hover:text-[#00C362]">마음 리포트</Link>
                              <Link to="/diagnosis" className="hover:text-[#00C362]">자가진단</Link>
              <Link to="#" className="hover:text-[#00C362] relative">
                치유 콘텐츠 <span className="text-[10px] text-[#00C362] absolute -top-2 -right-3">NEW</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">🔍</button>
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-[#00C362]">로그인 / 회원가입</Link>
            <Link to="/business" className="text-xs border px-2 py-1 rounded text-slate-500 hover:bg-gray-50">기업 멤버십</Link>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-12">
        
        {/* 3. 상단 섹션: 메인 배너(2) + 로그인 박스(1) 구조 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 왼쪽: 대형 배너 (2칸 차지) */}
          <div onClick={() => setIsPreModalOpen(true)} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group cursor-pointer">
            {/* 상단 알림 바 */}
            <div className="bg-blue-50 px-6 py-3 flex items-center gap-2 text-sm text-blue-600">
               <span className="font-bold">📢</span>
               <span>김*수님의 12월 마음 분석 리포트가 도착했습니다.</span>
            </div>
            
            {/* 배너 내용 */}
            <div className="p-10 flex flex-col justify-center h-full min-h-[320px]">
                <p className="text-slate-500 font-medium mb-2">24시간 깨어있는 당신만의 상담소</p>
                <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                    말 못 할 고민이 있다면<br/>
                    <span className="text-indigo-600">Attune AI와 대화해보세요</span>
                </h2>
                <div className="flex gap-2 mt-auto">
                    <span className="px-3 py-1 bg-gray-100 text-xs font-bold text-slate-600 rounded">실시간 대화</span>
                    <span className="px-3 py-1 bg-gray-100 text-xs font-bold text-slate-600 rounded">감정 분석</span>
                    <span className="px-3 py-1 bg-gray-100 text-xs font-bold text-slate-600 rounded">100% 익명</span>
                </div>
                {/* 일러스트 대체 (우측 하단 배치) */}
                <div className="absolute bottom-6 right-8 text-8xl opacity-90 group-hover:scale-105 transition-transform duration-300">
                    🤖
                </div>
            </div>
          </div>

          {/* 오른쪽: 로그인 및 서브 배너 (1칸 차지) */}
          <div className="flex flex-col gap-6">
            
            {/* 로그인 박스 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <p className="text-slate-600 mb-6">로그인하고 <br/><span className="font-bold">내 감정 데이터</span>를 확인하세요.</p>
                <Link to="/login" className="w-full bg-[#00C362] hover:bg-[#00b35a] text-white font-bold py-3.5 rounded-lg transition-colors shadow-sm">
                    로그인
                </Link>
            </div>

            {/* 서브 배너 (이벤트) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
                <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">오늘의 감정 기록하고</p>
                    <p className="text-sm text-[#00C362] font-bold">마음 영양제 받아가세요!</p>
                </div>
                <div className="text-4xl">💊</div>
            </div>

          </div>
        </section>


        {/* 4. 중단 섹션: 3개 카드 그리드 (서비스 핵심 기능) */}
        <section>
            <div className="flex items-center gap-2 mb-5">
                <h2 className="text-xl font-bold text-slate-900">Attune 솔루션</h2>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-bold rounded">누적 상담 건수: 1,245,951건</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 카드 1: AI 대화 (초록 테마) */}
                <div className="bg-[#E8F3EE] rounded-2xl p-8 relative overflow-hidden h-64 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group">
                    <div className="relative z-10">
                        <p className="text-slate-600 text-sm font-medium mb-2">답답한 마음, 들어줄 곳이 필요할 때</p>
                        <h3 className="text-xl font-bold text-slate-800 leading-snug">
                            Attune AI에게 <br/>
                            <span className="text-[#00C362]">속마음</span>을 털어놓으세요.
                        </h3>
                        <div className="mt-8 flex items-center gap-1 text-slate-500 text-sm group-hover:text-slate-800">
                            상담 시작하기 <span className="text-lg">›</span>
                        </div>
                    </div>
                    {/* 아이콘 */}
                    <div className="absolute bottom-4 right-4 text-[80px] drop-shadow-xl transform rotate-[-10deg]">
                        🗣️
                    </div>
                </div>

                {/* 카드 2: 분석 및 치료 (베이지 테마) */}
                <div className="bg-[#FFF8E7] rounded-2xl p-8 relative overflow-hidden h-64 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group">
                    <div className="relative z-10">
                        <p className="text-slate-600 text-sm font-medium mb-2">대화만 해도 분석이 됩니다</p>
                        <h3 className="text-xl font-bold text-slate-800 leading-snug">
                            대화 속 감정 패턴을 찾아<br/>
                            <span className="text-orange-500">맞춤 치유법</span>을 제안해요.
                        </h3>
                        <div className="mt-8 flex items-center gap-1 text-slate-500 text-sm group-hover:text-slate-800">
                            솔루션 예시보기 <span className="text-lg">›</span>
                        </div>
                    </div>
                    <div className="absolute bottom-4 right-4 text-[80px] drop-shadow-xl transform scale-x-[-1]">
                        🧠
                    </div>
                </div>

                {/* 카드 3: 리포트 발급 (블루 테마) */}
                <div className="bg-[#EBF0F8] rounded-2xl p-8 relative overflow-hidden h-64 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group">
                    <div className="relative z-10">
                        <p className="text-slate-600 text-sm font-medium mb-2">데이터로 보는 내 마음</p>
                        <h3 className="text-xl font-bold text-slate-800 leading-snug">
                            변화하는 심리 상태를<br/>
                            <span className="text-blue-500">정기 리포트</span>로 받아보세요.
                        </h3>
                        <div className="mt-8 flex items-center gap-1 text-slate-500 text-sm group-hover:text-slate-800">
                            샘플 리포트 확인 <span className="text-lg">›</span>
                        </div>
                    </div>
                    <div className="absolute bottom-4 right-4 text-[80px] drop-shadow-xl">
                        📄
                    </div>
                </div>

            </div>
        </section>

        {/* 5. 하단: 추천 상담 주제 */}
        <section className="pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">지금 바로 이야기 나눌 수 있는 주제</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { emoji: "😰", title: "직장 스트레스", desc: "번아웃 예방 및 관리" },
                    { emoji: "🌙", title: "불면증 케어", desc: "수면 패턴 분석 보고서" },
                    { emoji: "💔", title: "이별과 상실", desc: "슬픔을 나누는 대화" },
                    { emoji: "📉", title: "자존감 회복", desc: "나를 사랑하는 연습" },
                ].map((item, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-3">
                            {item.emoji}
                        </div>
                        <h3 className="font-bold text-slate-800">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>

      </main>

      {/* 우측 하단 플로팅 버튼 */}
            <div className="fixed bottom-8 right-8 z-50">
                <button onClick={() => setIsPreModalOpen(true)} className="bg-[#00C362] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#00b35a] transition-colors group relative">
                        <span className="text-2xl">💬</span>
                        <span className="absolute right-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                상담 시작하기
                        </span>
                </button>
            </div>

            <PreCounselModal isOpen={isPreModalOpen} onClose={() => setIsPreModalOpen(false)} />

    </div>
  );
}