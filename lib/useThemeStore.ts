import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AccentId } from './accents';

export type ThemeMode = 'dark' | 'light';

interface ThemeStoreState {
  accentId: AccentId;
  mode: ThemeMode;
  setAccent: (id: AccentId) => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      accentId: 'peridot',
      mode: 'dark',
      setAccent: (accentId) => set({ accentId }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'novesia-theme-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
