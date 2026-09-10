import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useRouter } from 'expo-router';

import { registerPushToken } from '../lib/pushService';
import { useAuthStore } from '../lib/useAuthStore';
import { useNotificationSettingsStore } from '../lib/useNotificationSettingsStore';

// expo-notifications memanggil native module langsung saat di-import.
// Gunakan dynamic import agar tidak memicu error di Expo Go tanpa native build.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Hook untuk meminta izin push notifikasi, mendaftarkan FCM device token ke server,
 * dan menangani interaksi saat user mengetuk notifikasi (deep linking).
 * Dipanggil sekali di RootStack (_layout.tsx).
 */
export function usePushRegistration() {
  const authToken = useAuthStore((s) => s.token);
  const notificationsEnabled = useNotificationSettingsStore((s) => s.enabled);
  const router = useRouter();

  // 1. Setup handler & notification channel (khusus Android)
  useEffect(() => {
    if (Platform.OS !== 'android' || isExpoGo) return;

    import('expo-notifications').then((Notifications) => {
      // Izinkan banner notifikasi melayang di atas layar (heads-up)
      // jika fitur notifikasi diaktifkan pengguna
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: notificationsEnabled,
          shouldShowList: notificationsEnabled,
          shouldPlaySound: notificationsEnabled,
          shouldSetBadge: false,
        }),
      });

      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }).catch(() => {});
  }, [notificationsEnabled]);

  // 2. Minta izin & daftarkan FCM device token ke server
  // Dijalankan ulang setiap kali authToken atau status notifikasi berubah
  useEffect(() => {
    if (Platform.OS !== 'android' || isExpoGo || !notificationsEnabled) return;
    const controller = new AbortController();

    (async () => {
      try {
        const Notifications = await import('expo-notifications');

        let settings = await Notifications.getPermissionsAsync();
        if (!settings.granted && settings.canAskAgain) {
          settings = await Notifications.requestPermissionsAsync();
        }
        if (!settings.granted || controller.signal.aborted) return;

        // Ambil token FCM native dari Google Play Services
        const devicePushToken = await Notifications.getDevicePushTokenAsync();
        if (controller.signal.aborted) return;

        await registerPushToken(devicePushToken.data, controller.signal);
      } catch (err: any) {
        if (err?.name !== 'AbortError' && __DEV__) {
          console.warn('[usePushRegistration] Gagal mendaftarkan push token:', err?.message || err);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [authToken]);

  // 3. Listener saat user mengetuk notifikasi (deep link ke novel / chapter)
  useEffect(() => {
    if (isExpoGo) return;
    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    import('expo-notifications').then((Notifications) => {
      if (cancelled) return;
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | { type?: string; slug?: string; novelSlug?: string; chapterId?: string }
          | undefined;

        const targetSlug = data?.slug || data?.novelSlug;
        if (data?.chapterId) {
          router.push(`/read/${data.chapterId}`);
        } else if (targetSlug) {
          router.push(`/novel/${targetSlug}`);
        }
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [router]);
}
