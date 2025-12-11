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
    if (!this.analyser ||!this.isPlaying) return 0;

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
  
  // 브라우저 정책상 사용자 인터랙션 후 호출 필요
  async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

export const audioPlayer = new AudioPlayer();