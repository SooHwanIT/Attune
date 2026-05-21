import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";
import { getContentDetailApi, type ContentResponse } from "../utils/contentApi";

// --- Types ---
interface ContentPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  difficulty: "초급" | "중급" | "고급";
  duration: "5분" | "10분" | "15분" | "20분";
  content?: string;
  keywords?: string[];
}

interface Comment {
  id: string;
  nickname: string;
  content: string;
  timestamp: string;
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

const DIFFICULTY_MAP: Record<string, "초급" | "중급" | "고급"> = {
  BEGINNER: "초급",
  INTERMEDIATE: "중급",
  ADVANCED: "고급",
};

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

function formatDuration(minutes: number): "5분" | "10분" | "15분" | "20분" {
  const valid = ["5분", "10분", "15분", "20분"] as const;
  const label = `${minutes}분` as "5분" | "10분" | "15분" | "20분";
  return valid.includes(label) ? label : "10분";
}

// API 응답을 ContentPost로 변환
function mapApiResponseToPost(api: ContentResponse): ContentPost {
  const category = CATEGORY_MAP[api.category] ?? api.category ?? "마음챙김";
  const difficulty = DIFFICULTY_MAP[api.difficulty] ?? "초급";
  return {
    id: String(api.id),
    title: api.title,
    excerpt: api.briefDescription ?? "",
    content: api.description,
    keywords: api.keywords ?? [],
    category,
    difficulty,
    duration: formatDuration(api.durationMinutes ?? 10),
    image: CATEGORY_IMAGES[category] ?? "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
  };
}

// 더미 댓글 데이터
const DUMMY_COMMENTS: Record<string, Comment[]> = {
  "post-0": [
    { id: "c1", nickname: "명상_초보자", content: "와 이 루틴 정말 효과 있네요! 매일 아침 10분씩 하고 있는데 업무 집중력이 확실히 올라갔어요.", timestamp: "2시간 전" },
    { id: "c2", nickname: "회사원_지현", content: "호흡법 부분이 가장 좋았습니다. 특히 4:4 호흡법이 신경계를 빠르게 진정시켜주는 느낌이 들어요.", timestamp: "1일 전" },
    { id: "c3", nickname: "스트레스_관리자", content: "감각 고정 단계에서 5가지를 관찰하는 거 진짜 신기해요. 마음이 맑아지는 기분이 들어요.", timestamp: "3일 전" },
    { id: "c4", nickname: "한음_일행", content: "이거 정말 과학 기반이네요. 신경가소성 얘기까지 나오다니! 더 자세히 알고 싶습니다.", timestamp: "5일 전" },
  ],
  "post-1": [
    { id: "c1", nickname: "불면증_탈출", content: "저 블루라이트 필터 정보가 가장 도움이 됐어요. 저녁 9시부터 적용하니까 정말 잠이 잘 와요.", timestamp: "4시간 전" },
    { id: "c2", nickname: "카페인_중독자", content: "카페인의 반감기가 5시간이라니! 그럼 오후 3시 이후 커피는 정말 피해야겠네요.", timestamp: "1일 전" },
    { id: "c3", nickname: "숙면_애호가", content: "체온 조절 팁이 정말 신기했어요. 따뜻한 우유 마시고 자니까 수면의 질이 확 좋아졌어요!", timestamp: "2일 전" },
    { id: "c4", nickname: "자기_관리법", content: "생체리듬 조절에 대해 더 깊이 알고 싶네요. 다음 콘텐츠도 기대됩니다.", timestamp: "1주 전" },
  ],
  "post-2": [
    { id: "c1", nickname: "감정_컨트롤", content: "분노 관리가 정말 어려웠는데 이 방법은 정말 실용적이네요. 특히 '나는' 메시지 부분이 정말 좋아요.", timestamp: "3시간 전" },
    { id: "c2", nickname: "대인_관계", content: "I 메시지 사용법 최고! 남편한테 이 방법으로 얘기했더니 반응이 달라지더라고요.", timestamp: "1일 전" },
    { id: "c3", nickname: "심리_공부", content: "NVC 소통법 정말 유용합니다. 이전에는 몰랐는데 이제 이해가 가네요.", timestamp: "3일 전" },
  ],
  "post-3": [
    { id: "c1", nickname: "관계_회복", content: "오해가 생겼을 때 첫 문장이 정말 중요하다는 게 와닿네요. 실제로 적용해봐야겠어요.", timestamp: "2시간 전" },
    { id: "c2", nickname: "부부_상담", content: "취약성을 드러내는 것이 신뢰를 쌓는다니... 이제 달라질 것 같아요.", timestamp: "2일 전" },
    { id: "c3", nickname: "애착이론", content: "애착이론을 기반으로 한 설명이라니 정말 과학적이네요! 신뢰도가 높아요.", timestamp: "1주 전" },
  ],
  "post-4": [
    { id: "c1", nickname: "직장_생활", content: "번아웃이 와 있는 건지 확인하기 좋네요. 체크리스트를 해보니 신체적 신호가 많이 있네요.", timestamp: "5시간 전" },
    { id: "c2", nickname: "회사원_정훈", content: "피곤함과 번아웃의 차이를 처음 알았어요. 정말 도움이 되는 콘텐츠입니다!", timestamp: "1일 전" },
    { id: "c3", nickname: "정신_건강", content: "행동적 신호 부분에서 깜짝 놀랐어요. 저 다 해당하는데... 번아웃 회복 로드맵을 보고 싶네요.", timestamp: "3일 전" },
  ],
  "post-5": [
    { id: "c1", nickname: "습관_형성", content: "2분 규칙 정말 좋아요! 운동을 시작하는 게 제일 어려웠는데 이 방법으로 시작하니까 되더라고요.", timestamp: "1시간 전" },
    { id: "c2", nickname: "자존감_UP", content: "작은 성공이 쌓여 자신감으로 변한다는 말이 제 가슴을 쳤어요. 이제 시작해볼 거예요.", timestamp: "1일 전" },
    { id: "c3", nickname: "환경_설계", content: "습관 쌓기 개념 정말 신기했어요. 한 가지씩 붙여나가면서 진행해봐야겠어요.", timestamp: "4일 전" },
    { id: "c4", nickname: "신경가소성", content: "신경생물학적 기초까지 다루니까 정말 신뢰가 가네요. 좋은 콘텐츠 감사합니다!", timestamp: "1주 전" },
  ],
  "post-6": [
    { id: "c1", nickname: "불안_극복", content: "이 루틴 정말 신기해요! 불안이 올라올 때마다 따라하면 5분 안에 진정이 되네요.", timestamp: "2시간 전" },
    { id: "c2", nickname: "공황_대처", content: "호흡 리셋이 가장 효과적이었어요. 이제 불안할 때 이 방법을 먼저 떠올려요.", timestamp: "1일 전" },
    { id: "c3", nickname: "감각_고정", content: "감각 고정 훈련이 정말 도움이 됩니다. 신경계가 진정되는 게 확실히 느껴져요.", timestamp: "3일 전" },
  ],
  "post-7": [
    { id: "c1", nickname: "명상_애호가", content: "5감 명상 정말 좋습니다! 매일 해보니 마음이 더 차분해졌어요.", timestamp: "3시간 전" },
    { id: "c2", nickname: "현재_순간", content: "현재 순간에 집중하는 방법을 배우니까 일상이 더 풍요로워졌어요.", timestamp: "1일 전" },
    { id: "c3", nickname: "감각_발달", content: "오감에 집중한다는 게 이렇게 효과적일 줄 몰랐어요. 추천합니다!", timestamp: "2일 전" },
    { id: "c4", nickname: "신경계_리셋", content: "주의산만이 많았는데 이 방법으로 많이 개선됐어요. 감사합니다!", timestamp: "5일 전" },
  ],
};

export default function ContentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<ContentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(DUMMY_COMMENTS[id || ""] || []);
  const [commentText, setCommentText] = useState("");
  const [currentUserName, setCurrentUserName] = useState<string>("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserName(user.name);
    }
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) {
        setError("콘텐츠를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getContentDetailApi(id);
        const contentPost = mapApiResponseToPost(response);
        setPost(contentPost);
        setError(null);
      } catch {
        setError("콘텐츠를 불러오는 데 실패했습니다.");
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  const colors = post ? CATEGORY_COLORS[post.category] || CATEGORY_COLORS["마음챙김"] : CATEGORY_COLORS["마음챙김"];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-base flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-green mx-auto"></div>
          <p className="text-slate-600">콘텐츠를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 text-base">
        <main className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">{error || "콘텐츠를 찾을 수 없습니다."}</h1>
            <button
              onClick={() => navigate("/contents")}
              className="mt-4 font-semibold text-brand-green hover:opacity-80"
            >
              ← 콘텐츠로 돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleAddComment = () => {
    if (commentText.trim() && currentUserName) {
      const newComment: Comment = {
        id: `c${Date.now()}`,
        nickname: currentUserName,
        content: commentText.trim(),
        timestamp: "방금",
      };
      setComments([newComment, ...comments]);
      setCommentText("");
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-base">
      <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8 lg:py-12">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate("/contents")}
          className="mb-8 flex items-center gap-1.5 text-sm font-semibold text-brand-green transition-colors hover:text-brand-green/80"
        >
          ← 콘텐츠로 돌아가기
        </button>

        {/* 콘텐츠 본문 */}
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 커버 이미지 */}
          <div className="relative overflow-hidden bg-slate-100 h-80 md:h-96">
            <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
          </div>

          {/* 메타정보 & 제목 */}
          <div className="p-6 md:p-10">
            {/* 메타정보 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold ${colors.bg} ${colors.text}`}>
                {post.category}
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {post.difficulty}
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                ⏱ {post.duration}
              </span>
            </div>

            {/* 제목 & 서브텍스트 */}
            <h1 className="mb-3 text-3xl md:text-4xl font-bold leading-tight text-slate-900">{post.title}</h1>
            <p className="mb-8 text-lg leading-7 text-slate-600">{post.excerpt}</p>

            {/* 관련 키워드 */}
            {post.keywords && post.keywords.length > 0 && (
              <div className="mb-8 pb-8 border-b border-slate-200">
                <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">관련 키워드</p>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 콘텐츠 본문 */}
            <div className="prose prose-slate max-w-none mb-12">
              {post.content?.split("\n\n").map((paragraph, idx) => {
                if (paragraph.startsWith("##")) {
                  return (
                    <h2
                      key={idx}
                      className="mb-4 mt-8 text-2xl font-bold text-slate-900"
                    >
                      {paragraph.replace(/^##\s/, "")}
                    </h2>
                  );
                }
                if (paragraph.startsWith("- [ ]")) {
                  return (
                    <ul key={idx} className="mb-4 list-none space-y-2">
                      {paragraph.split("\n").map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3 text-slate-600">
                          <input
                            type="checkbox"
                            className="mt-1.5 cursor-pointer"
                          />
                          <span>{item.replace(/^-\s\[\]\s/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="mb-4 leading-7 text-slate-600">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>
        </article>

        {/* 댓글 섹션 */}
        <section className="mt-12 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">💬 댓글 <span className="text-lg font-semibold text-slate-500">({comments.length})</span></h2>
            <p className="text-sm text-slate-500">이 콘텐츠에 대한 생각을 나누어주세요.</p>
          </div>

          {/* 댓글 입력 폼 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-4">
              {currentUserName && (
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{currentUserName}</span>님의 댓글
                </p>
              )}
              <div>
                <label htmlFor="comment" className="block text-sm font-semibold text-slate-700 mb-2">
                  댓글 내용
                </label>
                <textarea
                  id="comment"
                  placeholder="댓글을 입력해주세요. 존중하는 톤으로 작성해주세요 :)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green/30 resize-none"
                />
              </div>
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || !currentUserName}
                className="w-full rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                댓글 등록
              </button>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-8 text-center">
                <p className="text-slate-500">아직 댓글이 없습니다. 첫 번째 댓글을 남겨주세요!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{comment.nickname}</p>
                      <p className="text-xs text-slate-500">{comment.timestamp}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                  <p className="text-slate-700 leading-relaxed break-words">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
