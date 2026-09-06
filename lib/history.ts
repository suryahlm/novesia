/**
 * history.ts — Reading history tracking untuk novesia-app
 * Lokal di AsyncStorage. Sync ke novesia-api /api/me/history jika user login.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './useAuthStore';
import { apiPost } from './apiClient';

const HISTORY_KEY = 'novesia_recent_novels';

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
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    let history: HistoryItem[] = raw ? JSON.parse(raw) : [];

    // Hapus entry lama kalau ada
    history = history.filter((h) => h.novel_id !== item.novel_id);

    // Tambahkan ke depan
    history.unshift({ ...item, timestamp: Date.now() });

    // Batasi 10 item
    history = history.slice(0, 10);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Sync ke server jika user login
    const { token, user } = useAuthStore.getState();
    if (token && user) {
      apiPost('/api/me/history', {
        novel_id: item.novel_id,
        chapter_id: item.last_chapter_id,
        chapter_number: item.last_chapter,
      }).catch(() => {
        // Non-blocking — gagal sync tidak apa-apa
      });
    }
  } catch (e) {
    console.error('addHistory error:', e);
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('clearHistory error:', e);
  }
};
