import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Avatar from "./Avatar";
import type { AnimationKey, ExpressionKey } from "./avatarConfig";

type ThreePreviewSceneProps = {
  currentAnimation: AnimationKey;
  expressionOverrides: Record<ExpressionKey, number>;
  avatarUrl: string;
  avatarUrlCandidates?: string[];
  avatarPosition?: [number, number, number];
};

export default function ThreePreviewScene({
  currentAnimation,
  expressionOverrides,
  avatarUrl,
  avatarUrlCandidates,
  avatarPosition,
}: ThreePreviewSceneProps) {
  return (
    <Canvas camera={{ position: [0, 1.2, 2.6], fov: 35 }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 3, 2]} intensity={1.1} />
      <Avatar
        url={avatarUrl}
        fallbackUrls={avatarUrlCandidates}
        avatarPosition={avatarPosition}
        currentEmotion="neutral"
        currentAnimation={currentAnimation}
        expressionOverrides={expressionOverrides}
      />
      <OrbitControls target={[0, 0.9, 0]} />
    </Canvas>
  );
}
