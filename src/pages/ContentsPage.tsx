import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

// --- Types ---
type Difficulty = "초급" | "중급" | "고급";
type Duration = "5분" | "10분" | "15분" | "20분";

interface ContentPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  keywords: string[];
  difficulty: Difficulty;
  duration: Duration;
}

interface PracticeItem {
  title: string;
  duration: string;
  description: string;
  completedCount?: number;
  icon: string; // 접근성 및 시각적 인지를 위한 아이콘 추가
}

// --- Constants & Data ---
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  마음챙김: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  수면: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  감정관리: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  관계: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  직장: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  자존감: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  불안관리: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  우울감: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  스트레스해소: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
};

const CATEGORIES = ["전체", ...Object.keys(CATEGORY_COLORS)];

const RAW_POSTS: Omit<ContentPost, "id">[] = [
  { title: "하루 10분 마음정리 루틴", excerpt: "과학 기반 마음챙김 명상으로 전전두엽 활성화 및 집중력 강화. 신경가소성을 활용한 뇌 회로 재구성 프로토콜.", category: "마음챙김", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop", keywords: ["마음챙김", "신경가소성", "전전두엽"], difficulty: "초급", duration: "10분" },
  { title: "깊은 수면을 위한 저녁 습관", excerpt: "수면 전 2시간을 어떻게 보내느냐가 숙면의 핵심입니다. 빛, 카페인, 체온 조절로 수면의 질을 완벽하게 관리하세요.", category: "수면", image: "https://images.unsplash.com/photo-1511295742362-92c96b1cf484?q=80&w=800&auto=format&fit=crop", keywords: ["수면과학", "생체리듬", "멜라토닌"], difficulty: "초급", duration: "10분" },
  { title: "감정이 폭발하기 전에 쓰는 한 문장", excerpt: "감정이 커질수록 언어는 짧아져야 합니다. 갈등 상황에서 자신을 지키고 관계를 해치지 않는 문장 공식.", category: "감정관리", image: "https://images.unsplash.com/photo-1447452001602-7090c7ab2ad3?q=80&w=800&auto=format&fit=crop", keywords: ["감정조절", "정서표현", "갈등해결"], difficulty: "중급", duration: "10분" },
  { title: "관계를 회복하는 대화 시작법", excerpt: "오해가 생겼을 때 문제를 풀어가는 첫 문장이 중요합니다. 공감을 이끄는 질문형 대화법으로 신뢰를 회복하세요.", category: "관계", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop", keywords: ["애착이론", "공감적 소통", "신뢰 구축"], difficulty: "중급", duration: "10분" },
  { title: "번아웃 신호 체크리스트", excerpt: "피곤함과 번아웃은 다릅니다. 신체적, 정서적, 행동적 신호를 파악하고 조기에 대처하세요.", category: "직장", image: "https://images.unsplash.com/photo-1488228469209-c141f8bcd723?q=80&w=800&auto=format&fit=crop", keywords: ["번아웃", "직무 스트레스", "정신건강"], difficulty: "초급", duration: "5분" },
  { title: "자존감 회복을 위한 미세 습관", excerpt: "거창한 목표보다 작고 꾸준한 행동이 자기 신뢰를 만듭니다. 2분 규칙으로 작은 성공을 쌓아가세요.", category: "자존감", image: "https://images.unsplash.com/photo-1506869640319-a1a5606089e1?q=80&w=800&auto=format&fit=crop", keywords: ["자기효능감", "습관형성", "성공 경험"], difficulty: "중급", duration: "15분" },
  { title: "불안이 올라올 때 5분 안정 루틴", excerpt: "호흡 리셋과 감각 고정 훈련을 통한 즉각적 불안 감소. 신경계 진정 프로토콜로 공황발작에 대처하세요.", category: "불안관리", image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800&auto=format&fit=crop", keywords: ["호흡법", "불안장애", "스트레스 완화"], difficulty: "초급", duration: "5분" },
  { title: "신체 감각에 집중하기 - 5감 명상", excerpt: "오감 기반 마음챙김으로 현재 순간에 몰입하세요. 주의산만과 불안을 극복하는 감각 명상 프로토콜입니다.", category: "마음챙김", image: "https://images.unsplash.com/photo-1576091160550-112173f31c74?q=80&w=800&auto=format&fit=crop", keywords: ["마음챙김", "감각", "신경계"], difficulty: "초급", duration: "10분" },
];

const POSTS: ContentPost[] = RAW_POSTS.map((post, index) => ({ ...post, id: `post-${index}` }));

const EDITOR_PICKS = POSTS.slice(0, 5);

const PRACTICES: PracticeItem[] = [
  { title: "3분 호흡", duration: "3분", description: "숨 길이를 맞추며 긴장을 천천히 낮춥니다.", completedCount: 12500, icon: "🌬️" },
  { title: "감사 일기", duration: "4분", description: "오늘 있었던 작은 감사 1가지를 기록합니다.", completedCount: 9800, icon: "✍️" },
  { title: "목/어깨 스트레칭", duration: "5분", description: "누적 피로를 풀어 잠들기 전 몸을 정돈합니다.", completedCount: 8300, icon: "🧘‍♀️" },
  { title: "5분 바디 스캔", duration: "5분", description: "신체 각 부위의 긴장 상태를 인식하고 이완합니다.", completedCount: 7600, icon: "🔍" },
];

export default function ContentsPage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "전체">("전체");
  const [selectedDuration, setSelectedDuration] = useState<Duration | "전체">("전체");
  const [sortBy, setSortBy] = useState<"latest" | "difficulty" | "duration">("latest");

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = POSTS;
    if (selectedCategory !== "전체") filtered = filtered.filter((post) => post.category === selectedCategory);
    if (selectedDifficulty !== "전체") filtered = filtered.filter((post) => post.difficulty === selectedDifficulty);
    if (selectedDuration !== "전체") filtered = filtered.filter((post) => post.duration === selectedDuration);

    const sorted = [...filtered];
    if (sortBy === "difficulty") {
      const difficultyOrder = { 초급: 0, 중급: 1, 고급: 2 };
      sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
    } else if (sortBy === "duration") {
      const durationOrder = { "5분": 0, "10분": 1, "15분": 2, "20분": 3 };
      sorted.sort((a, b) => durationOrder[a.duration] - durationOrder[b.duration]);
    }
    return sorted;
  }, [selectedCategory, selectedDifficulty, selectedDuration, sortBy]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-brand-green/20">
      
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:py-16">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">Contents Library</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-slate-900">당신을 위한 심리 가이드</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
            전문가와 에디터가 엄선한 마음 챙김, 수면, 감정 관리 콘텐츠로 하루의 질을 높여보세요.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-16 lg:space-y-20">
        
        {/* 1. 에디터 픽 */}
        {EDITOR_PICKS.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">✨ 에디터 추천</h2>
                <p className="mt-1 text-sm text-slate-500">이번 주, 가장 도움이 될 만한 콘텐츠를 만나보세요.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ContentCard post={EDITOR_PICKS[0]} isFeatured />
              </div>
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                  {EDITOR_PICKS.slice(1, 5).map((post) => (
                    <ContentCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <hr className="border-slate-200/60" />

        {/* 2. 전체 콘텐츠 라이브러리 & 필터 */}
        <section>
          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">📚 전체 둘러보기</h2>
            <p className="mt-1 text-sm text-slate-500">관심 있는 주제를 선택하여 나만의 맞춤 가이드를 찾아보세요.</p>
          </div>

          <div className="sticky top-0 z-10 bg-[#F9FAFB]/90 backdrop-blur-md pb-6 pt-2">
            <div className="flex overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 gap-2 items-center border-b border-slate-200/60">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    selectedCategory === category
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-medium">난이도:</span>
                  <select 
                    className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
                    value={selectedDifficulty} 
                    onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | "전체")}
                  >
                    {["전체", "초급", "중급", "고급"].map(diff => <option key={diff} value={diff}>{diff}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-medium">소요 시간:</span>
                  <select 
                    className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
                    value={selectedDuration} 
                    onChange={(e) => setSelectedDuration(e.target.value as Duration | "전체")}
                  >
                    {["전체", "5분", "10분", "15분", "20분"].map(dur => <option key={dur} value={dur}>{dur}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                 <span className="text-slate-500 font-medium">정렬:</span>
                 <select 
                    className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="latest">최신순</option>
                    <option value="difficulty">난이도순</option>
                    <option value="duration">소요시간순</option>
                  </select>
              </div>
            </div>
          </div>

          {filteredAndSortedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm mt-4">
              <span className="text-5xl mb-4 grayscale opacity-50">🔍</span>
              <h3 className="text-lg font-bold text-slate-900">결과를 찾을 수 없습니다</h3>
              <p className="mt-2 text-sm text-slate-500">다른 필터 조건을 선택하거나 검색어를 변경해보세요.</p>
              <button 
                onClick={() => { setSelectedCategory("전체"); setSelectedDifficulty("전체"); setSelectedDuration("전체"); }}
                className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredAndSortedPosts.map((post) => (
                <ContentCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* 3. 마이크로 습관 */}
        <section className="bg-slate-100 text-slate-900 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-200">
          {/* 장식용 배경 요소 */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="mb-8 relative z-10">
            <h2 className="text-2xl font-bold tracking-tight">🎯 스스로 채우는 5분의 기적</h2>
            <p className="mt-2 text-slate-600">바쁜 일상 속, 잠깐의 시간으로 마음의 평온을 찾는 마이크로 습관들입니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
            {PRACTICES.map((item) => (
              <MicroPracticeCard key={item.title} {...item} />
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// --- Sub Components ---

function ContentCard({ post, isFeatured = false }: { post: ContentPost; isFeatured?: boolean }) {
  const colors = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["마음챙김"];

  return (
    <Link
      to={`/contents/${post.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full relative ${
        isFeatured ? 'ring-2 ring-slate-900/5 border-transparent' : 'border border-slate-200'
      }`}
    >
      <div className={`relative overflow-hidden bg-slate-100 ${isFeatured ? 'h-64 sm:h-80 lg:h-96' : 'h-48'}`}>
        <img
          src={post.image}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Featured 강조 뱃지 */}
        {isFeatured && (
          <div className="absolute top-4 left-4 z-20">
            <span className="rounded-full bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5">
              <span>✨</span> Editor's Pick
            </span>
          </div>
        )}
      </div>
      
      <div className={`flex flex-col flex-1 ${isFeatured ? 'p-6 lg:p-8' : 'p-5'}`}>
        {/* 메타 정보를 콘텐츠 상단으로 이동하여 시각적 흐름 개선 */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}>
            {post.category}
          </span>
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {post.difficulty}
          </span>
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            ⏱ {post.duration}
          </span>
        </div>

        <h3 className={`font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors ${isFeatured ? 'text-xl lg:text-3xl' : 'text-lg'}`}>
          {post.title}
        </h3>
        <p className={`mt-3 text-slate-500 ${isFeatured ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
          {post.excerpt}
        </p>
        
        {/* 키워드를 태그 형태로 명확히 분리 */}
        <div className="mt-auto pt-5 flex flex-wrap gap-2">
          {post.keywords.slice(0, 3).map((keyword) => (
            <span key={keyword} className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              # {keyword}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function MicroPracticeCard({ title, duration, description, completedCount, icon }: PracticeItem) {
  const formatCompletedCount = (count?: number) => {
    if (!count) return "";
    return count >= 1000 ? (count / 1000).toFixed(1).replace(/\.0$/, "") + "K" : count.toString();
  };

  // 진행도 바의 너비를 랜덤으로 가볍게 설정 (실제 데이터에 맞게 수정 필요)
  const progressWidth = completedCount ? Math.min(100, Math.max(30, (completedCount % 100))) : 0;

  return (
    <button className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white/5 p-5 text-left backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{icon}</span>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          {/* 인터랙션 유도를 위한 아이콘 */}
          <span className="text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
            →
          </span>
        </div>
        
        <p className="text-sm leading-relaxed text-slate-200 mb-6">{description}</p>
      </div>

      <div className="mt-auto">
        <div className="flex items-center justify-between mb-2">
          {completedCount !== undefined ? (
            <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {formatCompletedCount(completedCount)}명 실천 중
            </p>
          ) : (
            <span />
          )}
          <span className="flex-shrink-0 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold tracking-wider text-white">
            {duration}
          </span>
        </div>
        
        {/* 시각적 게이지 바 */}
        {completedCount !== undefined && (
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full" 
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
}