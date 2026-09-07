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
import { useLanguage } from '../lib/i18n';
import { updateUserName, uploadUserAvatar, deleteUserAccount, refreshUserProfile } from '../lib/authService';
import { getHistory } from '../lib/history';
import { getUserGamificationStats, UserGamificationStats } from '../lib/gamification';

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
  const { t, lang } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<AccountTab>('info');
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [gamification, setGamification] = useState<UserGamificationStats | null>(null);
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
    if (user) {
      refreshUserProfile().catch(() => {});
    }
  }, []);

  const loadCounts = async () => {
    try {
      const [lib, hist, gamifyData] = await Promise.all([
        AsyncStorage.getItem(LIBRARY_KEY),
        getHistory(),
        getUserGamificationStats(),
      ]);
      const bookmarks: string[] = lib ? JSON.parse(lib) : [];
      setBookmarkCount(bookmarks.length);
      setHistoryCount(hist.length);
      setGamification(gamifyData);
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
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setUploadingAvatar(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showPopup({
          title: lang === 'id' ? 'Izin Galeri Ditolak' : 'Gallery Permission Denied',
          message:
            lang === 'id'
              ? 'Aktifkan izin akses galeri untuk aplikasi Novesia lewat pengaturan HP Anda.'
              : 'Please enable gallery access permissions for Novesia in your device settings.',
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
        quality: 0.65,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const res = await uploadUserAvatar({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        base64: asset.base64,
      });

      if (res.error) {
        showPopup({
          title: t.photo_failed_title,
          message: res.error,
          icon: 'alert-circle-outline',
          tone: 'danger',
          showCancel: false,
        });
      } else {
        showPopup({
          title: t.photo_updated_title,
          message: t.photo_updated_msg,
          icon: 'checkmark-circle-outline',
          tone: 'success',
          showCancel: false,
        });
      }
    } catch (err: any) {
      showPopup({
        title: t.photo_failed_title,
        message: err?.message || (lang === 'id' ? 'Terjadi kesalahan saat memilih foto.' : 'Failed to select photo.'),
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
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    setNameDraft(user?.name ?? '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 3 || trimmed.length > 15) {
      showPopup({
        title: lang === 'id' ? 'Nama Tidak Valid' : 'Invalid Name',
        message: lang === 'id' ? 'Nama harus antara 3 sampai 15 karakter.' : 'Name must be between 3 and 15 characters.',
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
        title: lang === 'id' ? 'Nama Berhasil Diubah' : 'Name Updated',
        message:
          lang === 'id'
            ? `Nama tampilan Anda telah diperbarui menjadi "${trimmed}".`
            : `Your display name has been updated to "${trimmed}".`,
        tone: 'success',
        showCancel: false,
      });
    } else {
      showPopup({
        title: lang === 'id' ? 'Gagal Mengubah Nama' : 'Failed to Update Name',
        message: res.error || (lang === 'id' ? 'Terjadi kesalahan.' : 'An error occurred.'),
        tone: 'danger',
        showCancel: false,
      });
    }
  };

  // Hapus Akun
  const confirmDeleteAccount = () => {
    showPopup({
      title: t.delete_dialog_title,
      message: t.delete_dialog_msg,
      icon: 'trash-outline',
      tone: 'danger',
      confirmText: t.delete_dialog_confirm,
      cancelText: t.cancel,
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
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Ambient shimmer bottom-right */}
      <LinearGradient
        colors={['rgba(13,16,18,0)', colors.primary + '0D', colors.primary + '1F']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
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
            {t.profile_details_title}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 95 }} showsVerticalScrollIndicator={false}>
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
                  <Image
                    key={user.avatarUrl}
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 96, height: 96 }}
                  />
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
                {t.uploading_photo_hint}
              </Text>
            )}

            {/* Display Name with Edit Pencil */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                {user ? user.name : (lang === 'id' ? 'Pembaca Novesia' : 'Novesia Reader')}
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
                {user ? (isVip ? t.member_vip : user.email) : t.member_guest}
              </Text>
            </View>

            {!user && (
              <Pressable onPress={() => setAuthModalVisible(true)} style={{ marginTop: 6 }}>
                <GoldSurface style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 }}>
                  <Text style={{ color: colors.textOnPrimary, fontSize: 13, fontWeight: '800' }}>
                    {t.sign_in_register || (lang === 'id' ? 'Masuk / Daftar Akun' : 'Sign In / Register')}
                  </Text>
                </GoldSurface>
              </Pressable>
            )}
          </View>

          {/* Reading Statistics Row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <StatCard icon="bookmark" label={t.stat_bookmark} value={bookmarkCount} />
            <StatCard icon="book" label={t.stat_continue_reading} value={historyCount} />
            <StatCard icon="trophy" label={t.stat_level} value={gamification ? `Lv.${gamification.level}` : 'Lv.1'} />
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
              <Ionicons name="trophy" size={18} color={colors.primary} />
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.textPrimary }}>
                {t.reader_level_rank}
              </Text>
            </View>

            {gamification ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.textSecondary }}>
                    {t.stat_level} {gamification.level}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
                    {gamification.xpIntoLevel} / {gamification.xpForCurrentLevel} XP
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${gamification.progressPercentage}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 999,
                    }}
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RankBadge rank={gamification.rank} size="sm" />
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {gamification.totalXp} Total XP
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="flame" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {gamification.currentStreak} {t.streak_days}
                    </Text>
                  </View>
                </View>

                {gamification.nextRank && (
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {gamification.xpToNextRank} {t.xp_left_to} Rank {gamification.nextRank}
                  </Text>
                )}
              </>
            ) : null}
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
              const label = key === 'info' ? t.tab_account_info : t.tab_my_comments;
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
                  <InfoRow icon="mail-outline" label={t.info_email} value={user.email} />
                  <InfoRow icon="shield-checkmark-outline" label={t.info_status} value={isVip ? t.member_vip : t.member_regular} />
                  <InfoRow
                    icon="calendar-outline"
                    label={t.info_joined}
                    value={
                      user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : (lang === 'id' ? 'Pengguna Novesia' : 'Novesia User')
                    }
                  />
                </View>

                {/* Hapus Akun Button */}
                <Pressable onPress={confirmDeleteAccount} style={{ marginTop: 24, marginBottom: 20 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 13,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.danger + '44',
                      backgroundColor: 'rgba(216,102,102,0.08)',
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={{ fontSize: 13, color: colors.danger, fontWeight: '700' }}>
                      {t.delete_account_btn}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              <EmptyNotice
                icon="person-circle-outline"
                title={t.not_logged_in_title}
                subtitle={t.not_logged_in_desc}
              />
            )
          ) : !user ? (
            <EmptyNotice
              icon="chatbubble-outline"
              title={t.no_comments_title}
              subtitle={
                lang === 'id'
                  ? 'Masuk atau daftar untuk mulai berkomentar di novel dan forum diskusi Novesia.'
                  : 'Sign in or register to start commenting on novels and forums.'
              }
            />
          ) : (
            <EmptyNotice
              icon="chatbubble-outline"
              title={t.no_comments_title}
              subtitle={t.no_comments_desc}
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
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingName(false)} />
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
              {t.edit_name_title}
            </Text>
            <TextInput
              value={nameDraft}
              onChangeText={(v) => setNameDraft(v.slice(0, 15))}
              placeholder={t.edit_name_placeholder}
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
              {nameDraft.trim().length}/15 {t.edit_name_hint}
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
                <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700' }}>
                  {t.cancel}
                </Text>
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
                      {t.save}
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
            title: lang === 'id' ? 'Berhasil Masuk!' : 'Welcome Back!',
            message: lang === 'id' ? 'Selamat datang kembali di Novesia.' : 'Welcome back to Novesia.',
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
