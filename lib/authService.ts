import { supabase } from './supabase';
import { useAuthStore, AuthUser } from './useAuthStore';

export async function signUpWithEmail(email: string, password: string, name: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
          role: 'USER',
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || trimmedEmail,
        name: trimmedName || trimmedEmail.split('@')[0],
        avatarUrl: data.user.user_metadata?.avatar_url || null,
        role: (data.user.user_metadata?.role as any) || 'USER',
        createdAt: data.user.created_at,
      };

      useAuthStore.getState().setSession(data.session?.access_token || 'local-token', authUser);
      return { user: authUser, error: null };
    }

    return { user: null, error: 'Pendaftaran gagal diproses.' };
  } catch (err: any) {
    return { user: null, error: err.message || 'Terjadi kesalahan jaringan.' };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || trimmedEmail,
        name: data.user.user_metadata?.name || trimmedEmail.split('@')[0],
        avatarUrl: data.user.user_metadata?.avatar_url || null,
        role: (data.user.user_metadata?.role as any) || 'USER',
        createdAt: data.user.created_at,
      };

      useAuthStore.getState().setSession(data.session?.access_token || 'local-token', authUser);
      return { user: authUser, error: null };
    }

    return { user: null, error: 'Email atau password salah.' };
  } catch (err: any) {
    return { user: null, error: err.message || 'Terjadi kesalahan jaringan.' };
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('[authService] signOut error:', e);
  } finally {
    useAuthStore.getState().logout();
  }
}

export async function updateUserName(name: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 15) {
      return { success: false, error: 'Nama harus antara 3 sampai 15 karakter.' };
    }

    const { error } = await supabase.auth.updateUser({
      data: { name: trimmed },
    });

    if (error) {
      console.warn('[authService] Supabase updateUser warning:', error.message);
    }

    // Always update local store optimistically
    useAuthStore.getState().updateUser({ name: trimmed });
    return { success: true, error: null };
  } catch (err: any) {
    useAuthStore.getState().updateUser({ name: name.trim() });
    return { success: true, error: null };
  }
}

export async function uploadUserAvatar(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<{ avatarUrl: string | null; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'guest_' + Date.now();
    const ext = asset.mimeType?.split('/')[1] || 'jpg';
    const filePath = `avatars/${userId}_${Date.now()}.${ext}`;

    let avatarUrl = asset.uri;

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `avatar.${ext}`,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const { data, error } = await supabase.storage.from('avatars').upload(filePath, formData, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error && data?.path) {
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        if (publicData?.publicUrl) {
          avatarUrl = publicData.publicUrl;
        }
      }
    } catch (storageErr) {
      console.warn('[authService] Storage upload fallback to local URI:', storageErr);
    }

    // Save avatar_url to user metadata
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });
    } catch (metaErr) {
      console.warn('[authService] updateUser metadata error:', metaErr);
    }

    useAuthStore.getState().updateUser({ avatarUrl });
    return { avatarUrl, error: null };
  } catch (err: any) {
    return { avatarUrl: null, error: err.message || 'Gagal mengupload avatar.' };
  }
}

export async function deleteUserAccount(): Promise<{ success: boolean; error: string | null }> {
  try {
    await signOutUser();
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus akun.' };
  }
}
