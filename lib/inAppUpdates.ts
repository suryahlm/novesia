import Constants from 'expo-constants';

// Jeda sebelum prompt update muncul lagi setelah user menekan "Nanti" (update opsional).
// Mencegah prompt muncul setiap saat app dibuka jika update tidak mendesak.
export const UPDATE_SNOOZE_MS = 24 * 60 * 60 * 1000;

// Ambang batas serverPriority (0-10, disetel per rilis di Google Play Console via Publishing API)
// yang menjadikan update WAJIB (immediate update).
// Nilai 4 menyamakan standar native Google Play Core (priority >= 4 memicu flow IMMEDIATE).
export const UPDATE_PRIORITY_FORCE = 4;

// Jeda minimum antar-pengecekan background resume (15 menit agar tidak spam namun tetap responsif)
export const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

// Versi aplikasi yang sedang terpasang di perangkat
export const CURRENT_VERSION_NAME = Constants.expoConfig?.version ?? '1.1.8';
export const CURRENT_VERSION_CODE = Constants.expoConfig?.android?.versionCode ?? 18;

// Package name Android dibaca dari config runtime (app.json) dengan fallback jaring pengaman.
export const ANDROID_PACKAGE_NAME =
  Constants.expoConfig?.android?.package ?? 'cc.novesia.app';
