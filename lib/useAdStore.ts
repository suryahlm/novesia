import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdStoreState {
  lastShownAt: number | null;
  markShown: () => void;
}

// Cooldown iklan interstitial device-scoped (bukan per-akun) — lihat useChapterInterstitialAd.ts.
// Persist agar cooldown-nya tetap aktif walau aplikasi di-kill/dibuka ulang dalam 30 menit yang sama.
export const useAdStore = create<AdStoreState>()(
  persist(
    (set) => ({
      lastShownAt: null,
      markShown: () => set({ lastShownAt: Date.now() }),
    }),
    {
      name: 'novesia-ad-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
