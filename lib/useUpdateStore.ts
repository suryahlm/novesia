import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UpdateStoreState {
  /**
   * Timestamp terakhir user menekan "Nanti", di-key per-versionCode Play Store.
   * Di-key per versi agar rilis versi BARU berikutnya tetap menampilkan prompt
   * meskipun versi sebelumnya sedang di-snooze.
   */
  snoozedVersions: Record<string, number>;
  /** Timestamp terakhir checkForUpdate() dipanggil untuk throttling (UPDATE_CHECK_INTERVAL_MS). */
  lastCheckedAt: number | null;
  snoozeVersion: (storeVersion: string) => void;
  markChecked: () => void;
}

const storage = {
  getItem: AsyncStorage.getItem,
  removeItem: AsyncStorage.removeItem,
  setItem: (key: string, value: string) =>
    AsyncStorage.setItem(key, value).catch((err) => {
      if (__DEV__) console.warn('[useUpdateStore] gagal menulis storage', err);
    }),
};

export const useUpdateStore = create<UpdateStoreState>()(
  persist(
    (set) => ({
      snoozedVersions: {},
      lastCheckedAt: null,
      snoozeVersion: (storeVersion) =>
        set((s) => ({ snoozedVersions: { ...s.snoozedVersions, [storeVersion]: Date.now() } })),
      markChecked: () => set({ lastCheckedAt: Date.now() }),
    }),
    {
      name: 'novesia-update-store',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (_state, error) => {
        if (__DEV__ && error) console.warn('[useUpdateStore] gagal rehydrate', error);
      },
    }
  )
);
