import { describe, expect, it } from 'vitest';
import {
  calculateEmotionDistribution,
  calculateEmotionScore,
  calculateEmotionShift,
  calculateStabilityScore,
  detectTransitionPoints,
  extractEmotionScores,
  extractKeywordInsights,
  extractTopicSeries,
  getEmotionType,
  inferTopicFromText,
} from './analysisUtils';

describe('analysisUtils feature tests', () => {
  it('classifies text into topic buckets by keyword', () => {
    expect(inferTopicFromText('회사 프로젝트 마감이 걱정돼요')).toBe('직장/업무');
    expect(inferTopicFromText('엄마랑 대화가 어려워요')).toBe('가족 관계');
    expect(inferTopicFromText('잠을 못 자서 피곤해요')).toBe('수면/피로');
    expect(inferTopicFromText('숨 고르기랑 산책을 시작했어요')).toBe('회복/자기돌봄');
    expect(inferTopicFromText('분류되지 않는 문장')).toBe('일반 고민');
  });

  it('extracts only user topics from chat logs', () => {
    const chatLog = [
      { role: 'assistant', text: '무엇이 가장 힘든가요?' },
      { role: 'user', text: '회사 마감이 너무 빡빡해요' },
      { role: 'user', text: '잠도 잘 못 자고요' },
    ];

    expect(extractTopicSeries(chatLog)).toEqual(['직장/업무', '수면/피로']);
  });

  it('calculates emotion score with positive/negative keywords and clamps boundaries', () => {
    expect(calculateEmotionScore('좋아요 행복해요 슬프네요')).toBe(58);
    expect(calculateEmotionScore('좋아 행복 희망 감사 기뻐 만족 즐거 편해 안정 감정')).toBe(100);
    expect(calculateEmotionScore('슬프 두려 불안 답답 속상 힘들 외로 무기력 자책 절망')).toBe(0);
  });

  it('maps emotion type by score thresholds', () => {
    expect(getEmotionType(70)).toBe('positive');
    expect(getEmotionType(50)).toBe('neutral');
    expect(getEmotionType(35)).toBe('negative');
    expect(getEmotionType(20)).toBe('alert');
  });

  it('detects major transition points and limits output to top five', () => {
    const scores = [50, 70, 40, 80, 60, 20, 50];
    const transitions = detectTransitionPoints(scores);

    expect(transitions).toHaveLength(5);
    expect(transitions[0]).toMatchObject({
      fromEmotion: 50,
      toEmotion: 70,
      messageIdx: 1,
      trigger: '주제 변화 감지됨',
    });
  });

  it('calculates stability, shift, and distribution metrics', () => {
    expect(calculateStabilityScore([50, 50, 50])).toBe(100);
    expect(calculateEmotionShift([40, 52])).toEqual({ value: 12, direction: 'up' });
    expect(calculateEmotionShift([70, 62])).toEqual({ value: 8, direction: 'down' });
    expect(calculateEmotionShift([50, 54])).toEqual({ value: 4, direction: 'stable' });

    expect(calculateEmotionDistribution([])).toEqual({ positive: 33, neutral: 34, negative: 33 });
    expect(calculateEmotionDistribution([80, 55, 30, 45])).toEqual({
      positive: 25,
      neutral: 50,
      negative: 25,
    });
  });

  it('extracts emotion timeline score/time arrays for user messages only', () => {
    const { scores, times } = extractEmotionScores([
      { role: 'assistant', text: '안녕하세요' },
      { role: 'user', text: '불안해요' },
      { role: 'user', text: '그래도 지금은 편해요' },
    ]);

    expect(scores).toHaveLength(2);
    expect(times).toEqual(['00:23', '06:43']);
  });

  it('extracts keyword insights with category classification', () => {
    const insights = extractKeywordInsights([
      { role: 'user', text: '불안 걱정 스트레스가 커요' },
      { role: 'user', text: '호흡 명상 루틴을 실천해볼게요' },
      { role: 'assistant', text: '좋아요' },
    ]);

    const anxiety = insights.find((item) => item.keyword === '불안');
    const breathing = insights.find((item) => item.keyword === '호흡');

    expect(anxiety?.category).toBe('emotion');
    expect(breathing?.category).toBe('action');
  });
});