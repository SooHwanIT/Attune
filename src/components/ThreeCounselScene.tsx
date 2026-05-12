import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import Avatar from "./Avatar";
import type { AnimationKey } from "./avatarConfig";

type ThreeCounselSceneProps = {
  emotion: string;
  currentAnimation: AnimationKey;
  avatarUrl?: string;
  avatarUrlCandidates?: string[];
  avatarPosition?: [number, number, number];
};

export default function ThreeCounselScene({
  emotion,
  currentAnimation,
  avatarUrl = "/avatar.vrm",
  avatarUrlCandidates,
  avatarPosition,
}: ThreeCounselSceneProps) {
  return (
    <Canvas
      shadows
      gl={{ alpha: true, antialias: true }}
      style={{
        width: "100%",
        height: "100%",
        filter: "drop-shadow(0 20px 22px rgba(70,32,14,0.45)) drop-shadow(0 0 1px rgba(43,24,13,0.9))",
      }}
      camera={{ position: [0, -0.2, 1.6], fov: 42 }}
    >
      <ambientLight intensity={0.8} color="#fff6e8" />
      <hemisphereLight intensity={0.4} color="#fff2df" groundColor="#6b4a2c" />
      <directionalLight position={[2.2, 2.8, 2.6]} intensity={1} color="#fff7ed" castShadow />
      <spotLight position={[-2, 4, 5]} angle={0.5} penumbra={1} intensity={0.35} color="#ffd8a8" />
      <directionalLight position={[-2.6, 1.8, -2.4]} intensity={0.55} color="#ffe7c2" />
      <Avatar
        url={avatarUrl}
        fallbackUrls={avatarUrlCandidates}
        avatarPosition={avatarPosition}
        currentEmotion={emotion}
        currentAnimation={currentAnimation}
      />
      <ContactShadows position={[0, -0.38, 0]} opacity={0.42} scale={2.7} blur={2.3} far={1.7} color="#5c3a22" />
      <OrbitControls target={[0, 0.25, 0]} enablePan={false} />
    </Canvas>
  );
}
