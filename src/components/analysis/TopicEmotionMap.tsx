import { useMemo } from 'react';
import { emotionColorMap, getEmotionType } from '../../utils/analysisUtils';

interface TopicEmotionMapProps {
  scores: number[];
  topics: string[];
}

interface BubbleData {
  topic: string;
  x: number; // 0-100: 대화 진행도
  y: number; // -100 ~ 100: 감정 스케일
  size: number; // 빈도도
  color: string;
  bgColor: string;
}

export default function TopicEmotionMap({ scores, topics }: TopicEmotionMapProps) {
  const bubbleData: BubbleData[] = useMemo(() => {
    if (scores.length === 0) return [];

    // 주제별 감정 및 시간 집계
    const topicMap: Record<string, { emotions: number[]; indices: number[] }> = {};

    scores.forEach((score, idx) => {
      const topic = topics[idx] || '기타';
      if (!topicMap[topic]) {
        topicMap[topic] = { emotions: [], indices: [] };
      }
      topicMap[topic].emotions.push(score);
      topicMap[topic].indices.push(idx);
    });

    // 버블 데이터 변환
    const bubbles: BubbleData[] = Object.entries(topicMap).map(([topic, data]) => {
      const avgEmotion = data.emotions.reduce((a, b) => a + b, 0) / data.emotions.length;
      const avgTime = (data.indices.reduce((a, b) => a + b, 0) / data.indices.length / scores.length) * 100;
      const emotionType = getEmotionType(avgEmotion);
      const emotionInfo = emotionColorMap[emotionType];

      return {
        topic,
        x: avgTime,
        y: avgEmotion * 2 - 100, // -100 ~ 100으로 정규화
        size: Math.sqrt(data.emotions.length) * 3 + 8, // 최소 8, 빈도에 따라 증가
        color: emotionInfo.color,
        bgColor: emotionInfo.bgColor
      };
    });

    return bubbles;
  }, [scores, topics]);

  if (bubbleData.length === 0) {
    return (
      <div className="rounded-lg border border-dark bg-dark-elevated p-6 text-center md:p-8">
        <p className="text-base/60">주제 분석 데이터가 부족합니다.</p>
      </div>
    );
  }

  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 350;
  const PADDING = 50;

  // 데이터 좌표를 SVG 좌표로 변환
  const toSVGX = (x: number) => PADDING + (x / 100) * (SVG_WIDTH - PADDING * 2);
  const toSVGY = (y: number) => (SVG_HEIGHT - PADDING) - ((y + 100) / 200) * (SVG_HEIGHT - PADDING * 2);

  return (
    <div className="rounded-lg border border-dark bg-dark-surface p-6 md:p-8">
      <div className="mb-6">
        <h2 className="mb-1 text-xl font-bold text-base">주제×감정 맵</h2>
        <p className="text-sm text-base/60">
          상담에서 언급된 주제들이 감정에 어떤 영향을 미쳤는지 시각화합니다.
        </p>
      </div>

      {/* 차트 */}
      <div className="overflow-x-auto mb-6">
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          className="min-w-full"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          role="img"
          aria-labelledby="topic-emotion-map-title topic-emotion-map-desc"
        >
          <title id="topic-emotion-map-title">주제와 감정 분포 버블 차트</title>
          <desc id="topic-emotion-map-desc">상담 진행도와 감정 경향을 주제별로 보여주는 차트입니다.</desc>
          {/* 배경 그리드 */}
          <defs>
            <pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            x={PADDING}
            y={PADDING}
            width={SVG_WIDTH - PADDING * 2}
            height={SVG_HEIGHT - PADDING * 2}
            fill="url(#grid)"
          />

          {/* 축 */}
          {/* X축 */}
          <line
            x1={PADDING}
            y1={SVG_HEIGHT - PADDING}
            x2={SVG_WIDTH - PADDING}
            y2={SVG_HEIGHT - PADDING}
            stroke="#94a3b8"
            strokeWidth="2"
          />
          {/* Y축 */}
          <line
            x1={PADDING}
            y1={PADDING}
            x2={PADDING}
            y2={SVG_HEIGHT - PADDING}
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* 축 레이블 */}
          <text
            x={SVG_WIDTH - PADDING + 10}
            y={SVG_HEIGHT - PADDING + 15}
            fontSize="12"
            fill="#64748b"
            fontWeight="bold"
          >
            상담 진행도 →
          </text>
          <text
            x={PADDING - 40}
            y={PADDING - 10}
            fontSize="12"
            fill="#64748b"
            fontWeight="bold"
          >
            ↑ 감정
          </text>

          {/* 축 눈금 및 값 */}
          {[0, 25, 50, 75, 100].map((val) => {
            const x = toSVGX(val);
            return (
              <g key={`x-${val}`}>
                <line
                  x1={x}
                  y1={SVG_HEIGHT - PADDING}
                  x2={x}
                  y2={SVG_HEIGHT - PADDING + 5}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={SVG_HEIGHT - PADDING + 20}
                  fontSize="11"
                  fill="#757575"
                  textAnchor="middle"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {['-100', '-50', '0', '+50', '+100'].map((label, idx) => {
            const y = toSVGY((idx - 2) * 50);
            return (
              <g key={`y-${label}`}>
                <line
                  x1={PADDING - 5}
                  y1={y}
                  x2={PADDING}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={PADDING - 12}
                  y={y + 4}
                  fontSize="11"
                  fill="#757575"
                  textAnchor="end"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* 중심선 (감정 0 = 중립) */}
          <line
            x1={PADDING}
            y1={toSVGY(0)}
            x2={SVG_WIDTH - PADDING}
            y2={toSVGY(0)}
            stroke="#d1d5db"
            strokeWidth="1"
            strokeDasharray="4"
          />

          {/* 버블들 */}
          {bubbleData.map((bubble, idx) => {
            const svgX = toSVGX(bubble.x);
            const svgY = toSVGY(bubble.y);

            return (
              <g key={idx}>
                {/* 버블 */}
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={bubble.size}
                  fill={bubble.bgColor}
                  stroke={bubble.color}
                  strokeWidth="2"
                  opacity="0.85"
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                />

                {/* 텍스트 레이블 */}
                <text
                  x={svgX}
                  y={svgY}
                  fontSize="11"
                  fontWeight="bold"
                  fill={bubble.color}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none"
                >
                  {bubble.topic.substring(0, 4)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 주제 범례 */}
      <div className="rounded-lg border border-dark bg-dark-elevated p-4">
        <p className="mb-3 text-xs font-bold uppercase text-base/50">주제 상세</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {bubbleData.map((bubble, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div
                className="w-4 h-4 rounded-full border"
                style={{
                  backgroundColor: bubble.bgColor,
                  borderColor: bubble.color
                }}
              />
                <span className="text-base/70">
                {bubble.topic}
                  <span className="ml-1 text-xs text-base/50">
                  ({Math.round(bubble.y + 100) / 2}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 해석 가이드 */}
      <div className="mt-4 space-y-1 text-xs text-base/55">
        <p>📍 <span className="font-semibold">위치:</span> 오른쪽으로 갈수록 상담 후반이며, 위로 갈수록 긍정적입니다.</p>
        <p>⭕ <span className="font-semibold">크기:</span> 큰 원은 더 자주 언급된 주제입니다.</p>
      </div>
    </div>
  );
}
