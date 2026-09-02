import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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

    // Remove existing if any
    history = history.filter((h) => h.novel_id !== item.novel_id);

    // Add to front
    history.unshift({ ...item, timestamp: Date.now() });

    // Limit to 10
    history = history.slice(0, 10);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Optional: If logged in, sync to Supabase table (nu_reading_history)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('nu_reading_history').upsert({
        user_id: session.user.id,
        novel_id: item.novel_id,
        chapter_id: item.last_chapter_id,
        chapter_number: item.last_chapter,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error('Add History Error:', e);
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
    console.error('Clear History Error:', e);
  }
};
