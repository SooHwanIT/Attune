import { apiClient } from "./httpClient";

export type ContentResponse = {
  id: number;
  title: string;
  briefDescription: string;
  keywords: string[];
  description: string;
  createdAt: string;
};

export type ContentCreateRequest = {
  title: string;
  briefDescription: string;
  keywords: string[];
  description: string;
};

export async function listContentsApi(): Promise<ContentResponse[]> {
  const response = await apiClient.get<ContentResponse[]>("/contents");
  return response.data;
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
