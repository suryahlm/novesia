import { supabase } from './supabase';

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
 * Fetch all categories with live thread counts from Supabase
 */
export async function fetchForumCategories(): Promise<ForumCategory[]> {
  try {
    const { data: categories, error } = await supabase
      .from('nu_forum_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !categories) {
      console.error('Fetch categories error:', error);
      return [];
    }

    // Get thread counts per category
    const { data: threads, error: countErr } = await supabase
      .from('nu_forum_threads')
      .select('category_id');

    const counts: Record<string, number> = {};
    if (!countErr && threads) {
      threads.forEach((t) => {
        counts[t.category_id] = (counts[t.category_id] || 0) + 1;
      });
    }

    return categories.map((cat) => ({
      ...cat,
      threadCount: counts[cat.id] || 0,
    }));
  } catch (e) {
    console.error('fetchForumCategories error:', e);
    return [];
  }
}

/**
 * Fetch threads for a specific category
 */
export async function fetchCategoryThreads(categorySlug: string): Promise<{
  category: ForumCategory | null;
  threads: ForumThread[];
}> {
  try {
    const { data: category, error: catErr } = await supabase
      .from('nu_forum_categories')
      .select('*')
      .eq('slug', categorySlug)
      .single();

    if (catErr || !category) {
      return { category: null, threads: [] };
    }

    const { data: threads, error: threadErr } = await supabase
      .from('nu_forum_threads')
      .select('*')
      .eq('category_id', category.id)
      .order('pinned', { ascending: false })
      .order('last_activity_at', { ascending: false });

    return {
      category: { ...category, threadCount: threads?.length || 0 },
      threads: threads || [],
    };
  } catch (e) {
    console.error('fetchCategoryThreads error:', e);
    return { category: null, threads: [] };
  }
}

/**
 * Create a new thread
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
    const { data, error } = await supabase
      .from('nu_forum_threads')
      .insert({
        category_id: params.category_id,
        title: params.title.trim(),
        content: params.content.trim(),
        user_name: params.user_name || 'Pembaca Novesia',
        user_avatar: params.user_avatar || null,
        user_role: params.user_role || 'USER',
        user_id: params.user_id || null,
        pinned: false,
        locked: false,
        view_count: 0,
        post_count: 0,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create thread error:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('createForumThread error:', e);
    return null;
  }
}

/**
 * Fetch thread detail along with replies
 */
export async function fetchThreadDetail(threadId: string): Promise<{
  thread: ForumThread | null;
  posts: ForumPost[];
}> {
  try {
    try {
      await supabase.rpc('increment_thread_view', { p_thread_id: threadId });
    } catch {}


    const { data: thread, error: threadErr } = await supabase
      .from('nu_forum_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadErr || !thread) {
      return { thread: null, posts: [] };
    }

    const { data: posts } = await supabase
      .from('nu_forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    return { thread, posts: posts || [] };
  } catch (e) {
    console.error('fetchThreadDetail error:', e);
    return { thread: null, posts: [] };
  }
}

/**
 * Create a reply post in a thread
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
    const { data: post, error } = await supabase
      .from('nu_forum_posts')
      .insert({
        thread_id: params.thread_id,
        content: params.content.trim(),
        user_name: params.user_name || 'Pembaca Novesia',
        user_avatar: params.user_avatar || null,
        user_role: params.user_role || 'USER',
        user_id: params.user_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create post error:', error);
      return null;
    }

    // Update thread last_activity_at and increment post_count
    await supabase
      .from('nu_forum_threads')
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', params.thread_id);

    return post;
  } catch (e) {
    console.error('createForumPost error:', e);
    return null;
  }
}
