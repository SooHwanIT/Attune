import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Briefcase,
  Clock3,
  Compass,
  Frown,
  GraduationCap,
  Heart,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";

const categories = [
  { title: "직장 스트레스", desc: "Workplace Stress", icon: Briefcase },
  { title: "불면증", desc: "Insomnia", icon: MoonStar },
  { title: "관계 문제", desc: "Relationship issues", icon: Heart },
  { title: "불안 및 우울", desc: "Anxiety & Depression", icon: Frown },
  { title: "자기 계발", desc: "Self-Development", icon: Sprout },
  { title: "청소년 고민", desc: "Youth Concerns", icon: GraduationCap },
];

const trustMetrics = [
  {
    label: "처음이라면",
    value: "상담 시작 가이드",
    helper: "3분 준비 후 바로 상담을 시작해보세요.",
    icon: Sparkles,
  },
  {
    label: "개인정보 보호",
    value: "안심 상담 환경",
    helper: "상담 데이터는 안전하게 보호됩니다.",
    icon: ShieldCheck,
  },
  {
    label: "평균 응답 시간",
    value: "3초",
    helper: "질문 후 빠르게 이어지는 대화",
    icon: Clock3,
  },
];

const features = [
  {
    title: "감정 추적",
    desc: "대화 속 감정 흐름을 포착하고 하루 단위 패턴을 명확히 기록합니다.",
    icon: Activity,
  },
  {
    title: "회복 루틴",
    desc: "지금 상태에 맞는 회복 루틴을 제안해 무리 없이 마음을 정돈합니다.",
    icon: Compass,
  },
  {
    title: "데이터 리포트",
    desc: "주간 인사이트를 리포트로 정리해 변화의 방향을 한눈에 확인합니다.",
    icon: BarChart3,
  },
];

export default function MainPage() {
  const navigate = useNavigate();

  const handleCounselClick = (e: React.MouseEvent, topic?: string) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      navigate("/login", {
        state: {
          from: "/counsel/prepare",
          topic,
        },
      });
      return;
    }
    navigate("/counsel/prepare", {
      state: {
        topic,
      },
    });
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-brand-green selection:text-white">
      <main>
        {/* Hero Section - 강력한 비주얼 임팩트 */}
        <section className="relative overflow-hidden bg-white px-4 py-12 sm:px-6 sm:py-20 md:py-28 lg:px-8 lg:py-40">
          {/* 다이나믹 배경 */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-green/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-brand-green/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl z-10">
            <div className="max-w-4xl">
              {/* 라벨 */}
              <div className="mb-6 md:mb-8 flex items-center gap-2">
                <div className="h-1 w-6 md:w-8 bg-brand-green rounded-full" />
                <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-brand-green">
                  AI 심리 상담 플랫폼
                </p>
              </div>

              {/* 메인 헤딩 */}
              <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.15] tracking-tight text-gray-900 mb-4 md:mb-6">
                <span className="block">말하지 못한 고민까지,</span>
                <span className="block mt-2 md:mt-3">
                  <span className="bg-gradient-to-r from-brand-green via-brand-green to-brand-green/60 bg-clip-text text-transparent">
                    Attune AI
                  </span>
                  <span className="text-gray-900">가 함께 정리합니다.</span>
                </span>
              </h1>

              {/* 서브 헤딩 */}
              <p className="text-sm md:text-base lg:text-lg font-medium text-gray-600 max-w-2xl leading-relaxed mb-8 md:mb-12">
                상담, 분석, 실천 콘텐츠를 하나의 흐름으로 연결해 
                <span className="block mt-2">오늘의 마음 상태를 이해하고 내일의 회복 계획까지 제안합니다.</span>
              </p>
              
              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                <Link
                  to="/counsel/prepare"
                  onClick={handleCounselClick}
                  className="group w-full sm:w-auto flex h-10 md:h-12 lg:h-14 items-center justify-center gap-2 rounded-pill bg-brand-green px-6 md:px-8 text-xs md:text-sm lg:text-base font-bold text-white transition-all duration-200 hover:bg-brand-green-dark hover:shadow-lg shadow-md"
                >
                  상담 시작하기
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-2"
                  />
                </Link>
                <Link
                  to="/contents"
                  className="group w-full sm:w-auto flex h-10 md:h-12 lg:h-14 items-center justify-center rounded-pill border-2 border-brand-green/40 bg-white px-6 md:px-8 text-xs md:text-sm lg:text-base font-bold text-brand-green transition-all duration-200 hover:border-brand-green hover:bg-brand-green/5"
                >
                  콘텐츠 둘러보기
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Metrics - 신뢰도 강조 */}
        <section className="bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            {/* 섹션 헤더 */}
            <div className="mb-8 md:mb-12">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">왜 Attune을 선택할까요?</h2>
              <div className="h-1 w-12 md:w-16 bg-brand-green rounded-full" />
            </div>

            {/* 메트릭스 그리드 */}
            <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {trustMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="group relative rounded-lg bg-white p-5 md:p-6 transition-all duration-300 hover:bg-white hover:shadow-lg shadow-sm border border-gray-200 hover:border-brand-green/30 hover:-translate-y-1"
                  >
                    {/* 순번 배지 */}
                    <div className="absolute -top-3 md:-top-4 left-5 md:left-6 w-6 md:w-8 h-6 md:h-8 rounded-full bg-brand-green text-white font-bold text-xs md:text-sm flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </div>

                    {/* 아이콘 */}
                    <div className="mb-4 md:mb-6 inline-flex h-10 md:h-12 lg:h-14 w-10 md:w-12 lg:w-14 items-center justify-center rounded-lg bg-gray-50 text-brand-green shadow-inner border border-gray-100">
                      <Icon size={24} strokeWidth={2.5} />
                    </div>

                    {/* 콘텐츠 */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {metric.label}
                    </p>
                    <p className="text-base md:text-lg lg:text-xl font-extrabold text-gray-900 mb-2 md:mb-3">
                      {metric.value}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      {metric.helper}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Core Features - 핵심 가치 제안 */}
        <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-24 lg:px-8 lg:py-28 xl:py-32">
          <div className="mx-auto max-w-7xl">
            {/* 섹션 헤더 */}
            <div className="mb-10 md:mb-14 lg:mb-16">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2">Attune의 핵심 기능</h2>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">상담 이후까지 이어지는 완전한 케어 경험</p>
              <div className="h-1 w-12 md:w-16 bg-brand-green rounded-full" />
            </div>

            {/* 피처 카드 그리드 */}
            <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative rounded-lg bg-gradient-to-br from-white to-gray-50 p-5 md:p-6 lg:p-8 transition-all duration-300 hover:shadow-xl shadow-md border border-gray-200 hover:border-brand-green/40 hover:-translate-y-2"
                  >
                    {/* 누적 라인 */}
                    <div className="absolute inset-0 rounded-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-0 left-0 w-1 h-8 md:h-12 bg-gradient-to-b from-brand-green to-transparent" />
                    </div>

                    {/* 숫자 배지 */}
                    <div className="flex items-start justify-between mb-4 md:mb-6">
                      <div className="h-8 md:h-10 lg:h-12 w-8 md:w-10 lg:w-12 rounded-lg bg-brand-green text-white flex items-center justify-center font-bold text-xs md:text-sm lg:text-base shadow-sm">
                        {idx + 1}
                      </div>
                    </div>

                    {/* 아이콘 */}
                    <div className="mb-4 md:mb-6 inline-flex h-12 md:h-14 lg:h-16 w-12 md:w-14 lg:w-16 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green transition-all group-hover:bg-brand-green group-hover:text-white">
                      <Icon size={28} strokeWidth={2} />
                    </div>

                    {/* 텍스트 */}
                    <h3 className="text-base md:text-lg lg:text-xl font-extrabold text-gray-900 mb-2 md:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Categories Section - 상담 주제 선택 */}
        <section className="bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 md:py-24 lg:px-8 lg:py-28 xl:py-32">
          <div className="mx-auto max-w-7xl">
            {/* 섹션 헤더 */}
            <div className="mb-10 md:mb-14 lg:mb-16 max-w-2xl">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2">맞춤형 상담 카테고리</h2>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">당신의 상태와 필요에 맞는 주제를 선택하세요</p>
              <div className="h-1 w-12 md:w-16 bg-brand-green rounded-full" />
            </div>

            {/* 카테고리 그리드 - 더 큰 카드 */}
            <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:gap-6">
              {categories.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={(event) => handleCounselClick(event, item.title)}
                    className="group relative flex flex-col rounded-lg bg-white p-4 md:p-5 lg:p-6 text-left transition-all duration-300 hover:shadow-lg shadow-sm border border-gray-200 hover:border-brand-green hover:bg-gray-50 hover:-translate-y-1 md:hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                  >
                    {/* 호버 배경 */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-green/0 to-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* 컨텐트 */}
                    <div className="relative z-10">
                      {/* 아이콘 */}
                      <div className="mb-3 md:mb-4 lg:mb-5 inline-flex h-9 md:h-10 lg:h-12 w-9 md:w-10 lg:w-12 items-center justify-center rounded-lg bg-brand-green text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <Icon size={20} strokeWidth={2.5} />
                      </div>

                      {/* 텍스트 */}
                      <h3 className="text-sm md:text-base lg:text-lg font-extrabold text-gray-900 mb-1 md:mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 group-hover:text-brand-green transition-colors duration-200">
                        {item.desc}
                      </p>
                    </div>

                    {/* 화살표 - 호버시만 표시 */}
                    <div className="mt-2 md:mt-3 flex items-center gap-1 md:gap-2 text-gray-400 group-hover:text-brand-green transition-colors duration-200 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all">
                      <span className="text-xs font-bold uppercase">상담 시작</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA Section - 강력한 마무리 */}
        <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-24 lg:px-8 lg:py-28 xl:py-32">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg md:rounded-xl lg:rounded-2xl bg-gradient-to-br from-brand-green/5 via-white to-gray-50 px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20 shadow-xl border border-gray-200">
            {/* 배경 효과 */}
            <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-brand-green/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-brand-green/5 blur-3xl" />
            
            <div className="relative z-10">
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
                {/* 왼쪽: 메시지 */}
                <div className="text-center md:text-left">
                  <div className="inline-block mb-4 md:mb-6 px-2 md:px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/30">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-green">
                      🎯 지금 시작하세요
                    </p>
                  </div>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-gray-900 leading-tight mb-3 md:mb-4">
                    당신의 마음을
                    <br />
                    <span className="text-brand-green">가장 잘 이해하는</span>
                    <br />
                    파트너를 만나세요
                  </h2>

                  <p className="text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed max-w-xl">
                    24시간 언제든지, 당신의 속도에 맞는 AI 상담사와 함께
                    <br className="hidden sm:block" />
                    안정적인 일상을 설계하세요.
                  </p>
                </div>

                {/* 오른쪽: CTA 버튼 */}
                <div className="flex flex-col gap-2 md:gap-3 lg:gap-4">
                  <button
                    onClick={(event) => handleCounselClick(event)}
                    className="group flex h-10 md:h-12 lg:h-14 items-center justify-center gap-2 md:gap-3 rounded-pill bg-brand-green text-white font-bold text-xs md:text-sm lg:text-base transition-all duration-200 hover:bg-brand-green-dark hover:shadow-lg shadow-md"
                  >
                    상담 시작하기
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-2"
                    />
                  </button>

                  <Link
                    to="/analysis"
                    className="flex h-10 md:h-12 lg:h-14 items-center justify-center rounded-pill border-2 border-brand-green/50 text-brand-green font-bold text-xs md:text-sm lg:text-base bg-white transition-all duration-200 hover:bg-brand-green/5 hover:border-brand-green"
                  >
                    분석 리포트 보기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}