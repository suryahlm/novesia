import { Platform } from 'react-native';
import { apiPost } from './apiClient';

/**
 * Mendaftarkan FCM device push token ke backend novesia-api.
 *
 * Catatan:
 * apiPost otomatis menyematkan header Authorization (Bearer token) jika user login,
 * sehingga token terhubung ke akun user. Jika user logout, token tetap terdaftar
 * sebagai anonymous device untuk menerima pesan broadcast.
 */
export async function registerPushToken(
  token: string,
  signal?: AbortSignal
): Promise<void> {
  if (!token) return;
  await apiPost<void>(
    '/api/push-tokens',
    {
      token,
      platform: Platform.OS,
    },
    { signal }
  );
}
