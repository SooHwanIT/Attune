import {
  calculateEmotionShift,
  calculateStabilityScore,
  detectTransitionPoints,
  extractEmotionScores,
  extractTopicSeries,
} from "./analysisUtils";

const SESSION_STORE_KEY = "counselSessions:v1";

export type CounselSessionData = {
  chatLog: { role: string; text: string }[];
  stageHistory: { stage: number; content: string; summary: string }[];
  currentStage: number;
};

export type CounselSessionRecord = CounselSessionData & {
  sessionId: string;
  createdAt: string;
  metrics: {
    averageEmotion: number;
    stabilityScore: number;
    shiftDirection: "up" | "down" | "stable";
    shiftValue: number;
    transitionCount: number;
    topicCounts: Record<string, number>;
    userMessageCount: number;
  };
};

export type OverviewStats = {
  totalSessions: number;
  avgEmotion: number;
  avgStability: number;
  avgTransitions: number;
  completionRate: number;
  topTopics: Array<{ topic: string; count: number }>;
  trend: Array<{ label: string; avgEmotion: number; sessions: number }>;
};

type TrendBucket = {
  dateKey: string;
  label: string;
  sumEmotion: number;
  count: number;
};

const DUMMY_SESSION_RECORDS: CounselSessionRecord[] = [
  {
    sessionId: "demo-session-1",
    createdAt: "2026-03-24T09:30:00.000Z",
    currentStage: 10,
    stageHistory: [
      { stage: 1, content: "업무 압박", summary: "현재 스트레스 상황을 정리함" },
      { stage: 2, content: "감정 인식", summary: "불안과 긴장 반응을 확인함" },
      { stage: 3, content: "원인 탐색", summary: "마감과 대인 부담이 핵심 원인임" },
      { stage: 4, content: "행동 계획", summary: "일일 루틴과 호흡 연습 계획 수립" },
    ],
    chatLog: [
      { role: "assistant", text: "오늘 가장 무겁게 느껴지는 고민은 무엇인가요?" },
      { role: "user", text: "마감 일정이 겹치면서 실수할까 봐 불안해요." },
      { role: "assistant", text: "불안이 높아지는 순간을 구체적으로 떠올려볼까요?" },
      { role: "user", text: "회의 직전이 특히 긴장되고 잠도 얕아졌어요." },
    ],
    metrics: {
      averageEmotion: 58,
      stabilityScore: 71,
      shiftDirection: "up",
      shiftValue: 18,
      transitionCount: 3,
      topicCounts: {
        "직장/업무": 3,
        "불안/긴장": 2,
        "수면/피로": 1,
      },
      userMessageCount: 2,
    },
  },
  {
    sessionId: "demo-session-2",
    createdAt: "2026-03-20T11:10:00.000Z",
    currentStage: 9,
    stageHistory: [
      { stage: 1, content: "가족 갈등", summary: "반복되는 갈등 장면을 언어화함" },
      { stage: 2, content: "감정 파악", summary: "분노와 죄책감이 교차함" },
      { stage: 3, content: "대응 전략", summary: "대화 전 감정 정리 루틴 계획" },
    ],
    chatLog: [
      { role: "assistant", text: "가족과의 대화에서 어떤 순간이 가장 힘들었나요?" },
      { role: "user", text: "말이 길어지면 감정이 올라오고 후회가 남아요." },
      { role: "assistant", text: "감정이 올라올 때 멈춤 신호를 정해볼까요?" },
      { role: "user", text: "10초 숨 고르기를 먼저 해보면 도움이 될 것 같아요." },
    ],
    metrics: {
      averageEmotion: 52,
      stabilityScore: 64,
      shiftDirection: "stable",
      shiftValue: 4,
      transitionCount: 2,
      topicCounts: {
        "가족 관계": 3,
        "불안/긴장": 1,
        "회복/자기돌봄": 1,
      },
      userMessageCount: 2,
    },
  },
  {
    sessionId: "demo-session-3",
    createdAt: "2026-03-15T07:45:00.000Z",
    currentStage: 8,
    stageHistory: [
      { stage: 1, content: "수면 문제", summary: "입면 장애와 피로 악순환 정리" },
      { stage: 2, content: "원인 분석", summary: "야간 스마트폰 사용과 걱정 반추 확인" },
      { stage: 3, content: "실행 실험", summary: "수면 전 루틴 실험 항목 합의" },
    ],
    chatLog: [
      { role: "assistant", text: "최근 수면 패턴을 한 주 기준으로 말해줄 수 있나요?" },
      { role: "user", text: "새벽까지 휴대폰을 보고 나면 잠이 더 안 와요." },
      { role: "assistant", text: "취침 전 20분 디지털 오프를 시도해보면 어떨까요?" },
      { role: "user", text: "짧은 명상과 함께하면 실천 가능할 것 같아요." },
    ],
    metrics: {
      averageEmotion: 61,
      stabilityScore: 76,
      shiftDirection: "up",
      shiftValue: 12,
      transitionCount: 2,
      topicCounts: {
        "수면/피로": 3,
        "회복/자기돌봄": 2,
      },
      userMessageCount: 2,
    },
  },
];

function safeParse(input: string | null): CounselSessionRecord[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getTopicCounts(topics: string[]): Record<string, number> {
  return topics.reduce<Record<string, number>>((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
}

export function createSessionRecord(data: CounselSessionData): CounselSessionRecord {
  const { scores } = extractEmotionScores(data.chatLog);
  const topicSeries = extractTopicSeries(data.chatLog);
  const shift = calculateEmotionShift(scores);

  const averageEmotion =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 50;

  return {
    ...data,
    sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    metrics: {
      averageEmotion,
      stabilityScore: calculateStabilityScore(scores),
      shiftDirection: shift.direction,
      shiftValue: shift.value,
      transitionCount: detectTransitionPoints(scores).length,
      topicCounts: getTopicCounts(topicSeries),
      userMessageCount: data.chatLog.filter((msg) => msg.role === "user").length,
    },
  };
}

function listPersistedSessionRecords(): CounselSessionRecord[] {
  return safeParse(localStorage.getItem(SESSION_STORE_KEY)).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
}

export function listSessionRecords(): CounselSessionRecord[] {
  const records = listPersistedSessionRecords();
  if (records.length > 0) return records;
  return import.meta.env.DEV ? DUMMY_SESSION_RECORDS : [];
}

export function saveSessionRecord(record: CounselSessionRecord): void {
  const current = listPersistedSessionRecords();
  localStorage.setItem(SESSION_STORE_KEY, JSON.stringify([record, ...current]));
}

export function getSessionRecordById(sessionId: string): CounselSessionRecord | null {
  return listSessionRecords().find((session) => session.sessionId === sessionId) || null;
}

export function getOverviewStats(records: CounselSessionRecord[]): OverviewStats {
  if (records.length === 0) {
    return {
      totalSessions: 0,
      avgEmotion: 0,
      avgStability: 0,
      avgTransitions: 0,
      completionRate: 0,
      topTopics: [],
      trend: [],
    };
  }

  const topicCounter: Record<string, number> = {};

  records.forEach((record) => {
    Object.entries(record.metrics.topicCounts).forEach(([topic, count]) => {
      topicCounter[topic] = (topicCounter[topic] || 0) + count;
    });
  });

  const totalSessions = records.length;
  const avgEmotion = Math.round(
    records.reduce((sum, record) => sum + record.metrics.averageEmotion, 0) / totalSessions
  );
  const avgStability = Math.round(
    records.reduce((sum, record) => sum + record.metrics.stabilityScore, 0) / totalSessions
  );
  const avgTransitions = Number(
    (records.reduce((sum, record) => sum + record.metrics.transitionCount, 0) / totalSessions).toFixed(1)
  );
  const completionRate = Math.round(
    (records.reduce((sum, record) => sum + record.stageHistory.length / Math.max(record.currentStage, 1), 0) /
      totalSessions) *
      100
  );

  const topTopics = Object.entries(topicCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  const trendMap: Record<string, TrendBucket> = {};
  records.forEach((record) => {
    const date = new Date(record.createdAt);
    const dateKey = date.toISOString().slice(0, 10);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    if (!trendMap[dateKey]) {
      trendMap[dateKey] = { dateKey, label, sumEmotion: 0, count: 0 };
    }
    trendMap[dateKey].sumEmotion += record.metrics.averageEmotion;
    trendMap[dateKey].count += 1;
  });

  const trend = Object.values(trendMap)
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
    .map((bucket) => ({
      label: bucket.label,
      avgEmotion: Math.round(bucket.sumEmotion / bucket.count),
      sessions: bucket.count,
    }));

  return {
    totalSessions,
    avgEmotion,
    avgStability,
    avgTransitions,
    completionRate,
    topTopics,
    trend,
  };
}

export type EmotionDistribution = {
  positive: number;
  neutral: number;
  negative: number;
};

export type ShiftDistribution = {
  up: { count: number; percentage: number };
  stable: { count: number; percentage: number };
  down: { count: number; percentage: number };
};

export type TopicMetric = {
  topic: string;
  count: number;
  avgEmotion: number;
  avgStability: number;
};

export function getEmotionDistribution(records: CounselSessionRecord[]): EmotionDistribution {
  if (records.length === 0) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  records.forEach((record) => {
    const emotion = record.metrics.averageEmotion;
    if (emotion >= 70) {
      positive += 1;
    } else if (emotion >= 50) {
      neutral += 1;
    } else {
      negative += 1;
    }
  });

  const positivePercent = Math.round((positive / records.length) * 100);
  const neutralPercent = Math.round((neutral / records.length) * 100);
  const negativePercent = Math.max(0, 100 - positivePercent - neutralPercent);

  return {
    positive: positivePercent,
    neutral: neutralPercent,
    negative: negativePercent,
  };
}

export function getShiftDistribution(records: CounselSessionRecord[]): ShiftDistribution {
  if (records.length === 0) {
    return {
      up: { count: 0, percentage: 0 },
      stable: { count: 0, percentage: 0 },
      down: { count: 0, percentage: 0 },
    };
  }

  let upCount = 0;
  let stableCount = 0;
  let downCount = 0;

  records.forEach((record) => {
    if (record.metrics.shiftDirection === 'up') upCount += 1;
    else if (record.metrics.shiftDirection === 'stable') stableCount += 1;
    else downCount += 1;
  });

  const total = records.length;
  return {
    up: { count: upCount, percentage: Math.round((upCount / total) * 100) },
    stable: { count: stableCount, percentage: Math.round((stableCount / total) * 100) },
    down: { count: downCount, percentage: Math.round((downCount / total) * 100) },
  };
}

export function getTopicMetrics(records: CounselSessionRecord[]): TopicMetric[] {
  const topicStats: Record<string, { count: number; sumEmotion: number; sumStability: number }> = {};

  records.forEach((record) => {
    Object.entries(record.metrics.topicCounts).forEach(([topic, count]) => {
      if (!topicStats[topic]) {
        topicStats[topic] = { count: 0, sumEmotion: 0, sumStability: 0 };
      }
      topicStats[topic].count += count;
      topicStats[topic].sumEmotion += record.metrics.averageEmotion * count;
      topicStats[topic].sumStability += record.metrics.stabilityScore * count;
    });
  });

  return Object.entries(topicStats)
    .map(([topic, stats]) => ({
      topic,
      count: stats.count,
      avgEmotion: Math.round(stats.sumEmotion / stats.count),
      avgStability: Math.round(stats.sumStability / stats.count),
    }))
    .sort((a, b) => b.count - a.count);
}
