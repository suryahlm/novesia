/**
 * appConfig.ts — App Config dari novesia-api (/api/config)
 * Menggantikan Supabase nu_app_config table query.
 * Tetap cache di AsyncStorage 1 jam.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from './apiClient';

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
const CACHE_TTL = 60 * 60 * 1000; // 1 jam

let cachedConfig: AppConfig | null = null;

export async function getAppConfig(): Promise<AppConfig> {
  // Return memory cache jika ada
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

    // Fetch dari novesia-api
    const data = await apiGet<{ configs: { key: string; value: string }[] }>('/api/config');
    const configs = data?.configs || [];

    const config = { ...DEFAULT_CONFIG };
    for (const row of configs) {
      try {
        (config as any)[row.key] = JSON.parse(row.value);
      } catch {
        (config as any)[row.key] = row.value;
      }
    }

    cachedConfig = config;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      config,
      timestamp: Date.now(),
    }));

    return config;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function clearConfigCache() {
  cachedConfig = null;
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
}
