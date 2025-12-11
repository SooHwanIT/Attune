import axios from 'axios';

// ElevenLabs API 설정
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const VOICE_ID = "YOUR_VOICE_ID"; // Rachel 등 선호하는 목소리 ID

export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  // 감정 태그 제거 (TTS는 텍스트만 읽어야 함)
  const cleanText = text.replace(/\[.*?\]/g, "").trim();

  const response = await axios.post(
    `${ELEVENLABS_API_URL}/${VOICE_ID}`,
    {
      text: cleanText,
      model_id: "eleven_multilingual_v2", // 다국어 지원 모델
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    },
    {
      headers: {
        "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      responseType: 'arraybuffer' // 오디오 바이너리 데이터 수신
    }
  );
  return response.data;
};


// 오디오 컨텍스트 및 분석기 설정
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: AudioBufferSourceNode | null = null;

export const playAudio = async (audioData: ArrayBuffer, onEnded: () => void) => {
  if (!audioContext) audioContext = new (window.AudioContext |

| (window as any).webkitAudioContext)();
  
  const audioBuffer = await audioContext.decodeAudioData(audioData);
  
  if (source) source.disconnect(); // 이전 오디오 중지
  source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256; // 분석 정밀도 설정
  
  source.connect(analyser);
  analyser.connect(audioContext.destination); // 스피커로 출력 연결
  
  source.onended = onEnded;
  source.start(0);
};

// 매 프레임 호출되어 현재 볼륨을 반환하는 함수
export const getAudioVolume = (): number => {
  if (!analyser) return 0;
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  // 전체 주파수 대역의 평균 볼륨 계산
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  const average = sum / dataArray.length;
  
  // 0~255 범위를 0.0~1.0 범위로 정규화
  return average / 255;
};