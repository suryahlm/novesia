/**
 * forumService.ts — Novesia App Forum Service
 * Menggantikan Supabase direct queries dengan novesia-api REST calls.
 */
import { apiGet, apiPost } from './apiClient';

export interface ForumUser {
  id?: string;
  name: string;
  avatarUrl: string | null;
  role: 'USER' | 'VIP' | 'ADMIN';
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  threadCount: number;
}

export interface ForumThread {
  id: string;
  category_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  user_role: 'USER' | 'VIP' | 'ADMIN';
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  view_count: number;
  post_count: number;
  last_activity_at: string;
  created_at: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  user_role: 'USER' | 'VIP' | 'ADMIN';
  content: string;
  created_at: string;
}

/**
 * Fetch semua kategori forum dengan jumlah thread
 */
export async function fetchForumCategories(): Promise<ForumCategory[]> {
  try {
    const data = await apiGet<ForumCategory[]>('/api/forum/categories');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('fetchForumCategories error:', e);
    return [];
  }
}

/**
 * Fetch threads untuk kategori tertentu berdasarkan slug
 */
export async function fetchCategoryThreads(categorySlug: string): Promise<{
  category: ForumCategory | null;
  threads: ForumThread[];
}> {
  try {
    const data = await apiGet<{ category: ForumCategory; threads: ForumThread[] }>(
      `/api/forum/threads`,
      { categorySlug, limit: 100 }
    );
    return {
      category: data.category || null,
      threads: data.threads || [],
    };
  } catch (e) {
    console.error('fetchCategoryThreads error:', e);
    return { category: null, threads: [] };
  }
}

/**
 * Buat thread baru di forum
 */
export async function createForumThread(params: {
  category_id: string;
  title: string;
  content: string;
  user_name: string;
  user_avatar?: string | null;
  user_role?: 'USER' | 'VIP' | 'ADMIN';
  user_id?: string | null;
}): Promise<ForumThread | null> {
  try {
    const data = await apiPost<ForumThread>('/api/forum/threads', {
      category_id: params.category_id,
      title: params.title.trim(),
      content: params.content.trim(),
      user_name: params.user_name || 'Pembaca Novesia',
      user_avatar: params.user_avatar || null,
      user_role: params.user_role || 'USER',
      user_id: params.user_id || null,
    });
    return data;
  } catch (e) {
    console.error('createForumThread error:', e);
    return null;
  }
}

/**
 * Fetch detail thread beserta balasan
 */
export async function fetchThreadDetail(threadId: string): Promise<{
  thread: ForumThread | null;
  posts: ForumPost[];
}> {
  try {
    const data = await apiGet<{ thread: ForumThread; posts: ForumPost[] }>(
      `/api/forum/threads/${threadId}`
    );
    return {
      thread: data.thread || null,
      posts: data.posts || [],
    };
  } catch (e) {
    console.error('fetchThreadDetail error:', e);
    return { thread: null, posts: [] };
  }
}

/**
 * Buat balasan (post) dalam sebuah thread
 */
export async function createForumPost(params: {
  thread_id: string;
  content: string;
  user_name: string;
  user_avatar?: string | null;
  user_role?: 'USER' | 'VIP' | 'ADMIN';
  user_id?: string | null;
}): Promise<ForumPost | null> {
  try {
    const data = await apiPost<ForumPost>(`/api/forum/threads/${params.thread_id}/posts`, {
      content: params.content.trim(),
      user_name: params.user_name || 'Pembaca Novesia',
      user_avatar: params.user_avatar || null,
      user_role: params.user_role || 'USER',
      user_id: params.user_id || null,
    });
    return data;
  } catch (e) {
    console.error('createForumPost error:', e);
    return null;
  }
}
