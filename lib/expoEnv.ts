import { isRunningInExpoGo } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Mendeteksi apakah aplikasi saat ini berjalan di dalam lingkungan Expo Go.
 * SDK 53+: expo-notifications melarang remote notifications di Expo Go dan melempar
 * error jika di-import di Android. Gunakan fungsi ini untuk memproteksi import expo-notifications.
 */
export function isExpoGo(): boolean {
  try {
    if (typeof isRunningInExpoGo === 'function' && isRunningInExpoGo()) {
      return true;
    }
  } catch {}

  try {
    if (Constants.appOwnership === 'expo') {
      return true;
    }
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return true;
    }
    if ((Constants as any)?.expoVersion) {
      return true;
    }
  } catch {}

  return false;
}
