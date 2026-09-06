/**
 * authService.ts — Novesia App Auth Service
 * Menggantikan Supabase Auth dengan novesia-api JWT (pola Komiku).
 * Token disimpan di useAuthStore (zustand + AsyncStorage persist).
 */
import { Platform } from 'react-native';
import { apiGet, apiPost, apiPatch, apiPostForm } from './apiClient';
import { useAuthStore, AuthUser } from './useAuthStore';

// ─── Tipe response dari novesia-api ─────────────────────────────────────────

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

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const data = await apiPost<AuthResponse>('/api/auth/register', {
      email: trimmedEmail,
      password,
      name: trimmedName,
      platform: Platform.OS,
    });

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatarUrl: data.user.avatar_url,
      role: data.user.role,
      createdAt: data.user.created_at,
    };

    useAuthStore.getState().setSession(data.token, authUser);
    return { user: authUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Terjadi kesalahan jaringan.' };
  }
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();

    const data = await apiPost<AuthResponse>('/api/auth/login', {
      email: trimmedEmail,
      password,
    });

    if (data.user.banned) {
      return { user: null, error: 'Akun Anda telah dinonaktifkan (diblokir) oleh admin.' };
    }
    if (data.user.frozen) {
      return { user: null, error: 'Akun Anda sedang dibekukan sementara oleh admin.' };
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
    return { user: authUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Email atau password salah.' };
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOutUser(): Promise<void> {
  // Tidak perlu hit API — cukup clear token di store
  useAuthStore.getState().logout();
}

// ─── Update Nama ──────────────────────────────────────────────────────────────

export async function updateUserName(
  name: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 15) {
      return { success: false, error: 'Nama harus antara 3 sampai 15 karakter.' };
    }

    await apiPatch('/api/me', { name: trimmed });

    // Update local store optimistically
    useAuthStore.getState().updateUser({ name: trimmed });
    return { success: true, error: null };
  } catch (err: any) {
    // Tetap update local store agar UI responsif
    useAuthStore.getState().updateUser({ name: name.trim() });
    return { success: true, error: null };
  }
}

// ─── Upload Avatar ────────────────────────────────────────────────────────────

export async function uploadUserAvatar(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<{ avatarUrl: string | null; error: string | null }> {
  try {
    const ext = asset.mimeType?.split('/')[1] || 'jpg';

    const formData = new FormData();
    formData.append('avatar', {
      uri: asset.uri,
      name: asset.fileName || `avatar.${ext}`,
      type: asset.mimeType || 'image/jpeg',
    } as any);

    const result = await apiPostForm<{ avatarUrl: string }>('/api/me/avatar', formData);
    const avatarUrl = result.avatarUrl || asset.uri;

    useAuthStore.getState().updateUser({ avatarUrl });
    return { avatarUrl, error: null };
  } catch (err: any) {
    // Fallback: gunakan local URI
    useAuthStore.getState().updateUser({ avatarUrl: asset.uri });
    return { avatarUrl: asset.uri, error: null };
  }
}

// ─── Delete Account ───────────────────────────────────────────────────────────

export async function deleteUserAccount(): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiPost('/api/me/delete');
    await signOutUser();
    return { success: true, error: null };
  } catch (err: any) {
    // Tetap logout walau API gagal
    await signOutUser();
    return { success: true, error: null };
  }
}
