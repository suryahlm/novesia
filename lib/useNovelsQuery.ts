/**
 * useNovelsQuery.ts — Novel data fetching hooks untuk novesia-app
 * Menggantikan Supabase queries dengan novesia-api REST calls.
 * Pola Komiku: React Query dengan staleTime cache.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

export const INFINITE_PAGE_SIZE = 18;

export interface NovelItem {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  cover_landscape_url?: string | null;
  total_chapters: number;
  rating: number | null;
  status: string | null;
  genres?: string[];
  author?: string;
  synopsis?: string;
  synopsis_translated?: string | null;
  total_views?: number;
  source?: string;
  language?: string | null;
  translation_status?: string | null;
  updated_at?: string;
}

// Tipe response dari API yang membungkus array novel
interface NovelsResponse {
  novels?: NovelItem[];
  data?: NovelItem[];
}

/** Normalise response — API bisa return { novels: [...] } atau { data: [...] } */
function extractNovels(res: NovelsResponse | NovelItem[]): NovelItem[] {
  if (Array.isArray(res)) return res;
  return res.novels || res.data || [];
}

// ─── Fetch functions ─────────────────────────────────────────────────────────

export async function fetchAllNovels(): Promise<NovelItem[]> {
  try {
    const res = await apiGet<NovelsResponse>('/api/novels', {
      sort: 'rating',
      limit: 100,
    });
    return extractNovels(res);
  } catch (e) {
    console.error('fetchAllNovels error:', e);
    return [];
  }
}

export async function fetchLatestNovelsList(): Promise<NovelItem[]> {
  try {
    const res = await apiGet<NovelsResponse>('/api/novels/latest', {
      limit: 100,
    });
    return extractNovels(res);
  } catch (e) {
    console.error('fetchLatestNovelsList error:', e);
    return [];
  }
}

export async function fetchNovelDetail(slug: string): Promise<NovelItem | null> {
  try {
    const data = await apiGet<NovelItem>(`/api/novels/${slug}`);
    return data;
  } catch (e) {
    console.error('fetchNovelDetail error:', e);
    return null;
  }
}

/**
 * Fisher-Yates shuffle untuk mengocok acak N item dari pool (Pola Komiku)
 */
function shuffleSample<T>(array: T[], size: number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, size);
}

/**
 * Fetch Hero Banner Novel (Pola Komiku: Smart Random 10 dari Top 60 Rating & Cover Valid)
 */
export async function fetchFeaturedBanner(lang: string = 'all'): Promise<NovelItem[]> {
  try {
    const params: Record<string, string | number> = {
      sort: 'rating',
      limit: 60,
    };
    if (lang === 'id') {
      params['translation_status'] = 'id_translated';
    }

    const res = await apiGet<NovelsResponse>('/api/novels/featured', params);
    const data = extractNovels(res);

    if (!data || data.length === 0) return [];

    // Prioritaskan novel dengan cover landscape (Pola Komiku)
    const withLandscape = data.filter((n) => Boolean(n.cover_landscape_url));
    const withoutLandscape = data.filter((n) => !n.cover_landscape_url);

    const shuffledLandscape = shuffleSample(withLandscape, withLandscape.length);
    const needed = 10 - shuffledLandscape.length;
    const shuffledOthers = needed > 0 ? shuffleSample(withoutLandscape, needed) : [];

    return [...shuffledLandscape, ...shuffledOthers].slice(0, 10);
  } catch (err) {
    console.error('fetchFeaturedBanner error:', err);
    return [];
  }
}

export async function fetchIndonesianNovels(): Promise<NovelItem[]> {
  try {
    const res = await apiGet<NovelsResponse>('/api/novels', {
      translation_status: 'id_translated',
      sort: 'updated',
      limit: 100,
    });
    return extractNovels(res);
  } catch (e) {
    console.error('fetchIndonesianNovels error:', e);
    return [];
  }
}

export async function fetchPopularNovelsPage(
  page: number = 1,
  pageSize: number = INFINITE_PAGE_SIZE
): Promise<NovelItem[]> {
  try {
    const res = await apiGet<NovelsResponse>('/api/novels', {
      sort: 'rating',
      limit: pageSize,
      page,
    });
    return extractNovels(res);
  } catch (e) {
    console.error('fetchPopularNovelsPage error:', e);
    return [];
  }
}

export async function fetchLatestNovelsPage(
  page: number = 1,
  pageSize: number = INFINITE_PAGE_SIZE
): Promise<NovelItem[]> {
  try {
    const res = await apiGet<NovelsResponse>('/api/novels/latest', {
      limit: pageSize,
      page,
    });
    return extractNovels(res);
  } catch (e) {
    console.error('fetchLatestNovelsPage error:', e);
    return [];
  }
}

// ─── React Query Hooks ────────────────────────────────────────────────────────

/**
 * Hook Banner Hero — staleTime Infinity agar carousel tidak reshuffle saat ganti tab
 */
export function useFeaturedBanner(lang: string = 'all') {
  return useQuery({
    queryKey: ['novels', 'featured-banner', lang],
    queryFn: () => fetchFeaturedBanner(lang),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });
}

/** Hook Novel Populer — staleTime 5 Menit */
export function usePopularNovels() {
  return useQuery({
    queryKey: ['novels', 'popular'],
    queryFn: fetchAllNovels,
    staleTime: 1000 * 60 * 5,
  });
}

/** Hook Update Novel Terbaru — staleTime 5 Menit */
export function useLatestNovels() {
  return useQuery({
    queryKey: ['novels', 'latest'],
    queryFn: fetchLatestNovelsList,
    staleTime: 1000 * 60 * 5,
  });
}

/** Hook Detail Novel — staleTime 5 Menit */
export function useNovelDetail(slug: string) {
  return useQuery({
    queryKey: ['novel', slug],
    queryFn: () => fetchNovelDetail(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}

/** Hook Novel Terjemahan Bahasa Indonesia */
export function useIndonesianNovels() {
  return useQuery({
    queryKey: ['novels', 'indonesian'],
    queryFn: fetchIndonesianNovels,
    staleTime: 1000 * 60 * 5,
  });
}

/** Hook Infinite Scroll — Populer */
export function usePopularNovelsInfinite() {
  return useInfiniteQuery({
    queryKey: ['novels', 'popular', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      fetchPopularNovelsPage(pageParam as number, INFINITE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage: NovelItem[], _pages, lastPageParam) =>
      lastPage.length < INFINITE_PAGE_SIZE ? undefined : (lastPageParam as number) + 1,
  });
}

/** Hook Infinite Scroll — Terbaru */
export function useLatestNovelsInfinite() {
  return useInfiniteQuery({
    queryKey: ['novels', 'latest', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      fetchLatestNovelsPage(pageParam as number, INFINITE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage: NovelItem[], _pages, lastPageParam) =>
      lastPage.length < INFINITE_PAGE_SIZE ? undefined : (lastPageParam as number) + 1,
  });
}
