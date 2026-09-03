import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GradientBackground } from '../../components/GradientBackground';
import { ShimmerText } from '../../components/ShimmerText';
import { GoldSurface } from '../../components/GoldSurface';
import { VipCard } from '../../components/VipCard';
import { StatCard } from '../../components/StatCard';
import { RankBadge } from '../../components/RankBadge';
import { ThemeSheet } from '../../components/ThemeSheet';
import { CustomDialog, DialogTone } from '../../components/CustomDialog';
import { AuthModal } from '../../components/AuthModal';
import { useAuthStore } from '../../lib/useAuthStore';
import { useTheme } from '../../lib/ThemeProvider';
import { signOutUser } from '../../lib/authService';
import { getHistory, HistoryItem, clearHistory } from '../../lib/history';
import { getUserGamificationStats, UserGamificationStats } from '../../lib/gamification';

const LIBRARY_KEY = 'novesia_library';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [gamification, setGamification] = useState<UserGamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Custom Dialog State
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [histData, libData, gamifyData] = await Promise.all([
        getHistory(),
        AsyncStorage.getItem(LIBRARY_KEY),
        getUserGamificationStats(),
      ]);
      setHistory(histData);
      setGamification(gamifyData);
      if (libData) {
        try {
          const parsed = JSON.parse(libData);
          setBookmarkCount(Array.isArray(parsed) ? parsed.length : 0);
        } catch {
          setBookmarkCount(0);
        }
      } else {
        setBookmarkCount(0);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const showPopup = (config: typeof dialogConfig) => {
    setDialogConfig(config);
    setDialogVisible(true);
  };

  const handleClearCache = () => {
    showPopup({
      title: 'Bersihkan Cache & Riwayat',
      message: 'Apakah Anda yakin ingin menghapus seluruh riwayat baca dan cache lokal aplikasi?',
      icon: 'trash-outline',
      tone: 'danger',
      confirmText: 'Hapus Semua',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        await clearHistory();
        await loadData();
        showPopup({
          title: 'Cache Dibersihkan',
          message: 'Seluruh riwayat baca dan cache berhasil dihapus.',
          tone: 'success',
          showCancel: false,
        });
      },
    });
  };

  const handleLogout = () => {
    showPopup({
      title: 'Keluar dari Akun',
      message: 'Apakah Anda yakin ingin keluar dari akun Anda saat ini?',
      icon: 'log-out-outline',
      tone: 'danger',
      confirmText: 'Keluar',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        await signOutUser();
        showPopup({
          title: 'Berhasil Keluar',
          message: 'Anda telah keluar dari akun Anda.',
          tone: 'success',
          showCancel: false,
        });
      },
    });
  };

  const totalChapters = history.reduce((sum, h) => sum + (h.last_chapter || 0), 0);
  const totalNovels = history.length;
  const userIsVip = isVip || user?.role === 'VIP';
  const loggedIn = Boolean(user);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />
      {/* Accent ambient shimmer atas - cahaya aksen tipis dari pojok kiri atas */}
      <LinearGradient
        colors={[colors.primary + '2E', colors.primary + '0F', 'rgba(13,16,18,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Accent ambient shimmer bawah - lebih tipis, dari pojok kanan bawah */}
      <LinearGradient
        colors={['rgba(13,16,18,0)', colors.primary + '0D', colors.primary + '1F']}
        locations={[0.5, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header Title with ShimmerText */}
          <View style={{ paddingTop: 6, paddingBottom: 16 }}>
            <ShimmerText
              style={{ fontSize: 24, fontWeight: '900', letterSpacing: 0.5 }}
              baseColor={colors.primary}
              shineColor="rgba(255,250,230,0.95)"
            >
              Profil
            </ShimmerText>
          </View>

          {/* User Profile Header (Komiku Open Layout - Tanpa Kotak Tebal) */}
          <Pressable
            onPress={() => (user ? router.push('/akun') : setAuthModalVisible(true))}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 16,
              marginBottom: 18,
            }}
            accessibilityRole="button"
            accessibilityLabel="Buka detail akun"
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: colors.primary,
                overflow: 'hidden',
              }}
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 72, height: 72 }} />
              ) : (
                <Ionicons name="person" size={32} color={colors.primary} />
              )}
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    flexShrink: 1,
                  }}
                >
                  {user ? user.name : 'Pembaca Novesia'}
                </Text>
                {user &&
                  (userIsVip ? (
                    <GoldSurface
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                      }}
                    >
                      <Ionicons name="diamond" size={10} color={colors.textOnPrimary} />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: colors.textOnPrimary,
                          letterSpacing: 0.3,
                        }}
                      >
                        VIP
                      </Text>
                    </GoldSurface>
                  ) : (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceElevated,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                        Member
                      </Text>
                    </View>
                  ))}
              </View>

              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textMuted }}>
                {user ? user.email : 'Login untuk akses seluruh fitur (gratis)'}
              </Text>

              {!user && (
                <Pressable
                  onPress={() => setAuthModalVisible(true)}
                  style={{ alignSelf: 'flex-start', marginTop: 6 }}
                >
                  <GoldSurface
                    shimmer
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.textOnPrimary,
                      }}
                    >
                      Masuk / Daftar Akun
                    </Text>
                  </GoldSurface>
                </Pressable>
              )}

              {loggedIn && gamification && (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: colors.surfaceElevated,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                      Lv.{gamification.level}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: colors.surfaceElevated,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                      Rank {gamification.rank}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {user && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
                style={{ alignSelf: 'center' }}
              />
            )}
          </Pressable>

          {/* Hairline Separator */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 18 }} />

          {/* Level dan Rank Card (Komiku Pattern) */}
          <Pressable
            onPress={() => (user ? router.push('/akun') : setAuthModalVisible(true))}
            style={{
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 20,
              gap: 10,
            }}
            accessibilityRole="button"
            accessibilityLabel="Buka detail Level dan Rank"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="trophy" size={18} color={colors.primary} />
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.textPrimary }}>
                  Level dan Rank
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
            ) : gamification ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.textPrimary }}>
                    Level {gamification.level}
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
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {gamification.totalXp} Total XP
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="flame" size={13} color={colors.primary} />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {gamification.currentStreak} hari beruntun
                    </Text>
                  </View>
                </View>

                {gamification.nextRank && (
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {gamification.xpToNextRank} XP lagi ke Rank {gamification.nextRank}
                  </Text>
                )}
              </>
            ) : null}
          </Pressable>

          {/* Reading Statistics Row (Komiku StatCard Pattern) */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <StatCard icon="bookmark" label="Bookmark" value={bookmarkCount} />
            <StatCard icon="book" label="Lanjut Baca" value={totalNovels} />
            <StatCard
              icon="flame"
              label="Streak"
              value={gamification && gamification.currentStreak > 0 ? `${gamification.currentStreak} Hari` : '0 Hari'}
            />
          </View>

          {/* Menu Options (Unified Rounded Container) */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            {[
              {
                icon: 'person-outline' as const,
                label: 'Detail Akun & Profil',
                onPress: () => (user ? router.push('/akun') : setAuthModalVisible(true)),
              },
              {
                icon: 'color-palette-outline' as const,
                label: 'Pilihan Tema & Aksen',
                onPress: () => setThemeSheetVisible(true),
              },
              {
                icon: 'notifications-outline' as const,
                label: 'Notifikasi & Update',
                onPress: () =>
                  showPopup({
                    title: 'Notifikasi Aktif',
                    message: 'Notifikasi untuk update chapter terbaru telah diaktifkan secara otomatis.',
                    icon: 'notifications-outline',
                    tone: 'info',
                    showCancel: false,
                  }),
              },
              {
                icon: 'cloud-outline' as const,
                label: 'Bersihkan Riwayat & Cache',
                onPress: handleClearCache,
              },
              {
                icon: 'information-circle-outline' as const,
                label: 'Tentang Novesia',
                onPress: () =>
                  showPopup({
                    title: 'Novesia v1.0.0',
                    message:
                      'Platform baca novel terjemahan resmi dengan pengalaman visual premium Dark Luxury.',
                    icon: 'book-outline',
                    tone: 'gold',
                    showCancel: false,
                  }),
              },
            ].map((menu, i, arr) => (
              <Pressable
                key={menu.label}
                onPress={menu.onPress}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? colors.surfaceElevated : 'transparent',
                  borderBottomWidth: i !== arr.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                })}
              >
                <Ionicons name={menu.icon} size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <Text style={{ flex: 1, fontSize: 13.5, color: colors.textPrimary, fontWeight: '600' }}>
                  {menu.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* Logout Button */}
          {user && (
            <Pressable
              onPress={handleLogout}
              style={{
                backgroundColor: 'rgba(216,102,102,0.12)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(216,102,102,0.3)',
                paddingVertical: 13,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: '#D86666', fontWeight: '800' }}>
                Keluar dari Akun
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Auth Modal for Sign In / Sign Up */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => {
          showPopup({
            title: 'Berhasil Masuk!',
            message: 'Selamat datang di Novesia.',
            tone: 'success',
            showCancel: false,
          });
        }}
      />

      {/* Theme Selection BottomSheet */}
      <ThemeSheet
        visible={themeSheetVisible}
        onClose={() => setThemeSheetVisible(false)}
      />

      {/* Custom Luxury Dialog Popup */}
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
