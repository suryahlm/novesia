/**
 * Interstitial Ad Hook for Novesia
 * Shows an interstitial ad every N chapters read.
 * 
 * SAFE for Expo Go — gracefully no-ops when native module is unavailable.
 * Only works after EAS Build with react-native-google-mobile-ads.
 * 
 * TODO: Replace TEST Ad Unit IDs with production IDs from AdMob Console
 */
import { useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppConfig } from './appConfig';

// ═══════════════════════════════════════════════════
// 🔧 KONFIGURASI — Ganti dengan Ad Unit ID asli nanti
// ═══════════════════════════════════════════════════
// Ganti dengan: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
const INTERSTITIAL_AD_UNIT_ID = '__TEST_INTERSTITIAL__';

const DEFAULT_INTERVAL = 5;
const COUNTER_KEY = 'novesia_chapter_read_count';

// Lazy-load the ads module — prevents crash in Expo Go
let AdsModule: any = null;
try {
  AdsModule = require('react-native-google-mobile-ads');
} catch {
  // Native module not available (Expo Go) — ads will be disabled
}

/**
 * Hook untuk mengelola interstitial ad setiap N chapter.
 * Interval diambil dari Supabase (nu_app_config) secara dinamis.
 * Safe to use in Expo Go — automatically no-ops when native module is unavailable.
 */
export function useInterstitialAd() {
  const adRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const intervalRef = useRef<number>(DEFAULT_INTERVAL);
  const configLoaded = useRef(false);

  const isAdsAvailable = () => {
    return AdsModule && AdsModule.InterstitialAd && INTERSTITIAL_AD_UNIT_ID !== '__TEST_INTERSTITIAL__';
  };

  const ensureConfig = async () => {
    if (!configLoaded.current) {
      const config = await getAppConfig();
      intervalRef.current = config.ad_interval_chapters || DEFAULT_INTERVAL;
      configLoaded.current = true;
    }
  };

  const loadAd = useCallback(() => {
    if (!isAdsAvailable() || isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const { InterstitialAd, AdEventType } = AdsModule;
      const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);

      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        adRef.current = interstitial;
        isLoadingRef.current = false;
      });

      interstitial.addAdEventListener(AdEventType.ERROR, () => {
        isLoadingRef.current = false;
      });

      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        adRef.current = null;
        loadAd();
      });

      interstitial.load();
    } catch {
      isLoadingRef.current = false;
    }
  }, []);

  const showAd = useCallback(() => {
    if (adRef.current) {
      try { adRef.current.show(); } catch {}
    }
  }, []);

  const onChapterRead = useCallback(async () => {
    try {
      await ensureConfig();

      const stored = await AsyncStorage.getItem(COUNTER_KEY);
      let count = stored ? parseInt(stored, 10) : 0;
      count += 1;

      if (count >= intervalRef.current) {
        await AsyncStorage.setItem(COUNTER_KEY, '0');

        if (!isAdsAvailable()) return;

        if (adRef.current) {
          showAd();
        } else {
          const { InterstitialAd, AdEventType } = AdsModule;
          const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);
          interstitial.addAdEventListener(AdEventType.LOADED, () => interstitial.show());
          interstitial.addAdEventListener(AdEventType.CLOSED, () => loadAd());
          interstitial.addAdEventListener(AdEventType.ERROR, () => {});
          interstitial.load();
        }
      } else {
        await AsyncStorage.setItem(COUNTER_KEY, count.toString());
        if (isAdsAvailable() && !adRef.current && !isLoadingRef.current) {
          loadAd();
        }
      }
    } catch {
      // Never block reading experience
    }
  }, [loadAd, showAd]);

  return { onChapterRead };
}
