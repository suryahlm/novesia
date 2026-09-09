import { useCallback, useEffect, useRef, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { useAdStore } from './useAdStore';
import {
  AD_NOTICE_DURATION_MS,
  CHAPTER_INTERSTITIAL_AD_UNIT_ID,
  DEFAULT_AD_COOLDOWN_MINUTES,
  getAdNoticeMessage,
} from './ads';
import { getAppConfig } from './appConfig';

// react-native-google-mobile-ads memanggil native module langsung saat di-import (bukan saat
// dipanggil) — import statis di top-level bisa crash di Expo Go karena modul nativenya tidak ada di situ.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Iklan interstitial sebelum baca chapter — MAX sekali per cooldown interval per device.
 * Konfigurasi interval dan status aktif dapat diatur langsung dari Admin Panel secara dinamis.
 * 1. Cek due (default 30 menit atau sesuai pengaturan admin).
 * 2. Tandai lastShownAt SEGERA (komitmen slot, gagal load tidak membuat iklan terus mencoba tiap chapter).
 * 3. Tampilkan notice banner singkat (1.8s) "Next ad will appear in X minutes".
 * 4. Load & tampilkan iklan AdMob interstitial setelah notice selesai.
 * 5. Non-blocking: pembaca tidak ditahan loading spinner, pembaca tetap bisa langsung mulai membaca.
 */
export function useChapterInterstitialAd() {
  const lastShownAt = useAdStore((s) => s.lastShownAt);
  const markShown = useAdStore((s) => s.markShown);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string>(
    getAdNoticeMessage(DEFAULT_AD_COOLDOWN_MINUTES)
  );

  const processedChapterRef = useRef<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupAdRef = useRef<(() => void) | null>(null);

  // Menutup celah race condition jika komponen unmount saat async berlangsung
  const cancelledRef = useRef(false);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      cleanupAdRef.current?.();
    },
    []
  );

  const showForChapter = useCallback(
    async (chapterId: string) => {
      if (isExpoGo) return; // Tidak ada iklan di Expo Go, lewati dengan aman
      if (processedChapterRef.current === chapterId) return;
      processedChapterRef.current = chapterId;

      // Ambil konfigurasi dinamis yang diatur admin di Admin Panel
      const config = await getAppConfig().catch(() => null);
      if (cancelledRef.current) return;

      const isEnabled = config?.ad_interstitial_enabled ?? true;
      if (!isEnabled) return;

      const cooldownMinutes =
        typeof config?.ad_cooldown_minutes === 'number' && config.ad_cooldown_minutes > 0
          ? config.ad_cooldown_minutes
          : DEFAULT_AD_COOLDOWN_MINUTES;

      const cooldownMs = cooldownMinutes * 60 * 1000;
      const due = !lastShownAt || Date.now() - lastShownAt >= cooldownMs;
      if (!due) return;

      const message = getAdNoticeMessage(cooldownMinutes);
      setNoticeMessage(message);

      markShown();
      setNoticeVisible(true);

      noticeTimerRef.current = setTimeout(() => {
        if (cancelledRef.current) return;
        setNoticeVisible(false);

        import('react-native-google-mobile-ads')
          .then(({ AdEventType, InterstitialAd }) => {
            if (cancelledRef.current) return;

            const interstitial = InterstitialAd.createForAdRequest(CHAPTER_INTERSTITIAL_AD_UNIT_ID);
            const unsubscribers: Array<() => void> = [];
            const cleanup = () => {
              unsubscribers.forEach((unsubscribe) => unsubscribe());
              cleanupAdRef.current = null;
            };
            cleanupAdRef.current = cleanup;

            unsubscribers.push(
              interstitial.addAdEventListener(AdEventType.LOADED, () => {
                if (!cancelledRef.current) {
                  interstitial.show();
                }
              })
            );
            unsubscribers.push(interstitial.addAdEventListener(AdEventType.CLOSED, cleanup));
            unsubscribers.push(interstitial.addAdEventListener(AdEventType.ERROR, cleanup));

            interstitial.load();
          })
          .catch(() => {
            setNoticeVisible(false);
          });
      }, AD_NOTICE_DURATION_MS);
    },
    [lastShownAt, markShown]
  );

  return { showForChapter, noticeVisible, noticeMessage };
}
