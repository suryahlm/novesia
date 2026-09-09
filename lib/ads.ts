// Ad Unit ID interstitial AdMob Android untuk Novesia.
// Di-hardcode (bukan import TestIds dari react-native-google-mobile-ads) SENGAJA — package itu
// adalah native module, sekadar mengimpornya di top level bisa menyebabkan crash di Expo Go
// (sama persis dengan pola di app Komiku).
// Nilai default: Google AdMob Official Interstitial Test ID (Android).
// Saat rilis produksi, bisa diganti dengan ID AdMob unit resmi dari console AdMob atau via env.
export const CHAPTER_INTERSTITIAL_AD_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712';

// Jeda minimum default antar-tampil iklan interstitial per device (fallback jika offline/belum fetch config)
export const DEFAULT_AD_COOLDOWN_MINUTES = 30;
export const AD_COOLDOWN_MS = DEFAULT_AD_COOLDOWN_MINUTES * 60 * 1000;

// Durasi pemberitahuan sebelum iklan mulai di-load (1.8 detik)
export const AD_NOTICE_DURATION_MS = 1800;

// Default English notice message
export const AD_NOTICE_MESSAGE = 'Next ad will appear in 30 minutes';

export function getAdNoticeMessage(minutes: number = DEFAULT_AD_COOLDOWN_MINUTES): string {
  if (minutes <= 1) {
    return 'Next ad will appear in 1 minute';
  }
  return `Next ad will appear in ${minutes} minutes`;
}

// Device ID pengujian AdMob agar interaksi/klik saat testing tidak dianggap invalid traffic oleh Google.
export const AD_TEST_DEVICE_IDS = ['9a523031-4b33-4dea-b428-10ca1ad1abe1'];
