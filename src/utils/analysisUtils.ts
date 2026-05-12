/**
 * 분석 유틸 함수: 상담 데이터에서 인사이트 자동 추출
 */

export type EmotionType = 'positive' | 'neutral' | 'negative' | 'alert';

export interface EmotionScore {
  type: EmotionType;
  value: number; // 0-100
  label: string;
  color: string;
  bgColor: string;
}

export interface TopicPoint {
  topic: string;
  startIdx: number;
  endIdx: number;
  emotion: number;
  frequency: number;
}

export interface TransitionPoint {
  fromEmotion: number;
  toEmotion: number;
  trigger: string;
  messageIdx: number;
  time: string;
}

export interface KeywordInsight {
  keyword: string;
  count: number;
  category: 'all' | 'emotion' | 'action';
  insight: string;
}

// 메시지 기반 주제 분류 (규칙 기반)
export const inferTopicFromText = (text: string): string => {
  const t = text.toLowerCase();
  if (/(업무|회사|마감|직장|상사|프로젝트)/.test(t)) return '직장/업무';
  if (/(가족|부모|엄마|아빠|형|누나|동생)/.test(t)) return '가족 관계';
  if (/(잠|수면|불면|새벽|피곤)/.test(t)) return '수면/피로';
  if (/(불안|두려|걱정|초조|긴장)/.test(t)) return '불안/긴장';
  if (/(명상|호흡|운동|산책|휴식|회복)/.test(t)) return '회복/자기돌봄';
  return '일반 고민';
};

export const extractTopicSeries = (
  chatLog: Array<{ role: string; text: string }>
): string[] => {
  return chatLog
    .filter((m) => m.role === 'user')
    .map((m) => inferTopicFromText(m.text));
};

// 감정 점수 계산 (메시지 기반)
export const calculateEmotionScore = (text: string): number => {
  const positiveKeywords = ['좋아', '행복', '희망', '감사', '기뻐', '감정', '만족', '즐거', '편해', '안정'];
  const negativeKeywords = ['슬프', '두려', '불안', '답답', '속상', '힘들', '외로', '무기력', '자책', '절망'];
  
  let score = 50; // 기본값 중립
  
  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 8;
  });
  
  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) score -= 8;
  });
  
  return Math.max(0, Math.min(100, score));
};

// 감정 타입 판정
export const getEmotionType = (score: number): EmotionType => {
  if (score >= 65) return 'positive';
  if (score >= 45) return 'neutral';
  if (score >= 30) return 'negative';
  return 'alert';
};

// 감정별 색상 매핑
export const emotionColorMap: Record<EmotionType, { color: string; bgColor: string; defaultLabel: string }> = {
  positive: {
    color: '#10B981',
    bgColor: '#ECFDF5',
    defaultLabel: '긍정'
  },
  neutral: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    defaultLabel: '중립'
  },
  negative: {
    color: '#EF4444',
    bgColor: '#FEF2F2',
    defaultLabel: '부정'
  },
  alert: {
    color: '#DC2626',
    bgColor: '#FEE2E2',
    defaultLabel: '경고'
  }
};

// 전체 메시지에서 감정 점수 배열 도출
export const extractEmotionScores = (
  chatLog: Array<{ role: string; text: string }>
): { scores: number[]; times: string[] } => {
  const userMessages = chatLog.filter(m => m.role === 'user');
  const scores = userMessages.map(m => calculateEmotionScore(m.text));
  const times = userMessages.map((_, idx) => {
    const minutes = Math.floor((idx / userMessages.length) * 13.5); // 13:30 기준
    const seconds = Math.floor(((idx % 3) * 20 + 23) % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  return { scores, times };
};

// 전환점(Transition Point) 감지
export const detectTransitionPoints = (
  scores: number[]
): TransitionPoint[] => {
  const transitions: TransitionPoint[] = [];
  const threshold = 15; // 15점 이상 변화를 전환점으로 판정

  for (let i = 1; i < scores.length; i++) {
    const delta = Math.abs(scores[i] - scores[i - 1]);
    if (delta >= threshold) {
      transitions.push({
        fromEmotion: scores[i - 1],
        toEmotion: scores[i],
        trigger: '주제 변화 감지됨', // 추후 NLP로 개선
        messageIdx: i,
        time: `${String(Math.floor(i * 13.5 / scores.length)).padStart(2, '0')}:${String((i * 23) % 60).padStart(2, '0')}`
      });
    }
  }

  return transitions.slice(0, 5); // 상위 5개만
};

// 안정도 점수 (0-100, 높을수록 안정적)
export const calculateStabilityScore = (scores: number[]): number => {
  if (scores.length === 0) return 50;
  
  // 분산 계산
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // 표준편차가 작을수록 안정적 (역함수)
  const stability = Math.max(0, 100 - stdDev);
  return Math.round(stability);
};

// 감정 변화도 (시작 → 종료, %)
export const calculateEmotionShift = (scores: number[]): { value: number; direction: 'up' | 'down' | 'stable' } => {
  if (scores.length < 2) return { value: 0, direction: 'stable' };
  
  const start = scores[0];
  const end = scores[scores.length - 1];
  const shift = end - start;
  
  return {
    value: Math.abs(shift),
    direction: shift > 5 ? 'up' : shift < -5 ? 'down' : 'stable'
  };
};

// 감정 분포 계산 (긍정/중립/부정 %)
export const calculateEmotionDistribution = (scores: number[]): { positive: number; neutral: number; negative: number } => {
  if (scores.length === 0) return { positive: 33, neutral: 34, negative: 33 };
  
  let pos = 0, neu = 0, neg = 0;
  
  scores.forEach(score => {
    if (score >= 65) pos++;
    else if (score >= 45) neu++;
    else neg++;
  });
  
  const total = scores.length;
  return {
    positive: Math.round((pos / total) * 100),
    neutral: Math.round((neu / total) * 100),
    negative: Math.round((neg / total) * 100)
  };
};

// 키워드 추출 (간단한 구현)
export const extractKeywords = (
  chatLog: Array<{ role: string; text: string }>,
  limit: number = 9
): string[] => {
  const commonWords = new Set(['이', '그', '저', '것', '수', '있', '데', '말', '생각', '않', '요', '어', '고', '했', '하', '했어', '하고']);
  const wordFreq: Record<string, number> = {};
  
  chatLog.forEach(msg => {
    const words = msg.text.split(/[\s,.\-!?]+/).filter(w => w.length > 1 && !commonWords.has(w));
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });
  
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

// 키워드 인사이트 추출 (규칙 기반 AI 분석)
export const extractKeywordInsights = (
  chatLog: Array<{ role: string; text: string }>,
  limit: number = 12
): KeywordInsight[] => {
  const stopWords = new Set([
    '오늘', '정말', '그냥', '조금', '최근', '지금', '그리고', '하지만', '그래서', '이런',
    '저런', '같아요', '있어요', '없어요', '합니다', '했어요', '하면', '하면서', '있고', '있는'
  ]);

  const userTexts = chatLog
    .filter((msg) => msg.role === 'user')
    .map((msg) => msg.text)
    .join(' ');

  const tokens = userTexts.match(/[가-힣a-zA-Z]{2,}/g) || [];
  const freqMap: Record<string, number> = {};

  tokens.forEach((token) => {
    if (stopWords.has(token)) return;
    freqMap[token] = (freqMap[token] || 0) + 1;
  });

  const classifyCategory = (word: string): 'all' | 'emotion' | 'action' => {
    if (/(불안|긴장|걱정|두려|스트레스|우울|무기력|답답|감정|안정|편안|자신감|회복)/.test(word)) {
      return 'emotion';
    }
    if (/(실천|계획|루틴|호흡|명상|운동|수면|기록|정리|대화|연습|시도|준비|휴식)/.test(word)) {
      return 'action';
    }
    return 'all';
  };

  const makeInsight = (count: number, category: 'all' | 'emotion' | 'action') => {
    if (category === 'emotion') {
      return `감정 관련 표현으로 ${count}회 반복되어 정서적 핵심 이슈로 감지되었습니다.`;
    }
    if (category === 'action') {
      return `실행/습관 관련 표현으로 ${count}회 언급되어 변화 의지가 반영되었습니다.`;
    }
    return `상담 맥락에서 ${count}회 나타난 핵심 주제로 분석되었습니다.`;
  };

  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([keyword, count]) => {
      const category = classifyCategory(keyword);
      return {
        keyword,
        count,
        category,
        insight: makeInsight(count, category),
      };
    });
};

// 타임라인 데이터 생성
export const generateTimelineData = (
  chatLog: Array<{ role: string; text: string }>,
  scores: number[],
  topics: string[] = []
) => {
  const userMessages = chatLog.filter(m => m.role === 'user');
  
  return userMessages.map((msg, idx) => ({
    time: `${String(Math.floor(idx * 13.5 / userMessages.length)).padStart(2, '0')}:${String((idx * 23) % 60).padStart(2, '0')}`,
    emotion: scores[idx] || 50,
    topic: topics[idx] || inferTopicFromText(msg.text),
    message: msg.text.substring(0, 30) + (msg.text.length > 30 ? '...' : ''),
    fullMessage: msg.text
  }));
};
