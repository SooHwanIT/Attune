# 🌿 Attune AI Care - AI Vtuber 심리 상담 서비스

**Attune AI Care**는 3D 버추얼 아바타(Vtuber)와 실시간으로 소통하며 심리 상담을 진행할 수 있는 웹 기반 AI 헬스케어 플랫폼입니다. 사용자는 인지행동치료(CBT)에 기반한 체계적인 5단계 상담을 경험할 수 있으며, 상담 종료 후 AI가 분석한 세션 리포트를 통해 감정의 변화와 실천 계획을 제공받습니다.

## 🎯 기획 배경 및 서비스 목표 (Background & Objective)
현대인들은 높은 스트레스와 불안을 겪고 있지만, 비용, 시간, 심리적 장벽 등으로 인해 대면 심리 상담을 받기 어려워합니다. **Attune AI Care**는 이러한 장벽을 낮추기 위해 **친근한 3D 버추얼 아바타**와 검증된 **CBT(인지행동치료)** 모델을 결합했습니다. 언제 어디서나 편안하고 익명성이 보장된 환경에서 속마음을 털어놓고, 체계적인 AI 분석을 통해 일상의 작은 변화를 만들어가는 것을 목표로 합니다.

## 👤 타겟 사용자 (Target Audience)
- 🏢 업무 스트레스, 인간관계 등으로 감정 관리가 필요한 현대인
- 💬 누군가에게 속마음을 털어놓고 싶지만 대면 상담의 시선이 부담스러운 분
- 🧠 자신의 감정 변화 추이를 객관적인 데이터로 확인하고 심리 안정을 찾고 싶은 분

## 💡 핵심 가치 및 서비스 철학 (Core Values & Design)
- **안전하고 몰입감 있는 환경 (Spotify-inspired)**: Spotify 디자인 시스템에서 영감을 받은 몰입형 다크 테마(Near Black)를 채택하여, 사용자가 시각적 자극을 최소화하고 온전히 자신의 내면과 대화에 집중할 수 있는 안전한 환경(Cocoon)을 제공합니다.
- **구조화된 전문 상담**: 단순 챗봇을 넘어 공감, 원인 분석, 사고의 전환, 행동 계획으로 이어지는 체계적 흐름을 제공하여 실질적인 문제 해결을 돕습니다.
- **Actionable Insight (실천 가능한 통찰)**: 대화로만 끝나지 않고, 감정 추이와 대화 키워드를 분석하여 일상에 적용할 수 있는 '나를 위한 작은 실천'과 맞춤형 명상 콘텐츠를 제안합니다.

## 🗺️ 유저 저니 맵 (User Journey)
사용자는 다음과 같은 6단계의 자연스러운 흐름을 통해 내면을 돌보는 경험을 하게 됩니다.
1. **🏠 메인 (Main)**: 편안하고 몰입감 있는 첫 화면에서 서비스의 가치를 확인하고 상담을 결심합니다.
2. **🔐 로그인 (Login)**: 안전하게 사용자 정보를 보호하고 나만의 지속적인 상담 기록을 유지하기 위해 로그인/회원가입을 진행합니다.
3. **🎙️ 실시간 상담 (Counseling)**: 사전 체크인 후, 3D Vtuber 상담사와 음성 및 웹캠으로 소통하며 5단계 CBT(인지행동치료) 상담을 밀도 있게 진행합니다.
4. **📝 기록 (Record)**: 상담이 종료되면 대화 내용과 주요 지표들이 안전하게 저장되어 언제든 나의 과거 세션을 되돌아볼 수 있습니다.
5. **📊 분석 (Analysis)**: AI가 도출한 감정 변화 스냅샷, 주요 키워드, 상담 요약 및 실천 가능한 인사이트(Actionable Insight)를 확인합니다.
6. **📚 맞춤형 콘텐츠 (Contents)**: 분석된 감정과 주요 키워드(예: 직장 스트레스, 수면/피로 등)를 바탕으로 추천받은 심리/명상 콘텐츠를 소비하며 일상에서 마음 근육을 단련합니다.

## ✨ 핵심 기능 (Key Features)

### 1. 🎙️ 3D AI 아바타와의 실시간 상담
- **VRM 아바타 렌더링**: `@react-three/fiber` 및 `@pixiv/three-vrm`을 활용하여 웹상에서 자연스러운 3D 아바타 구현
- **동적 표정 및 애니메이션**: 사용자의 감정과 대화 문맥에 맞춘 실시간 표정 변화(neutral, happy, sad, angry 등) 및 자연스러운 애니메이션 전환(CrossFade)
- **오디오 기반 립싱크(Lip-sync)**: 음성 주파수 분석을 통해 아바타의 입 모양을 동기화하여 몰입감 있는 대화 경험 제공

### 2. 📋 사전 상담 준비 (Pre-Counseling Modal)
- 상담 전 사용자의 **주제, 현재 기분, 전하고 싶은 말**을 입력받아 맞춤형 상담의 기초 자료로 활용
- **웹브라우저 미디어 장치 제어**: WebRTC(`getUserMedia`)를 통해 카메라 및 마이크 상태 사전 점검 및 미리보기 제공
- **WebSocket 연동**: 빠르고 지연 없는 실시간 스트리밍 상담을 위한 소켓 연결 초기화

### 3. 🧠 CBT 기반 5단계 상담 진행 (Stage Progress)
상담의 흐름을 시각적으로 제공하여 사용자가 현재 어느 단계에 있는지 인지할 수 있도록 돕습니다.
1. **공감 형성**: 현재 상태 확인
2. **문제 탐색**: 구체적 상황 파악
3. **사고 전환**: 관점의 재구성
4. **행동 계획**: 작은 실천 설계
5. **마무리**: 통찰 및 다짐

### 4. 📊 AI 상담 분석 리포트 (Session Analysis)
- **감정 스냅샷**: 상담 전/후의 감정 변화 추이를 시각화 (예: 불안 ➡️ 안도감)
- **상담 요약 및 인사이트**: 오늘 털어놓은 고민, AI가 발견한 사용자의 강점, 그리고 일상에 적용할 수 있는 '나를 위한 작은 실천' 요약
- **핵심 키워드 추출**: 대화 중 가장 많이 등장한 감정/상황 키워드 제공
- **추천 콘텐츠**: 사용자의 현재 고민과 상태(예: 직장 스트레스, 수면/피로 등)에 맞춘 맞춤형 심리/명상 콘텐츠 추천

---

## 🧩 주요 페이지 및 컴포넌트 상세 (Pages & Components)

프로젝트는 사용자의 자연스러운 심리 치유 여정을 위해 여러 세부 페이지와 모듈화된 컴포넌트로 구성되어 있습니다.

### 1. 🏠 메인 및 인증 페이지 (Main & Auth)
- **사용자 행동 (Actions)**: 서비스 핵심 가치 확인, 로그인/회원가입, 비밀번호 재설정 진행
- **주요 컴포넌트**:
  - `HeroSection`: 서비스의 목적을 직관적으로 전달하는 메인 배너 및 상담 시작(CTA) 영역
  - `AuthForm`: 이메일/비밀번호 입력 폼 (비밀번호 강도 실시간 피드백 및 노출 상태 토글 포함)

### 2. ⏳ 상담 대기 및 안내 페이지 (CounselWaitingPage)
- **사용자 행동 (Actions)**: 본 상담 시작 전 상담 예상 소요 시간, 데이터 보호 정책 확인 및 CBT 5단계 로드맵 예습
- **주요 컴포넌트**:
  - `StepCard`: 상담 준비 절차(정보 확인 ➡️ 사전 질문 ➡️ 시작) 시각화
  - `CBT Roadmap`: 공감 형성부터 마무리까지 5단계 진행 과정과 각 단계별 AI 예시 질문을 보여주는 인터랙티브 애니메이션 UI

### 3. 📋 사전 상담 준비 모달 (PreCounselModal)
- **사용자 행동 (Actions)**: 오늘 다룰 주제, 현재 감정 상태, 전하고 싶은 말을 단계별로 입력하고 기기(웹캠/마이크) 상태 점검
- **주요 컴포넌트**:
  - `Topic & Mood Selection`: 직장/관계/불안 등 고민 주제와 현재 감정을 직관적인 카드 형태로 선택
  - `DeviceCheck`: WebRTC 기반 카메라/마이크 권한 요청, 비디오 실시간 미리보기 제공 및 On/Off 제어

### 4. 🎙️ 실시간 상담 스튜디오 (CounselPage)
- **사용자 행동 (Actions)**: 3D Vtuber와 실제 통화하듯 음성/영상으로 대화, 현재 CBT 진행 단계 확인, 상담 강제 종료 및 기록 페이지로 이동
- **주요 컴포넌트**:
  - `ThreeCounselScene`: `@react-three/fiber` 기반의 3D 환경 렌더링 및 아바타 립싱크/동적 표정 제어
  - `StageProgress`: 현재 상담이 전체 5단계 중 어디쯤 위치했는지 보여주는 상단 프로그레스 UI
  - `CounselController`: 하단에서 마이크/카메라 상태를 실시간으로 제어하고 상담을 종료하는 컨트롤러
  - `SubtitleView`: AI 상담사의 음성을 텍스트 자막으로 출력하여 접근성 및 이해도 향상

### 5. 📊 세션 기록 및 분석 페이지 (Analysis & Report)
- **사용자 행동 (Actions)**: 지난 상담 세션 기록 조회, AI가 분석한 세션별 감정 추이, 대화 키워드, 행동 지표 확인
- **주요 컴포넌트**:
  - `TopicEmotionMap`: 대화 진행도(X축)와 감정 스케일(Y축)을 기반으로, 대화 주제가 감정에 미친 영향을 시각화하는 인터랙티브 버블 차트
  - `SessionList` / `KPI Dashboard`: 세션별 평균 감정, 안정도, 긍정적 변화도 등의 핵심 지표 집계 뷰

### 6. 📚 콘텐츠 및 마이페이지 (Contents & MyPage)
- **사용자 행동 (Actions)**: 분석 결과를 바탕으로 추천된 심리 안정/명상 콘텐츠 열람, 프로필 정보 및 계정 보안 관리
- **주요 컴포넌트**:
  - `ContentCard` / `FilterBar`: 명상, 호흡법 등 맞춤형 힐링 콘텐츠 탐색 및 상세 렌더링
  - `UserProfile`: 로그인한 사용자의 이름, 이메일 정보 표시 및 로그아웃 처리

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React (TypeScript)
- **Routing**: React Router DOM (보안 라우팅 `ProtectedRoute`, `DevOnlyRoute` 적용)
- **Styling**: Tailwind CSS, Lucide React (Icons)

### 3D & Graphics
- **3D Engine**: Three.js
- **React 3D Binding**: `@react-three/fiber`, `@react-three/drei`
- **Avatar Handling**: `@pixiv/three-vrm`, `@pixiv/three-vrm-animation`

### Communication & Data
- **Real-time**: WebSocket
- **Media**: Web Audio API, WebRTC (getUserMedia)

---

## 📂 프로젝트 주요 구조 (Directory Structure)

```text
src/
 ├── components/
 │    ├── Avatar.tsx             # 3D VRM 모델 렌더링 및 애니메이션/립싱크 제어 컴포넌트
 │    ├── Header.tsx             # GNB 라우팅, 인증 상태에 따른 메뉴 제어 및 반응형 헤더
 │    ├── NoiseFlowBackground.tsx# Perlin Noise를 활용한 심리적으로 안정감을 주는 배경 애니메이션
 │    ├── PreCounselModal.tsx    # 상담 시작 전 기기 세팅 및 초기 상태 입력 모달
 │    ├── StageProgress.tsx      # CBT 5단계 상담 진행 상황 시각화 프로그레스 바
 │    ├── ThreeCounselScene.tsx  # 본 상담 화면의 3D 씬 (조명 및 아바타 배치)
 │    ├── ThreePreviewScene.tsx  # 프리뷰 전용 3D 씬
 │    └── ProtectedRoute.tsx     # 로그인 유저 전용 라우트 가드
 ├── utils/
 │    ├── audioPlayer.ts         # 아바타 립싱크 및 오디오 재생 유틸 (추정)
 │    ├── auth.ts                # 로그인 및 세션 관리 유틸
 │    ├── counselingApi.ts       # 상담 데이터 패칭 API 유틸
 │    └── wsSession.ts           # WebSocket 세션 상태 관리
 └── ...
```

---

## 🚀 시작하기 (Getting Started)

1. 환경 변수 설정 (`.env` 파일 생성)
   ```env
   VITE_COUNSEL_WS_BASE_URL=wss://your-websocket-server-url
   ```
2. 패키지 설치: `npm install` (또는 `yarn`, `pnpm`)
3. 로컬 서버 실행: `npm run dev`