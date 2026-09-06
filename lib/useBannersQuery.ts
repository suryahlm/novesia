/**
 * useBannersQuery.ts — Banner hooks untuk novesia-app
 * Menggantikan Supabase dengan novesia-api REST calls.
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

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
  try {
    const data = await apiGet<HomeBanner[]>('/api/banners', {
      target: 'app',
      active: true,
    });
    const validAppSlots = [1, 2, 3, 4, 5, 6];
    const nowTs = Date.now();

    return (Array.isArray(data) ? data : []).filter((banner) => {
      if (!validAppSlots.includes(Number(banner.slot))) return false;
      if (!banner.image_url) return false;
      if (banner.start_at && new Date(banner.start_at).getTime() > nowTs) return false;
      if (banner.expires_at && new Date(banner.expires_at).getTime() <= nowTs) return false;
      return true;
    });
  } catch (e) {
    console.error('fetchHomeBanners error:', e);
    return [];
  }
}

/**
 * Hook banner carousel beranda (maksimal 3 banner aktif, urut slot 1..3).
 * Sama persis dengan pola Komiku (auto-slide 3.5 detik, buka link pada tap).
 */
export function useHomeBanners() {
  return useQuery({
    queryKey: ['banners', 'home'],
    queryFn: fetchHomeBanners,
    staleTime: 1000 * 60 * 2, // 2 menit cache
  });
}
