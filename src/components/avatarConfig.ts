export const ANIMATION_FILES = {
  standMotion: "/animations/StandMotion.vrma",
  idle: "/animations/idle.vrma",
  greeting: "/animations/greeting.vrma",
  vSignCute: "/animations/pose1_v_sign_cute.vrma",
  bangEmphasis: "/animations/pose2_bang_emphasis.vrma",
  spinShowoff: "/animations/pose3_spin_showoff.vrma",
  modelConfident: "/animations/pose4_model_confident.vrma",
  squatTired: "/animations/pose5_squat_tired.vrma",
  angry: "/animations/Angry.vrma",
  blush: "/animations/Blush.vrma",
  clapping: "/animations/Clapping.vrma",
  goodbye: "/animations/Goodbye.vrma",
  jump: "/animations/Jump.vrma",
  lookAround: "/animations/LookAround.vrma",
  relax: "/animations/Relax.vrma",
  sad: "/animations/Sad.vrma",
  sleepy: "/animations/Sleepy.vrma",
  surprised: "/animations/Surprised.vrma",
  thinking: "/animations/Thinking.vrma",
} as const;

export type AnimationKey = keyof typeof ANIMATION_FILES;

export const EXPRESSION_KEYS = [
  "neutral",
  "happy",
  "angry",
  "sad",
  "relaxed",
  "surprised",
  "blink",
  "aa",
  "ih",
  "ou",
  "ee",
  "oh",
] as const;

export type ExpressionKey = (typeof EXPRESSION_KEYS)[number];
