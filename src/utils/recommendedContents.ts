export type RecommendedContent = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
};

export const RECOMMENDED_CONTENTS_BY_TOPIC: Record<string, RecommendedContent[]> = {
  "직장/업무": [
    { id: "c1", title: "직장 스트레스 관리법", description: "업무 부담을 줄이는 실질적인 방법들", category: "업무", level: "입문", duration: "12분" },
    { id: "c2", title: "효율적인 시간 관리", description: "마감 기한 내에 일을 끝내는 팁", category: "업무", level: "중급", duration: "18분" },
    { id: "c3", title: "직장 내 갈등 대처법", description: "동료와의 관계 문제 해결하기", category: "인간관계", level: "중급", duration: "15분" },
  ],
  "가족 관계": [
    { id: "c4", title: "가족 대화법", description: "효과적인 의사소통의 시작", category: "관계", level: "입문", duration: "14분" },
    { id: "c5", title: "부모와의 갈등 풀기", description: "세대간 차이 이해하고 소통하기", category: "관계", level: "중급", duration: "20분" },
    { id: "c6", title: "감정 조절 명상", description: "분노와 답답함을 다루는 방법", category: "명상", level: "입문", duration: "10분" },
  ],
  "수면/피로": [
    { id: "c7", title: "숙면의 비결", description: "깊은 잠을 자기 위한 생활 습관", category: "건강", level: "입문", duration: "16분" },
    { id: "c8", title: "피로 회복 운동법", description: "신체 피로를 빠르게 푸는 스트레칭", category: "운동", level: "입문", duration: "8분" },
    { id: "c9", title: "저녁 마음 정리하기", description: "하루를 마무리하는 명상 루틴", category: "명상", level: "입문", duration: "12분" },
  ],
  "불안/긴장": [
    { id: "c10", title: "불안 증상 이해하기", description: "불안과 스트레스의 신체적 반응", category: "심리", level: "입문", duration: "14분" },
    { id: "c11", title: "호흡으로 진정하기", description: "긴장을 풀어주는 호흡 기법", category: "기술", level: "입문", duration: "7분" },
    { id: "c12", title: "불안 상황 대처법", description: "예기불안을 줄이는 심리 기술", category: "심리", level: "중급", duration: "17분" },
  ],
  "회복/자기돌봄": [
    { id: "c13", title: "자신감 회복하기", description: "자존감을 높이는 일상 연습법", category: "심리", level: "중급", duration: "19분" },
    { id: "c14", title: "셀프케어 루틴", description: "자기 자신을 돌보는 시간의 중요성", category: "라이프", level: "입문", duration: "13분" },
    { id: "c15", title: "긍정 훈련", description: "부정적 생각 패턴 바꾸기", category: "심리", level: "중급", duration: "21분" },
  ],
};

export function getRecommendedContentsByTopics(topics: string[], maxItems = 4): RecommendedContent[] {
  const dedup: Record<string, boolean> = {};
  const recommended: RecommendedContent[] = [];

  topics.forEach((topic) => {
    const contents = RECOMMENDED_CONTENTS_BY_TOPIC[topic] || [];
    contents.forEach((content) => {
      if (!dedup[content.id]) {
        recommended.push(content);
        dedup[content.id] = true;
      }
    });
  });

  return recommended.slice(0, maxItems);
}
