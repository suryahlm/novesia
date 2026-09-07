/**
 * httpTimeout.ts — Wrapper batas waktu request HTTP (Pola Komiku).
 * 
 * Di React Native Android, fetch() tidak memiliki batas waktu socket bawaan.
 * Saat HP berpindah jaringan (WiFi -> Seluler), radio seluler bangun dari idle,
 * atau koneksi drop tiba-tiba di 3G/EDGE, request bisa "menggantung" tanpa batas waktu.
 * Hal ini menyebabkan spinner berputar terus selamanya dan user terpaksa menutup paksa app.
 * 
 * withTimeout memasang AbortController dengan timer default 30 detik (cukup untuk handshake
 * di jaringan seluler lambat). Jika batas waktu terlampaui, request di-abort dan caller
 * dapat membedakan timeout jaringan dari pembatalan manual query menggunakan `didTimeout()`.
 */

const DEFAULT_TIMEOUT_MS = 30000;

export function withTimeout(signal: AbortSignal | undefined, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => clearTimeout(timer),
  };
}
