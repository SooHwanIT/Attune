import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiClient, toApiError } from "./httpClient";

// 1. 시스템 프롬프트: AI에게 성격과 애니메이션 선택 규칙을 부여합니다.
// JSON 형식으로 응답을 강제하여 파싱하기 쉽게 만듭니다.
const SYSTEM_PROMPT = `
당신은 '루나'라는 이름의 3D AI 버튜버입니다.
성격: 명랑하고 활기차며, 친절합니다. 이모티콘을 적절히 사용하세요.
제약사항: 답변은 2문장 이내로 짧게 하세요.

[애니메이션 선택 가이드]
사용자의 말과 당신의 답변에 가장 잘 어울리는 동작을 아래 목록에서 하나만 선택하세요.
- idle: 기본 대기, 일반적인 대화, 경청
- greeting: 인사(안녕, 반가워), 소개, 만남
- vSignCute: 긍정(네, 좋아요), 귀여움, 브이(V), 사진 찍기
- bangEmphasis: 장난(빵야), 공격, 화남, 강조
- spinShowoff: 자랑(한바퀴 돌기), 변신, 회전, 뒷모습 보여주기
- modelConfident: 멋짐, 모델 포즈, 자신감
- squatTired: 운동, 스쿼트, 힘들 때, 앉기

[출력 형식]
반드시 오직 JSON 형식으로만 응답하세요. 마크다운이나 부가적인 설명은 쓰지 마세요.
Example:
{
  "text": "반가워요! 오늘 정말 기분 좋은 날이네요! 😄",
  "emotion": "happy",
  "animation": "greeting"
}
`;

export interface ChatResponse {
  text: string;
  emotion: string;
  animation: string; // 애니메이션 필드 추가
}

const LEGACY_TO_NEW_ANIMATION_MAP: Record<string, string> = {
  pose1: "vSignCute",
  pose2: "bangEmphasis",
  pose3: "spinShowoff",
  pose4: "modelConfident",
  pose5: "squatTired",
};

function normalizeAnimation(animation: unknown): string {
  if (typeof animation !== "string" || !animation.trim()) return "idle";

  const normalized = animation.trim();
  return LEGACY_TO_NEW_ANIMATION_MAP[normalized] || normalized;
}

// 2. Gemini API 호출
export const getAIResponse = async (message: string): Promise<ChatResponse> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is not set in .env.local");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // 모델명은 사용 가능한 최신 모델로 지정 (예: gemini-1.5-flash 등)
    // 참고: gemini-2.5 계열은 프리뷰 상태일 수 있으므로, 오류 시 gemini-1.5-flash로 변경해보세요.
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: { responseMimeType: "application/json" } // JSON 모드 강제
    });

    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = await response.text();

    // JSON 파싱 (가끔 마크다운 ```json ... ``` 이 포함될 경우 제거)
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedData = JSON.parse(content);

    return {
      text: parsedData.text || "오류가 발생했습니다.",
      emotion: parsedData.emotion || "neutral",
      animation: normalizeAnimation(parsedData.animation),
    };

  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    // 에러 발생 시 기본값 반환
    return { 
      text: "죄송해요, 잠시 머리가 어지러워요... (API 오류)", 
      emotion: "sad", 
      animation: "idle" 
    };
  }
};

// 3. 상담 시작 API
export interface InitiateCounselRequest {
  topic: string;
  mood: string;
  style: "empathy" | "solution";
  content: string;
}

export interface InitiateCounselResponse {
  success: boolean;
  sessionId: string;
  message: string;
}

export const initiateCounsel = async (data: InitiateCounselRequest): Promise<InitiateCounselResponse> => {
  try {
    const response = await apiClient.post<InitiateCounselResponse>("/counsel/initiate", data);

    return response.data;
  } catch (error) {
    const apiError = toApiError(error);
    return {
      success: false,
      sessionId: "",
      message: apiError.message || "서버가 준비되지 않았습니다.",
    };
  }
};

// 4. ElevenLabs TTS 설정 (기존 유지)
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel Voice

export const getVoice = async (text: string): Promise<ArrayBuffer> => {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error("VITE_ELEVENLABS_API_KEY is missing");
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const response = await axios.post(
      url,
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );
    return response.data;
  } catch (error) {
    console.error("ElevenLabs Error:", error);
    throw error;
  }
};