import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export type NotificationType = 'info' | 'warning' | 'maintenance';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_active: boolean;
  created_at: string;
}

export async function fetchActiveNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('nu_notifications')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
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
