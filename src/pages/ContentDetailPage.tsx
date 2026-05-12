import { useParams, useNavigate } from "react-router-dom";

interface ContentPost {
  title: string;
  excerpt: string;
  category: string;
  image: string;
  content?: string;
  keywords?: string[];
}

const POSTS: ContentPost[] = [
  {
    title: "하루 10분 마음정리 루틴",
    excerpt: "업무 시작 전 10분만 투자해도 집중력과 감정 안정에 큰 차이가 생깁니다.",
    category: "마음챙김",
    image: "/assets/textures/room_material_diffuse.jpg",
    content: "업무 시작 전 10분만 투자해도 집중력과 감정 안정에 큰 차이가 생깁니다. 호흡, 감각, 생각 정리의 3단계를 짧게 실습해보세요.\n\n## 1단계: 호흡 안정 (3분)\n코로 천천히 숨을 들이쉬고 입으로 천천히 내쉽니다. 숨을 들이쉬는 동안 마음속으로 1, 2, 3을 세고, 내쉬는 동안 1, 2, 3, 4를 셉니다.\n\n## 2단계: 감각 고정 (4분)\n현재 순간에 집중하기 위해 주변의 5가지를 관찰합니다. 보이는 것, 들리는 것, 냄새, 촉감, 맛 중 어떤 감각이든 괜찮습니다.\n\n## 3단계: 생각 정리 (3분)\n오늘 해야 할 일 중 가장 중요한 것 3개를 적습니다. 우선순위를 정하면 집중력이 향상됩니다.",
      keywords: ["마음챙김", "신경가소성", "전전두엽", "감정조절", "집중력"],
  },
  {
    title: "깊은 수면을 위한 저녁 습관",
    excerpt: "수면 전 2시간을 어떻게 보내느냐가 숙면의 핵심입니다.",
    category: "수면",
    image: "/assets/textures/internal_ground_ao_texture.jpeg",
    content: "수면 전 2시간을 어떻게 보내느냐가 숙면의 핵심입니다. 빛, 카페인, 체온을 조절하는 간단한 행동 가이드를 소개합니다.\n\n## 빛 관리\n수면 1시간 전부터 화면의 밝기를 줄이거나 블루라이트 필터를 활성화하세요. 자연 채광에 노출되면 수면 호르몬인 멜라토닌의 분비가 억제됩니다.\n\n## 카페인 제한\n오후 3시 이후로는 카페인 섭취를 피하세요. 카페인의 반감기는 5시간으로, 저녁 8시 커피는 자정까지 영향을 미칩니다.\n\n## 체온 조절\n따뜻한 음식이나 음료를 섭취하면 체온이 상승했다가 저녁에 급격히 내려가며 숙면을 유도합니다.",
      keywords: ["수면과학", "생체리듬", "수면 구조", "카페인 대사", "체온 조절"],
  },
  {
    title: "감정이 폭발하기 전에 쓰는 한 문장",
    excerpt: "감정이 커질수록 언어는 짧아져야 합니다.",
    category: "감정관리",
    image: "/assets/textures/ray_material_diffuse.jpg",
    content: "감정이 커질수록 언어는 짧아져야 합니다. 갈등 상황에서 스스로를 지키면서도 관계를 해치지 않는 문장 공식을 알려드립니다.\n\n## 상황 인정\n'지금 상황이 정말 답답하고 화난다'라고 먼저 인정하세요.\n\n## 감정 표현\n'나는 이 상황에서 불편함을 느끼고 있어'라고 표현하세요.\n\n## 행동 제안\n'우리 함께 이 문제를 풀어볼까?'라고 제안하세요.",
      keywords: ["인지행동치료", "감정조절", "정서표현", "경계설정", "갈등해결"],
  },
  {
    title: "관계를 회복하는 대화 시작법",
    excerpt: "오해가 생겼을 때 문제를 풀어가는 첫 문장이 중요합니다.",
    category: "관계",
    image: "/assets/textures/equipment_material_diffuse.jpg",
    content: "오해가 생겼을 때 문제를 풀어가는 첫 문장이 중요합니다. 방어를 줄이고 공감을 이끄는 질문형 대화법을 정리했습니다.\n\n## 고민 표현하기\n'내가 뭔가 잘못했나봐, 너와 얘기하고 싶어'라고 시작하세요.\n\n## 상대방의 생각 듣기\n'너는 이 상황을 어떻게 생각해?'라고 물어보세요.\n\n## 함께 풀기\n'우리 함께 이 문제를 어떻게 풀 수 있을까?'라고 제안하세요.",
      keywords: ["애착이론", "공감적 소통", "취약성", "신뢰 구축", "관계 회복"],
  },
  {
    title: "번아웃 신호 체크리스트",
    excerpt: "피곤함과 번아웃은 다릅니다.",
    category: "직장",
    image: "/assets/textures/room_material_occlusion.jpg",
    content: "피곤함과 번아웃은 다릅니다. 최근 2주 기준으로 점검 가능한 체크리스트를 통해 현재 상태를 가볍게 진단해보세요.\n\n## 신체적 신호\n- [ ] 일어나기 힘들다\n- [ ] 피로가 풀리지 않는다\n- [ ] 소화가 잘 안 된다\n\n## 정서적 신호\n- [ ] 업무에 흥미가 없다\n- [ ] 쉽게 자극을 받는다\n- [ ] 무기력함을 느낀다\n\n## 행동적 신호\n- [ ] 업무 능률이 급격히 떨어졌다\n- [ ] 실수가 증가했다\n- [ ] 사람 만나기가 싫다",
      keywords: ["번아웃", "직무 스트레스", "심리측정", "정신건강", "직장 건강"],
  },
  {
    title: "자존감 회복을 위한 미세 습관",
    excerpt: "거창한 목표보다 작고 꾸준한 행동이 자기 신뢰를 만듭니다.",
    category: "자존감",
    image: "/assets/textures/equipment_material_normal.jpg",
    content: "거창한 목표보다 작고 꾸준한 행동이 자기 신뢰를 만듭니다. 실패 확률을 낮추는 미세 습관 설계법을 담았습니다.\n\n## 원칙 1: 2분 규칙\n시작하기 힘든 일은 2분 버전으로 시작하세요. 예를 들어 '운동'이 아니라 '스트레칭 2분'부터.\n\n## 원칙 2: 연쇄 반응\n한 가지 작은 습관이 안정되면, 그 습관 다음에 새로운 습관을 붙이세요.\n\n## 원칙 3: 환경 설계\n습관이 자동으로 일어나도록 환경을 디자인하세요. 예를 들어 명상 쿠션을 항상 보이는 곳에 놓으세요.",
      keywords: ["자기효능감", "습관형성", "보상계획", "성공 경험", "점진적 노출"],
  },
];

export default function ContentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const postIndex = id ? parseInt(id, 10) : -1;
  const post = postIndex >= 0 && postIndex < POSTS.length ? POSTS[postIndex] : null;

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

  return (
    <div className="min-h-screen bg-slate-50 text-base">
      <main className="mx-auto max-w-4xl px-4 py-10 lg:px-8 lg:py-12">
        <button
          onClick={() => navigate("/contents")}
          className="mb-6 text-sm font-semibold text-brand-green hover:opacity-80"
        >
          ← 콘텐츠로 돌아가기
        </button>

        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <img src={post.image} alt={post.title} className="h-96 w-full object-cover" />
          <div className="p-6 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-brand-green">{post.category}</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{post.title}</h1>
            <p className="mb-8 text-lg leading-7 text-slate-600">{post.excerpt}</p>

              {post.keywords && post.keywords.length > 0 && (
                <div className="mb-8 border-b border-dark pb-8">
                  <p className="mb-3 text-xs font-semibold text-slate-500">관련 키워드</p>
                  <div className="flex flex-wrap gap-2">
                    {post.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            <div className="prose prose-slate max-w-none">
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
                            className="mt-1"
                            disabled
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
      </main>
    </div>
  );
}
