import { useEffect, useState, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import { audioPlayer } from "../utils/audioPlayer";
import {
  ANIMATION_FILES,
  EXPRESSION_KEYS,
  type AnimationKey,
  type ExpressionKey,
} from "./avatarConfig";

interface AvatarProps {
  url: string;
  fallbackUrls?: string[];
  avatarPosition?: [number, number, number];
  currentEmotion: string;
  currentAnimation: AnimationKey;
  expressionOverrides?: Partial<Record<ExpressionKey, number>>;
}

export default function Avatar({
  url,
  fallbackUrls,
  avatarPosition,
  currentEmotion,
  currentAnimation,
  expressionOverrides,
}: AvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const loadingAnimationsRef = useRef<Set<string>>(new Set());
  const loadAnimationByNameRef = useRef<((name: AnimationKey) => Promise<THREE.AnimationAction | null>) | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const { scene: threeScene } = useThree();

  // 1. VRM 모델 로드
  useEffect(() => {
    if (!url && (!fallbackUrls || fallbackUrls.length === 0)) return;

    let disposed = false;

    const loadModel = async () => {
      const [{ GLTFLoader }, { VRMLoaderPlugin, VRMUtils }] = await Promise.all([
        import("three/addons/loaders/GLTFLoader.js"),
        import("@pixiv/three-vrm"),
      ]);

      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      const candidateUrls = [url, ...(fallbackUrls ?? [])].filter((candidateUrl, index, array) =>
        !!candidateUrl && array.indexOf(candidateUrl) === index
      );

      setVrm(null);
      setScene(null);
      mixerRef.current = null;
      actionsRef.current = {};
      loadingAnimationsRef.current.clear();
      currentActionRef.current = null;

      for (const candidateUrl of candidateUrls) {
        try {
          const gltf = await loader.loadAsync(candidateUrl);
          if (disposed) return;

          const vrmData = gltf.userData.vrm as VRM | undefined;
          if (!vrmData) {
            console.warn(`Loaded file is not a VRM: ${candidateUrl}`);
            continue;
          }

          VRMUtils.rotateVRM0(vrmData);
          setVrm(vrmData);
          setScene(gltf.scene);

          // VRM 모델의 씬을 기반으로 믹서 생성
          mixerRef.current = new THREE.AnimationMixer(vrmData.scene);
          console.log("VRM Model Loaded", candidateUrl);
          return;
        } catch (error) {
          console.warn(`Failed to load VRM model: ${candidateUrl}`, error);
        }
      }

      console.error("Unable to load any VRM model candidates", candidateUrls);
    };

    void loadModel();

    return () => {
      disposed = true;
    };
  }, [url, fallbackUrls]);

  // Scene에 추가
  useEffect(() => {
    if (vrm && scene && threeScene) {
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          if (!(material instanceof THREE.MeshStandardMaterial)) return;
          material.roughness = Math.min(1, material.roughness + 0.05);
          material.metalness = 0;
          material.emissive = new THREE.Color("#221108");
          material.emissiveIntensity = 0.04;
        });
      });

      threeScene.add(scene);
      return () => {
        threeScene.remove(scene);
      };
    }
  }, [vrm, scene, threeScene]);

  // 2. 애니메이션 파일(.vrma) 로드 및 리타겟팅 적용
  useEffect(() => {
    if (!vrm || !mixerRef.current) return;

    const loadAllAnimations = async () => {
      const [{ GLTFLoader }, { VRMAnimationLoaderPlugin, createVRMAnimationClip }] = await Promise.all([
        import("three/addons/loaders/GLTFLoader.js"),
        import("@pixiv/three-vrm-animation"),
      ]);

      const loader = new GLTFLoader();
      loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

      const loadAction = async (name: AnimationKey): Promise<THREE.AnimationAction | null> => {
        if (actionsRef.current[name]) return actionsRef.current[name];
        if (loadingAnimationsRef.current.has(name)) return null;

        loadingAnimationsRef.current.add(name);
        try {
          const gltf = await loader.loadAsync(ANIMATION_FILES[name]);
          const vrmAnimations = gltf.userData.vrmAnimations;
          if (!vrmAnimations || vrmAnimations.length === 0) {
            console.warn(`No VRM animations found in ${ANIMATION_FILES[name]}`);
            return null;
          }

          const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
          clip.name = name;
          const action = mixerRef.current?.clipAction(clip) ?? null;
          if (action) {
            actionsRef.current[name] = action;
            console.log(`Loaded & Retargeted: ${name}`);
          }
          return action;
        } catch (error) {
          console.error(`Failed to load animation: ${name}`, error);
          return null;
        } finally {
          loadingAnimationsRef.current.delete(name);
        }
      };

      loadAnimationByNameRef.current = loadAction;

      // 초기 체감 성능을 위해 idle만 우선 로딩/재생
      const idleAction = await loadAction("idle");
      if (idleAction) {
        idleAction.play();
        currentActionRef.current = idleAction;
      }

      // 나머지 애니메이션은 백그라운드에서 순차 로딩
      void (async () => {
        for (const name of Object.keys(ANIMATION_FILES) as AnimationKey[]) {
          if (name === "idle") continue;
          await loadAction(name);
        }
      })();
    };

    void loadAllAnimations();
  }, [vrm]); // vrm이 로드된 후에 실행

  // 3. 애니메이션 전환 (CrossFade) - 기존 코드 유지
  useEffect(() => {
    if (!actionsRef.current || !mixerRef.current) return;

    const transitionTo = (newAction: THREE.AnimationAction) => {
      const prevAction = currentActionRef.current;
      if (newAction === prevAction) return;
      if (prevAction) {
        prevAction.fadeOut(0.5);
      }
      newAction.reset().fadeIn(0.5).play();
      currentActionRef.current = newAction;
    };

    const cachedAction = actionsRef.current[currentAnimation];
    if (cachedAction) {
      transitionTo(cachedAction);
      return;
    }

    const lazyLoad = loadAnimationByNameRef.current;
    if (!lazyLoad) return;

    void lazyLoad(currentAnimation).then((loadedAction) => {
      if (loadedAction) transitionTo(loadedAction);
    });
  }, [currentAnimation]);

  // 4. 매 프레임 업데이트
  useFrame((state, delta) => {
    if (!vrm) return;

    // 믹서 업데이트
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // VRM 물리/포즈 업데이트
    vrm.update(delta);

    // 표정 제어
    if (vrm.expressionManager) {
      const hasExpressionOverrides =
        !!expressionOverrides && Object.keys(expressionOverrides).length > 0;

      if (hasExpressionOverrides) {
        EXPRESSION_KEYS.forEach((expressionKey) => {
          vrm.expressionManager?.setValue(expressionKey, 0);
        });

        for (const [expressionName, weight] of Object.entries(expressionOverrides)) {
          vrm.expressionManager.setValue(
            expressionName as ExpressionKey,
            clamp01(typeof weight === "number" ? weight : 0)
          );
        }

        vrm.expressionManager.update();
        return;
      }

      const presetName = mapEmotionToPreset(currentEmotion);
      vrm.expressionManager.setValue(presetName, 1.0);
      
      ["neutral", "happy", "angry", "sad", "relaxed", "surprised"].forEach(emo => {
        if (emo !== presetName) vrm.expressionManager?.setValue(emo, 0);
      });

      // 향상된 립싱크: 주파수 분석 기반 다양한 입술 모양
      const lipSyncValues = audioPlayer.getLipSyncValues?.();
      if (lipSyncValues) {
        // 여러 입술 모양을 동시에 블렌딩
        vrm.expressionManager.setValue('aa', Math.max(lipSyncValues.aa ?? 0, 0));
        vrm.expressionManager.setValue('ih', lipSyncValues.ih ?? 0);
        vrm.expressionManager.setValue('ou', lipSyncValues.ou ?? 0);
        vrm.expressionManager.setValue('ee', lipSyncValues.ee ?? 0);
        vrm.expressionManager.setValue('oh', lipSyncValues.oh ?? 0);
      } else {
        // 폴백: 기존 음량 기반 립싱크
        const volume = audioPlayer.getVolume();
        vrm.expressionManager.setValue('aa', volume);
      }
      
      const blinkValue = Math.sin(state.clock.elapsedTime * 2) > 0.98 ? 1 : 0;
      vrm.expressionManager.setValue('blink', blinkValue);
      vrm.expressionManager.update();
    }
  });

  if (!scene) return null;
  // primitive에 직접 scene을 넣음
  return <primitive object={scene} position={avatarPosition ?? [0, -0.4, 0]} />;
}

// 헬퍼 함수
function mapEmotionToPreset(emotion: string): string {
  switch (emotion) {
    case "happy": return "happy";
    case "angry": return "angry";
    case "sad": return "sad";
    case "relaxed": return "relaxed";
    case "surprised": return "surprised";
    default: return "neutral";
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}