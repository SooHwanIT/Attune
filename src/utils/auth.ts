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
const KNOWN_USERS_KEY = "knownUsers";
const DEMO_USERS_KEY = "demoUsers";

const ACCESS_TOKEN_EXPIRY = 1; // 1시간
const REFRESH_TOKEN_EXPIRY = 7 * 24; // 7일

const USE_BACKEND_AUTH = import.meta.env.VITE_USE_BACKEND_AUTH === "true";
const ALLOW_DEMO_AUTH_FALLBACK = import.meta.env.VITE_ALLOW_DEMO_AUTH_FALLBACK !== "false";

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

type DemoUserRecord = User & { password: string };
type KnownUserRecord = User & { password?: string };

const DEMO_USERS: DemoUserRecord[] = [
  { id: "1", email: "demo@attune.com", password: "demo1234", name: "SuHwan", avatar: "🧑‍💻" },
  { id: "2", email: "test@attune.com", password: "test1234", name: "SuHwan", avatar: "👤" },
];

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createDemoToken(user: Pick<User, "id" | "email" | "name" | "avatar">, expiresInHours: number): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    iat: issuedAt,
    exp: issuedAt + expiresInHours * 3600,
  };

  return `${base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }))}.${base64UrlEncode(JSON.stringify(payload))}.`;
}

function safeParseDemoUsers(value: string | null): DemoUserRecord[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStoredDemoUsers(): DemoUserRecord[] {
  return safeParseDemoUsers(localStorage.getItem(DEMO_USERS_KEY));
}

function safeParseKnownUsers(value: string | null): KnownUserRecord[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getKnownUsers(): KnownUserRecord[] {
  return safeParseKnownUsers(localStorage.getItem(KNOWN_USERS_KEY));
}

function saveKnownUsers(users: KnownUserRecord[]): void {
  localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(users));
}

function saveStoredDemoUsers(users: DemoUserRecord[]): void {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function getAllDemoUsers(): DemoUserRecord[] {
  return [...DEMO_USERS, ...getStoredDemoUsers()];
}

function buildFallbackName(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  return localPart || email;
}

function saveKnownUserProfile(user: KnownUserRecord): void {
  const users = getKnownUsers();
  const filtered = users.filter((item) => item.email.toLowerCase() !== user.email.toLowerCase());
  saveKnownUsers([...filtered, user]);
}

function loadKnownUserProfile(email: string): KnownUserRecord | null {
  const normalizedEmail = email.toLowerCase();
  const userFromKnown = getKnownUsers().find((item) => item.email.toLowerCase() === normalizedEmail);
  if (userFromKnown) return userFromKnown;

  const userFromDemo = getAllDemoUsers().find((item) => item.email.toLowerCase() === normalizedEmail);
  return userFromDemo ?? null;
}

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

function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 > Date.now();
}

function setSession(user: User, accessToken: string, refreshToken?: string, accessHours = ACCESS_TOKEN_EXPIRY, refreshHours = REFRESH_TOKEN_EXPIRY): void {
  const accessTokenExpiry = Date.now() + accessHours * 3600 * 1000;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(`${accessToken}_expiry`, accessTokenExpiry.toString());
  saveKnownUserProfile(user);

  if (!USE_BACKEND_AUTH && refreshToken) {
    const refreshTokenExpiry = Date.now() + refreshHours * 3600 * 1000;
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem(`${refreshToken}_expiry`, refreshTokenExpiry.toString());
  }
}

function saveSessionFromApi(payload: AuthSessionResponse, email: string, fallbackName?: string): void {
  const knownUser = loadKnownUserProfile(email);
  const user: User = {
    id: knownUser?.id ?? decodeJwtPayload(payload.accessToken)?.sub ?? email,
    email,
    name: knownUser?.name ?? fallbackName ?? buildFallbackName(email),
    avatar: knownUser?.avatar,
  };

  setSession(user, payload.accessToken);
}

function removeSessionStorage(): void {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (accessToken) {
    // refresh cookies are handled by the backend; keep this branch for demo mode compatibility.
    localStorage.removeItem(`${accessToken}_expiry`);
  }
}

function loginLocal(email: string, password: string): AuthResult {
  const user = getAllDemoUsers().find((item) => item.email === email && item.password === password);
  if (!user) {
    return { success: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const sessionUser = { id: user.id, email: user.email, name: user.name, avatar: user.avatar };
  setSession(
    sessionUser,
    createDemoToken(sessionUser, ACCESS_TOKEN_EXPIRY),
    createDemoToken(sessionUser, REFRESH_TOKEN_EXPIRY),
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY
  );
  return { success: true };
}

function signupLocal(name: string, email: string, password: string): AuthResult {
  const exists = getAllDemoUsers().some((item) => item.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { success: false, message: "이미 가입된 이메일입니다." };
  }

  const storedUsers = getStoredDemoUsers();
  const newUser: DemoUserRecord = {
    id: `local-${Date.now()}`,
    email,
    password,
    name,
  };
  saveStoredDemoUsers([...storedUsers, newUser]);

  const sessionUser = { id: newUser.id, email: newUser.email, name: newUser.name };

  setSession(
    sessionUser,
    createDemoToken(sessionUser, ACCESS_TOKEN_EXPIRY),
    createDemoToken(sessionUser, REFRESH_TOKEN_EXPIRY),
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY
  );

  return { success: true };
}

export const getAccessToken = (): string | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;

  if (isTokenValid(token)) {
    return token;
  }

  const result = refreshAccessToken();
  if (result.success) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return null;
};

export const getRefreshToken = (): string | null => null;

export const isLoggedIn = (): boolean => !!getAccessToken() && !!getCurrentUser();

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

// 호환성을 위해 유지: 기존 동기 로그인은 로컬 더미 인증만 수행
export const login = (email: string, password: string): AuthResult => loginLocal(email, password);

export const authenticate = async (email: string, password: string): Promise<AuthResult> => {
  if (USE_BACKEND_AUTH) {
    try {
      const payload = await loginApi(email, password);
      saveSessionFromApi(payload, email);
      return { success: true };
    } catch (error) {
      if (!ALLOW_DEMO_AUTH_FALLBACK) {
        return { success: false, message: toApiError(error).message };
      }
    }
  }

  return loginLocal(email, password);
};

export const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
  if (USE_BACKEND_AUTH) {
    try {
      await signupApi(name, email, password);
      const payload = await loginApi(email, password);
      saveSessionFromApi(payload, email, name);
      return { success: true };
    } catch (error) {
      if (!ALLOW_DEMO_AUTH_FALLBACK) {
        return { success: false, message: toApiError(error).message };
      }
    }
  }

  return signupLocal(name, email, password);
};

export const refreshAccessToken = (): AuthResult => {
  if (USE_BACKEND_AUTH) {
    // 동기 API는 사용할 수 없으므로, 백엔드 모드에서는 재로그인을 유도합니다.
    return { success: false, message: "세션이 만료되어 다시 로그인이 필요합니다." };
  }

  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken || !isTokenValid(refreshToken)) {
    return { success: false, message: "로그인이 만료되었습니다." };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "로그인이 만료되었습니다." };
  }

  const newAccessToken = createDemoToken(currentUser, ACCESS_TOKEN_EXPIRY);
  const accessTokenExpiry = Date.now() + ACCESS_TOKEN_EXPIRY * 3600 * 1000;

  localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
  localStorage.setItem(`${newAccessToken}_expiry`, accessTokenExpiry.toString());

  return { success: true };
};

export const refreshAccessTokenAsync = async (): Promise<AuthResult> => {
  if (!USE_BACKEND_AUTH) {
    return refreshAccessToken();
  }

  try {
    const accessToken = await refreshTokenApi();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "사용자 정보를 찾을 수 없습니다." };
    }
    saveSessionFromApi(accessToken, currentUser.email, currentUser.name);
    return { success: true };
  } catch (error) {
    return { success: false, message: toApiError(error).message };
  }
};

export const logout = async (): Promise<void> => {
  if (USE_BACKEND_AUTH) {
    try {
      await logoutApi();
    } catch {
      // 토큰이 만료된 상태라도 로컬 세션은 반드시 정리합니다.
    }
  }

  removeSessionStorage();
};

export const setLoggedIn = (value: boolean): void => {
  if (value) {
    loginLocal("demo@attune.com", "demo1234");
  } else {
    void logout();
  }
};

export const requestSignupVerificationCode = async (email: string): Promise<AuthResult> => {
  if (!USE_BACKEND_AUTH) {
    return { success: true };
  }

  try {
    await sendVerificationCodeApi(email);
    return { success: true };
  } catch (error) {
    return { success: false, message: toApiError(error).message };
  }
};

export const verifySignupCode = async (email: string, code: string): Promise<AuthResult> => {
  if (!USE_BACKEND_AUTH) {
    return { success: true };
  }

  const result = await verifyEmailCodeApi(email, code);
  return result.verified ? { success: true } : { success: false, message: result.message };
};

setAuthTokenGetter(getAccessToken);


