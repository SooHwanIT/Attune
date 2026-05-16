import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

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
};

const POSTS: ContentPost[] = [
  {
    id: "post-0",
    title: "하루 10분 마음정리 루틴",
    excerpt: "업무 시작 전 10분만 투자해도 집중력과 감정 안정에 큰 차이가 생깁니다.",
    category: "마음챙김",
    difficulty: "초급",
    duration: "10분",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
    content: "업무 시작 전 10분만 투자해도 집중력과 감정 안정에 큰 차이가 생깁니다. 호흡, 감각, 생각 정리의 3단계를 짧게 실습해보세요.\n\n## 1단계: 호흡 안정 (3분)\n코로 천천히 숨을 들이쉬고 입으로 천천히 내쉽니다. 숨을 들이쉬는 동안 마음속으로 1, 2, 3을 세고, 내쉬는 동안 1, 2, 3, 4를 셉니다. 이 호흡은 신경계를 진정시키고 부교감신경을 활성화합니다.\n\n## 2단계: 감각 고정 (4분)\n현재 순간에 집중하기 위해 주변의 5가지를 관찰합니다. 보이는 것, 들리는 것, 냄새, 촉감, 맛 중 어떤 감각이든 괜찮습니다. 이 과정은 전두엽의 활성화를 돕고 집중력을 향상시킵니다.\n\n## 3단계: 생각 정리 (3분)\n오늘 해야 할 일 중 가장 중요한 것 3개를 적습니다. 우선순위를 정하면 집중력이 향상되고 스트레스가 감소합니다. 이는 신경가소성을 활용한 효과적인 뇌 훈련법입니다.",
    keywords: ["마음챙김", "신경가소성", "전전두엽", "감정조절", "집중력"],
  },
  {
    id: "post-1",
    title: "깊은 수면을 위한 저녁 습관",
    excerpt: "수면 전 2시간을 어떻게 보내느냐가 숙면의 핵심입니다.",
    category: "수면",
    difficulty: "초급",
    duration: "10분",
    image: "https://images.unsplash.com/photo-1511295742362-92c96b1cf484?q=80&w=800&auto=format&fit=crop",
    content: "수면 전 2시간을 어떻게 보내느냐가 숙면의 핵심입니다. 빛, 카페인, 체온을 조절하는 간단한 행동 가이드를 소개합니다.\n\n## 빛 관리\n수면 1시간 전부터 화면의 밝기를 줄이거나 블루라이트 필터를 활성화하세요. 자연 채광에 노출되면 수면 호르몬인 멜라토닌의 분비가 억제됩니다. 저녁 시간에는 어두운 환경 유지가 중요합니다.\n\n## 카페인 제한\n오후 3시 이후로는 카페인 섭취를 피하세요. 카페인의 반감기는 5시간으로, 저녁 8시 커피는 자정까지 영향을 미칩니다. 특히 예민한 사람은 더 일찍 끊어야 합니다.\n\n## 체온 조절\n따뜻한 음식이나 음료를 섭취하면 체온이 상승했다가 저녁에 급격히 내려가며 숙면을 유도합니다. 따뜻한 우유나 허브차가 도움이 됩니다.",
    keywords: ["수면과학", "생체리듬", "수면 구조", "카페인 대사", "체온 조절"],
  },
  {
    id: "post-2",
    title: "감정이 폭발하기 전에 쓰는 한 문장",
    excerpt: "감정이 커질수록 언어는 짧아져야 합니다.",
    category: "감정관리",
    difficulty: "중급",
    duration: "10분",
    image: "https://images.unsplash.com/photo-1447452001602-7090c7ab2ad3?q=80&w=800&auto=format&fit=crop",
    content: "감정이 커질수록 언어는 짧아져야 합니다. 갈등 상황에서 스스로를 지키면서도 관계를 해치지 않는 문장 공식을 알려드립니다.\n\n## 상황 인정\n'지금 상황이 정말 답답하고 화난다'라고 먼저 인정하세요. 자신의 감정을 있는 그대로 인정하는 것이 가장 먼저 할 일입니다.\n\n## 감정 표현\n'나는 이 상황에서 불편함을 느끼고 있어'라고 표현하세요. 'I' 메시지를 사용하여 비난하지 않으면서 자신의 감정을 전달합니다.\n\n## 행동 제안\n'우리 함께 이 문제를 풀어볼까?'라고 제안하세요. 해결 방안을 함께 찾는 자세가 중요합니다.",
    keywords: ["인지행동치료", "감정조절", "정서표현", "경계설정", "갈등해결"],
  },
  {
    id: "post-3",
    title: "관계를 회복하는 대화 시작법",
    excerpt: "오해가 생겼을 때 문제를 풀어가는 첫 문장이 중요합니다.",
    category: "관계",
    difficulty: "중급",
    duration: "10분",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop",
    content: "오해가 생겼을 때 문제를 풀어가는 첫 문장이 중요합니다. 방어를 줄이고 공감을 이끄는 질문형 대화법을 정리했습니다.\n\n## 고민 표현하기\n'내가 뭔가 잘못했나봐, 너와 얘기하고 싶어'라고 시작하세요. 이 문장은 상대방의 방어심을 낮추고 대화의 문을 엽니다.\n\n## 상대방의 생각 듣기\n'너는 이 상황을 어떻게 생각해?'라고 물어보세요. 상대방의 관점을 이해하는 것이 관계 회복의 첫걸음입니다.\n\n## 함께 풀기\n'우리 함께 이 문제를 어떻게 풀 수 있을까?'라고 제안하세요. 함께라는 표현으로 팀 정신을 강화합니다.",
    keywords: ["애착이론", "공감적 소통", "취약성", "신뢰 구축", "관계 회복"],
  },
  {
    id: "post-4",
    title: "번아웃 신호 체크리스트",
    excerpt: "피곤함과 번아웃은 다릅니다.",
    category: "직장",
    difficulty: "초급",
    duration: "5분",
    image: "https://images.unsplash.com/photo-1488228469209-c141f8bcd723?q=80&w=800&auto=format&fit=crop",
    content: "피곤함과 번아웃은 다릅니다. 최근 2주 기준으로 점검 가능한 체크리스트를 통해 현재 상태를 가볍게 진단해보세요.\n\n## 신체적 신호\n- [ ] 일어나기 힘들다\n- [ ] 피로가 풀리지 않는다\n- [ ] 소화가 잘 안 된다\n\n## 정서적 신호\n- [ ] 업무에 흥미가 없다\n- [ ] 쉽게 자극을 받는다\n- [ ] 무기력함을 느낀다\n\n## 행동적 신호\n- [ ] 업무 능률이 급격히 떨어졌다\n- [ ] 실수가 증가했다\n- [ ] 사람 만나기가 싫다",
    keywords: ["번아웃", "직무 스트레스", "심리측정", "정신건강", "직장 건강"],
  },
  {
    id: "post-5",
    title: "자존감 회복을 위한 미세 습관",
    excerpt: "거창한 목표보다 작고 꾸준한 행동이 자기 신뢰를 만듭니다.",
    category: "자존감",
    difficulty: "중급",
    duration: "15분",
    image: "https://images.unsplash.com/photo-1506869640319-a1a5606089e1?q=80&w=800&auto=format&fit=crop",
    content: "거창한 목표보다 작고 꾸준한 행동이 자기 신뢰를 만듭니다. 실패 확률을 낮추는 미세 습관 설계법을 담았습니다.\n\n## 원칙 1: 2분 규칙\n시작하기 힘든 일은 2분 버전으로 시작하세요. 예를 들어 '운동'이 아니라 '스트레칭 2분'부터. 작은 성공이 쌓여 자신감으로 변합니다.\n\n## 원칙 2: 연쇄 반응\n한 가지 작은 습관이 안정되면, 그 습관 다음에 새로운 습관을 붙이세요. 이를 습관 쌓기라고 부릅니다.\n\n## 원칙 3: 환경 설계\n습관이 자동으로 일어나도록 환경을 디자인하세요. 예를 들어 명상 쿠션을 항상 보이는 곳에 놓으세요.",
    keywords: ["자기효능감", "습관형성", "보상계획", "성공 경험", "점진적 노출"],
  },
];

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
  const [comments, setComments] = useState<Comment[]>(DUMMY_COMMENTS[id || ""] || []);
  const [commentText, setCommentText] = useState("");
  const [currentUserName, setCurrentUserName] = useState<string>("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserName(user.name);
    }
  }, []);

  const post = POSTS.find((p) => p.id === id);
  const colors = post ? CATEGORY_COLORS[post.category] || CATEGORY_COLORS["마음챙김"] : CATEGORY_COLORS["마음챙김"];

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 text-base">
        <main className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">콘텐츠를 찾을 수 없습니다.</h1>
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
