import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  CreditCard, 
  Bell, 
  LogOut, 
  ChevronRight, 
  FileText, 
  MessageCircle,
  Shield,
  CalendarDays,
  X,            // 닫기 아이콘
  BarChart2,    // 차트 아이콘
  ArrowRight,   // 화살표 아이콘
  Quote         // 인용구 아이콘
} from "lucide-react";

// --- [Type Definition] 데이터 타입 정의 ---
interface ActivityData {
  id: number;
  type: 'counsel' | 'report';
  date: string;
  title: string;
  status: string;
  // 모달용 상세 데이터
  summary?: string;
  keywords?: string[];
  score?: number; // 0~100
  sentiment?: string;
}

// --- [Mock Data] 활동 내역 데이터 ---
const mockActivities: ActivityData[] = [
  {
    id: 1,
    type: 'counsel',
    date: '2024.12.11',
    title: '직장 스트레스 관련 상담',
    status: '상담 완료',
    summary: '최근 프로젝트 마감으로 인한 압박감과 동료와의 소통 부재에 대한 고민을 나누었습니다. 번아웃 초기 증상이 의심되며 휴식이 필요합니다.',
    keywords: ['#직장', '#압박감', '#번아웃', '#휴식필요'],
    score: 45,
    sentiment: '불안/지침'
  },
  {
    id: 2,
    type: 'report',
    date: '2024.12.10',
    title: '12월 2주차 마음 리포트 발급',
    status: '확인 가능',
    summary: '지난주 대비 긍정적인 감정 단어 사용이 15% 증가했습니다. 수면 패턴이 규칙적으로 변화하고 있어 심리적 안정감이 높아지고 있습니다.',
    keywords: ['#회복', '#안정', '#긍정적', '#변화'],
    score: 78,
    sentiment: '안정/회복'
  },
  {
    id: 3,
    type: 'counsel',
    date: '2024.12.05',
    title: '불면증 케어 세션',
    status: '상담 완료',
    summary: '잠들기 전 스마트폰 사용을 줄이고 명상 가이드를 실천하기로 약속했습니다. 불안감으로 인한 입면 장애가 주된 원인으로 분석됩니다.',
    keywords: ['#불면증', '#수면위생', '#명상', '#습관'],
    score: 55,
    sentiment: '우울/걱정'
  },
];

export default function MyPage() {
  // 모달 상태 관리
  const [selectedReport, setSelectedReport] = useState<ActivityData | null>(null);

  // 모달 열기
  const openModal = (activity: ActivityData) => {
    setSelectedReport(activity);
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedReport(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-12 relative">
      
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
          
          {/* 2. 좌측 사이드바 */}
          <aside className="lg:col-span-1 space-y-6">
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
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#00C362]/10 to-transparent"></div>
            </div>

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

          {/* 3. 우측 메인 컨텐츠 */}
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
                <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 group-hover:scale-110 transition-transform">🎁</div>
             </div>

             {/* 활동 요약 (Stats Grid) */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  icon="💬" label="총 상담 횟수" value="12회" desc="누적 340분 대화" 
                  color="bg-green-50 text-green-600"
                />
                <StatCard 
                  icon="📊" label="최근 마음 날씨" value="맑음 ☀️" desc="지난주 대비 긍정적" 
                  color="bg-orange-50 text-orange-600"
                />
                <StatCard 
                  icon="💌" label="받은 리포트" value="4건" desc="읽지 않은 리포트 1건" 
                  color="bg-blue-50 text-blue-600"
                />
             </div>

             {/* 상담 기록 캘린더 */}
             <CounselingCalendar />

             {/* 최근 활동 내역 (클릭 가능하도록 수정) */}
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-lg text-slate-900">최근 활동 내역</h3>
                   <button className="text-xs font-bold text-slate-400 hover:text-[#00C362] flex items-center">
                     전체보기 <ChevronRight size={14}/>
                   </button>
                </div>

                <div className="space-y-4">
                   {mockActivities.map((activity) => (
                     <ActivityItem 
                        key={activity.id}
                        data={activity}
                        onClick={() => openModal(activity)}
                     />
                   ))}
                </div>
             </div>
          </section>
        </div>
      </main>

      {/* --- [NEW] 리포트 요약 모달 --- */}
      {selectedReport && (
        <ReportSummaryModal 
          data={selectedReport} 
          onClose={closeModal} 
        />
      )}

    </div>
  );
}

// --- Sub Components ---

// [NEW] 리포트 요약 모달 컴포넌트
function ReportSummaryModal({ data, onClose }: { data: ActivityData; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                data.type === 'counsel' 
                  ? 'bg-blue-50 text-blue-600 border-blue-100' 
                  : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                {data.type === 'counsel' ? 'AI 상담 기록' : '정기 리포트'}
              </span>
              <span className="text-xs text-slate-400">{data.date}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{data.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white hover:bg-gray-100 rounded-full text-slate-400 border border-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          
          {/* Summary */}
          <div className="relative bg-[#F8FAFC] p-5 rounded-2xl">
            <Quote size={20} className="text-slate-300 absolute top-4 left-4" />
            <p className="text-slate-600 text-sm leading-relaxed pl-6 pt-1">
              {data.summary}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sentiment Score */}
            <div className="border border-gray-100 rounded-xl p-4">
               <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <BarChart2 size={16} />
                  <span className="text-xs font-bold">심리 안정 점수</span>
               </div>
               <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-slate-800">{data.score}</span>
                  <span className="text-xs text-slate-400 mb-1.5">/ 100</span>
               </div>
               {/* Progress Bar */}
               <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-[#00C362] rounded-full" 
                    style={{ width: `${data.score}%` }}
                  ></div>
               </div>
            </div>

            {/* Keywords */}
            <div className="border border-gray-100 rounded-xl p-4">
               <div className="flex items-center gap-2 mb-3 text-slate-500">
                  <FileText size={16} />
                  <span className="text-xs font-bold">주요 키워드</span>
               </div>
               <div className="flex flex-wrap gap-1.5">
                  {data.keywords?.map((k, i) => (
                    <span key={i} className="px-2 py-1 bg-[#E8F3EE] text-[#00C362] text-[10px] font-bold rounded-md">
                      {k}
                    </span>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-gray-100 transition-colors"
          >
            닫기
          </button>
          <button 
            onClick={() => navigate('/report')} // 리포트 상세 페이지로 이동
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#00C362] hover:bg-[#00b35a] shadow-lg shadow-green-100 transition-all flex items-center gap-2"
          >
            리포트 자세히 보기
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}

// [UPDATED] Activity Item 컴포넌트 (onClick 추가)
function ActivityItem({ data, onClick }: { data: ActivityData; onClick: () => void }) {
  const isCounsel = data.type === 'counsel';
  
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 hover:scale-[1.01] transition-all cursor-pointer group border border-transparent hover:border-gray-200"
    >
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 transition-colors ${
             isCounsel 
              ? 'bg-white border border-gray-200 group-hover:border-[#00C362] group-hover:text-[#00C362]' 
              : 'bg-blue-100 text-blue-600'
          }`}>
             {isCounsel ? <MessageCircle size={20}/> : <FileText size={20}/>}
          </div>
          <div>
             <p className="text-sm font-bold text-slate-800 group-hover:text-[#00C362] transition-colors">
               {data.title}
             </p>
             <p className="text-xs text-slate-400">{data.date} · {data.sentiment}</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
         <span className={`text-xs font-bold px-2 py-1 rounded ${
           isCounsel ? 'bg-gray-200 text-slate-500' : 'bg-[#E8F3EE] text-[#00C362]'
         }`}>
            {data.status}
         </span>
         <ChevronRight size={16} className="text-gray-300 group-hover:text-[#00C362]" />
       </div>
    </div>
  );
}

// --- 기타 서브 컴포넌트 (이전과 동일) ---

function CounselingCalendar() {
  // ... (이전 코드와 동일, 생략 없이 유지해주세요)
  const generateGrassData = () => {
    const weeks = 24; 
    const daysPerWeek = 7;
    const data = [];
    for (let w = 0; w < weeks; w++) {
      const weekData = [];
      for (let d = 0; d < daysPerWeek; d++) {
        const rand = Math.random();
        let level = 0;
        if (rand > 0.85) level = 1;
        if (rand > 0.95) level = 2;
        if (rand > 0.98) level = 3;
        if (w > 18 && d > 3 && Math.random() > 0.5) level = 2;
        weekData.push({ level });
      }
      data.push(weekData);
    }
    return data;
  };
  const grassData = generateGrassData();
  const getBrandColor = (level: number) => {
    switch(level) {
        case 1: return "bg-[#A7F3D0]"; 
        case 2: return "bg-[#34D399]"; 
        case 3: return "bg-[#00C362]"; 
        default: return "bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            <CalendarDays className="text-[#00C362]" size={20} />
            <h3 className="font-bold text-lg text-slate-900">상담 기록 캘린더</h3>
         </div>
         <span className="text-xs text-slate-400 font-medium">최근 6개월</span>
      </div>
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max pb-2">
          {grassData.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
              {week.map((day, dIndex) => (
                <div 
                  key={`${wIndex}-${dIndex}`}
                  className={`w-3.5 h-3.5 rounded-sm ${getBrandColor(day.level)} hover:ring-2 hover:ring-offset-1 hover:ring-[#00C362]/50 transition-all cursor-pointer`}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-2 text-xs text-slate-400">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
        <div className="w-3 h-3 rounded-sm bg-[#A7F3D0]"></div>
        <div className="w-3 h-3 rounded-sm bg-[#34D399]"></div>
        <div className="w-3 h-3 rounded-sm bg-[#00C362]"></div>
        <span>More</span>
      </div>
    </div>
  );
}

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