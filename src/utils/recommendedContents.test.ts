import { describe, expect, it } from 'vitest';
import { getRecommendedContentsByTopics } from './recommendedContents';

describe('recommendedContents feature tests', () => {
  it('returns deduplicated recommendations while preserving topic order', () => {
    const results = getRecommendedContentsByTopics(['직장/업무', '직장/업무', '불안/긴장'], 10);
    const ids = results.map((item) => item.id);

    expect(ids).toEqual(['c1', 'c2', 'c3', 'c10', 'c11', 'c12']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('respects maxItems and ignores unknown topics', () => {
    const limited = getRecommendedContentsByTopics(['직장/업무', '가족 관계'], 4);
    expect(limited).toHaveLength(4);

    const unknown = getRecommendedContentsByTopics(['알 수 없는 주제']);
    expect(unknown).toEqual([]);
  });
});