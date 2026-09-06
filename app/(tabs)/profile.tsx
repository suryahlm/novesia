import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GradientBackground } from '../../components/GradientBackground';
import { StatCard } from '../../components/StatCard';
import { RankBadge } from '../../components/RankBadge';
import { ThemeSheet } from '../../components/ThemeSheet';
import { LanguageSheet } from '../../components/LanguageSheet';
import { CustomDialog, DialogTone } from '../../components/CustomDialog';
import { AuthModal } from '../../components/AuthModal';
import { useAuthStore } from '../../lib/useAuthStore';
import { useTheme } from '../../lib/ThemeProvider';
import { useLanguage } from '../../lib/i18n';
import { signOutUser } from '../../lib/authService';
import { getHistory, HistoryItem, clearHistory } from '../../lib/history';
import { getUserGamificationStats, UserGamificationStats } from '../../lib/gamification';

const LIBRARY_KEY = 'novesia_library';
const READING_SETTINGS_KEY = 'novesia_reading_settings';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [gamification, setGamification] = useState<UserGamificationStats | null>(null);
  const [readerFontSize, setReaderFontSize] = useState(18);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [langSheetVisible, setLangSheetVisible] = useState(false);
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
      const [histData, libData, gamifyData, settingsData] = await Promise.all([
        getHistory(),
        AsyncStorage.getItem(LIBRARY_KEY),
        getUserGamificationStats(),
        AsyncStorage.getItem(READING_SETTINGS_KEY),
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
      if (settingsData) {
        try {
          const s = JSON.parse(settingsData);
          if (s.fontSize) setReaderFontSize(s.fontSize);
        } catch {}
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
      title: t.clear_dialog_title,
      message: t.clear_dialog_msg,
      icon: 'trash-outline',
      tone: 'danger',
      confirmText: t.clear_dialog_confirm,
      cancelText: t.cancel,
      showCancel: true,
      onConfirm: async () => {
        await clearHistory();
        await loadData();
        showPopup({
          title: t.cleared_success_title,
          message: t.cleared_success_msg,
          tone: 'success',
          showCancel: false,
        });
      },
    });
  };

  const handleLogout = () => {
    showPopup({
      title: t.logout_dialog_title,
      message: t.logout_dialog_msg,
      icon: 'log-out-outline',
      tone: 'danger',
      confirmText: t.logout_dialog_confirm,
      cancelText: t.cancel,
      showCancel: true,
      onConfirm: async () => {
        await signOutUser();
        showPopup({
          title: t.logout_success_title,
          message: t.logout_success_msg,
          tone: 'success',
          showCancel: false,
        });
      },
    });
  };

  const openWebLegal = (path: 'terms' | 'privacy' | 'dmca') => {
    const url = `https://novesia.cc/${path}?lang=${lang}`;
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const totalNovels = history.length;
  const userIsVip = user?.role === 'VIP';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />

      {/* Subtle ambient luxury glow */}
      <LinearGradient
        colors={[colors.primary + '18', colors.primary + '05', 'rgba(0,0,0,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* 1. Hero User Profile Card */}
          {user ? (
            /* Logged in Executive Membership Card */
            <Pressable
              onPress={() => router.push('/akun')}
              style={({ pressed }) => [
                styles.userCard,
                {
                  backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Detail akun dan profil"
            >
              <View style={styles.avatarOuter}>
                <View
                  style={[
                    styles.avatarWrapper,
                    {
                      backgroundColor: colors.primaryMuted || colors.primary + '18',
                      borderColor: colors.primary + '40',
                    },
                  ]}
                >
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={36} color={colors.primary} />
                  )}
                </View>
                {/* Active Indicator Dot */}
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.surface,
                    },
                  ]}
                />
              </View>

              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text
                    numberOfLines={1}
                    style={[styles.userName, { color: colors.textPrimary }]}
                  >
                    {user.name}
                  </Text>

                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: userIsVip
                          ? colors.primaryMuted || colors.primary + '20'
                          : colors.surfaceElevated,
                        borderColor: userIsVip ? colors.primary + '60' : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={userIsVip ? 'diamond' : 'shield-checkmark-outline'}
                      size={10.5}
                      color={userIsVip ? colors.primary : colors.textMuted}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[
                        styles.roleBadgeText,
                        {
                          color: userIsVip ? colors.primary : colors.textMuted,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {userIsVip ? 'VIP' : 'Member'}
                    </Text>
                  </View>
                </View>

                <Text numberOfLines={1} style={[styles.userEmail, { color: colors.textMuted }]}>
                  {user.email}
                </Text>

                {gamification && (
                  <View style={styles.levelBadgeRow}>
                    <View
                      style={[
                        styles.levelPill,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.levelPillText, { color: colors.primary }]}>
                        Lv. {gamification.level}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.levelPill,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.levelPillText, { color: colors.textMuted }]}>
                        {gamification.totalXp} XP
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.chevronBadge,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
              </View>
            </Pressable>
          ) : (
            /* Guest Welcome & Sign In Card */
            <View
              style={[
                styles.guestCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.guestTopRow}>
                <View
                  style={[
                    styles.guestAvatar,
                    {
                      backgroundColor: colors.primaryMuted || colors.primary + '18',
                      borderColor: colors.primary + '30',
                    },
                  ]}
                >
                  <Ionicons name="person-outline" size={30} color={colors.primary} />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.guestTitle, { color: colors.textPrimary }]}>
                      {t.user_reader || 'Pembaca Novesia'}
                    </Text>
                    <View
                      style={[
                        styles.guestPill,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.guestPillText, { color: colors.textMuted }]}>
                        {lang === 'en' ? 'Guest' : 'Tamu'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.guestSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                    {lang === 'en'
                      ? 'Sign in to sync bookmarks across devices and claim daily rewards.'
                      : 'Masuk untuk sinkronisasi bookmark di cloud & klaim reward XP.'}
                  </Text>

                  <Pressable
                    onPress={() => setAuthModalVisible(true)}
                    style={({ pressed }) => [
                      styles.guestCtaBtn,
                      {
                        backgroundColor: colors.primaryMuted || colors.primary + '18',
                        borderColor: colors.primary + '40',
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Masuk atau daftar akun"
                  >
                    <Ionicons name="log-in-outline" size={13} color={colors.primary} />
                    <Text style={[styles.guestCtaText, { color: colors.primary }]}>
                      {t.sign_in_register || 'Masuk / Daftar Akun'}
                    </Text>
                    <Ionicons name="arrow-forward" size={11} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* 2. Level & Gamification Card (Exclusive Pass) */}
          <Pressable
            onPress={() => router.push('/rewards' as any)}
            style={({ pressed }) => [
              styles.gamifyCard,
              {
                backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Buka detail Level dan Rank"
          >
            <View style={styles.gamifyHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.gamifyIconBadge,
                    {
                      backgroundColor: colors.primaryMuted || colors.primary + '18',
                      borderColor: colors.primary + '30',
                    },
                  ]}
                >
                  <Ionicons name="trophy-outline" size={14} color={colors.primary} />
                </View>
                <Text style={[styles.gamifyTitle, { color: colors.textPrimary }]}>
                  {t.level_rank || 'Level & Rank'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {gamification && <RankBadge rank={gamification.rank} size="sm" />}
                <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
              </View>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 6 }} />
            ) : gamification ? (
              <>
                <View style={styles.xpRow}>
                  <Text style={[styles.xpLevelText, { color: colors.textPrimary }]}>
                    Level {gamification.level}
                  </Text>
                  <Text style={[styles.xpCountText, { color: colors.textMuted }]}>
                    {gamification.xpIntoLevel} / {gamification.xpForCurrentLevel} XP ({gamification.progressPercentage}%)
                  </Text>
                </View>

                {/* Minimalist 4px progress bar */}
                <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceElevated }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, Math.max(0, gamification.progressPercentage))}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.gamifyFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="sparkles-outline" size={11.5} color={colors.primary} />
                    <Text style={[styles.gamifyFooterText, { color: colors.textMuted }]}>
                      {gamification.totalXp} {t.total_xp}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="flame" size={12} color={colors.primary} />
                    <Text style={[styles.gamifyFooterText, { color: colors.textMuted }]}>
                      {gamification.currentStreak} {t.days_streak}
                    </Text>
                  </View>
                </View>
              </>
            ) : null}
          </Pressable>

          {/* 3. Stat Cards Row (Bookmarks, Reading History, Streak - All Interactive!) */}
          <View style={styles.statRow}>
            <StatCard
              icon="bookmark"
              label={t.bookmark}
              value={bookmarkCount}
              onPress={() => router.push('/(tabs)/library')}
            />
            <StatCard
              icon="book"
              label={t.continue_read}
              value={totalNovels}
              onPress={() => router.push('/(tabs)/library')}
            />
            <StatCard
              icon="flame"
              label={t.streak}
              value={
                gamification && gamification.currentStreak > 0
                  ? `${gamification.currentStreak} ${t.days}`
                  : `0 ${t.days}`
              }
              onPress={() => router.push('/rewards' as any)}
            />
          </View>

          {/* 4. Section 1: Application Preferences */}
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            {lang === 'en' ? 'PREFERENCES & READING' : 'PENGATURAN TAMPILAN & BACA'}
          </Text>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {[
              {
                icon: 'color-palette-outline' as const,
                label: t.theme_accent,
                previewDot: colors.primary,
                onPress: () => setThemeSheetVisible(true),
              },
              {
                icon: 'language-outline' as const,
                label: t.language_setting,
                badge: lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN',
                onPress: () => setLangSheetVisible(true),
              },
              {
                icon: 'text-outline' as const,
                label: lang === 'en' ? 'Reader Text & Layout' : 'Ukuran Font & Tampilan Baca',
                badge: `${readerFontSize}px`,
                onPress: () => router.push('/settings'),
              },
              {
                icon: 'notifications-outline' as const,
                label: t.notifications_update,
                badge: lang === 'en' ? 'Active' : 'Aktif',
                onPress: () =>
                  showPopup({
                    title: t.notif_active_title,
                    message: t.notif_active_msg,
                    icon: 'notifications-outline',
                    tone: 'gold',
                    showCancel: false,
                  }),
              },
            ].map((menu, i, arr) => (
              <Pressable
                key={menu.label}
                onPress={menu.onPress}
                style={({ pressed }) => [
                  styles.settingsRow,
                  {
                    backgroundColor: pressed ? colors.surfaceElevated : 'transparent',
                    borderBottomWidth: i !== arr.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={menu.label}
              >
                <View
                  style={[
                    styles.menuIconBadge,
                    {
                      backgroundColor: colors.primaryMuted || colors.primary + '18',
                      borderColor: colors.primary + '25',
                    },
                  ]}
                >
                  <Ionicons name={menu.icon} size={15} color={colors.primary} />
                </View>

                <Text
                  style={[styles.settingsLabel, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {menu.label}
                </Text>

                {'previewDot' in menu && menu.previewDot && (
                  <View
                    style={[
                      styles.previewColorDot,
                      {
                        backgroundColor: menu.previewDot,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                )}

                {'badge' in menu && menu.badge && (
                  <View
                    style={[
                      styles.settingsBadge,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.settingsBadgeText, { color: colors.textMuted }]}>
                      {menu.badge}
                    </Text>
                  </View>
                )}

                <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* 5. Section 2: Account & Data */}
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            {lang === 'en' ? 'ACCOUNT & DATA' : 'AKUN & DATA'}
          </Text>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {[
              {
                icon: 'person-outline' as const,
                label: t.account_details,
                onPress: () => (user ? router.push('/akun') : setAuthModalVisible(true)),
              },
              {
                icon: 'cloud-outline' as const,
                label: t.clear_history_cache,
                onPress: handleClearCache,
              },
              {
                icon: 'information-circle-outline' as const,
                label: t.about_app,
                badge: 'v1.0.0',
                onPress: () =>
                  showPopup({
                    title: 'Novesia v1.0.0',
                    message: t.about_dialog_desc,
                    icon: 'book-outline',
                    tone: 'gold',
                    showCancel: false,
                  }),
              },
            ].map((menu, i, arr) => (
              <Pressable
                key={menu.label}
                onPress={menu.onPress}
                style={({ pressed }) => [
                  styles.settingsRow,
                  {
                    backgroundColor: pressed ? colors.surfaceElevated : 'transparent',
                    borderBottomWidth: i !== arr.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={menu.label}
              >
                <View
                  style={[
                    styles.menuIconBadge,
                    {
                      backgroundColor: colors.primaryMuted || colors.primary + '18',
                      borderColor: colors.primary + '25',
                    },
                  ]}
                >
                  <Ionicons name={menu.icon} size={15} color={colors.primary} />
                </View>

                <Text
                  style={[styles.settingsLabel, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {menu.label}
                </Text>

                {'badge' in menu && menu.badge && (
                  <View
                    style={[
                      styles.settingsBadge,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.settingsBadgeText, { color: colors.textMuted }]}>
                      {menu.badge}
                    </Text>
                  </View>
                )}

                <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* 6. Sign Out Button (if logged in) */}
          {user && (
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutBtn,
                {
                  backgroundColor: colors.danger + '12',
                  borderColor: colors.danger + '30',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.logout_account}
            >
              <Ionicons name="log-out-outline" size={15} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>{t.logout_account}</Text>
            </Pressable>
          )}

          {/* 7. Legal Links Bar (Matching web footer) */}
          <View style={styles.legalLinksRow}>
            <Pressable
              onPress={() => openWebLegal('terms')}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="link"
              accessibilityLabel={lang === 'id' ? 'Syarat & Ketentuan' : 'Terms of Service'}
            >
              <Text style={[styles.legalLinkText, { color: colors.textMuted }]}>
                {lang === 'id' ? 'Syarat & Ketentuan' : 'Terms of Service'}
              </Text>
            </Pressable>

            <Text style={[styles.legalDot, { color: colors.border }]}>•</Text>

            <Pressable
              onPress={() => openWebLegal('privacy')}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="link"
              accessibilityLabel={lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}
            >
              <Text style={[styles.legalLinkText, { color: colors.textMuted }]}>
                {lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}
              </Text>
            </Pressable>

            <Text style={[styles.legalDot, { color: colors.border }]}>•</Text>

            <Pressable
              onPress={() => openWebLegal('dmca')}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="link"
              accessibilityLabel="DMCA"
            >
              <Text style={[styles.legalLinkText, { color: colors.textMuted }]}>
                DMCA
              </Text>
            </Pressable>
          </View>

          {/* 8. Subtle Footer */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Novesia Reader • {lang === 'en' ? 'Dark Luxury Experience' : 'Pengalaman Membaca Dark Luxury'}
            </Text>
            <Text style={[styles.footerVersionText, { color: colors.textMuted + '80' }]}>
              Build 1.0.0 (Release)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

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

      <ThemeSheet
        visible={themeSheetVisible}
        onClose={() => setThemeSheetVisible(false)}
      />

      <LanguageSheet
        visible={langSheetVisible}
        onClose={() => setLangSheetVisible(false)}
      />

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

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },

  // 1. Hero User Card (Logged In)
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  avatarOuter: {
    position: 'relative',
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 72,
    height: 72,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2.5,
  },
  userInfo: {
    flex: 1,
    gap: 4.5,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 18.5,
    fontWeight: '800',
    flexShrink: 1,
    letterSpacing: -0.4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
  },
  userEmail: {
    fontSize: 12.5,
    marginTop: 0.5,
  },
  levelBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  levelPill: {
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  chevronBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Guest Card
  guestCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 16,
    gap: 16,
  },
  guestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  guestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  guestPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  guestPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  guestSubtitle: {
    fontSize: 12,
    lineHeight: 16.5,
  },
  guestCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 6,
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: 7,
    borderWidth: 1,
  },
  guestCtaText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // 2. Gamify Card
  gamifyCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
    gap: 8,
  },
  gamifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gamifyIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gamifyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpLevelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  xpCountText: {
    fontSize: 10.5,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  gamifyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gamifyFooterText: {
    fontSize: 10.5,
  },

  // 3. Stats Row
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  // Section & Settings
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10.5,
    paddingHorizontal: 12,
    gap: 10,
  },
  menuIconBadge: {
    width: 29,
    height: 29,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  previewColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  settingsBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  settingsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    marginBottom: 14,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Footer
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
    flexWrap: 'wrap',
  },
  legalLinkText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  legalDot: {
    fontSize: 11,
    marginHorizontal: 2,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  footerText: {
    fontSize: 10.5,
    fontWeight: '400',
  },
  footerVersionText: {
    fontSize: 9.5,
    fontWeight: '400',
  },
});
