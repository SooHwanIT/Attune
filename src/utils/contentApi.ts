import { apiClient } from "./httpClient";

// 목록 조회용 (백엔드 ContentSummaryResponse 매핑)
export type ContentSummaryResponse = {
  id: number;
  title: string;
  briefDescription: string;
  keywords: string[];
  category: string;       // "MINDFULNESS", "SLEEP", ...
  difficulty: string;     // "BEGINNER", "INTERMEDIATE", "ADVANCED"
  durationMinutes: number;
};

// 상세 조회용 (백엔드 ContentResponse 매핑)
export type ContentResponse = {
  id: number;
  title: string;
  briefDescription: string;
  keywords: string[];
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
};

export type ContentCreateRequest = {
  title: string;
  briefDescription: string;
  keywords: string[];
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
};

// 백엔드가 Page<T> 래퍼로 응답할 수 있으므로 배열/페이지 모두 처리
export async function listContentsApi(): Promise<ContentSummaryResponse[]> {
  const response = await apiClient.get("/contents");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return [];
}

export async function getContentDetailApi(contentId: number | string): Promise<ContentResponse> {
  const response = await apiClient.get<ContentResponse>(`/contents/${contentId}`);
  return response.data;
}

export async function createContentApi(data: ContentCreateRequest): Promise<number> {
  const response = await apiClient.post<number>("/contents", data);
  return response.data;
}

export async function deleteContentApi(contentId: number | string): Promise<void> {
  await apiClient.delete(`/contents/${contentId}`);
}
