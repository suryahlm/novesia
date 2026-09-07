import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DisclaimerState {
  hasAcceptedDisclaimer: boolean;
  acceptDisclaimer: () => void;
}

export const useDisclaimerStore = create<DisclaimerState>()(
  persist(
    (set) => ({
      hasAcceptedDisclaimer: false,
      acceptDisclaimer: () => set({ hasAcceptedDisclaimer: true }),
    }),
    {
      name: 'novesia-disclaimer-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
