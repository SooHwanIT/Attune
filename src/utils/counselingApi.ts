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
  summary: string;
  primaryEmotion: string;
  feedback: string;
  issuedAt: string;
};

export type SessionTicketResponse = {
  ticketId: string;
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

export async function startCounselingSessionApi(): Promise<SessionTicketResponse> {
  const response = await apiClient.post<SessionTicketResponse>("/counseling/sessions");
  return response.data;
}

export async function listCounselingSessionsApi(page = 0, size = 10): Promise<PageResponse<CounselingSessionSummary>> {
  const response = await apiClient.get<PageResponse<CounselingSessionSummary>>("/counseling/sessions", {
    params: { page, size },
  });
  return response.data;
}

export async function getCounselingReportDetailApi(sessionId: number): Promise<CounselingReportDetail> {
  const response = await apiClient.get<CounselingReportDetail>(`/counseling/sessions/${sessionId}/report`);
  return response.data;
}