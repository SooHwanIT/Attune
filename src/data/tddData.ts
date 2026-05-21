export type TddStatus = '완료' | '구현중' | '미구현';
export type TddImportance = '상' | '중' | '하';

export interface TddItem {
  id: string;
  question: string;
  importance: TddImportance;
  status: TddStatus;
}

export interface TddCategory {
  id: string;
  icon: string;
  name: string;
  items: TddItem[];
}

export const tddData: TddCategory[] = [
  {
    id: 'user',
    icon: '👤',
    name: '인증/유저',
    items: [
      { id: 'u-1', question: '로그인이 이루어지는가?', importance: '상', status: '완료' },
      { id: 'u-2', question: '회원가입이 이루어지는가?', importance: '상', status: '완료' },
      { id: 'u-3', question: '로그아웃 시 인증 정보가 삭제되고 로그인 페이지로 이동되는가?', importance: '상', status: '완료' },
      { id: 'u-4', question: '비밀번호 재설정 요청이 처리되는가?', importance: '중', status: '완료' },
      { id: 'u-5', question: '비로그인 상태에서 보호 페이지 접근이 차단되는가?', importance: '상', status: '완료' },
      { id: 'u-6', question: '401 응답 수신 시 인증 정보가 초기화되고 로그인 페이지로 이동되는가?', importance: '상', status: '완료' },
      { id: 'u-7', question: '마이페이지에서 프로필 정보가 조회되는가?', importance: '중', status: '완료' },
      { id: 'u-8', question: '도메인 설정과 HTTPS/WSS 도메인이 올바르게 구성되어 있는가?', importance: '상', status: '완료' },
    ],
  },
  {
    id: 'counsel',
    icon: '💬',
    name: '상담',
    items: [
      { id: 'c-1', question: '상담 사전 정보가 단계별로 입력되는가?', importance: '상', status: '완료' },
      { id: 'c-2', question: '카메라·마이크 권한에 따라 상담 준비 화면이 분기되는가?', importance: '상', status: '완료' },
      { id: 'c-3', question: '사용자 음성 인식 후 AI 응답이 생성되는가?', importance: '상', status: '완료' },
      { id: 'c-4', question: 'CBT 5단계 순서로 상담이 진행되는가?', importance: '상', status: '완료' },
      { id: 'c-5', question: '얼굴·음성·텍스트 감정이 추출되어 응답에 반영되는가?', importance: '상', status: '완료' },
      { id: 'c-6', question: 'AI 응답에 캐릭터 립싱크·표정이 연동되는가?', importance: '상', status: '완료' },
      { id: 'c-7', question: '상담 종료 시 세션이 저장되고 기록 목록으로 이동되는가?', importance: '상', status: '완료' },
      { id: 'c-8', question: '연결 오류 시 화면에 안내 메시지가 표시되는가?', importance: '중', status: '완료' },
      { id: 'c-9', question: 'WebSocket 세션이 만료된 상태로 진입 시 상담 준비 화면으로 이동되는가?', importance: '상', status: '완료' },
      { id: 'c-10', question: '사전 정보 입력 모달에서 입력한 주제·기분·내용이 상담 세션에 전달되는가?', importance: '상', status: '완료' },
      { id: 'c-11', question: '음성 인식 결과가 채팅 로그에 표시되는가?', importance: '중', status: '완료' },
      { id: 'c-12', question: '응답 처리가 20초 이상 지연될 경우 안내 메시지가 표시되는가?', importance: '중', status: '완료' },
      { id: 'c-13', question: '페이지 이탈 시 세션 종료 신호가 서버로 전송되는가?', importance: '중', status: '완료' },
      { id: 'c-14', question: '상담 세션이 20초 이내에 생성되고 각 응답이 3초 이내에 반환되는가?', importance: '상', status: '완료' },
    ],
  },
  {
    id: 'record',
    icon: '📁',
    name: '기록·분석',
    items: [
      { id: 'r-1', question: '상담 기록 목록이 조회되는가?', importance: '상', status: '완료' },
      { id: 'r-2', question: '상담 기록 상세(감정·키워드·CBT)가 표시되는가?', importance: '상', status: '완료' },
      { id: 'r-3', question: '상담 기록이 삭제되는가?', importance: '중', status: '완료' },
      { id: 'r-4', question: '상담 종료 후 세션 분석 결과가 생성되는가?', importance: '상', status: '완료' },
      { id: 'r-5', question: '복수 세션의 감정 추이가 통계로 집계되는가?', importance: '상', status: '완료' },
      { id: 'r-6', question: '기간별 감정 분석 결과가 표시되는가?', importance: '상', status: '완료' },
      { id: 'r-7', question: '단계별 상담 내용이 요약 표시되는가?', importance: '상', status: '완료' },
    ],
  },
  {
    id: 'contents',
    icon: '📚',
    name: '콘텐츠',
    items: [
      { id: 'ct-1', question: '콘텐츠 목록이 조회되는가?', importance: '중', status: '완료' },
      { id: 'ct-2', question: '에디터 추천 콘텐츠 섹션이 표시되는가?', importance: '중', status: '완료' },
      { id: 'ct-3', question: '카테고리·난이도·소요시간 필터 조합에 따라 목록이 변경되는가?', importance: '중', status: '완료' },
      { id: 'ct-4', question: '최신순·난이도순·소요시간순 정렬이 적용되는가?', importance: '중', status: '완료' },
      { id: 'ct-5', question: '콘텐츠 상세 페이지가 표시되는가?', importance: '중', status: '완료' },
      { id: 'ct-6', question: '콘텐츠 본문이 렌더링되는가?', importance: '중', status: '완료' },
      { id: 'ct-7', question: '콘텐츠 상세에서 댓글 등록·삭제가 이루어지는가?', importance: '중', status: '완료' },
      { id: 'ct-8', question: 'API 실패 또는 유효하지 않은 ID 접근 시 에러 화면이 표시되는가?', importance: '중', status: '완료' },
      { id: 'ct-9', question: '관리자 계정으로 콘텐츠 CRUD가 동작하는가?', importance: '중', status: '구현중' },
      { id: 'ct-10', question: '감정 분석 결과를 기반으로 추천 콘텐츠가 제공되는가?', importance: '중', status: '미구현' },
    ],
  },
  {
    id: 'flow',
    icon: '🔄',
    name: '플로우',
    items: [
      { id: 'f-1', question: '회원가입 → 로그인 → 첫 상담 완료 → 분석 결과 조회까지 전 과정이 이어지는가?', importance: '상', status: '완료' },
      { id: 'f-2', question: '메인에서 상담 주제 선택 시 비로그인 상태는 로그인으로 이동하고, 로그인 후 해당 주제로 상담에 진입되는가?', importance: '상', status: '완료' },
      { id: 'f-3', question: '사전 정보 입력 → 디바이스 설정 → CBT 5단계 진행 → 상담 종료까지 흐름이 이어지는가?', importance: '상', status: '완료' },
      { id: 'f-4', question: '사용자 발화 → 감정 추출 → AI 응답 생성 → 캐릭터 반응까지 한 사이클이 이어지는가?', importance: '상', status: '완료' },
      { id: 'f-5', question: '상담 종료 후 분석 결과가 생성되고 기록 목록에 반영되어 상세 조회까지 이어지는가?', importance: '상', status: '완료' },
      { id: 'f-6', question: '로그인 후 이전 상담 기록을 조회하고 전체 감정 통계를 확인할 수 있는가?', importance: '중', status: '완료' },
      { id: 'f-7', question: '세션 중 인증 토큰 만료 시 갱신을 시도하고, 실패하면 로그인 페이지로 이동되는가?', importance: '중', status: '구현중' },
    ],
  },
];
