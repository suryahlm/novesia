import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export const INFINITE_PAGE_SIZE = 18;

export interface NovelItem {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
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
}

export async function fetchAllNovels(): Promise<NovelItem[]> {
  const { data, error } = await supabase
    .from('nu_novels')
    .select('id, title, nu_slug, cover_url, total_chapters, rating, status, genres, author, synopsis, synopsis_translated, total_views, source, language, translation_status')
    .eq('is_blacklisted', false)
    .in('status', ['active', 'completed', 'ongoing', 'published'])
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error('Error fetching novels:', error);
    return [];
  }
  return data || [];
}

export async function fetchLatestNovelsList(): Promise<NovelItem[]> {
  const { data, error } = await supabase
    .from('nu_novels')
    .select('id, title, nu_slug, cover_url, total_chapters, rating, status, genres, author, synopsis, synopsis_translated, total_views, source, language, translation_status, updated_at')
    .eq('is_blacklisted', false)
    .in('status', ['active', 'completed', 'ongoing', 'published'])
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching latest novels:', error);
    return [];
  }
  return data || [];
}

export async function fetchNovelDetail(slug: string): Promise<NovelItem | null> {
  const { data, error } = await supabase
    .from('nu_novels')
    .select('*')
    .eq('nu_slug', slug)
    .eq('is_blacklisted', false)
    .in('status', ['active', 'completed', 'ongoing', 'published'])
    .maybeSingle();

  if (error) {
    console.error('Error fetching novel detail:', error);
    return null;
  }
  return data;
}

/**
 * Fisher-Yates shuffle untuk mengocok acak N item dari pool teratas (Pola Komiku)
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
 * Mengambil pool novel berating tinggi yang memiliki cover valid, lalu mengocok 10 novel terpilih.
 */
export async function fetchFeaturedBanner(lang: string = 'all'): Promise<NovelItem[]> {
  try {
    let query = supabase
      .from('nu_novels')
      .select('id, title, nu_slug, cover_url, total_chapters, rating, status, genres, author, synopsis, synopsis_translated, total_views, source, language, translation_status, updated_at')
      .eq('is_blacklisted', false)
      .in('status', ['active', 'completed', 'ongoing', 'published'])
      .gt('total_chapters', 0)
      .not('cover_url', 'is', null);

    if (lang === 'id') {
      query = query
        .or('translation_status.eq.id_translated,synopsis_translated.not.is.null')
        .order('rating', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .limit(60);
    } else {
      query = query
        .order('rating', { ascending: false, nullsFirst: false })
        .order('total_chapters', { ascending: false })
        .limit(60);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching featured banner pool:', error);
      return [];
    }

    if (!data || data.length === 0) return [];
    // Random 10 dari pool top 60 (Pola Komiku)
    return shuffleSample(data, Math.min(10, data.length));
  } catch (err) {
    console.error('Error in fetchFeaturedBanner:', err);
    return [];
  }
}

/**
 * Hook Banner Hero - staleTime Infinity agar carousel tidak reshuffle saat ganti tab (Pola Komiku)
 */
export function useFeaturedBanner(lang: string = 'all') {
  return useQuery({
    queryKey: ['novels', 'featured-banner', lang],
    queryFn: () => fetchFeaturedBanner(lang),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30, // 30 menit cache
  });
}

/**
 * Hook Novel Populer - staleTime 5 Menit (Instant memory cache)
 */
export function usePopularNovels() {
  return useQuery({
    queryKey: ['novels', 'popular'],
    queryFn: fetchAllNovels,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook Update Novel Terbaru - staleTime 5 Menit
 */
export function useLatestNovels() {
  return useQuery({
    queryKey: ['novels', 'latest'],
    queryFn: fetchLatestNovelsList,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook Detail Novel - staleTime 5 Menit
 */
export function useNovelDetail(slug: string) {
  return useQuery({
    queryKey: ['novel', slug],
    queryFn: () => fetchNovelDetail(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook Novel Terjemahan Bahasa Indonesia
 * Menampilkan seluruh novel yang memiliki terjemahan bahasa Indonesia (bahkan sejak 1 chapter)
 */
export async function fetchIndonesianNovels(): Promise<NovelItem[]> {
  const { data, error } = await supabase
    .from('nu_novels')
    .select('id, title, nu_slug, cover_url, total_chapters, rating, status, genres, author, synopsis, synopsis_translated, total_views, source, language, translation_status, updated_at')
    .eq('is_blacklisted', false)
    .in('status', ['active', 'completed', 'ongoing', 'published'])
    .or('translation_status.eq.id_translated,synopsis_translated.not.is.null')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching indonesian novels:', error);
    return [];
  }
  return data || [];
}

export function useIndonesianNovels() {
  return useQuery({
    queryKey: ['novels', 'indonesian'],
    queryFn: fetchIndonesianNovels,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook Infinite Scroll untuk Halaman Lihat Semua (Trending, Populer, Update Terbaru)
 */
export async function fetchPopularNovelsPage(page: number = 1, pageSize: number = INFINITE_PAGE_SIZE): Promise<NovelItem[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from('nu_novels')
    .select('id, title, nu_slug, cover_url, total_chapters, rating, status, genres, author, synopsis, synopsis_translated, total_views, source, language, translation_status')
    .eq('is_blacklisted', false)
    .in('status', ['active', 'completed', 'ongoing', 'published'])
    .order('rating', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching popular novels page:', error);
    return [];
  }
  return data || [];
}

export function usePopularNovelsInfinite() {
  return useInfiniteQuery({
    queryKey: ['novels', 'popular', 'infinite'],
    queryFn: ({ pageParam = 1 }) => fetchPopularNovelsPage(pageParam as number, INFINITE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage: NovelItem[], _pages, lastPageParam) =>
      lastPage.length < INFINITE_PAGE_SIZE ? undefined : (lastPageParam as number) + 1,
  });
}

export async function fetchLatestNovelsPage(page: number = 1, pageSize: number = INFINITE_PAGE_SIZE): Promise<NovelItem[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from('nu_novels')
    .select('id, title, nu_slug, cover_url, total_chapters, rating, status, genres, author, synopsis, synopsis_translated, total_views, source, language, translation_status, updated_at')
    .eq('is_blacklisted', false)
    .in('status', ['active', 'completed', 'ongoing', 'published'])
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching latest novels page:', error);
    return [];
  }
  return data || [];
}

export function useLatestNovelsInfinite() {
  return useInfiniteQuery({
    queryKey: ['novels', 'latest', 'infinite'],
    queryFn: ({ pageParam = 1 }) => fetchLatestNovelsPage(pageParam as number, INFINITE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage: NovelItem[], _pages, lastPageParam) =>
      lastPage.length < INFINITE_PAGE_SIZE ? undefined : (lastPageParam as number) + 1,
  });
}


