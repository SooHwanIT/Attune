import { useEffect, useMemo, useState } from "react";

type ChoseongSample = {
  symbol: string;
  prompt: string;
  targetFileName: string;
};

const CHOSEONG_SAMPLES: ChoseongSample[] = [
  { symbol: "ㄱ", prompt: "그", targetFileName: "giyeok.wav" },
  { symbol: "ㄲ", prompt: "끄", targetFileName: "ssang_giyeok.wav" },
  { symbol: "ㄴ", prompt: "느", targetFileName: "nieun.wav" },
  { symbol: "ㄷ", prompt: "드", targetFileName: "digeut.wav" },
  { symbol: "ㄸ", prompt: "뜨", targetFileName: "ssang_digeut.wav" },
  { symbol: "ㄹ", prompt: "르", targetFileName: "rieul.wav" },
  { symbol: "ㅁ", prompt: "므", targetFileName: "mieum.wav" },
  { symbol: "ㅂ", prompt: "브", targetFileName: "bieup.wav" },
  { symbol: "ㅃ", prompt: "쁘", targetFileName: "ssang_bieup.wav" },
  { symbol: "ㅅ", prompt: "스", targetFileName: "siot.wav" },
  { symbol: "ㅆ", prompt: "쓰", targetFileName: "ssang_siot.wav" },
  { symbol: "ㅇ", prompt: "응", targetFileName: "ieung.wav" },
  { symbol: "ㅈ", prompt: "즈", targetFileName: "jieut.wav" },
  { symbol: "ㅉ", prompt: "쯔", targetFileName: "ssang_jieut.wav" },
  { symbol: "ㅊ", prompt: "츠", targetFileName: "chieut.wav" },
  { symbol: "ㅋ", prompt: "크", targetFileName: "kieuk.wav" },
  { symbol: "ㅌ", prompt: "트", targetFileName: "tieut.wav" },
  { symbol: "ㅍ", prompt: "프", targetFileName: "pieup.wav" },
  { symbol: "ㅎ", prompt: "흐", targetFileName: "hieut.wav" },
];

const DEFAULT_SCRIPT = CHOSEONG_SAMPLES.map((item) => item.prompt).join(" ");

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function TestTtsSampleBuilderPage() {
  const [scriptText, setScriptText] = useState(DEFAULT_SCRIPT);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
  const [pitch, setPitch] = useState(1.15);
  const [rate, setRate] = useState(0.95);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pickedFiles, setPickedFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const koreanVoices = allVoices.filter((voice) => voice.lang.toLowerCase().startsWith("ko"));
      setVoices(koreanVoices);

      if (!selectedVoiceUri && koreanVoices[0]) {
        setSelectedVoiceUri(koreanVoices[0].voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceUri]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === selectedVoiceUri) ?? null,
    [voices, selectedVoiceUri],
  );

  const speakScript = () => {
    const trimmed = scriptText.trim();
    if (!trimmed) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "ko-KR";
    utterance.pitch = pitch;
    utterance.rate = rate;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const downloadAudacityLabelTemplate = () => {
    const sampleDurationSec = 0.22;
    const gapSec = 0.06;
    let cursor = 0;

    const lines = CHOSEONG_SAMPLES.map((item) => {
      const start = cursor;
      const end = start + sampleDurationSec;
      cursor = end + gapSec;
      return `${start.toFixed(3)}\t${end.toFixed(3)}\t${item.symbol}_${item.targetFileName}`;
    });

    downloadTextFile("audacity-labels-initials.txt", lines.join("\n"));
  };

  const downloadRecordingScript = () => {
    const content = [
      "[Korean Choseong Recording Script]",
      "",
      "Read naturally with short pauses.",
      `Main line: ${scriptText.trim() || DEFAULT_SCRIPT}`,
      "",
      "Target files:",
      ...CHOSEONG_SAMPLES.map((item) => `${item.symbol} -> ${item.targetFileName}`),
    ].join("\n");

    downloadTextFile("tts-recording-script.txt", content);
  };

  const setPickedFile = (targetFileName: string, file: File | null) => {
    setPickedFiles((prev) => ({
      ...prev,
      [targetFileName]: file,
    }));
  };

  const downloadRenamedFile = (targetFileName: string) => {
    const file = pickedFiles[targetFileName];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = targetFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">초성 샘플 제작 테스트</h1>
        <p className="mt-1 text-sm text-slate-600">
          한국어 TTS로 초성용 원본 음성을 빠르게 만들고, Audacity 분할과 파일명 맞춤 저장까지 한 번에 진행할 수 있습니다.
        </p>

        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-800">1) TTS 원본 생성</h2>
          <p className="mt-1 text-xs text-slate-600">
            먼저 TTS로 한 줄을 반복 재생하면서 OS 녹음기나 Audacity loopback으로 전체 음성을 녹음하세요.
          </p>

          <label className="mt-3 block text-xs font-semibold text-slate-600">읽을 문장</label>
          <textarea
            value={scriptText}
            onChange={(event) => setScriptText(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          />

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              한국어 Voice
              <select
                value={selectedVoiceUri}
                onChange={(event) => setSelectedVoiceUri(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                {voices.length === 0 && <option value="">ko 음성 없음</option>}
                {voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Pitch: {pitch.toFixed(2)}
              <input
                type="range"
                min={0.8}
                max={1.8}
                step={0.01}
                value={pitch}
                onChange={(event) => setPitch(Number(event.target.value))}
                className="mt-2 w-full accent-emerald-600"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Rate: {rate.toFixed(2)}
              <input
                type="range"
                min={0.7}
                max={1.2}
                step={0.01}
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
                className="mt-2 w-full accent-emerald-600"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={speakScript}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              TTS 재생
            </button>
            <button
              type="button"
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              정지
            </button>
            <button
              type="button"
              onClick={downloadRecordingScript}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              녹음 스크립트 txt 저장
            </button>
            <button
              type="button"
              onClick={downloadAudacityLabelTemplate}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Audacity 라벨 txt 저장
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-800">2) 파일명 맞춤 저장</h2>
          <p className="mt-1 text-xs text-slate-600">
            Audacity에서 분할 Export한 파일을 선택하면, 이 페이지에서 목표 파일명으로 다시 내려받을 수 있습니다.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {CHOSEONG_SAMPLES.map((item) => (
              <div key={item.targetFileName} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-xs text-slate-700">
                  {item.symbol} ({item.prompt}) {"->"} <span className="font-semibold">{item.targetFileName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) => setPickedFile(item.targetFileName, event.target.files?.[0] ?? null)}
                    className="max-w-full text-xs"
                  />
                  <button
                    type="button"
                    disabled={!pickedFiles[item.targetFileName]}
                    onClick={() => downloadRenamedFile(item.targetFileName)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    파일명 맞춰 다운로드
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            최종 파일은 프로젝트의 public/assets/tts/initials 폴더에 넣으면 CounselTestPage가 바로 읽습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
