import axios, { AxiosError } from "axios";

export type ApiError = {
  status?: number;
  code?: string;
  message: string;
  details?: unknown;
};

type TokenGetter = () => string | null;

let authTokenGetter: TokenGetter | null = null;

export function setAuthTokenGetter(getter: TokenGetter): void {
  authTokenGetter = getter;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = authTokenGetter?.();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; code?: string; details?: unknown }>;
    return {
      status: axiosError.response?.status,
      code: axiosError.response?.data?.code,
      message: axiosError.response?.data?.message || axiosError.message || "API 요청에 실패했습니다.",
      details: axiosError.response?.data?.details,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "알 수 없는 오류가 발생했습니다." };
}
