/**
 * App Config — fetches reward/ad settings from Supabase (nu_app_config table).
 * Falls back to defaults if fetch fails.
 * Caches config in AsyncStorage for 1 hour.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface AppConfig {
  daily_checkin_rewards: number[];
  referral_bonus: number;
  watch_ad_reward: number;
  ad_interval_chapters: number;
}

const DEFAULT_CONFIG: AppConfig = {
  daily_checkin_rewards: [10, 20, 30, 40, 50, 60, 70],
  referral_bonus: 50,
  watch_ad_reward: 40,
  ad_interval_chapters: 5,
};

const CACHE_KEY = 'novesia_app_config';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

let cachedConfig: AppConfig | null = null;

export async function getAppConfig(): Promise<AppConfig> {
  // Return memory cache if available
  if (cachedConfig) return cachedConfig;

  try {
    // Check AsyncStorage cache
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (stored) {
      const { config, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < CACHE_TTL) {
        cachedConfig = config;
        return config;
      }
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('nu_app_config')
      .select('key, value');

    if (error || !data) throw error;

    const config = { ...DEFAULT_CONFIG };
    for (const row of data) {
      try {
        (config as any)[row.key] = JSON.parse(row.value);
      } catch {
        (config as any)[row.key] = row.value;
      }
    }

    // Cache it
    cachedConfig = config;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      config,
      timestamp: Date.now(),
    }));

    return config;
  } catch {
    // Fallback to defaults
    return DEFAULT_CONFIG;
  }
}

// Force refresh (used after pull-to-refresh etc.)
export function clearConfigCache() {
  cachedConfig = null;
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
}
