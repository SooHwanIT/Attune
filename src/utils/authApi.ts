import { apiClient } from "./httpClient";

export type AuthApiUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

type HeaderMap = Record<string, string | undefined>;

export type AuthSessionResponse = {
  accessToken: string;
  message: string;
};

function readAccessToken(headers: HeaderMap): string {
  const headerValue = headers.authorization ?? headers.Authorization;
  if (!headerValue) {
    throw new Error("인증 토큰을 응답 헤더에서 찾을 수 없습니다.");
  }

  const token = headerValue.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new Error("유효한 인증 토큰이 없습니다.");
  }

  return token;
}

export async function loginApi(email: string, password: string): Promise<AuthSessionResponse> {
  const response = await apiClient.post("/auth/login", { email, password });
  return {
    accessToken: readAccessToken(response.headers as HeaderMap),
    message: typeof response.data === "string" ? response.data : "로그인 성공",
  };
}

export async function signupApi(name: string, email: string, password: string): Promise<{ message: string }> {
  const response = await apiClient.post("/users/signup", {
    name,
    email,
    password,
  });
  return {
    message: typeof response.data === "string" ? response.data : "회원가입 성공",
  };
}

export async function refreshTokenApi(): Promise<AuthSessionResponse> {
  const response = await apiClient.post("/auth/reissue");
  return {
    accessToken: readAccessToken(response.headers as HeaderMap),
    message: typeof response.data === "string" ? response.data : "재발급 성공",
  };
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function sendVerificationCodeApi(email: string): Promise<string> {
  try {
    console.log("📧 이메일 인증 코드 발송 요청:", email);
    const response = await apiClient.post("/mail/send", { email });
    console.log("✅ 인증 메일 발송 성공:", response.data);
    return typeof response.data === "string" ? response.data : "인증 메일 발송 완료";
  } catch (error) {
    console.error("❌ 인증 메일 발송 실패:", error);
    if (error instanceof Error) {
      console.error("에러 메시지:", error.message);
    }
    throw error;
  }
}

export async function verifyEmailCodeApi(email: string, code: string): Promise<{ verified: boolean; message: string }> {
  try {
    console.log("🔐 이메일 인증 코드 검증 요청:", { email, code });
    const response = await apiClient.post("/mail/verify", { email, code });
    console.log("✅ 이메일 인증 성공:", response.data);
    return {
      verified: true,
      message: typeof response.data === "string" ? response.data : "인증 성공",
    };
  } catch (error) {
    console.error("❌ 이메일 인증 실패:", error);
    if (error instanceof Error) {
      console.error("에러 메시지:", error.message);
    }
    return {
      verified: false,
      message: error instanceof Error ? error.message : "인증에 실패했습니다.",
    };
  }
}
