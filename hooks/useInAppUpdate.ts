import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import {
  ANDROID_PACKAGE_NAME,
  CURRENT_VERSION_CODE,
  CURRENT_VERSION_NAME,
  UPDATE_CHECK_INTERVAL_MS,
  UPDATE_PRIORITY_FORCE,
  UPDATE_SNOOZE_MS,
} from '../lib/inAppUpdates';
import { useUpdateStore } from '../lib/useUpdateStore';
import { getAppConfig } from '../lib/appConfig';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Google Play In-App Updates hanya berlaku untuk native Android (Play Core API).
// Dinonaktifkan di Expo Go dan iOS untuk menghindari crash native module.
const isSupported = !isExpoGo && Platform.OS === 'android';

export interface AvailableUpdate {
  storeVersion: string;
  mandatory: boolean;
  daysSinceRelease: number | null;
  changelog?: string;
  source: 'play_core' | 'server_api';
}

/**
 * Membuka halaman aplikasi di Google Play Store sebagai fallback
 * jika Play Core API menolak menjalankan in-app update langsung.
 */
export async function openPlayStore() {
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
 * Hook untuk mendeteksi pembaruan aplikasi secara cerdas (Dual-Layer: Play Core + Server API)
 * dan memicu flow native In-App Update atau Play Store.
 */
export function useInAppUpdate() {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);
  const cancelledRef = useRef(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const checkNow = useCallback(async (force = false): Promise<AvailableUpdate | null> => {
    if (!isSupported || checkingRef.current) return null;
    checkingRef.current = true;
    setChecking(true);

    try {
      // 1. Jalankan pengecekan ganda secara paralel: Play Core & Server Config API
      const [playCoreResult, serverConfig] = await Promise.allSettled([
        (async () => {
          try {
            const { checkForUpdate } = await import('expo-in-app-updates');
            return await checkForUpdate();
          } catch {
            return null;
          }
        })(),
        getAppConfig(),
      ]);

      if (cancelledRef.current) return null;

      const playCore = playCoreResult.status === 'fulfilled' ? playCoreResult.value : null;
      const config = serverConfig.status === 'fulfilled' ? serverConfig.value : null;

      // Evaluasi apakah ada update dari Play Core
      const playCoreHasUpdate = Boolean(playCore?.updateAvailable && !playCore?.updateInProgress);

      // Evaluasi apakah ada update dari Server API (/api/config)
      const serverVersionCode = Number(config?.app_version_code) || 0;
      const serverHasUpdate = Boolean(serverVersionCode > CURRENT_VERSION_CODE);

      if (playCoreHasUpdate || serverHasUpdate) {
        const mandatory =
          (playCore?.serverPriority ?? 0) >= UPDATE_PRIORITY_FORCE ||
          Boolean(config?.force_update_enabled) ||
          (config?.min_supported_version_code !== undefined &&
            CURRENT_VERSION_CODE < Number(config.min_supported_version_code));

        const storeVersion =
          config?.app_version ||
          (playCore?.storeVersion && playCore.storeVersion !== String(CURRENT_VERSION_CODE)
            ? playCore.storeVersion
            : CURRENT_VERSION_NAME);

        const changelog = config?.update_changelog;
        const daysSinceRelease = playCore?.daysSinceRelease ?? null;
        const source: 'play_core' | 'server_api' = playCoreHasUpdate ? 'play_core' : 'server_api';

        // Snooze hanya berlaku untuk update opsional jika tidak dipaksa (manual check)
        if (!mandatory && !force) {
          const snoozedAt = useUpdateStore.getState().snoozedVersions[storeVersion];
          if (snoozedAt && Date.now() - snoozedAt < UPDATE_SNOOZE_MS) {
            return null;
          }
        }

        const foundUpdate: AvailableUpdate = {
          storeVersion,
          mandatory,
          daysSinceRelease,
          changelog,
          source,
        };

        setUpdate(foundUpdate);
        useUpdateStore.getState().markChecked();
        return foundUpdate;
      }

      // Jika tidak ada update yang terdeteksi
      useUpdateStore.getState().markChecked();
      setUpdate(null);
      return null;
    } catch (err) {
      if (__DEV__) console.warn('[useInAppUpdate] checkNow gagal', err);
      return null;
    } finally {
      checkingRef.current = false;
      if (!cancelledRef.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const checkIfDue = () => {
      if (!useUpdateStore.persist.hasHydrated()) return;
      const { lastCheckedAt } = useUpdateStore.getState();
      // Periksa jika belum pernah dicek atau sudah melewati interval (15 menit)
      if (lastCheckedAt && Date.now() - lastCheckedAt < UPDATE_CHECK_INTERVAL_MS) return;
      checkNow(false);
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
      // Jika update berasal dari Play Core, coba native bottom sheet Google Play
      if (update.source === 'play_core') {
        try {
          const { startUpdate: start } = await import('expo-in-app-updates');
          const started = (await start(true)) || (await start(false));
          if (!started) {
            await openPlayStore();
          }
          return;
        } catch {
          await openPlayStore();
          return;
        }
      }

      // Jika dari Server API atau Play Core belum terindeks di perangkat, langsung buka halaman Play Store
      await openPlayStore();
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

  return { update, starting, checking, checkNow, startUpdate, dismiss };
}
