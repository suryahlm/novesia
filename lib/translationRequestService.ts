/**
 * translationRequestService.ts
 * Layanan untuk mengajukan permintaan terjemahan Bahasa Indonesia dari aplikasi mobile ke novesia-api.
 */

import { apiPost } from './apiClient';

export interface TranslationRequestPayload {
  novelId?: string;
  novelSlug?: string;
  novelTitle?: string;
  novelCover?: string | null;
  chapterId?: string | null;
  chapterNumber?: number | null;
}

export interface TranslationRequestResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    novel_id: string;
    novel_title: string;
    novel_slug: string;
    request_count: number;
    status: string;
  };
}

/**
 * Kirim permintaan terjemahan Bahasa Indonesia untuk novel atau chapter tertentu.
 */
export async function requestTranslation(
  payload: TranslationRequestPayload
): Promise<TranslationRequestResponse> {
  return apiPost<TranslationRequestResponse>('/api/translation-requests', payload);
}
