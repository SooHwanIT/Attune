import { useEffect, useState, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from "@pixiv/three-vrm-animation"; // ✨ 추가된 라이브러리
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from "three";
import { audioPlayer } from "../utils/audioPlayer";

// 애니메이션 파일 목록
const ANIMATION_FILES = {
  idle: "/animations/VRMA_01.vrma",
  greeting: "/animations/VRMA_02.vrma",
  pose1: "/animations/VRMA_03.vrma",
  pose2: "/animations/VRMA_04.vrma",
  pose3: "/animations/VRMA_05.vrma",
  pose4: "/animations/VRMA_06.vrma",
  pose5: "/animations/VRMA_07.vrma",
};

interface AvatarProps {
  url: string;
  currentEmotion: string;
  currentAnimation: keyof typeof ANIMATION_FILES;
}

export default function Avatar({ url, currentEmotion, currentAnimation }: AvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const { scene: threeScene } = useThree();

  // 1. VRM 모델 로드
  useEffect(() => {
    if (!url) return;
    
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    loader.load(url, (gltf) => {
      const vrmData = gltf.userData.vrm;
      if (vrmData) {
        VRMUtils.rotateVRM0(vrmData);
        setVrm(vrmData);
        setScene(gltf.scene);
        
        // ✨ 중요: VRM 모델의 씬을 기반으로 믹서 생성
        mixerRef.current = new THREE.AnimationMixer(vrmData.scene);
        console.log("VRM Model Loaded");
      }
    });
  }, [url]);

  // Scene에 추가
  useEffect(() => {
    if (vrm && scene && threeScene) {
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
      // ✨ VRM Animation 플러그인 등록
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

      const loadedActions: Record<string, THREE.AnimationAction> = {};

      for (const [name, filePath] of Object.entries(ANIMATION_FILES)) {
        try {
          const gltf = await loader.loadAsync(filePath);
          
          // ✨ userData.vrmAnimations 에서 데이터 추출
          const vrmAnimations = gltf.userData.vrmAnimations;
          
          if (vrmAnimations && vrmAnimations.length > 0) {
            // ✨ 핵심: 로드된 VRM 애니메이션을 현재 내 아바타(vrm) 구조에 맞게 변환(createAnimationClip)
            const clip = createVRMAnimationClip(vrmAnimations[0], vrm);

            // 클립 이름 설정 (디버깅용)
            clip.name = name;

            const action = mixerRef.current!.clipAction(clip);
            loadedActions[name] = action;
            console.log(`✓ Loaded & Retargeted: ${name}`);
          } else {
            console.warn(`❌ No VRM animations found in ${filePath}`);
          }
        } catch (error) {
          console.error(`❌ Failed to load animation: ${name}`, error);
        }
      }

      actionsRef.current = loadedActions;

      // 초기 애니메이션 실행
      if (loadedActions["idle"]) {
        loadedActions["idle"].play();
        currentActionRef.current = loadedActions["idle"];
      }
    };

    loadAllAnimations();
  }, [vrm]); // vrm이 로드된 후에 실행

  // 3. 애니메이션 전환 (CrossFade) - 기존 코드 유지
  useEffect(() => {
    if (!actionsRef.current || !mixerRef.current) return;

    const newAction = actionsRef.current[currentAnimation];
    const prevAction = currentActionRef.current;

    if (newAction && newAction !== prevAction) {
      if (prevAction) {
        prevAction.fadeOut(0.5);
      }
      newAction.reset().fadeIn(0.5).play();
      currentActionRef.current = newAction;
    }
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

    // 표정 제어 (기존 코드 유지)
    if (vrm.expressionManager) {
      const presetName = mapEmotionToPreset(currentEmotion);
      vrm.expressionManager.setValue(presetName, 1.0);
      
      ['neutral', 'happy', 'angry', 'sad', 'surprised'].forEach(emo => {
        if (emo !== presetName) vrm.expressionManager?.setValue(emo, 0);
      });

      const volume = audioPlayer.getVolume();
      vrm.expressionManager.setValue('aa', volume);
      
      const blinkValue = Math.sin(state.clock.elapsedTime * 2) > 0.98 ? 1 : 0;
      vrm.expressionManager.setValue('blink', blinkValue);
      vrm.expressionManager.update();
    }
  });

  if (!scene) return null;
  // primitive에 직접 scene을 넣음
  return <primitive object={scene} position={[0, -0.8, 0]} />;
}

// 헬퍼 함수
function mapEmotionToPreset(emotion: string): string {
  switch (emotion) {
    case "happy": return "happy";
    case "angry": return "angry";
    case "sad": return "sad";
    case "surprised": return "surprised";
    default: return "neutral";
  }
}