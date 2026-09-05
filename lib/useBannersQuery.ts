import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface HomeBanner {
  id: string;
  slot: number;
  title: string;
  image_key?: string;
  image_url: string;
  target_url: string | null;
  active: boolean;
  start_at: string | null;
  expires_at: string | null;
}

export async function fetchHomeBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase
    .from('nu_banners')
    .select('*')
    .eq('active', true)
    .lte('slot', 3)
    .order('slot', { ascending: true });

  if (error) {
    console.error('Error fetching home banners:', error);
    return [];
  }

  const nowTs = Date.now();
  return (data || []).filter((banner) => {
    if (!banner.image_url) return false;
    if (banner.start_at && new Date(banner.start_at).getTime() > nowTs) {
      return false;
    }
    if (banner.expires_at && new Date(banner.expires_at).getTime() <= nowTs) {
      return false;
    }
    return true;
  });
}

/**
 * Hook banner carousel beranda (maksimal 3 banner aktif, urut slot 1..3).
 * Sama persis dengan pola Komiku (auto-slide 3.5 detik, buka link eksternal/in-app pada tap).
 */
export function useHomeBanners() {
  return useQuery({
    queryKey: ['banners', 'home'],
    queryFn: fetchHomeBanners,
    staleTime: 1000 * 60 * 2, // 2 menit cache
  });
}
