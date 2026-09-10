/**
 * commentService.ts — Novesia App Comment Service
 * Menghubungkan aplikasi mobile dengan API komentar terpadu (/api/comments).
 */
import { apiGet, apiPost, apiDelete } from './apiClient';

export interface CommentUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: 'USER' | 'VIP' | 'ADMIN' | null;
}

export interface CommentItemData {
  id: string;
  content: string;
  target: 'NOVEL' | 'CHAPTER';
  novel_id?: string | null;
  novelId?: string | null;
  chapter_id?: string | null;
  chapterId?: string | null;
  chapter_number?: number | null;
  chapterNumber?: number | null;
  parent_id?: string | null;
  parentId?: string | null;
  likes_count: number;
  likesCount: number;
  user_id?: string | null;
  userId?: string | null;
  user_name: string;
  userName: string;
  user_avatar?: string | null;
  userAvatar?: string | null;
  user_email?: string | null;
  userEmail?: string | null;
  created_at: string;
  createdAt: string;
  user?: CommentUser | null;
  replies_count?: number;
  replies?: CommentItemData[];
}

export interface CommentsFetchResponse {
  comments: CommentItemData[];
  rows: CommentItemData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FetchCommentsParams {
  novelId?: string;
  novelSlug?: string;
  chapterId?: string;
  chapterNumber?: number;
  target?: 'NOVEL' | 'CHAPTER';
  parentId?: string | null;
  sort?: 'newest' | 'popular';
  page?: number;
  limit?: number;
}

/**
 * Fetch daftar komentar (Novel atau Chapter)
 */
export async function fetchComments(params: FetchCommentsParams): Promise<CommentsFetchResponse> {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params.novelId) queryParams.novelId = params.novelId;
  if (params.novelSlug) queryParams.novelSlug = params.novelSlug;
  if (params.chapterId) queryParams.chapterId = params.chapterId;
  if (params.chapterNumber !== undefined && params.chapterNumber !== null) {
    queryParams.chapterNumber = params.chapterNumber;
  }
  if (params.target) queryParams.target = params.target;
  if (params.parentId !== undefined) {
    queryParams.parentId = params.parentId === null ? 'null' : params.parentId;
  }
  if (params.sort) queryParams.sort = params.sort;
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;

  try {
    const data = await apiGet<CommentsFetchResponse>('/api/comments', queryParams);
    return (
      data || {
        comments: [],
        rows: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 15,
        hasMore: false,
      }
    );
  } catch (err) {
    console.warn('[commentService] fetchComments error:', err);
    return {
      comments: [],
      rows: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 15,
      hasMore: false,
    };
  }
}

/**
 * Kirim komentar baru atau balasan
 */
export async function sendComment(body: {
  novelId?: string;
  novelSlug?: string;
  chapterId?: string;
  chapterNumber?: number;
  target?: 'NOVEL' | 'CHAPTER';
  parentId?: string | null;
  content: string;
  userName?: string;
}): Promise<CommentItemData> {
  return await apiPost<CommentItemData>('/api/comments', body);
}

/**
 * Beri like / upvote komentar
 */
export async function likeComment(
  commentId: string
): Promise<{ success: boolean; likesCount: number }> {
  return await apiPost<{ success: boolean; likesCount: number; likes_count?: number }>(
    `/api/comments/${encodeURIComponent(commentId)}/like`
  );
}

/**
 * Hapus komentar (Pemilik atau Admin)
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; deleted: boolean }> {
  return await apiDelete<{ success: boolean; deleted: boolean }>(
    `/api/comments/${encodeURIComponent(commentId)}`
  );
}
