import {
  loginApi,
  logoutApi,
  refreshTokenApi,
  sendVerificationCodeApi,
  signupApi,
  verifyEmailCodeApi,
  type AuthSessionResponse,
} from "./authApi";
import { setAuthTokenGetter, toApiError } from "./httpClient";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  iat: number;
  exp: number;
}

export type AuthResult = {
  success: boolean;
  message?: string;
};

// JWT 페이로드 디코딩 함수
function decodeJwtPayload(token: string): { exp?: number; sub?: string } | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload) as { exp?: number; sub?: string };
  } catch {
    return null;
  }
}

// 토큰 만료 여부 확인
function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }
  return payload.exp * 1000 > Date.now();
}

// 세션 저장
function setSession(user: User, accessToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// API 응답으로부터 세션 저장
function saveSessionFromApi(payload: AuthSessionResponse, email: string, fallbackName?: string): void {
  const decoded = decodeJwtPayload(payload.accessToken);
  const user: User = {
    id: decoded?.sub ?? email,
    email,
    name: fallbackName ?? email.split("@")[0] ?? email,
  };

  setSession(user, payload.accessToken);
}

// 세션 삭제
function removeSessionStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 현재 저장된 Access Token 가져오기
export const getAccessToken = (): string | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;

  if (isTokenValid(token)) {
    return token;
  }
  
  // 토큰이 만료된 경우 API 인터셉터에서 refreshAccessTokenAsync를 호출하도록 유도하기 위해 null 반환
  return null;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const isLoggedIn = (): boolean => !!getAccessToken() && !!getCurrentUser();

// 로그인
export const authenticate = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const payload = await loginApi(email, password);
    saveSessionFromApi(payload, email);
    return { success: true };
  } catch (error) {
    return { success: false, message: toApiError(error).message };
  }
};

// 회원가입
export const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
  try {
    await signupApi(name, email, password);
    const payload = await loginApi(email, password);
    saveSessionFromApi(payload, email, name);
    return { success: true };
  } catch (error) {
    return { success: false, message: toApiError(error).message };
  }
};

// Access Token 비동기 갱신 (쿠키의 Refresh Token을 이용해 백엔드에서 갱신된 Access Token을 받아옴)
export const refreshAccessTokenAsync = async (): Promise<AuthResult> => {
  try {
    const payload = await refreshTokenApi(); // 백엔드에서 쿠키를 읽어 새 토큰을 응답
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return { success: false, message: "사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요." };
    }
    
    saveSessionFromApi(payload, currentUser.email, currentUser.name);
    return { success: true };
  } catch (error) {
    removeSessionStorage(); // 갱신 실패 시 세션 초기화
    return { success: false, message: toApiError(error).message };
  }
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await logoutApi();
  } catch {
    // 토큰이 이미 만료되어 백엔드 로그아웃이 실패하더라도 로컬 세션은 반드시 지웁니다.
  } finally {
    removeSessionStorage();
  }
};

// 이메일 인증 코드 요청
export const requestSignupVerificationCode = async (email: string): Promise<AuthResult> => {
  try {
    console.log("📨 회원가입 인증 코드 요청 시작:", email);
    console.log("🔗 API Endpoint:", `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/mail/send`);
    await sendVerificationCodeApi(email);
    console.log("✅ 인증 코드 요청 성공");
    return { success: true };
  } catch (error) {
    console.error("❌ 인증 코드 요청 실패:", error);
    const apiError = toApiError(error);
    console.error("상세 에러:", apiError);
    return { success: false, message: apiError.message };
  }
};

// 이메일 인증 코드 확인
export const verifySignupCode = async (email: string, code: string): Promise<AuthResult> => {
  try {
    console.log("✔️ 회원가입 인증 코드 검증 시작:", { email, code });
    const result = await verifyEmailCodeApi(email, code);
    console.log("검증 결과:", result);
    return result.verified ? { success: true } : { success: false, message: result.message };
  } catch (error) {
    console.error("❌ 인증 코드 검증 실패:", error);
    const apiError = toApiError(error);
    console.error("상세 에러:", apiError);
    return { success: false, message: apiError.message };
  }
};

// HTTP 클라이언트용 토큰 Getter 설정
setAuthTokenGetter(getAccessToken);