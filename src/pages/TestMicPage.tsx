import { useEffect, useRef, useState } from "react";

export default function TestMicPage() {
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);
  const [level, setLevel] = useState(0);
  const [preampGain, setPreampGain] = useState(2.6);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const stopMicTest = () => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    setIsMicOn(false);
    setLevel(0);
  };

  const startLevelMeter = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const waveform = new Float32Array(analyser.fftSize);

    const tick = () => {
      analyser.getFloatTimeDomainData(waveform);

      let sum = 0;
      for (let i = 0; i < waveform.length; i += 1) {
        sum += waveform[i] * waveform[i];
      }

      const rms = Math.sqrt(sum / waveform.length);
      const db = 20 * Math.log10(Math.max(rms, 1e-7));
      const normalizedLevel = Math.min(100, Math.max(0, Math.round(((db + 60) / 45) * 100)));
      setLevel(normalizedLevel);
      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    tick();
  };

  const startMicTest = async () => {
    stopMicTest();
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      gainNode.gain.value = preampGain;
      source.connect(gainNode);
      gainNode.connect(analyser);
      sourceNodeRef.current = source;
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;

      setStatus("ready");
      setIsMicOn(true);
      startLevelMeter();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "마이크 접근에 실패했습니다.");
      stopMicTest();
    }
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = preampGain;
    }
  }, [preampGain]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-dark-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">마이크 테스트</h1>
        <p className="mt-1 text-sm text-slate-600">권한 확인과 실시간 음성 입력 레벨을 점검할 수 있습니다.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startMicTest}
            disabled={isMicOn}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            테스트 시작
          </button>

          <button
            type="button"
            onClick={stopMicTest}
            disabled={!isMicOn}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-dark-surface px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            중지
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wide">Preamp Gain</span>
            <span className="font-semibold">x{preampGain.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            step={0.1}
            value={preampGain}
            onChange={(event) => setPreampGain(Number(event.target.value))}
            className="mb-4 w-full accent-emerald-600"
          />

          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Input Level</div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-75"
              style={{ width: `${level}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-600">{level}%</p>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          상태: {status === "idle" ? "대기" : status === "ready" ? "정상" : "오류"}
          {errorMessage ? <p className="mt-1 text-red-600">{errorMessage}</p> : null}
        </div>
      </div>
    </div>
  );
}
