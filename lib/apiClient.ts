/**
 * apiClient.ts — Base HTTP client untuk novesia-app
 * Memanggil novesia-api (port 4300 / api.novesia.cc) dengan JWT token.
 * Pola Komiku: getJson, postJson, patchJson, deleteJson.
 */

import { useAuthStore } from './useAuthStore';

// Gunakan env variable atau fallback ke production URL
export const API_BASE_URL =
  ((process.env.EXPO_PUBLIC_API_URL as string) || 'https://api.novesia.cc').replace(/\/$/, '');

/**
 * Buat Authorization header jika token tersedia di store.
 */
function getAuthHeader(): Record<string, string> {
  const token = useAuthStore.getState().token;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Helper generik: fetch JSON dari novesia-api
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * POST JSON ke novesia-api
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * PATCH JSON ke novesia-api
 */
export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * DELETE ke novesia-api
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * POST multipart/form-data (untuk upload avatar)
 */
export async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Jangan set Content-Type — biarkan fetch set boundary otomatis

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
