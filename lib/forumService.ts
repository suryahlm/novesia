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
      `/api/forum/categories/${encodeURIComponent(categorySlug)}`
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

export const FORUM_CATEGORY_TRANSLATIONS: Record<
  string,
  { en: { name: string; description: string }; id: { name: string; description: string } }
> = {
  'diskusi-novel-umum': {
    id: {
      name: 'Diskusi Novel Umum',
      description: 'Ruang diskusi seputar berbagai judul novel terjemahan di Novesia.',
    },
    en: {
      name: 'General Novel Discussion',
      description: 'Discussion space for translated novel titles on Novesia.',
    },
  },
  'diskusi-umum': {
    id: {
      name: 'Diskusi Umum',
      description: 'Ruang bebas untuk berdiskusi seputar novel, cerita, dan dunia kepenulisan.',
    },
    en: {
      name: 'General Discussion',
      description: 'Open space to discuss novels, stories, and the world of writing.',
    },
  },
  'rekomendasi-novel': {
    id: {
      name: 'Rekomendasi Novel',
      description: 'Bagikan dan temukan rekomendasi novel-novel terbaik dari pembaca lain.',
    },
    en: {
      name: 'Novel Recommendations',
      description: 'Share and discover the best novel recommendations from fellow readers.',
    },
  },
  'rekomendasi-review': {
    id: {
      name: 'Rekomendasi & Review',
      description: 'Bagikan rekomendasi novel terbaik dan ulasan favoritmu.',
    },
    en: {
      name: 'Recommendations & Reviews',
      description: 'Share top novel recommendations and your favorite reviews.',
    },
  },
  'spoiler-dan-teori': {
    id: {
      name: 'Spoiler & Teori',
      description: 'Bahas kelanjutan chapter dan teori cerita tanpa takut merusak kejutan.',
    },
    en: {
      name: 'Spoilers & Theories',
      description: 'Discuss upcoming chapters and story theories without spoiling the fun.',
    },
  },
  'teori-spoiler': {
    id: {
      name: 'Teori & Spoiler',
      description: 'Ruang bahas teori jalan cerita, plot twist, dan spoiler chapter novel.',
    },
    en: {
      name: 'Theories & Spoilers',
      description: 'Space to discuss storyline theories, plot twists, and novel chapter spoilers.',
    },
  },
  'saran-dan-masukan': {
    id: {
      name: 'Saran & Masukan',
      description: 'Kritik, saran, dan ide pengembangan untuk aplikasi dan web Novesia.',
    },
    en: {
      name: 'Feedback & Suggestions',
      description: 'Feedback, suggestions, and development ideas for Novesia app and web.',
    },
  },
  'kritik-saran': {
    id: {
      name: 'Kritik & Saran',
      description: 'Masukan untuk kualitas terjemahan, fitur aplikasi, atau request judul novel baru.',
    },
    en: {
      name: 'Critiques & Suggestions',
      description: 'Feedback on translation quality, app features, or new novel requests.',
    },
  },
  'lounge-santai': {
    id: {
      name: 'Lounge Santai',
      description: 'Ngobrol santai dan kenalan dengan sesama komunitas pembaca Novesia.',
    },
    en: {
      name: 'Casual Lounge',
      description: 'Casual chatter and mingling with the Novesia reader community.',
    },
  },
};

export function getLocalizedCategory(
  category: ForumCategory | null | undefined,
  lang: 'en' | 'id'
): { name: string; description: string | null } {
  if (!category) {
    return {
      name: lang === 'en' ? 'Forum Discussion' : 'Diskusi Forum',
      description: null,
    };
  }

  const translation = FORUM_CATEGORY_TRANSLATIONS[category.slug];
  if (translation) {
    return {
      name: translation[lang]?.name || category.name,
      description: translation[lang]?.description || category.description,
    };
  }

  const entry = Object.values(FORUM_CATEGORY_TRANSLATIONS).find(
    (t) => t.id.name === category.name || t.en.name === category.name
  );
  if (entry) {
    return {
      name: entry[lang]?.name || category.name,
      description: entry[lang]?.description || category.description,
    };
  }

  return {
    name: category.name,
    description: category.description,
  };
}

