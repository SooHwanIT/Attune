import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listContentsApi, type ContentSummaryResponse } from "../utils/contentApi";

// --- Types ---
type Difficulty = "초급" | "중급" | "고급";
type Duration = "5분" | "10분" | "15분" | "20분";
type ContentSort = "latest" | "difficulty" | "duration";

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

// 백엔드 enum → 한국어 매핑
const CATEGORY_MAP: Record<string, string> = {
  MINDFULNESS: "마음챙김",
  SLEEP: "수면",
  EMOTION_MANAGEMENT: "감정관리",
  RELATIONSHIP: "관계",
  WORK: "직장",
  SELF_ESTEEM: "자존감",
  ANXIETY_MANAGEMENT: "불안관리",
  DEPRESSION: "우울감",
  STRESS_RELIEF: "스트레스해소",
};

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  BEGINNER: "초급",
  INTERMEDIATE: "중급",
  ADVANCED: "고급",
};

// 카테고리별 이미지 (백엔드에 이미지 URL 없음)
const CATEGORY_IMAGES: Record<string, string> = {
  마음챙김: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
  수면: "https://images.unsplash.com/photo-1511295742362-92c96b1cf484?q=80&w=800&auto=format&fit=crop",
  감정관리: "https://images.unsplash.com/photo-1447452001602-7090c7ab2ad3?q=80&w=800&auto=format&fit=crop",
  관계: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop",
  직장: "https://images.unsplash.com/photo-1488228469209-c141f8bcd723?q=80&w=800&auto=format&fit=crop",
  자존감: "https://images.unsplash.com/photo-1506869640319-a1a5606089e1?q=80&w=800&auto=format&fit=crop",
  불안관리: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
  우울감: "https://images.unsplash.com/photo-1511295742362-92c96b1cf484?q=80&w=800&auto=format&fit=crop",
  스트레스해소: "https://images.unsplash.com/photo-1447452001602-7090c7ab2ad3?q=80&w=800&auto=format&fit=crop",
};
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop";

function formatDuration(minutes: number): Duration {
  const valid: Duration[] = ["5분", "10분", "15분", "20분"];
  const label = `${minutes}분` as Duration;
  return valid.includes(label) ? label : "10분";
}

// API 응답을 ContentPost로 변환
function mapApiContentToPost(api: ContentSummaryResponse): ContentPost {
  const category = CATEGORY_MAP[api.category] ?? api.category;
  const difficulty = DIFFICULTY_MAP[api.difficulty] ?? "초급";
  return {
    id: String(api.id),
    title: api.title,
    excerpt: api.briefDescription ?? "",
    keywords: api.keywords ?? [],
    category,
    difficulty,
    duration: formatDuration(api.durationMinutes),
    image: CATEGORY_IMAGES[category] ?? FALLBACK_IMAGE,
  };
}

const PRACTICES: PracticeItem[] = [
  { title: "3분 호흡", duration: "3분", description: "숨 길이를 맞추며 긴장을 천천히 낮춥니다.", completedCount: 12500, icon: "🌬️" },
  { title: "감사 일기", duration: "4분", description: "오늘 있었던 작은 감사 1가지를 기록합니다.", completedCount: 9800, icon: "✍️" },
  { title: "목/어깨 스트레칭", duration: "5분", description: "누적 피로를 풀어 잠들기 전 몸을 정돈합니다.", completedCount: 8300, icon: "🧘‍♀️" },
  { title: "5분 바디 스캔", duration: "5분", description: "신체 각 부위의 긴장 상태를 인식하고 이완합니다.", completedCount: 7600, icon: "🔍" },
];

export default function ContentsPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "전체">("전체");
  const [selectedDuration, setSelectedDuration] = useState<Duration | "전체">("전체");
  const [sortBy, setSortBy] = useState<ContentSort>("latest");

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        const response = await listContentsApi();
        const contentPosts = response.map(mapApiContentToPost);
        setPosts(contentPosts);
        setError(null);
      } catch {
        setError("콘텐츠를 불러오는 데 실패했습니다.");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, []);

  const editorPicks = posts.slice(0, 5);

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;
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
  }, [posts, selectedCategory, selectedDifficulty, selectedDuration, sortBy]);

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
        
        {loading && (
          <div className="text-center py-16">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-green mx-auto"></div>
            <p className="text-slate-600">콘텐츠를 불러오는 중...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16 bg-red-50 rounded-lg border border-red-200 p-6">
            <h3 className="text-lg font-bold text-red-700">{error}</h3>
            <p className="mt-2 text-sm text-red-600">잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500">콘텐츠가 없습니다.</p>
          </div>
        )}
        
        {!loading && !error && posts.length > 0 && (
          <>
        
        {/* 1. 에디터 픽 */}
        {editorPicks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">✨ 에디터 추천</h2>
                <p className="mt-1 text-sm text-slate-500">이번 주, 가장 도움이 될 만한 콘텐츠를 만나보세요.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ContentCard post={editorPicks[0]} isFeatured />
              </div>
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                  {editorPicks.slice(1, 5).map((post) => (
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
                    onChange={(e) => setSortBy(e.target.value as ContentSort)}
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
        </>
        )}
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
          onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE; }}
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
