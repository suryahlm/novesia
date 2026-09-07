/**
 * apiClient.ts — Base HTTP client untuk novesia-app (Pola Komiku).
 * Memanggil novesia-api dengan JWT token, deteksi platform OS, dan batas waktu (timeout).
 * 
 * Perlindungan Jaringan Lambat:
 * Setiap request dibungkus dengan withTimeout (default 30 detik) agar tidak menggantung tanpa batas
 * di Android saat radio seluler idle atau koneksi internet lemah/drop.
 */

import { Platform } from 'react-native';
import { useAuthStore } from './useAuthStore';
import { withTimeout } from './httpTimeout';
import { ApiError } from './apiError';

// Gunakan env variable atau fallback ke production URL
export const API_BASE_URL =
  ((process.env.EXPO_PUBLIC_API_URL as string) || 'https://api.novesia.cc').replace(/\/$/, '');

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * Buat header dasar client aplikasi (termasuk Auth jika login).
 */
function getBaseHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'X-Client-Platform': 'app',
    'X-Client-OS': Platform.OS,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Helper generik: fetch JSON dari novesia-api dengan proteksi timeout & error parsing
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: RequestOptions
): Promise<T> {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const { signal: combinedSignal, didTimeout, cleanup } = withTimeout(
    options?.signal,
    options?.timeoutMs
  );

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getBaseHeaders(),
        ...(options?.headers || {}),
      },
      signal: combinedSignal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(
        errBody?.error || `HTTP ${res.status} - gagal memuat data`,
        res.status,
        errBody?.code
      );
    }

    return (await res.json()) as Promise<T>;
  } catch (err: any) {
    const isAbort = (err as { name?: string })?.name === 'AbortError' && !didTimeout();
    if (!isAbort) {
      console.warn(`[apiClient] GET ${url} error:`, err?.message || err);
    }
    if (didTimeout()) {
      throw new ApiError('Waktu tunggu habis, periksa koneksi internet Anda.', 408, 'TIMEOUT');
    }
    throw err;
  } finally {
    cleanup();
  }
}

/**
 * POST JSON ke novesia-api
 */
export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { signal: combinedSignal, didTimeout, cleanup } = withTimeout(
    options?.signal,
    options?.timeoutMs
  );

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getBaseHeaders(),
        ...(options?.headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(
        errBody?.error || `HTTP ${res.status} - gagal mengirim data`,
        res.status,
        errBody?.code
      );
    }

    return (await res.json()) as Promise<T>;
  } catch (err: any) {
    if (didTimeout()) {
      throw new ApiError('Waktu tunggu habis, periksa koneksi internet Anda.', 408, 'TIMEOUT');
    }
    throw err;
  } finally {
    cleanup();
  }
}

/**
 * PATCH JSON ke novesia-api
 */
export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { signal: combinedSignal, didTimeout, cleanup } = withTimeout(
    options?.signal,
    options?.timeoutMs
  );

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getBaseHeaders(),
        ...(options?.headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(
        errBody?.error || `HTTP ${res.status} - gagal memperbarui data`,
        res.status,
        errBody?.code
      );
    }

    return (await res.json()) as Promise<T>;
  } catch (err: any) {
    if (didTimeout()) {
      throw new ApiError('Waktu tunggu habis, periksa koneksi internet Anda.', 408, 'TIMEOUT');
    }
    throw err;
  } finally {
    cleanup();
  }
}

/**
 * DELETE ke novesia-api
 */
export async function apiDelete<T>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { signal: combinedSignal, didTimeout, cleanup } = withTimeout(
    options?.signal,
    options?.timeoutMs
  );

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getBaseHeaders(),
        ...(options?.headers || {}),
      },
      signal: combinedSignal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(
        errBody?.error || `HTTP ${res.status} - gagal menghapus data`,
        res.status,
        errBody?.code
      );
    }

    return (await res.json()) as Promise<T>;
  } catch (err: any) {
    if (didTimeout()) {
      throw new ApiError('Waktu tunggu habis, periksa koneksi internet Anda.', 408, 'TIMEOUT');
    }
    throw err;
  } finally {
    cleanup();
  }
}

/**
 * POST multipart/form-data (untuk upload avatar)
 */
export async function apiPostForm<T>(
  path: string,
  formData: FormData,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { signal: combinedSignal, didTimeout, cleanup } = withTimeout(
    options?.signal,
    options?.timeoutMs || 60000 // Form upload bisa butuh waktu hingga 60 detik di koneksi lambat
  );

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...getBaseHeaders(),
        ...(options?.headers || {}),
      },
      body: formData,
      signal: combinedSignal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(
        errBody?.error || `HTTP ${res.status} - gagal mengunggah berkas`,
        res.status,
        errBody?.code
      );
    }

    return (await res.json()) as Promise<T>;
  } catch (err: any) {
    if (didTimeout()) {
      throw new ApiError('Waktu unggah habis, periksa koneksi internet Anda.', 408, 'TIMEOUT');
    }
    throw err;
  } finally {
    cleanup();
  }
}
