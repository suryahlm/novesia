import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettingsState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
}

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      toggleEnabled: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: 'novesia-notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
