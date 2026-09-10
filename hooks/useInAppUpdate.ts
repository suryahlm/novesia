import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import {
  ANDROID_PACKAGE_NAME,
  UPDATE_CHECK_INTERVAL_MS,
  UPDATE_PRIORITY_FORCE,
  UPDATE_SNOOZE_MS,
} from '../lib/inAppUpdates';
import { useUpdateStore } from '../lib/useUpdateStore';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Google Play In-App Updates hanya berlaku untuk native Android (Play Core API).
// Dinonaktifkan di Expo Go dan iOS untuk menghindari crash native module.
const isSupported = !isExpoGo && Platform.OS === 'android';

export interface AvailableUpdate {
  storeVersion: string;
  mandatory: boolean;
  daysSinceRelease: number | null;
}

/**
 * Membuka halaman aplikasi di Google Play Store sebagai fallback
 * jika Play Core API menolak menjalankan in-app update langsung.
 */
async function openPlayStore() {
  try {
    await Linking.openURL(`market://details?id=${ANDROID_PACKAGE_NAME}`);
  } catch {
    await Linking.openURL(
      `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`
    ).catch((err) => {
      if (__DEV__) console.warn('[useInAppUpdate] gagal membuka Play Store URL', err);
    });
  }
}

/**
 * Hook untuk mendeteksi pembaruan aplikasi di Google Play Store
 * dan memicu flow native In-App Update.
 */
export function useInAppUpdate() {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);
  const [starting, setStarting] = useState(false);
  const cancelledRef = useRef(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const checkNow = useCallback(async () => {
    if (!isSupported || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const { checkForUpdate } = await import('expo-in-app-updates');
      const result = await checkForUpdate();

      // Tandai throttle check setelah API merespons
      useUpdateStore.getState().markChecked();
      if (cancelledRef.current) return;

      // Jika tidak ada update atau update sedang berjalan di Play Store, lewati prompt
      if (!result.updateAvailable || result.updateInProgress) return;

      const priority = result.serverPriority ?? 0;
      const mandatory = priority >= UPDATE_PRIORITY_FORCE;
      const storeVersion = result.storeVersion;

      // Snooze hanya berlaku untuk update opsional
      if (!mandatory) {
        const snoozedAt = useUpdateStore.getState().snoozedVersions[storeVersion];
        if (snoozedAt && Date.now() - snoozedAt < UPDATE_SNOOZE_MS) return;
      }

      setUpdate({
        storeVersion,
        mandatory,
        daysSinceRelease: result.daysSinceRelease ?? null,
      });
    } catch (err) {
      if (__DEV__) console.warn('[useInAppUpdate] checkForUpdate gagal', err);
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const checkIfDue = () => {
      // Tunggu hingga Zustand store selesai direhidrasi dari AsyncStorage
      if (!useUpdateStore.persist.hasHydrated()) return;
      const { lastCheckedAt } = useUpdateStore.getState();
      if (lastCheckedAt && Date.now() - lastCheckedAt < UPDATE_CHECK_INTERVAL_MS) return;
      checkNow();
    };

    let unsubHydration: (() => void) | undefined;
    if (useUpdateStore.persist.hasHydrated()) {
      checkIfDue();
    } else {
      unsubHydration = useUpdateStore.persist.onFinishHydration(() => checkIfDue());
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      checkIfDue();
    });

    return () => {
      unsubHydration?.();
      sub.remove();
    };
  }, [checkNow]);

  const startUpdate = useCallback(async () => {
    if (!update || starting) return;
    setStarting(true);
    try {
      const { startUpdate: start } = await import('expo-in-app-updates');
      // Coba IMMEDIATE (layar penuh Google Play). Jika tidak diizinkan, coba FLEXIBLE (background).
      const started = (await start(true)) || (await start(false));
      if (!started) {
        await openPlayStore();
      }
    } catch (err) {
      if (__DEV__) console.warn('[useInAppUpdate] startUpdate gagal', err);
      await openPlayStore();
    } finally {
      if (!cancelledRef.current) setStarting(false);
    }
  }, [update, starting]);

  const dismiss = useCallback(() => {
    if (!update || update.mandatory) return;
    useUpdateStore.getState().snoozeVersion(update.storeVersion);
    setUpdate(null);
  }, [update]);

  return { update, starting, startUpdate, dismiss };
}
