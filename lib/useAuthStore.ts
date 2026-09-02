import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'USER' | 'VIP' | 'ADMIN';
  vipUntil?: string | null;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string | null, user: AuthUser | null) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'novesia-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
