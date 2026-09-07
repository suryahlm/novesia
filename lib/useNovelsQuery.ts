/**
 * useNovelsQuery.ts — Novel & Chapter data fetching hooks untuk novesia-app
 * Pola Komiku: React Query dengan staleTime cache, timeout abort, dan payload ringkas.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

/**
 * Batas jumlah novel yang diambil di halaman Beranda (Update Terbaru / Populer).
 * Mengurangi limit dari 100 ke 15 memotong payload jaringan hingga ~85%,
 * membuat aplikasi tetap super cepat dan ringan meski di jaringan 3G/lelet.
 */
export const HOME_LIST_LIMIT = 15;
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
  year?: number | null;
  original_status?: string | null;
  updated_at?: string;
}

export interface ChapterItem {
  id: string;
  chapter_number: number;
  chapter_title: string | null;
  translation_status: string;
  word_count_original: number;
  word_count_translated: number;
  created_at?: string;
}

export interface ChapterDetailResponse {
  id: string;
  chapter_number: number;
  chapter_title: string | null;
  content_original: string | null;
  content_translated: string | null;
  word_count_original: number;
  word_count_translated: number;
  novel_id: string;
  novel_slug?: string;
  novel?: { title: string; cover_url: string | null; nu_slug: string };
  prevChapterNum?: number | null;
  nextChapterNum?: number | null;
  prev_chapter?: { id: string; chapter_number: number } | null;
  next_chapter?: { id: string; chapter_number: number } | null;
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

// ─── Fetch Functions ─────────────────────────────────────────────────────────

export async function fetchAllNovels(signal?: AbortSignal, limit = HOME_LIST_LIMIT): Promise<NovelItem[]> {
  const res = await apiGet<NovelsResponse>(
    '/api/novels',
    {
      sort: 'rating',
      limit,
    },
    { signal }
  );
  return extractNovels(res);
}

export async function fetchLatestNovelsList(signal?: AbortSignal, limit = HOME_LIST_LIMIT): Promise<NovelItem[]> {
  const res = await apiGet<NovelsResponse>(
    '/api/novels/latest',
    {
      limit,
    },
    { signal }
  );
  return extractNovels(res);
}

export async function fetchIndonesianNovels(signal?: AbortSignal, limit = HOME_LIST_LIMIT): Promise<NovelItem[]> {
  const res = await apiGet<NovelsResponse>(
    '/api/novels',
    {
      translation_status: 'id_translated',
      sort: 'updated',
      limit,
    },
    { signal }
  );
  return extractNovels(res);
}

export async function fetchNovelDetail(slug: string, signal?: AbortSignal): Promise<NovelItem> {
  return await apiGet<NovelItem>(`/api/novels/${slug}`, undefined, { signal });
}

export async function fetchNovelChapters(slug: string, limit = 2000, signal?: AbortSignal): Promise<ChapterItem[]> {
  const res = await apiGet<{ chapters?: ChapterItem[]; data?: ChapterItem[] }>(
    `/api/chapters/${slug}`,
    { limit },
    { signal }
  );
  return res.chapters || res.data || (Array.isArray(res) ? (res as any) : []);
}

export async function fetchChapterById(chapterId: string, signal?: AbortSignal): Promise<ChapterDetailResponse> {
  return await apiGet<ChapterDetailResponse>(`/api/chapters/by-id/${chapterId}`, undefined, { signal });
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
 * Fetch Hero Banner Novel (Pola Komiku: Smart Random 10 dari Top 20 Rating & Cover Valid)
 */
export async function fetchFeaturedBanner(lang: string = 'all', signal?: AbortSignal): Promise<NovelItem[]> {
  const params: Record<string, string | number> = {
    sort: 'rating',
    limit: 20, // Ringan: hanya minta 20 item untuk pool random banner
  };
  if (lang === 'id') {
    params['translation_status'] = 'id_translated';
  }

  const res = await apiGet<NovelsResponse>('/api/novels/featured', params, { signal });
  const data = extractNovels(res);

  if (!data || data.length === 0) return [];

  // Prioritaskan novel dengan cover landscape (Pola Komiku)
  const withLandscape = data.filter((n) => Boolean(n.cover_landscape_url));
  const withoutLandscape = data.filter((n) => !n.cover_landscape_url);

  const shuffledLandscape = shuffleSample(withLandscape, withLandscape.length);
  const needed = 10 - shuffledLandscape.length;
  const shuffledOthers = needed > 0 ? shuffleSample(withoutLandscape, needed) : [];

  return [...shuffledLandscape, ...shuffledOthers].slice(0, 10);
}

export async function fetchPopularNovelsPage(
  page: number = 1,
  pageSize: number = INFINITE_PAGE_SIZE,
  signal?: AbortSignal
): Promise<NovelItem[]> {
  const res = await apiGet<NovelsResponse>(
    '/api/novels',
    {
      sort: 'rating',
      limit: pageSize,
      page,
    },
    { signal }
  );
  return extractNovels(res);
}

export async function fetchLatestNovelsPage(
  page: number = 1,
  pageSize: number = INFINITE_PAGE_SIZE,
  signal?: AbortSignal
): Promise<NovelItem[]> {
  const res = await apiGet<NovelsResponse>(
    '/api/novels/latest',
    {
      limit: pageSize,
      page,
    },
    { signal }
  );
  return extractNovels(res);
}

// ─── React Query Hooks ────────────────────────────────────────────────────────

/**
 * Hook Banner Hero — staleTime Infinity agar carousel tidak reshuffle saat ganti tab
 */
export function useFeaturedBanner(lang: string = 'all') {
  return useQuery({
    queryKey: ['novels', 'featured-banner', lang],
    queryFn: ({ signal }) => fetchFeaturedBanner(lang, signal),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });
}

/** Hook Novel Populer — staleTime 5 Menit */
export function usePopularNovels() {
  return useQuery({
    queryKey: ['novels', 'popular'],
    queryFn: ({ signal }) => fetchAllNovels(signal, HOME_LIST_LIMIT),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/** Hook Update Novel Terbaru — staleTime 5 Menit */
export function useLatestNovels() {
  return useQuery({
    queryKey: ['novels', 'latest'],
    queryFn: ({ signal }) => fetchLatestNovelsList(signal, HOME_LIST_LIMIT),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/** Hook Novel Terjemahan Bahasa Indonesia — staleTime 5 Menit */
export function useIndonesianNovels() {
  return useQuery({
    queryKey: ['novels', 'indonesian'],
    queryFn: ({ signal }) => fetchIndonesianNovels(signal, HOME_LIST_LIMIT),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook Detail Novel — staleTime 5 Menit (Pola Komiku).
 * Membuka kembali novel yang sama dalam 5 menit langsung instan 0ms tanpa loading spinner.
 */
export function useNovelDetail(slug: string) {
  return useQuery({
    queryKey: ['novel', slug],
    queryFn: ({ signal }) => fetchNovelDetail(slug, signal),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook Daftar Bab Novel — staleTime 5 Menit.
 * Berjalan paralel bersama detail novel sehingga UI tidak terblokir.
 */
export function useNovelChapters(slug: string, limit = 2000) {
  return useQuery({
    queryKey: ['novel-chapters', slug, limit],
    queryFn: ({ signal }) => fetchNovelChapters(slug, limit, signal),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook Konten Bab Novel — staleTime 24 Jam (Pola Komiku).
 * Bab yang sudah diambil disimpan di memory cache, sehingga navigasi maju/mundur
 * antar-bab terasa instan tanpa spinner.
 */
export function useChapterDetail(chapterId: string) {
  return useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: ({ signal }) => fetchChapterById(chapterId, signal),
    enabled: Boolean(chapterId),
    staleTime: 1000 * 60 * 60 * 24, // Konten bab bersifat permanen
    gcTime: 1000 * 60 * 60, // Cache bertahan di memori 1 jam
  });
}

/** Hook Infinite Scroll — Populer */
export function usePopularNovelsInfinite(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ['novels', 'popular', 'infinite'],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchPopularNovelsPage(pageParam as number, INFINITE_PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage: NovelItem[] | undefined, _pages, lastPageParam) =>
      !Array.isArray(lastPage) || lastPage.length < INFINITE_PAGE_SIZE
        ? undefined
        : (lastPageParam as number) + 1,
    enabled: options?.enabled ?? true,
  });
}

/** Hook Infinite Scroll — Terbaru */
export function useLatestNovelsInfinite(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ['novels', 'latest', 'infinite'],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchLatestNovelsPage(pageParam as number, INFINITE_PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage: NovelItem[] | undefined, _pages, lastPageParam) =>
      !Array.isArray(lastPage) || lastPage.length < INFINITE_PAGE_SIZE
        ? undefined
        : (lastPageParam as number) + 1,
    enabled: options?.enabled ?? true,
  });
}
