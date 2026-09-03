import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

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
    .neq('status', 'draft')
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
    .neq('status', 'draft')
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
    .single();

  if (error) {
    console.error('Error fetching novel detail:', error);
    return null;
  }
  return data;
}

/**
 * Hook Banner Hero - staleTime Infinity agar carousel tidak reshuffle saat ganti tab
 */
export function useFeaturedBanner() {
  return useQuery({
    queryKey: ['novels', 'featured-banner'],
    queryFn: fetchAllNovels,
    staleTime: Infinity,
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
    .neq('status', 'draft')
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

