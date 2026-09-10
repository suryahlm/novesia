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
  ad_cooldown_minutes: number;
  ad_interstitial_enabled: boolean;
  telegram_link?: string;
  support_email?: string;
  app_version?: string;
  app_version_code?: number;
  min_supported_version_code?: number;
  force_update_enabled?: boolean;
  play_store_url?: string;
  update_changelog?: string;
}

const DEFAULT_CONFIG: AppConfig = {
  daily_checkin_rewards: [10, 20, 30, 40, 50, 60, 70],
  referral_bonus: 50,
  watch_ad_reward: 40,
  ad_interval_chapters: 5,
  ad_cooldown_minutes: 30,
  ad_interstitial_enabled: true,
  telegram_link: 'https://t.me/novesiaforum',
  support_email: 'support@novesia.cc',
  app_version: '1.1.7',
  app_version_code: 17,
  min_supported_version_code: 15,
  force_update_enabled: false,
  play_store_url: 'https://play.google.com/store/apps/details?id=cc.novesia.app',
  update_changelog:
    'Peningkatan stabilitas aplikasi, performa membaca novel lebih lancar, serta penambahan notifikasi rilis bab terbaru secara realtime.',
};

const CACHE_KEY = 'novesia_app_config';
const CACHE_TTL = 10 * 60 * 1000; // 10 menit (agar perubahan di admin cepat tersinkronkan)

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
      if (
        row.key === 'app_version' ||
        row.key === 'telegram_link' ||
        row.key === 'support_email' ||
        row.key === 'play_store_url' ||
        row.key === 'update_changelog'
      ) {
        (config as any)[row.key] = String(row.value);
        continue;
      }
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
