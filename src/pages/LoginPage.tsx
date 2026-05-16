import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { authenticate, isLoggedIn, register, requestSignupVerificationCode, verifySignupCode } from "../utils/auth";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as { from?: string } | null)?.from || "/";
  const redirectState = location.state;
  
  // 탭 상태
  const [mode, setMode] = useState<AuthMode>("login");
  
  // 로그인 폼
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // 회원가입 폼
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  
  // 공통 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;

    if (location.pathname === "/login") {
      navigate(redirectPath === "/login" ? "/" : redirectPath, { replace: true, state: redirectState });
    }
  }, [location.pathname, navigate, redirectPath, redirectState]);

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string): { strength: "weak" | "medium" | "strong"; percentage: number } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: "weak", percentage: 33 };
    if (strength <= 3) return { strength: "medium", percentage: 66 };
    return { strength: "strong", percentage: 100 };
  };

  const signupStrength = calculatePasswordStrength(signupPassword);

  const getStrengthLabel = (strength: "weak" | "medium" | "strong") => {
    if (strength === "weak") return "약함";
    if (strength === "medium") return "중간";
    return "강함";
  };

  // 이메일 유효성 검사
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const resetVerificationState = () => {
    setVerificationCode("");
    setIsVerificationSent(false);
    setIsEmailVerified(false);
    setVerificationMessage("");
  };

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    
    const result = await authenticate(loginEmail, loginPassword);
    
    setIsLoading(false);
    
    if (result.success) {
      navigate(redirectPath === "/login" ? "/" : redirectPath, { replace: true, state: redirectState });
    } else {
      setError(result.message || "로그인에 실패했습니다.");
    }
  };

  // 회원가입 처리
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim() || !signupPasswordConfirm.trim()) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    if (!isValidEmail(signupEmail)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    if (signupPassword.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (signupPassword !== signupPasswordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isEmailVerified) {
      setError("이메일 인증을 먼저 완료해주세요.");
      return;
    }

    if (!agreed) {
      setError("이용약관에 동의해주세요.");
      return;
    }

    setIsLoading(true);
    
    const result = await register(signupName, signupEmail, signupPassword);
    
    setIsLoading(false);
    
    if (result.success) {
      navigate(redirectPath === "/login" ? "/" : redirectPath, { replace: true, state: redirectState });
    } else {
      setError(result.message || "회원가입에 실패했습니다.");
    }
  };

  // 인증 메일 발송
  const handleSendVerificationCode = async () => {
    setError("");
    setVerificationMessage("");

    if (!signupEmail.trim()) {
      setError("이메일을 먼저 입력해주세요.");
      return;
    }

    if (!isValidEmail(signupEmail)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    console.log("🚀 인증 코드 버튼 클릭:", signupEmail);
    setIsVerificationLoading(true);
    const result = await requestSignupVerificationCode(signupEmail);
    setIsVerificationLoading(false);

    console.log("📊 인증 코드 결과:", result);
    if (result.success) {
      setIsVerificationSent(true);
      setVerificationMessage("인증 코드를 이메일로 전송했습니다.");
    } else {
      setError(result.message || "인증 메일 전송에 실패했습니다.");
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    setError("");
    setVerificationMessage("");

    if (!verificationCode.trim()) {
      setError("인증 코드를 입력해주세요.");
      return;
    }

    setIsVerificationLoading(true);
    const result = await verifySignupCode(signupEmail, verificationCode);
    setIsVerificationLoading(false);

    if (result.success) {
      setIsEmailVerified(true);
      setVerificationMessage("이메일 인증이 완료되었습니다.");
    } else {
      setIsEmailVerified(false);
      setVerificationMessage(result.message || "이메일 인증에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6 lg:p-8 text-slate-900">
      <div className="flex flex-1 items-center justify-center">
        <div className="grid min-h-[600px] sm:min-h-[700px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-lg md:rounded-xl border border-slate-200 bg-white md:grid-cols-2 shadow-lg">
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8 md:p-10 lg:p-12 text-slate-900 md:flex">
            <div>
              <Link to="/" className="mb-2 inline-block text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-brand-green">
                Attune <span className="ml-1 text-xs sm:text-sm font-normal text-slate-600">AI Care</span>
              </Link>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mt-4 md:mt-6 text-slate-900">
                오늘 하루,<br />
                <span className="text-brand-green">당신의 마음</span>을<br />
                나누세요
              </h2>
              <p className="mt-3 md:mt-4 text-xs sm:text-sm leading-relaxed text-slate-600">
                AI 심리 상담사와 안전한 대화를 시작하세요.<br />
                모든 대화는 완전 익명으로 보호됩니다.
              </p>
            </div>

            <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full border border-brand-green/20 bg-brand-green/10"></div>
            <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full border border-brand-green/20 bg-brand-green/10"></div>
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green/10 opacity-30"></div>
          </div>

          <div className="flex flex-col justify-center bg-slate-50 p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6 md:mb-8 flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className={`px-2 sm:px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm transition-colors border-b-2 ${
                    mode === "login"
                      ? "border-brand-green text-brand-green"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  로그인
                </button>
                <button
                  onClick={() => {
                    setMode("signup");
                    resetVerificationState();
                    setError("");
                  }}
                  className={`px-2 sm:px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm transition-colors border-b-2 ${
                    mode === "signup"
                      ? "border-brand-green text-brand-green"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  회원가입
                </button>
              </div>

              {error && (
                <div className="mb-6 rounded-md border border-semantic-negative/30 bg-semantic-negative/10 p-3 text-xs sm:text-sm text-semantic-negative">
                  {error}
                </div>
              )}

              {mode === "login" && (
                <form className="space-y-3 sm:space-y-4 md:space-y-5" onSubmit={handleLogin}>
                  <h1 className="mb-1 sm:mb-2 text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900">로그인</h1>
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-slate-600">기존 계정으로 로그인하세요.</p>

                  <div>
                    <label className="mb-1 ml-1 block text-xs font-bold text-slate-600">이메일</label>
                    <input 
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-green focus:bg-slate-50 disabled:opacity-50 shadow-sm" 
                      placeholder="your@email.com" 
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 ml-1 block text-xs font-bold text-slate-600">비밀번호</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-10 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-green focus:bg-slate-50 disabled:opacity-50 shadow-sm" 
                        placeholder="비밀번호를 입력하세요" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 text-xs text-slate-600">
                    <label className="flex cursor-pointer items-center gap-2 hover:text-slate-900">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-200 accent-brand-green" disabled={isLoading} />
                      <span>로그인 상태 유지</span>
                    </label>
                    <Link to="/forgot-password" className="hover:text-brand-green hover:underline">비밀번호 찾기</Link>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="mt-2 sm:mt-4 w-full rounded-pill bg-brand-green py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-bold text-white transition-colors hover:bg-brand-green-dark active:scale-[0.98] disabled:opacity-50 shadow-md"
                  >
                    {isLoading ? "로그인 중..." : "로그인"}
                  </button>

                  <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-slate-600">
                    계정이 없으신가요? <button type="button" onClick={() => setMode("signup")} className="font-bold text-brand-green hover:underline">회원가입</button>
                  </div>
                </form>
              )}

              {mode === "signup" && (
                <form className="space-y-5" onSubmit={handleSignup}>
                  <h1 className="mb-2 text-2xl font-extrabold text-slate-900">회원가입</h1>
                  <p className="mb-6 text-sm text-slate-600">상담을 시작하려면 계정을 생성하세요.</p>

                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-600">이름 또는 닉네임</label>
                    <input 
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-green focus:bg-slate-50 disabled:opacity-50 shadow-sm" 
                      placeholder="예: 김서진, 루시, John" 
                    />
                    <p className="mt-1 ml-1 text-xs text-slate-400">외부에 공개되지 않습니다</p>
                  </div>

                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-600">이메일</label>
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        value={signupEmail}
                        onChange={(e) => {
                          setSignupEmail(e.target.value);
                          setIsEmailVerified(false);
                          setIsVerificationSent(false);
                          setVerificationMessage("");
                        }}
                        disabled={isLoading || isVerificationLoading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-green focus:bg-slate-50 disabled:opacity-50 shadow-sm" 
                        placeholder="your@email.com" 
                      />
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={isLoading || isVerificationLoading}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {isVerificationLoading ? "전송 중" : "인증 코드"}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <Mail size={13} />
                      <span>{isVerificationSent ? "인증 코드가 전송되었습니다." : "이메일 인증 후 가입할 수 있습니다."}</span>
                      {isEmailVerified && <CheckCircle2 size={13} className="text-brand-green" />}
                    </div>
                  </div>

                  {/* 이메일 인증 코드는 항상 렌더링되거나 인증 코드가 전송된 이후에만 노출되도록 처리 */}
                  <div className={!isVerificationSent && !isEmailVerified ? "opacity-50 pointer-events-none" : ""}>
                    <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-600">인증 코드</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        disabled={isLoading || isVerificationLoading || isEmailVerified}
                        className="w-full rounded-lg border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-green focus:bg-slate-50 disabled:opacity-50 shadow-sm"
                        placeholder="6자리 코드를 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isLoading || isVerificationLoading || !isVerificationSent || isEmailVerified}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        인증 확인
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <ShieldCheck size={13} />
                      <span>{verificationMessage || "메일의 6자리 코드를 입력해 주세요."}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-600">비밀번호</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-5 py-3.5 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-green focus:bg-slate-50 disabled:opacity-50 shadow-sm" 
                        placeholder="8자 이상" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {signupPassword && (
                      <div className="mt-2">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white">
                            <div
                              className={`h-full transition-all ${
                                signupStrength.strength === "weak"
                                  ? "bg-semantic-negative"
                                  : signupStrength.strength === "medium"
                                  ? "bg-semantic-warning"
                                  : "bg-brand-green"
                              }`}
                              style={{ width: `${signupStrength.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{getStrengthLabel(signupStrength.strength)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-bold text-slate-600">비밀번호 확인</label>
                    <div className="relative">
                      <input 
                        type={showPasswordConfirm ? "text" : "password"}
                        value={signupPasswordConfirm}
                        onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-5 py-3.5 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-green focus:bg-slate-50 disabled:opacity-50 shadow-sm" 
                        placeholder="비밀번호를 다시 입력하세요" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      >
                        {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {signupPasswordConfirm && signupPassword !== signupPasswordConfirm && (
                      <p className="mt-1 ml-1 text-xs text-semantic-negative">비밀번호가 일치하지 않습니다</p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={agreed} 
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={isLoading}
                      className="mt-0.5 h-4 w-4 rounded border-slate-200 accent-brand-green" 
                    />
                    <label htmlFor="terms" className="cursor-pointer leading-relaxed hover:text-slate-900">
                      이용약관 및 개인정보보호정책에 동의합니다
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading || !agreed || !isEmailVerified}
                    className="mt-4 w-full rounded-pill bg-brand-green py-4 text-base font-bold text-white transition-colors hover:bg-brand-green-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
                  >
                    {isLoading ? "가입 중..." : "회원가입"}
                  </button>

                  <div className="mt-4 text-center text-sm text-slate-600">
                    이미 계정이 있으신가요? <button type="button" onClick={() => setMode("login")} className="font-bold text-brand-green hover:underline">로그인</button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}