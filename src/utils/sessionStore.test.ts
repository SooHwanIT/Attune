import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CounselSessionRecord } from './sessionStore';
import {
  createSessionRecord,
  getEmotionDistribution,
  getOverviewStats,
  getSessionRecordById,
  getShiftDistribution,
  getTopicMetrics,
  listSessionRecords,
  saveSessionRecord,
} from './sessionStore';

function makeRecord(overrides: Partial<CounselSessionRecord>): CounselSessionRecord {
  return {
    sessionId: 'session-default',
    createdAt: '2026-04-01T00:00:00.000Z',
    currentStage: 10,
    stageHistory: [{ stage: 1, content: '내용', summary: '요약' }],
    chatLog: [{ role: 'user', text: '불안해요' }],
    metrics: {
      averageEmotion: 50,
      stabilityScore: 50,
      shiftDirection: 'stable',
      shiftValue: 0,
      transitionCount: 0,
      topicCounts: { '일반 고민': 1 },
      userMessageCount: 1,
    },
    ...overrides,
  };
}

describe('sessionStore feature tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T00:00:00.000Z'));
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('creates a session record with derived metrics', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);

    const record = createSessionRecord({
      chatLog: [
        { role: 'assistant', text: '안녕하세요' },
        { role: 'user', text: '불안하고 답답해요' },
        { role: 'user', text: '호흡하니 조금 편해졌어요' },
      ],
      stageHistory: [{ stage: 1, content: '탐색', summary: '상태 확인' }],
      currentStage: 2,
    });

    expect(record.sessionId).toMatch(/^session-\d+-[a-z0-9]{6}$/);
    expect(record.createdAt).toBe('2026-04-06T00:00:00.000Z');
    expect(record.metrics.userMessageCount).toBe(2);
    expect(record.metrics.topicCounts).toEqual({ '불안/긴장': 1, '회복/자기돌봄': 1 });
    expect(record.metrics.transitionCount).toBeGreaterThanOrEqual(0);
  });

  it('persists and retrieves session records', () => {
    const older = makeRecord({
      sessionId: 'older',
      createdAt: '2026-04-05T10:00:00.000Z',
      metrics: {
        averageEmotion: 55,
        stabilityScore: 60,
        shiftDirection: 'stable',
        shiftValue: 4,
        transitionCount: 2,
        topicCounts: { '직장/업무': 1 },
        userMessageCount: 2,
      },
    });
    const latest = makeRecord({
      sessionId: 'latest',
      createdAt: '2026-04-06T10:00:00.000Z',
      metrics: {
        averageEmotion: 62,
        stabilityScore: 73,
        shiftDirection: 'up',
        shiftValue: 10,
        transitionCount: 1,
        topicCounts: { '불안/긴장': 2 },
        userMessageCount: 3,
      },
    });

    saveSessionRecord(older);
    saveSessionRecord(latest);

    const sessions = listSessionRecords();
    expect(sessions[0].sessionId).toBe('latest');
    expect(sessions[1].sessionId).toBe('older');
    expect(getSessionRecordById('older')?.sessionId).toBe('older');
  });

  it('aggregates overview, distribution, and topic metrics', () => {
    const records = [
      makeRecord({
        sessionId: 's1',
        createdAt: '2026-04-01T00:00:00.000Z',
        currentStage: 10,
        stageHistory: new Array(8).fill({ stage: 1, content: 'a', summary: 'b' }),
        metrics: {
          averageEmotion: 80,
          stabilityScore: 70,
          shiftDirection: 'up',
          shiftValue: 15,
          transitionCount: 2,
          topicCounts: { '직장/업무': 2, '불안/긴장': 1 },
          userMessageCount: 4,
        },
      }),
      makeRecord({
        sessionId: 's2',
        createdAt: '2026-04-01T10:00:00.000Z',
        currentStage: 10,
        stageHistory: new Array(5).fill({ stage: 1, content: 'a', summary: 'b' }),
        metrics: {
          averageEmotion: 40,
          stabilityScore: 50,
          shiftDirection: 'down',
          shiftValue: 12,
          transitionCount: 4,
          topicCounts: { '불안/긴장': 2 },
          userMessageCount: 3,
        },
      }),
      makeRecord({
        sessionId: 's3',
        createdAt: '2026-04-02T00:00:00.000Z',
        currentStage: 10,
        stageHistory: new Array(10).fill({ stage: 1, content: 'a', summary: 'b' }),
        metrics: {
          averageEmotion: 60,
          stabilityScore: 90,
          shiftDirection: 'stable',
          shiftValue: 2,
          transitionCount: 1,
          topicCounts: { '수면/피로': 1 },
          userMessageCount: 5,
        },
      }),
    ];

    const overview = getOverviewStats(records);
    expect(overview).toMatchObject({
      totalSessions: 3,
      avgEmotion: 60,
      avgStability: 70,
      avgTransitions: 2.3,
      completionRate: 77,
    });
    expect(overview.topTopics[0]).toEqual({ topic: '불안/긴장', count: 3 });
    expect(overview.trend).toEqual([
      { label: '4/1', avgEmotion: 60, sessions: 2 },
      { label: '4/2', avgEmotion: 60, sessions: 1 },
    ]);

    expect(getEmotionDistribution(records)).toEqual({ positive: 33, neutral: 33, negative: 34 });
    expect(getShiftDistribution(records)).toEqual({
      up: { count: 1, percentage: 33 },
      stable: { count: 1, percentage: 33 },
      down: { count: 1, percentage: 33 },
    });

    const topicMetrics = getTopicMetrics(records);
    expect(topicMetrics[0]).toEqual({
      topic: '불안/긴장',
      count: 3,
      avgEmotion: 53,
      avgStability: 57,
    });
  });
});