import { apiClient } from "./httpClient";

export type CounselingSessionSummary = {
  sessionId: number;
  counselingType: string;
  topic: string;
  startedAt: string;
  endedAt: string;
};

export type CounselingReportDetail = {
  topic: string;
  startedAt: string;
  endedAt: string;
  totalTurnCount: number;
  summary: string;
  primaryEmotion: string;
  initialEmotion: string;
  finalEmotion: string;
  strengths: string;
  actionItems: string;
  keywords: string;
  stageDetails: StageDetail[];
  issuedAt: string;
};

export type SessionTicketResponse = {
  ticketId: string;
};

export type StageDetail = {
  step: number;
  content: string;
  emotionFlow: string[];
};

export type PageResponse<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

function isSessionTicketResponse(data: unknown): data is SessionTicketResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "ticketId" in data &&
    typeof (data as { ticketId?: unknown }).ticketId === "string" &&
    (data as { ticketId: string }).ticketId.trim().length > 0
  );
}

export async function startCounselingSessionApi(): Promise<SessionTicketResponse> {
  const response = await apiClient.post<unknown>("/counseling/sessions");
  if (!isSessionTicketResponse(response.data)) {
    throw new Error("상담 입장권 응답 형식이 올바르지 않습니다.");
  }
  return response.data;
}

export async function listCounselingSessionsApi(
  page = 0,
  size = 10,
  direction: "ASC" | "DESC" = "DESC"
): Promise<PageResponse<CounselingSessionSummary>> {
  const response = await apiClient.get<PageResponse<CounselingSessionSummary>>("/counseling/sessions", {
    params: { page, size, direction },
  });
  return response.data;
}

export async function getCounselingReportDetailApi(sessionId: number): Promise<CounselingReportDetail> {
  const response = await apiClient.get<CounselingReportDetail>(`/counseling/sessions/${sessionId}/report`);
  return response.data;
}

export async function deleteCounselingSessionApi(sessionId: number): Promise<string> {
  const response = await apiClient.delete<string>(`/counseling/sessions/${sessionId}`);
  return typeof response.data === "string" ? response.data : "";
}
