export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    // 브라우저 호환성을 위해 AudioContext 초기화
    const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = AudioCtx ? new AudioCtx() : null;
  }

  // 오디오 재생 및 분석기 연결
  async play(audioData: ArrayBuffer, onEnded?: () => void) {
    if (!this.audioContext) return;
    
    // 이전 오디오 중지
    this.stop();

    // 오디오 디코딩
    const audioBuffer = await this.audioContext.decodeAudioData(audioData);

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = audioBuffer;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // Source -> Analyser -> Destination(스피커) 연결
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.source.onended = () => {
      this.isPlaying = false;
      if (onEnded) onEnded();
    };

    this.source.start(0);
    this.isPlaying = true;
  }

  stop() {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // 이미 멈춘 경우 무시
      }
      this.source.disconnect();
    }
    this.isPlaying = false;
  }

  // 현재 볼륨 가져오기 (0.0 ~ 1.0) - 립싱크용
  getVolume(): number {
    if (!this.analyser || !this.isPlaying) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // 전체 주파수의 평균 볼륨 계산
    let sum = 0;
    for (const amplitude of dataArray) {
      sum += amplitude;
    }
    const average = sum / dataArray.length;
    
    // 정규화 및 감도 조절 (입을 더 잘 벌리게 하기 위해 2.5배 증폭)
    return Math.min(1, (average / 255) * 2.5);
  }

  // 입술 모양 분석 - 주파수별로 다양한 입술 형태 결정
  // aa: 낮은 주파수 (0-500Hz) - 입을 크게 벌린 모양
  // ih: 중간 주파수 (800-2000Hz) - 입을 살짝 벌린 모양
  // ou: 낮은 중간 주파수 (200-800Hz) - 입을 둥글게 오므린 모양
  // ee: 높은 주파수 (2000-4000Hz) - 입을 옆으로 펼친 모양
  // oh: 매우 낮은 주파수 (100-400Hz) - 입을 둥글게 벌린 모양
  getLipSyncValues(): Record<string, number> {
    if (!this.analyser || !this.isPlaying) {
      return { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // 주파수 대역별 에너지 계산
    const lowBand = dataArray.slice(0, Math.floor(dataArray.length * 0.2)); // 0-400Hz
    const midLowBand = dataArray.slice(Math.floor(dataArray.length * 0.2), Math.floor(dataArray.length * 0.4)); // 400-800Hz
    const midHighBand = dataArray.slice(Math.floor(dataArray.length * 0.6), Math.floor(dataArray.length * 0.8)); // 1200-1600Hz
    const highBand = dataArray.slice(Math.floor(dataArray.length * 0.8), dataArray.length); // 1600Hz+

    const getAverage = (arr: Uint8Array) => {
      if (arr.length === 0) return 0;
      let sum = 0;
      for (const val of arr) sum += val;
      return (sum / arr.length) / 255;
    };

    const low = getAverage(lowBand);
    const midLow = getAverage(midLowBand);
    const midHigh = getAverage(midHighBand);
    const high = getAverage(highBand);

    return {
      aa: Math.min(1, low * 2.0), // 낮은 주파수 강조
      ih: Math.min(1, midHigh * 1.8),
      ou: Math.min(1, midLow * 1.9),
      ee: Math.min(1, high * 1.7),
      oh: Math.min(1, low * 1.8),
    };
  }
  
  // 브라우저 정책상 사용자 인터랙션 후 호출 필요
  async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

export const audioPlayer = new AudioPlayer();