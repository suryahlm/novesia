import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GradientBackground } from '../components/GradientBackground';
import { GoldSurface } from '../components/GoldSurface';
import { ShimmerText } from '../components/ShimmerText';
import { RankBadge } from '../components/RankBadge';
import { StatCard } from '../components/StatCard';
import { CustomDialog, DialogTone } from '../components/CustomDialog';
import { AuthModal } from '../components/AuthModal';
import { useAuthStore } from '../lib/useAuthStore';
import { useTheme } from '../lib/ThemeProvider';
import { updateUserName, uploadUserAvatar, deleteUserAccount } from '../lib/authService';
import { getHistory } from '../lib/history';

const LIBRARY_KEY = 'novesia_library';

type AccountTab = 'comments' | 'info';

function EmptyNotice({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <Ionicons name={icon} size={26} color={colors.textMuted} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
        {subtitle}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={{ fontSize: 13, color: colors.textMuted, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

export default function AkunScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<AccountTab>('info');
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const uploadingRef = useRef(false);

  // Edit Name Modal
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Auth Modal
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Custom Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    tone?: DialogTone;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    title: '',
    message: '',
  });

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      const bookmarks: string[] = lib ? JSON.parse(lib) : [];
      setBookmarkCount(bookmarks.length);
      const hist = await getHistory();
      setHistoryCount(hist.length);
    } catch {
      setBookmarkCount(0);
      setHistoryCount(0);
    }
  };

  const showPopup = (config: typeof dialogConfig) => {
    setDialogConfig(config);
    setDialogVisible(true);
  };

  // Upload Foto Profil
  const handleChangeAvatar = async () => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setUploadingAvatar(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showPopup({
          title: 'Izin Galeri Ditolak',
          message: 'Aktifkan izin akses galeri untuk aplikasi Novesia lewat pengaturan HP Anda.',
          icon: 'alert-circle-outline',
          tone: 'warning',
          showCancel: false,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const res = await uploadUserAvatar({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });

      if (res.error) {
        showPopup({
          title: 'Gagal Upload Foto',
          message: res.error,
          icon: 'alert-circle-outline',
          tone: 'danger',
          showCancel: false,
        });
      } else {
        showPopup({
          title: 'Foto Profil Diperbarui',
          message: 'Foto profil baru Anda berhasil disimpan!',
          icon: 'checkmark-circle-outline',
          tone: 'success',
          showCancel: false,
        });
      }
    } catch (err: any) {
      showPopup({
        title: 'Gagal Ganti Foto',
        message: err?.message || 'Terjadi kesalahan saat memilih foto.',
        tone: 'danger',
        showCancel: false,
      });
    } finally {
      uploadingRef.current = false;
      setUploadingAvatar(false);
    }
  };

  // Ganti Nama
  const openEditName = () => {
    setNameDraft(user?.name ?? '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 3 || trimmed.length > 15) {
      showPopup({
        title: 'Nama Tidak Valid',
        message: 'Nama harus antara 3 sampai 15 karakter.',
        tone: 'warning',
        showCancel: false,
      });
      return;
    }

    setSavingName(true);
    const res = await updateUserName(trimmed);
    setSavingName(false);

    if (res.success) {
      setEditingName(false);
      showPopup({
        title: 'Nama Berhasil Diubah',
        message: `Nama tampilan Anda telah diperbarui menjadi "${trimmed}".`,
        tone: 'success',
        showCancel: false,
      });
    } else {
      showPopup({
        title: 'Gagal Mengubah Nama',
        message: res.error || 'Terjadi kesalahan.',
        tone: 'danger',
        showCancel: false,
      });
    }
  };

  // Hapus Akun
  const confirmDeleteAccount = () => {
    showPopup({
      title: 'Hapus Akun?',
      message:
        'Semua data login, XP, dan riwayat akun Anda akan dihapus permanen. Bookmark yang tersimpan lokal di HP tidak ikut terhapus. Tindakan ini tidak dapat dibatalkan.',
      icon: 'trash-outline',
      tone: 'danger',
      confirmText: 'Hapus Akun',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        await deleteUserAccount();
        router.back();
      },
    });
  };

  const isVip = user?.role === 'VIP';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />
      {/* Ambient shimmer top-left */}
      <LinearGradient
        colors={[colors.primary + '2E', colors.primary + '0F', 'rgba(13,16,18,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Ambient shimmer bottom-right */}
      <LinearGradient
        colors={['rgba(13,16,18,0)', colors.primary + '0D', colors.primary + '1F']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Top App Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary, flex: 1, textAlign: 'center', marginRight: 24 }}>
            Detail Profil
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Avatar & User Details */}
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 24, marginTop: 8 }}>
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  overflow: 'hidden',
                }}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: 96, height: 96 }} />
                ) : (
                  <Ionicons name="person" size={44} color={colors.primary} />
                )}
              </View>

              {/* Camera Upload Button */}
              <Pressable
                onPress={handleChangeAvatar}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.background,
                  opacity: uploadingAvatar ? 0.6 : 1,
                }}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Ionicons name="camera" size={16} color={colors.textOnPrimary} />
                )}
              </Pressable>
            </View>

            {uploadingAvatar && (
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                Mengupload foto, tunggu sebentar...
              </Text>
            )}

            {/* Display Name with Edit Pencil */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                {user ? user.name : 'Pembaca Novesia'}
              </Text>
              {user && (
                <Pressable onPress={openEditName} hitSlop={10}>
                  <Ionicons name="pencil" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Status Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isVip ? colors.primary + '59' : colors.border,
                backgroundColor: isVip ? colors.primaryMuted : 'transparent',
              }}
            >
              <Ionicons
                name={user ? (isVip ? 'ribbon' : 'checkmark-circle') : 'person-outline'}
                size={13}
                color={isVip ? colors.primary : colors.textMuted}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isVip ? colors.primary : colors.textMuted,
                }}
              >
                {user ? (isVip ? 'VIP Member' : user.email) : 'Tamu - Belum Masuk'}
              </Text>
            </View>

            {!user && (
              <Pressable onPress={() => setAuthModalVisible(true)} style={{ marginTop: 6 }}>
                <GoldSurface style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 }}>
                  <Text style={{ color: colors.textOnPrimary, fontSize: 13, fontWeight: '800' }}>
                    Masuk / Daftar Akun
                  </Text>
                </GoldSurface>
              </Pressable>
            )}
          </View>

          {/* Reading Statistics Row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <StatCard icon="bookmark" label="Bookmark" value={bookmarkCount} />
            <StatCard icon="book" label="Lanjut Baca" value={historyCount} />
            <StatCard icon="trophy" label="Level" value={user ? 'Lv.1' : '-'} />
          </View>

          {/* Level dan Rank Card */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 20,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="trophy-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.textPrimary }}>
                Level dan Rank Pembaca
              </Text>
            </View>

            {!user ? (
              <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                Daftar atau masuk akun untuk mulai mengumpulkan XP dari membaca bab novel, naik level, dan meraih gelar Rank.
              </Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSecondary }}>
                    Level 1
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    120 / 300 XP
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      width: '40%',
                      backgroundColor: colors.primary,
                      borderRadius: 3,
                    }}
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RankBadge rank="F" size="sm" />
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>120 XP musim ini</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="flame-outline" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>1 hari beruntun</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Tab Switcher (Info vs Komentar) */}
          <View
            style={{
              flexDirection: 'row',
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 4,
              marginBottom: 16,
            }}
          >
            {(['info', 'comments'] as const).map((key) => {
              const active = tab === key;
              const label = key === 'info' ? 'Informasi Akun' : 'Komentar Saya';
              const icon = key === 'info' ? 'information-circle-outline' : 'chatbubble-outline';

              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}
                >
                  {active ? (
                    <GoldSurface
                      shimmer
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Ionicons name={icon} size={15} color={colors.textOnPrimary} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.textOnPrimary }}>
                        {label}
                      </Text>
                    </GoldSurface>
                  ) : (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 8,
                      }}
                    >
                      <Ionicons name={icon} size={15} color={colors.textMuted} />
                      <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.textMuted }}>
                        {label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Tab Content */}
          {tab === 'info' ? (
            user ? (
              <View>
                <View
                  style={{
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                  }}
                >
                  <InfoRow icon="mail-outline" label="Email" value={user.email} />
                  <InfoRow icon="shield-checkmark-outline" label="Status" value={isVip ? 'VIP Member' : 'Member Biasa'} />
                  <InfoRow
                    icon="calendar-outline"
                    label="Bergabung"
                    value={
                      user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Pengguna Novesia'
                    }
                  />
                </View>

                {/* Hapus Akun Button */}
                <Pressable onPress={confirmDeleteAccount} style={{ marginTop: 20 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.danger + '44',
                      backgroundColor: 'rgba(216,102,102,0.08)',
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={{ fontSize: 13, color: colors.danger, fontWeight: '700' }}>
                      Hapus Akun
                    </Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              <EmptyNotice
                icon="person-circle-outline"
                title="Anda Belum Masuk"
                subtitle="Masuk atau daftar untuk melihat informasi akun, email, dan status keanggotaan Anda."
              />
            )
          ) : !user ? (
            <EmptyNotice
              icon="chatbubble-outline"
              title="Belum Ada Komentar"
              subtitle="Masuk atau daftar untuk mulai berkomentar di novel dan forum diskusi Novesia."
            />
          ) : (
            <EmptyNotice
              icon="chatbubble-outline"
              title="Belum Ada Komentar"
              subtitle="Komentar yang Anda tulis pada bab novel dan forum akan muncul di sini."
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Ganti Nama Modal */}
      <Modal visible={editingName} transparent animationType="fade" onRequestClose={() => setEditingName(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setEditingName(false)} />
          <View
            style={{
              width: '100%',
              maxWidth: 340,
              borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
              Ganti Nama Tampilan
            </Text>
            <TextInput
              value={nameDraft}
              onChangeText={(v) => setNameDraft(v.slice(0, 15))}
              placeholder="Nama tampilan baru"
              placeholderTextColor={colors.textMuted}
              maxLength={15}
              autoFocus
              style={{
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: colors.surfaceElevated,
                fontSize: 14,
              }}
            />
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {nameDraft.trim().length}/15 karakter (minimal 3 karakter)
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <Pressable
                onPress={() => setEditingName(false)}
                disabled={savingName}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700' }}>Batal</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveName}
                disabled={savingName || nameDraft.trim().length < 3}
                style={{ flex: 1, borderRadius: 12, overflow: 'hidden', opacity: nameDraft.trim().length < 3 ? 0.5 : 1 }}
              >
                <GoldSurface
                  shimmer
                  style={{
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {savingName ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.textOnPrimary, fontWeight: '800' }}>
                      Simpan
                    </Text>
                  )}
                </GoldSurface>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => {
          showPopup({
            title: 'Berhasil Masuk!',
            message: 'Selamat datang kembali di Novesia.',
            tone: 'success',
            showCancel: false,
          });
        }}
      />

      {/* Custom Dialog */}
      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        icon={dialogConfig.icon}
        tone={dialogConfig.tone}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        showCancel={dialogConfig.showCancel}
      />
    </View>
  );
}
