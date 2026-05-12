import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";

type ResetState = "idle" | "submitting" | "sent";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ResetState>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setStatus("submitting");

    await new Promise((resolve) => window.setTimeout(resolve, 700));

    setStatus("sent");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-base">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">ACCOUNT RECOVERY</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">비밀번호 찾기</h1>
          <p className="mt-2 text-sm text-slate-600">
            가입한 이메일을 입력하면 비밀번호 재설정 안내를 보내드립니다.
          </p>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {status === "sent" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                재설정 안내를 전송했습니다. 메일함을 확인해주세요.
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-md bg-brand-green px-4 py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-500">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "submitting"}
                  placeholder="your@email.com"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-300 focus:border-primary focus:bg-white disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex w-full items-center justify-center rounded-md bg-brand-green px-4 py-3 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {status === "submitting" ? "전송 중..." : "재설정 안내 보내기"}
              </button>

              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                로그인으로 돌아가기
              </Link>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
