import React from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-slate-800">
      
      {/* 메인 컨테이너: 좌우 분할 레이아웃 */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px] border border-gray-100">
        
        {/* Left Side: 브랜드 비주얼 영역 (Attune 감성) */}
        <div className="bg-[#E8F3EE] p-12 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <Link to="/" className="text-2xl font-extrabold tracking-tight text-slate-900 inline-block mb-2">
              Attune <span className="text-[#00C362] text-sm font-normal ml-1">AI Care</span>
            </Link>
            <h2 className="text-3xl font-bold leading-tight mt-6">
              오늘 하루, <br />
              <span className="text-[#00C362]">당신의 마음</span>은 <br />
              어떠셨나요?
            </h2>
            <p className="text-slate-600 mt-4 text-sm leading-relaxed opacity-90">
              로그인하고 AI 심리 상담사와 대화를 시작하세요.<br />
              당신의 감정 기록이 더 나은 내일을 만듭니다.
            </p>
          </div>

          {/* 하단 통계/배지 */}
          <div className="relative z-10 flex gap-3 mt-8">
            <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-white/50">
              🔒 100% 익명 보장
            </div>
            <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-white/50">
              🕒 24시간 상담 대기
            </div>
          </div>

          {/* 3D 일러스트/아이콘 (우측 하단 배치) */}
          <div className="absolute -bottom-10 -right-10 text-[180px] drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
            🔐
          </div>
          {/* 장식용 배경 원 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00C362] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        </div>

        {/* Right Side: 로그인 폼 영역 */}
        <div className="bg-white p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-2xl font-bold mb-2 text-slate-900">로그인</h1>
            <p className="text-sm text-slate-500 mb-8">
              Attune 서비스 이용을 위해 로그인해주세요.
            </p>

            {/* 입력 폼 */}
            <form className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">이메일</label>
                <input 
                  type="email"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#00C362] focus:ring-4 focus:ring-[#00C362]/10 outline-none transition-all placeholder:text-gray-400" 
                  placeholder="example@attune.com" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">비밀번호</label>
                <input 
                  type="password"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#00C362] focus:ring-4 focus:ring-[#00C362]/10 outline-none transition-all placeholder:text-gray-400" 
                  placeholder="비밀번호를 입력하세요" 
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
                  <input type="checkbox" className="accent-[#00C362] w-4 h-4 rounded border-gray-300" />
                  <span>로그인 상태 유지</span>
                </label>
                <Link to="#" className="hover:text-[#00C362] hover:underline">비밀번호 찾기</Link>
              </div>

              <button className="w-full bg-[#00C362] hover:bg-[#00b35a] text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-[#00C362]/20 transition-all active:scale-[0.98] mt-4">
                이메일로 로그인
              </button>
            </form>

            {/* 구분선 */}
            <div className="relative my-8 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative bg-white px-4 text-xs text-gray-400 font-medium">또는 소셜 계정으로 로그인</span>
            </div>

            {/* 소셜 로그인 (예시) */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-xl">💬</span>
                <span className="text-sm font-medium text-slate-700">카카오</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                 <span className="text-xl">🇬</span>
                 <span className="text-sm font-medium text-slate-700">Google</span>
              </button>
            </div>

            {/* 회원가입 유도 */}
            <div className="text-center text-sm text-slate-500 mt-10">
              아직 Attune 회원이 아니신가요? <br className="md:hidden"/>
              <Link to="/signup" className="text-[#00C362] font-bold hover:underline ml-1">
                3초만에 회원가입 하기
              </Link>
            </div>
          </div>
        </div>

      </div>
      
      {/* 배경 데코레이션 */}
      <div className="fixed top-0 left-0 w-full h-1/2 bg-[#00C362]/5 -z-10 rounded-b-[3rem]"></div>
    </div>
  );
}