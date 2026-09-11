/**
 * history.ts — Reading history tracking untuk novesia-app
 * Multi-account aware & Cloud-synced ke novesia-api (/api/me/history)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './useAuthStore';
import { apiGet, apiPost, apiDelete } from './apiClient';

const LEGACY_HISTORY_KEY = 'novesia_recent_novels';

export const getHistoryKey = (userId?: string | null): string => {
  return userId ? `novesia_recent_novels_${userId}` : 'novesia_recent_novels_guest';
};

export interface HistoryItem {
  novel_id: string;
  title: string;
  cover: string;
  last_chapter: number;
  last_chapter_id: string;
  timestamp: number;
}

export const addHistory = async (item: Omit<HistoryItem, 'timestamp'>) => {
  try {
    const { token, user } = useAuthStore.getState();
    const storageKey = getHistoryKey(user?.id);

    const raw = await AsyncStorage.getItem(storageKey);
    let history: HistoryItem[] = raw ? JSON.parse(raw) : [];

    // Hapus entry lama kalau ada
    history = history.filter((h) => h.novel_id !== item.novel_id);

    // Tambahkan ke depan
    history.unshift({ ...item, timestamp: Date.now() });

    // Batasi 30 item untuk riwayat baca
    history = history.slice(0, 30);

    await AsyncStorage.setItem(storageKey, JSON.stringify(history));

    // Sync ke database server jika user login
    if (token && user) {
      apiPost('/api/me/history', {
        novelId: item.novel_id,
        novel_id: item.novel_id,
        chapterId: item.last_chapter_id,
        chapter_id: item.last_chapter_id,
        chapterNumber: item.last_chapter,
        chapter_number: item.last_chapter,
        chapterTitle: `Chapter ${item.last_chapter}`,
        chapter_title: `Chapter ${item.last_chapter}`,
      }).catch(() => {
        // Non-blocking — offline safe
      });
    }
  } catch (e) {
    console.error('addHistory error:', e);
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const { token, user } = useAuthStore.getState();
    const storageKey = getHistoryKey(user?.id);

    let raw = await AsyncStorage.getItem(storageKey);

    // Migration fallback from legacy key if user storage is empty
    if (!raw) {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_HISTORY_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        await AsyncStorage.setItem(storageKey, legacyRaw);
      }
    }

    let localHistory: HistoryItem[] = raw ? JSON.parse(raw) : [];

    // Jika user login, sinkronisasi dua arah dengan server database
    if (token && user) {
      try {
        const res = await apiGet<{ histories?: any[] }>('/api/me/history', { limit: 30 });
        if (res?.histories && Array.isArray(res.histories)) {
          const serverItems: HistoryItem[] = res.histories
            .map((h) => ({
              novel_id: h.novel_id || h.novel?.id,
              title: h.novel?.title || h.chapter_title || '',
              cover: h.novel?.cover_url || h.novel?.coverUrl || '',
              last_chapter: Number(h.chapter_number) || 1,
              last_chapter_id: h.chapter_id || '',
              timestamp: h.last_read_at ? new Date(h.last_read_at).getTime() : Date.now(),
            }))
            .filter((item) => Boolean(item.novel_id));

          // Merge: utamakan item dengan chapter lebih tinggi atau timestamp lebih baru
          const map = new Map<string, HistoryItem>();

          for (const item of localHistory) {
            if (item.novel_id) map.set(item.novel_id, item);
          }

          for (const serverItem of serverItems) {
            const existing = map.get(serverItem.novel_id);
            if (!existing) {
              map.set(serverItem.novel_id, serverItem);
            } else {
              if (
                serverItem.last_chapter > existing.last_chapter ||
                serverItem.timestamp > existing.timestamp
              ) {
                map.set(serverItem.novel_id, {
                  ...existing,
                  ...serverItem,
                  title: serverItem.title || existing.title,
                  cover: serverItem.cover || existing.cover,
                });
              }
            }
          }

          const merged = Array.from(map.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 30);

          await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
          return merged;
        }
      } catch {
        // Gagal koneksi (offline), kembalikan cache lokal
      }
    }

    return localHistory;
  } catch {
    return [];
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    const { token, user } = useAuthStore.getState();
    const storageKey = getHistoryKey(user?.id);

    await AsyncStorage.removeItem(storageKey);
    await AsyncStorage.removeItem(LEGACY_HISTORY_KEY).catch(() => {});

    if (token && user) {
      apiDelete('/api/me/history').catch(() => {});
    }
  } catch (e) {
    console.error('clearHistory error:', e);
  }
};

export const removeHistoryItem = async (novelId: string): Promise<void> => {
  try {
    const { token, user } = useAuthStore.getState();
    const storageKey = getHistoryKey(user?.id);

    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const history: HistoryItem[] = JSON.parse(raw);
      const updated = history.filter((h) => h.novel_id !== novelId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    }

    if (token && user) {
      apiDelete(`/api/me/history/${novelId}`).catch(() => {});
    }
  } catch (e) {
    console.error('removeHistoryItem error:', e);
  }
};
