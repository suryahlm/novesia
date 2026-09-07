// Ad Unit ID interstitial AdMob Android untuk Novesia.
// Di-hardcode (bukan import TestIds dari react-native-google-mobile-ads) SENGAJA — package itu
// adalah native module, sekadar mengimpornya di top level bisa menyebabkan crash di Expo Go
// (sama persis dengan pola di app Komiku).
// Nilai default: Google AdMob Official Interstitial Test ID (Android).
// Saat rilis produksi, bisa diganti dengan ID AdMob unit resmi dari console AdMob atau via env.
export const CHAPTER_INTERSTITIAL_AD_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712';

// Jeda minimum antar-tampil iklan interstitial per device (BUKAN per novel/chapter) —
// agar pembaca tidak terganggu iklan setiap buka bab baru, hanya tampil sekali per 30 menit.
export const AD_COOLDOWN_MS = 30 * 60 * 1000;

// Durasi pemberitahuan "Iklan berikutnya tampil 30 menit lagi" tampil SEBELUM iklan mulai
// di-load — cukup untuk terbaca sekilas tanpa menghalangi kenyamanan membaca.
export const AD_NOTICE_DURATION_MS = 1800;

export const AD_NOTICE_MESSAGE = 'Iklan berikutnya tampil 30 menit lagi';

// Device ID pengujian AdMob agar interaksi/klik saat testing tidak dianggap invalid traffic oleh Google.
export const AD_TEST_DEVICE_IDS = ['9a523031-4b33-4dea-b428-10ca1ad1abe1'];
