import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { 
  Download, 
  Share2, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Brain, 
  Smile, 
  AlertCircle 
} from "lucide-react";

// 1. Mock Data (실제 데이터 연동 시 교체)
const weeklyMoodData = [
  { day: "월", score: 45, energy: 60 },
  { day: "화", score: 55, energy: 50 },
  { day: "수", score: 40, energy: 45 },
  { day: "목", score: 70, energy: 80 },
  { day: "금", score: 85, energy: 90 },
  { day: "토", score: 80, energy: 85 },
  { day: "일", score: 90, energy: 70 },
];

const radarData = [
  { subject: "스트레스", A: 40, fullMark: 100 },
  { subject: "우울감", A: 20, fullMark: 100 },
  { subject: "불안", A: 30, fullMark: 100 },
  { subject: "회복탄력성", A: 85, fullMark: 100 },
  { subject: "수면질", A: 65, fullMark: 100 },
  { subject: "대인관계", A: 70, fullMark: 100 },
];

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-12">
      
      {/* 1. 헤더 영역 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Mind Report</h1>
            <span className="px-2 py-0.5 bg-gray-100 text-slate-500 text-xs rounded font-medium">
              2024년 12월 2주차
            </span>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-gray-100 rounded-lg transition-colors">
               <Calendar size={16} /> 지난 리포트
             </button>
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-[#00C362] bg-[#E8F3EE] hover:bg-[#dcfceb] rounded-lg transition-colors">
               <Download size={16} /> PDF 저장
             </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* 2. 종합 요약 카드 (Hero Section) */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
           {/* 배경 장식 */}
           <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#00C362]/10 to-blue-500/10 rounded-full blur-3xl -z-10"></div>

           <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                이번 주 김*수 님의 마음 날씨는 <br/>
                <span className="text-[#00C362]">매우 맑음</span> 입니다. ☀️
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                주 초반에는 다소 스트레스 지수가 높았으나, 목요일 기점으로 회복탄력성이 크게 상승했습니다. 
                현재 <strong>긍정적인 에너지</strong>가 유지되고 있습니다.
              </p>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-2xl">😊</span>
                    <div>
                        <p className="text-xs text-slate-400 font-bold">주요 감정</p>
                        <p className="font-bold text-slate-700">성취감, 안도</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-2xl">🔥</span>
                    <div>
                        <p className="text-xs text-slate-400 font-bold">에너지 레벨</p>
                        <p className="font-bold text-slate-700">높음 (85%)</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* 종합 점수 원형 그래프 (CSS only) */}
           <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                <circle cx="96" cy="96" r="88" stroke="#00C362" strokeWidth="12" fill="transparent" strokeDasharray="552" strokeDashoffset="100" strokeLinecap="round" className="animate-[dash_1.5s_ease-out_forwards]" />
              </svg>
              <div className="absolute text-center">
                 <span className="text-4xl font-extrabold text-slate-800">82</span>
                 <span className="text-sm text-slate-400 block font-medium">/ 100점</span>
              </div>
           </div>
        </section>


        {/* 3. 데이터 시각화 그리드 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 좌측: 감정 흐름 (Line Chart) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-[#00C362]" size={20} />
                        <h3 className="font-bold text-lg text-slate-800">주간 감정 변화 추이</h3>
                    </div>
                    <div className="flex gap-2 text-xs font-medium">
                        <span className="flex items-center gap-1 text-[#00C362]"><span className="w-2 h-2 rounded-full bg-[#00C362]"></span>긍정 지수</span>
                        <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-300"></span>에너지</span>
                    </div>
                </div>
                
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyMoodData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#00C362" strokeWidth={3} dot={{ r: 4, fill: '#00C362', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="energy" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 우측: 심리 균형 (Radar Chart) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="text-indigo-500" size={20} />
                    <h3 className="font-bold text-lg text-slate-800">심리 균형도</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">5가지 핵심 지표의 균형을 분석합니다.</p>

                <div className="flex-1 min-h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="My Status"
                                dataKey="A"
                                stroke="#6366F1"
                                strokeWidth={2}
                                fill="#6366F1"
                                fillOpacity={0.2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-2 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700 leading-snug">
                    💡 <strong>Tip:</strong> 회복탄력성이 아주 훌륭해요! 다만, <strong>스트레스 관리</strong>에 조금 더 신경 쓰면 완벽할 거예요.
                </div>
            </div>
        </section>


        {/* 4. 키워드 및 AI 솔루션 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 상담 키워드 분석 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Brain className="text-orange-500" size={20} />
                    <h3 className="font-bold text-lg text-slate-800">주요 상담 키워드</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {/* 크기와 색상으로 빈도/긍부정 표현 */}
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-lg font-bold">#성취감</span>
                    <span className="px-3 py-1.5 bg-gray-100 text-slate-600 rounded-full text-sm">#프로젝트</span>
                    <span className="px-5 py-3 bg-indigo-100 text-indigo-600 rounded-full text-xl font-bold">#성장</span>
                    <span className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm">#피곤함</span>
                    <span className="px-4 py-2 bg-gray-50 text-slate-500 rounded-full text-base">#동료</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-sm">#기대</span>
                    <span className="px-3 py-1.5 bg-red-50 text-red-500 rounded-full text-xs">#마감기한</span>
                </div>
                <p className="mt-6 text-sm text-slate-500 border-t border-gray-100 pt-4">
                    이번 주 상담에서는 <strong>'성장'</strong>과 <strong>'성취감'</strong>에 대한 언급이 지난주 대비 <strong>40% 증가</strong>했습니다.
                </p>
            </div>

            {/* AI 맞춤 처방 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Smile className="text-[#00C362]" size={20} />
                    <h3 className="font-bold text-lg text-slate-800">Attune AI 솔루션</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-[#E8F3EE] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                            🧘‍♀️
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">잠들기 전 5분 명상</h4>
                            <p className="text-xs text-slate-500 mt-1">높은 각성 상태를 진정시키고 수면 질을 개선합니다.</p>
                        </div>
                        <span className="ml-auto text-[#00C362] text-xs font-bold self-center">Start ›</span>
                    </div>

                    <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-[#FFF8E7] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                            📝
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">감정 일기 쓰기 (성취감 편)</h4>
                            <p className="text-xs text-slate-500 mt-1">이번 주 느꼈던 긍정적인 감정을 기록으로 남겨보세요.</p>
                        </div>
                        <span className="ml-auto text-orange-500 text-xs font-bold self-center">Start ›</span>
                    </div>

                    <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-[#EBF0F8] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                            🤸
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">가벼운 스트레칭</h4>
                            <p className="text-xs text-slate-500 mt-1">경직된 근육을 이완시켜 스트레스 호르몬을 낮춥니다.</p>
                        </div>
                        <span className="ml-auto text-blue-500 text-xs font-bold self-center">Start ›</span>
                    </div>
                </div>
            </div>

        </section>

        {/* 하단 배너 */}
        <div className="mt-8 p-4 bg-[#2C3E50] rounded-xl flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-yellow-400" />
                <span className="text-sm">전문가와의 심층 상담이 필요하신가요?</span>
            </div>
            <button className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors">
                전문가 매칭하기 →
            </button>
        </div>

      </main>
    </div>
  );
}