/**
 * novelRequestService.ts
 * Layanan client untuk mengirimkan permohonan judul novel baru dari mobile app ke backend novesia-api.
 */
import { apiPost } from './apiClient';

export interface NovelRequestPayload {
  title: string;
  author?: string | null;
  sourceUrl?: string | null;
  language?: string | null;
  notes?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

export interface NovelRequestItemData {
  id: string;
  title: string;
  author: string | null;
  sourceUrl: string | null;
  language: string | null;
  notes: string | null;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  requestCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NovelRequestResponse {
  success: boolean;
  message: string;
  data?: NovelRequestItemData;
}

/**
 * Kirimkan permohonan novel baru ke server
 */
export async function sendNovelRequest(
  payload: NovelRequestPayload
): Promise<NovelRequestResponse> {
  return await apiPost<NovelRequestResponse>('/api/novel-requests', payload);
}
