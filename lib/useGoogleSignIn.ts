import { useState } from 'react';
import { Alert, NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { apiPost } from './apiClient';
import { useAuthStore, AuthUser } from './useAuthStore';

// Web Client ID publik untuk OAuth token audience
export const GOOGLE_WEB_CLIENT_ID =
  (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string) ||
  '49249228915-cg9h4c4gl2ud1g9lvm4c5vp3rs3s0op6.apps.googleusercontent.com';

/**
 * Deteksi apakah native module RNGoogleSignin benar-benar terdaftar di binary native saat ini.
 * Mencegah fatal crash "TurboModuleRegistry.getEnforcing: RNGoogleSignin could not be found" di Expo Go
 * atau di development client / simulator tanpa native build.
 */
export function isGoogleSignInSupported(): boolean {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return false;
  }
  // Expo Go tidak memiliki native Google Sign-In binary
  if (
    (Constants as any)?.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return false;
  }
  try {
    if (typeof TurboModuleRegistry?.get === 'function') {
      if (TurboModuleRegistry.get('RNGoogleSignin') != null) {
        return true;
      }
    }
    if ((NativeModules as any)?.RNGoogleSignin != null) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

let configured = false;

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    role: 'USER' | 'VIP' | 'ADMIN';
    vip_until?: string | null;
    banned?: boolean;
    frozen?: boolean;
    created_at?: string;
  };
}

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const isSupported = isGoogleSignInSupported();

  const signIn = async (): Promise<{ success: boolean; error: string | null }> => {
    if (!isGoogleSignInSupported()) {
      Alert.alert(
        'Mode Pengembangan / Expo Go',
        'Login Google Play Services membutuhkan file APK resmi Novesia yang terpasang di perangkat. Di Expo Go, silakan masuk menggunakan email dan kata sandi.'
      );
      return {
        success: false,
        error: 'Login Google memerlukan APK yang terpasang di perangkat.',
      };
    }

    setLoading(true);
    try {
      const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await import(
        '@react-native-google-signin/google-signin'
      );

      if (!configured) {
        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: false,
        });
        configured = true;
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Pastikan session lokal Google direset agar Android selalu memunculkan dialog pilihan akun
      try {
        await GoogleSignin.signOut();
      } catch {
        // Abaikan jika sebelumnya belum ada sesi login
      }
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        setLoading(false);
        return { success: false, error: null }; // Dibatalkan oleh user
      }

      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('Google tidak memberikan token identitas. Silakan coba lagi.');
      }

      // Verifikasi dan sinkronisasi ke novesia-api
      const data = await apiPost<AuthResponse>('/api/auth/google', {
        idToken,
        platform: 'app',
        os: Platform.OS,
      });

      if (data.user.banned) {
        throw new Error('Akun Anda telah dinonaktifkan (diblokir) oleh admin.');
      }
      if (data.user.frozen) {
        throw new Error('Akun Anda sedang dibekukan sementara oleh admin.');
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        avatarUrl: data.user.avatar_url,
        role: data.user.role,
        vipUntil: data.user.vip_until ?? null,
        createdAt: data.user.created_at,
      };

      useAuthStore.getState().setSession(data.token, authUser);
      setLoading(false);
      return { success: true, error: null };
    } catch (err: any) {
      setLoading(false);
      if (isGoogleSignInSupported()) {
        try {
          const { isErrorWithCode, statusCodes } = await import(
            '@react-native-google-signin/google-signin'
          );
          if (isErrorWithCode(err)) {
            if (err.code === statusCodes.SIGN_IN_CANCELLED) {
              return { success: false, error: null };
            }
            if (err.code === statusCodes.IN_PROGRESS) {
              return { success: false, error: 'Proses login sedang berjalan.' };
            }
            if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
              const msg = 'Google Play Services tidak tersedia atau perlu diperbarui.';
              Alert.alert('Gagal Masuk', msg);
              return { success: false, error: msg };
            }
          }
        } catch {
          // Abaikan jika modul error check gagal
        }
      }

      let message = err?.message || 'Gagal masuk dengan Google. Silakan coba lagi.';
      if (typeof message === 'string' && (message.includes('DEVELOPER_ERROR') || err?.code === '10')) {
        message = 'Google OAuth belum dikonfigurasi lengkap di Google Cloud Console (SHA-1 fingerprint atau Client ID belum cocok).';
      }
      Alert.alert('Gagal Masuk', message);
      return { success: false, error: message };
    }
  };

  return { signIn, loading, isSupported, isExpoGo: !isSupported };
}
