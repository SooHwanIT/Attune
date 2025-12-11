import React from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  LogOut, 
  ChevronRight, 
  FileText, 
  MessageCircle,
  Shield
} from "lucide-react";

export default function MyPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-12">
      
      {/* 1. 헤더 (공통) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-slate-900">
            Attune <span className="text-[#00C362] text-sm font-normal ml-1">My</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-slate-600">
             <Link to="/counsel" className="hover:text-[#00C362]">상담실 가기</Link>
             <Link to="/report" className="hover:text-[#00C362]">리포트</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 2. 좌측 사이드바 (프로필 및 메뉴) */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* 프로필 카드 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
               <div className="w-24 h-24 bg-[#E8F3EE] rounded-full flex items-center justify-center text-5xl mb-4 border-4 border-white shadow-sm z-10">
                 🧑‍💻
               </div>
               <h2 className="text-xl font-bold text-slate-900">김어튠 님</h2>
               <p className="text-sm text-slate-500 mb-4">attune_user@email.com</p>
               
               <span className="px-3 py-1 bg-gray-100 text-slate-600 text-xs font-bold rounded-full mb-6">
                 🌱 Free Plan
               </span>

               <button className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 transition-colors">
                 프로필 편집
               </button>

               {/* 데코레이션 */}
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#00C362]/10 to-transparent"></div>
            </div>

            {/* 네비게이션 메뉴 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               <nav className="flex flex-col">
                  <MenuItem icon={<User size={18}/>} label="계정 정보" active />
                  <MenuItem icon={<CreditCard size={18}/>} label="구독 및 결제 관리" />
                  <MenuItem icon={<Bell size={18}/>} label="알림 설정" />
                  <MenuItem icon={<Shield size={18}/>} label="개인정보 보호" />
                  <div className="border-t border-gray-100 my-1"></div>
                  <button className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left w-full">
                     <LogOut size={18} />
                     로그아웃
                  </button>
               </nav>
            </div>
          </aside>


          {/* 3. 우측 메인 컨텐츠 (대시보드) */}
          <section className="lg:col-span-3 space-y-6">
             
             {/* 타이틀 */}
             <div className="flex items-end justify-between">
                <h1 className="text-2xl font-bold text-slate-900">마이페이지</h1>
                <p className="text-sm text-slate-500">내 활동 내역과 계정을 관리합니다.</p>
             </div>

             {/* 멤버십 배너 */}
             <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg shadow-indigo-200 relative overflow-hidden group">
                <div className="relative z-10">
                   <h3 className="text-xl font-bold mb-2">프리미엄 멤버십으로 업그레이드하세요! 💎</h3>
                   <p className="text-indigo-100 text-sm opacity-90">
                      무제한 AI 상담과 심층 심리 분석 리포트를 받아보실 수 있습니다.
                   </p>
                </div>
                <button className="mt-4 md:mt-0 relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                   멤버십 자세히 보기
                </button>
                {/* 배경 장식 */}
                <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 group-hover:scale-110 transition-transform">🎁</div>
             </div>

             {/* 활동 요약 (Stats Grid) */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  icon="💬" 
                  label="총 상담 횟수" 
                  value="12회" 
                  desc="누적 340분 대화" 
                  color="bg-green-50 text-green-600"
                />
                <StatCard 
                  icon="📊" 
                  label="최근 마음 날씨" 
                  value="맑음 ☀️" 
                  desc="지난주 대비 긍정적" 
                  color="bg-orange-50 text-orange-600"
                />
                <StatCard 
                  icon="💌" 
                  label="받은 리포트" 
                  value="4건" 
                  desc="읽지 않은 리포트 1건" 
                  color="bg-blue-50 text-blue-600"
                />
             </div>

             {/* 최근 활동 내역 */}
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-lg text-slate-900">최근 활동 내역</h3>
                   <button className="text-xs font-bold text-slate-400 hover:text-[#00C362] flex items-center">
                     전체보기 <ChevronRight size={14}/>
                   </button>
                </div>

                <div className="space-y-4">
                   <ActivityItem 
                     type="counsel"
                     date="2024.12.11"
                     title="직장 스트레스 관련 상담"
                     status="상담 완료"
                   />
                   <ActivityItem 
                     type="report"
                     date="2024.12.10"
                     title="12월 2주차 마음 리포트 발급"
                     status="확인 가능"
                   />
                   <ActivityItem 
                     type="counsel"
                     date="2024.12.05"
                     title="불면증 케어 세션"
                     status="상담 완료"
                   />
                </div>
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// --- Sub Components ---

// 메뉴 아이템 컴포넌트
function MenuItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors text-left w-full border-l-4 ${
      active 
        ? "bg-[#E8F3EE] text-[#00C362] border-[#00C362]" 
        : "text-slate-600 hover:bg-gray-50 border-transparent"
    }`}>
      {icon}
      {label}
    </button>
  );
}

// 통계 카드 컴포넌트
function StatCard({ icon, label, value, desc, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform">
       <div className="flex justify-between items-start">
          <div>
             <p className="text-xs text-slate-400 font-bold mb-1">{label}</p>
             <h4 className="text-xl font-extrabold text-slate-800">{value}</h4>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${color}`}>
             {icon}
          </div>
       </div>
       <p className="text-xs text-slate-400 mt-2">{desc}</p>
    </div>
  );
}

// 활동 내역 아이템 컴포넌트
function ActivityItem({ type, date, title, status }: any) {
  const isCounsel = type === 'counsel';
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 ${isCounsel ? 'bg-white border border-gray-200' : 'bg-blue-100 text-blue-600'}`}>
             {isCounsel ? <MessageCircle size={20}/> : <FileText size={20}/>}
          </div>
          <div>
             <p className="text-sm font-bold text-slate-800 group-hover:text-[#00C362] transition-colors">{title}</p>
             <p className="text-xs text-slate-400">{date}</p>
          </div>
       </div>
       <span className={`text-xs font-bold px-2 py-1 rounded ${isCounsel ? 'bg-gray-200 text-slate-500' : 'bg-[#E8F3EE] text-[#00C362]'}`}>
          {status}
       </span>
    </div>
  );
}