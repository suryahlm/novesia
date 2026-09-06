/**
 * useNotificationsQuery.ts — Notifications hook untuk novesia-app
 * Menggantikan Supabase dengan novesia-api REST calls.
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

export type NotificationType = 'info' | 'warning' | 'maintenance';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target?: 'all' | 'web' | 'app';
  is_active: boolean;
  created_at: string;
}

export async function fetchActiveNotifications(): Promise<AppNotification[]> {
  try {
    const data = await apiGet<AppNotification[]>('/api/notifications', {
      target: 'app',
      active: true,
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('fetchActiveNotifications error:', e);
    return [];
  }
}

/**
 * Hook untuk memuat broadcast notifikasi in-app aktif dari Admin Panel.
 * Sama dengan useAnnouncements di Komiku.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications', 'active'],
    queryFn: fetchActiveNotifications,
    staleTime: 1000 * 60, // 1 menit cache
  });
}
