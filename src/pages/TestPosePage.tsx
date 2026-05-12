import { Suspense, lazy, useEffect, useState } from "react";
import {
  ANIMATION_FILES,
  EXPRESSION_KEYS,
  type AnimationKey,
  type ExpressionKey,
} from "../components/avatarConfig";
const ThreePreviewScene = lazy(() => import("../components/ThreePreviewScene"));

const ANIMATION_BUTTONS: Array<{ key: AnimationKey; label: string }> = Object.keys(ANIMATION_FILES).map((key) => ({
  key: key as AnimationKey,
  label: formatKeyLabel(key),
}));

const DEFAULT_EXPRESSION_VALUES: Record<ExpressionKey, number> = {
  neutral: 1,
  happy: 0,
  angry: 0,
  sad: 0,
  relaxed: 0,
  surprised: 0,
  blink: 0,
  aa: 0,
  ih: 0,
  ou: 0,
  ee: 0,
  oh: 0,
};

const MODEL_OPTIONS = [
  { label: "0613cococo1", value: "/0613cococo1.vrm" },
  { label: "0613inuinu1", value: "/0613inuinu1.vrm" },
  { label: "maromage_01", value: "/maromage_01.vrm" },
  { label: "avatar", value: "/avatar.vrm" },
] as const;

type ReactionPreset = {
  id: string;
  label: string;
  description: string;
  animation: AnimationKey;
  expressions?: Partial<Record<ExpressionKey, number>>;
};

const REACTION_PRESET_GROUPS: Array<{ group: string; presets: ReactionPreset[] }> = [
  {
    group: "1) 적극적 경청",
    presets: [
      {
        id: "listen_tilt_head",
        label: "Listen Tilt Head",
        description: "공감의 갸우뚱, 미동 최소화",
        animation: "lookAround",
        expressions: { neutral: 0.6, relaxed: 0.4 },
      },
      {
        id: "listen_lean_in",
        label: "Listen Lean In",
        description: "상체를 살짝 당겨 집중",
        animation: "relax",
        expressions: { neutral: 0.9, surprised: 0.1 },
      },
      {
        id: "listen_slow_nods",
        label: "Listen Slow Nods",
        description: "규칙적이고 느린 끄덕임",
        animation: "spinShowoff",
        expressions: { neutral: 0.9, relaxed: 0.1 },
      },
    ],
  },
  {
    group: "2) 깊은 위로와 수용",
    presets: [
      {
        id: "empathy_hand_on_heart",
        label: "Empathy Hand on Heart",
        description: "가슴에 손을 얹고 안정적 공감",
        animation: "sad",
        expressions: { sad: 0.4, relaxed: 0.6 },
      },
      {
        id: "empathy_deep_sigh",
        label: "Empathy Deep Sigh",
        description: "지긋이 감았다 뜨는 공감 호흡",
        animation: "sleepy",
        expressions: { sad: 0.3, blink: 0.5 },
      },
      {
        id: "empathy_open_palms",
        label: "Empathy Open Palms",
        description: "무비판적 수용의 열린 손",
        animation: "relax",
        expressions: { neutral: 0.7, relaxed: 0.3 },
      },
    ],
  },
  {
    group: "3) 통찰과 생각",
    presets: [
      {
        id: "think_hand_on_chin",
        label: "Think Hand on Chin",
        description: "턱을 짚고 시선을 살짝 위로",
        animation: "thinking",
        expressions: { neutral: 0.8, blink: 0.2 },
      },
      {
        id: "think_adjust_hair",
        label: "Think Adjust Hair",
        description: "가벼운 습관 제스처",
        animation: "lookAround",
        expressions: { neutral: 0.85, relaxed: 0.15 },
      },
      {
        id: "think_steeple_hands",
        label: "Think Steeple Hands",
        description: "전문가다운 진지한 고민",
        animation: "modelConfident",
        expressions: { neutral: 0.9, angry: 0.1 },
      },
    ],
  },
  {
    group: "4) 지지와 격려",
    presets: [
      {
        id: "encourage_soft_clap",
        label: "Encourage Soft Clap",
        description: "조용한 박수와 미소",
        animation: "clapping",
        expressions: { happy: 0.7, relaxed: 0.3 },
      },
      {
        id: "encourage_thumbs_up",
        label: "Encourage Gentle ThumbsUp",
        description: "가슴 가까운 따뜻한 최고",
        animation: "vSignCute",
        expressions: { happy: 0.6, neutral: 0.4 },
      },
      {
        id: "encourage_nod_smile",
        label: "Encourage Nod With Smile",
        description: "확신의 끄덕임과 미소",
        animation: "greeting",
        expressions: { happy: 0.8, neutral: 0.2 },
      },
    ],
  },
  {
    group: "5) 인사와 라포 형성",
    presets: [
      {
        id: "greet_polite_bow",
        label: "Greet Polite Bow",
        description: "정중한 목례",
        animation: "greeting",
        expressions: { happy: 0.4, relaxed: 0.6 },
      },
      {
        id: "greet_warm_wave",
        label: "Greet Warm Wave",
        description: "가벼운 손인사",
        animation: "goodbye",
        expressions: { happy: 0.6, relaxed: 0.4 },
      },
    ],
  },
];

export default function TestPosePage() {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationKey>("idle");
  const [expressionValues, setExpressionValues] = useState<Record<ExpressionKey, number>>(DEFAULT_EXPRESSION_VALUES);
  const [shouldMountThreeScene, setShouldMountThreeScene] = useState(false);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>(MODEL_OPTIONS[0].value);
  const [modelPosition, setModelPosition] = useState<[number, number, number]>([0, -0.4, 0]);

  useEffect(() => {
    const timerId = window.setTimeout(() => setShouldMountThreeScene(true), 180);
    return () => window.clearTimeout(timerId);
  }, []);

  const updateExpression = (key: ExpressionKey, value: number) => {
    setExpressionValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetExpressions = () => {
    setExpressionValues(DEFAULT_EXPRESSION_VALUES);
  };

  const applyExpressionPreset = (presetName: string) => {
    const presets: Record<string, Partial<Record<ExpressionKey, number>>> = {
      neutral: { neutral: 1, happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0 },
      happy: { neutral: 0, happy: 1, angry: 0, sad: 0, relaxed: 0, surprised: 0 },
      angry: { neutral: 0, happy: 0, angry: 1, sad: 0, relaxed: 0, surprised: 0 },
      sad: { neutral: 0, happy: 0, angry: 0, sad: 1, relaxed: 0, surprised: 0 },
      relaxed: { neutral: 0, happy: 0, angry: 0, sad: 0, relaxed: 1, surprised: 0 },
      surprised: { neutral: 0, happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 1 },
    };
    const preset = presets[presetName];
    if (preset) {
      setExpressionValues(mergeExpressionValues(preset));
    }
  };

  const applyPreset = (preset: ReactionPreset) => {
    setCurrentAnimation(preset.animation);
    setExpressionValues(mergeExpressionValues(preset.expressions));
  };

  const updateModelPosition = (axisIndex: 0 | 1 | 2, value: number) => {
    setModelPosition((prev) => {
      const next: [number, number, number] = [...prev] as [number, number, number];
      next[axisIndex] = value;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">아바타 애니메이션 테스트</h1>
              <p className="mt-1 text-sm text-slate-600">
                애니메이션 버튼과 표정 게이지를 이용해 아바타 반응을 실시간으로 확인할 수 있습니다.
              </p>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              총 애니메이션 {ANIMATION_BUTTONS.length}개
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-slate-700">모델 선택</div>
              <label className="block text-xs text-slate-500">
                VRM 모델
                <select
                  value={selectedModelUrl}
                  onChange={(e) => setSelectedModelUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="mb-2 text-xs font-semibold text-slate-600">모델 위치 오프셋</div>
                <div className="space-y-2">
                  {([
                    { label: "X", index: 0 as const },
                    { label: "Y", index: 1 as const },
                    { label: "Z", index: 2 as const },
                  ]).map((axis) => (
                    <label key={axis.label} className="block text-xs text-slate-600">
                      <div className="mb-1 flex items-center justify-between">
                        <span>{axis.label}</span>
                        <span>{modelPosition[axis.index].toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.01}
                        value={modelPosition[axis.index]}
                        onChange={(e) => updateModelPosition(axis.index, Number(e.target.value))}
                        className="h-2 w-full cursor-pointer accent-emerald-600"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-slate-700">상담 리액션 프리셋</div>
              <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
                {REACTION_PRESET_GROUPS.map((groupItem) => (
                  <div key={groupItem.group} className="rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                    <div className="mb-2 px-1 text-xs font-bold text-slate-600">{groupItem.group}</div>
                    <div className="space-y-2">
                      {groupItem.presets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
                        >
                          <div className="text-sm font-semibold text-slate-800">{preset.label}</div>
                          <div className="text-xs text-slate-500">{preset.description}</div>
                          <div className="mt-1 text-[11px] font-medium text-emerald-700">
                            anim: {formatKeyLabel(preset.animation)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-slate-700">현재 애니메이션</div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
                {formatKeyLabel(currentAnimation)}
                <span className="ml-2 text-xs text-slate-500">({currentAnimation})</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {ANIMATION_BUTTONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCurrentAnimation(item.key)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      currentAnimation === item.key
                        ? "border-emerald-600 bg-emerald-600 text-white shadow"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-slate-700">표정 프리셋</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "neutral", label: "😐 중립" },
                    { key: "happy", label: "😊 행복" },
                    { key: "angry", label: "😠 화남" },
                    { key: "sad", label: "😢 슬픔" },
                    { key: "relaxed", label: "😌 이완" },
                    { key: "surprised", label: "😲 놀람" },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyExpressionPreset(preset.key)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-700">표정 게이지</div>
                  <p className="text-xs text-slate-500">범위 0.00 ~ 1.00</p>
                </div>
                <button
                  type="button"
                  onClick={resetExpressions}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  초기화
                </button>
              </div>
              <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                {EXPRESSION_KEYS.map((expressionKey) => (
                  <label
                    key={expressionKey}
                    className="block rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2"
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{expressionKey}</span>
                      <span>{expressionValues[expressionKey].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={expressionValues[expressionKey]}
                      onChange={(e) => updateExpression(expressionKey, Number(e.target.value))}
                      className="h-2 w-full cursor-pointer accent-emerald-600"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              3D 미리보기
            </div>
            <div className="h-[72vh] min-h-[520px]">
              {shouldMountThreeScene ? (
                <Suspense fallback={<div className="h-full w-full bg-slate-100" />}>
                  <ThreePreviewScene
                    currentAnimation={currentAnimation}
                    expressionOverrides={expressionValues}
                    avatarUrl={selectedModelUrl}
                    avatarPosition={modelPosition}
                  />
                </Suspense>
              ) : (
                <div className="h-full w-full bg-slate-100" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatKeyLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function mergeExpressionValues(
  partial?: Partial<Record<ExpressionKey, number>>
): Record<ExpressionKey, number> {
  const merged: Record<ExpressionKey, number> = { ...DEFAULT_EXPRESSION_VALUES };

  if (!partial) return merged;

  for (const [key, value] of Object.entries(partial)) {
    merged[key as ExpressionKey] = clamp01(typeof value === "number" ? value : 0);
  }

  return merged;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
