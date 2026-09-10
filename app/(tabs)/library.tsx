import React, { useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GradientBackground } from '../../components/GradientBackground';
import { CoverImage } from '../../components/CoverImage';
import { ErrorState } from '../../components/ErrorState';
import { AuthModal } from '../../components/AuthModal';
import { useAuthStore } from '../../lib/useAuthStore';
import { useTheme } from '../../lib/ThemeProvider';
import { useLanguage } from '../../lib/i18n';
import { apiGet, apiPost, apiDelete } from '../../lib/apiClient';
import { getHistory, clearHistory, HistoryItem } from '../../lib/history';

const LIBRARY_KEY = 'novesia_library';

type LibraryTab = 'bookmarks' | 'history';

interface SavedNovel {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  total_chapters: number;
  author: string | null;
  status: string | null;
  total_views?: number;
  rating?: number | null;
}

function formatRelativeTime(timestamp: number, lang: string): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return lang === 'en' ? 'Just now' : 'Baru saja';
  if (minutes < 60) return `${minutes} ${lang === 'en' ? 'min ago' : 'mnt lalu'}`;
  if (hours < 24) return `${hours} ${lang === 'en' ? 'h ago' : 'jam lalu'}`;
  if (days < 7) return `${days} ${lang === 'en' ? 'd ago' : 'hari lalu'}`;

  return new Date(timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

export default function LibraryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lang, t } = useLanguage();

  const user = useAuthStore((s) => s.user);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('bookmarks');
  const [bookmarks, setBookmarks] = useState<SavedNovel[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkError, setBookmarkError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBookmarks(), loadHistory()]);
    setLoading(false);
  };

  const loadBookmarks = async () => {
    const authUser = useAuthStore.getState().user;
    if (!authUser) {
      setBookmarks([]);
      setBookmarkError(false);
      return;
    }
    try {
      setBookmarkError(false);
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      const localIds: string[] = lib ? JSON.parse(lib) : [];

      // Jika ada bookmark lokal, sinkronkan ke server secara otomatis
      if (localIds.length > 0) {
        await apiPost('/api/me/bookmarks/sync', { novelIds: localIds }).catch(() => {});
      }

      // Ambil daftar bookmark resmi dari server
      const serverRes = await apiGet<{ bookmarks?: any[] }>('/api/me/bookmarks').catch(() => null);
      if (serverRes && Array.isArray(serverRes.bookmarks) && serverRes.bookmarks.length > 0) {
        const serverNovels = serverRes.bookmarks.map((b) => b.novel).filter(Boolean) as SavedNovel[];
        setBookmarks(serverNovels);
        const serverIds = serverNovels.map((n) => n.id);
        await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(serverIds));
        setBookmarkError(false);
        return;
      }

      // Fallback: jika server bookmarks kosong atau gagal, gunakan localIds
      if (localIds.length === 0) {
        setBookmarks([]);
        setBookmarkError(false);
        return;
      }

      const res = await apiGet<{ novels?: any[]; data?: any[] }>('/api/novels', {
        ids: localIds.join(','),
        limit: localIds.length,
      });
      const data = res.novels || res.data || (Array.isArray(res) ? res : []);

      const map = new Map((data || []).map((n: any) => [n.id, n]));
      const ordered = localIds.map((id) => map.get(id)).filter(Boolean) as SavedNovel[];
      setBookmarks(ordered);
      setBookmarkError(false);
    } catch {
      setBookmarkError(true);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await getHistory();
      setHistory(hist);
    } catch {
      setHistory([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const removeBookmark = async (novelId: string) => {
    try {
      apiDelete(`/api/me/bookmarks/${novelId}`).catch(() => {});
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      let saved: string[] = lib ? JSON.parse(lib) : [];
      saved = saved.filter((id) => id !== novelId);
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(saved));
      setBookmarks((prev) => prev.filter((n) => n.id !== novelId));
    } catch {}
  };

  const handleClearHistory = () => {
    Alert.alert(
      lang === 'en' ? 'Clear Reading History' : 'Hapus Riwayat Membaca',
      lang === 'en'
        ? 'Are you sure you want to clear all reading history?'
        : 'Yakin ingin menghapus seluruh riwayat membaca Anda?',
      [
        { text: lang === 'en' ? 'Cancel' : 'Batal', style: 'cancel' },
        {
          text: lang === 'en' ? 'Clear All' : 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const totalCount = activeTab === 'bookmarks' ? bookmarks.length : history.length;
  const subtitle =
    activeTab === 'bookmarks'
      ? `${totalCount} ${lang === 'en' ? 'novels saved' : 'novel tersimpan'}`
      : `${totalCount} ${lang === 'en' ? 'chapters read' : 'riwayat baca'}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />

      {/* Subtle ambient glow */}
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '06', 'rgba(13,16,18,0)']}
        locations={[0, 0.3, 0.6]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Title with Subtitle & Action */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {t.tab_library || 'Library'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {subtitle}
              </Text>
            </View>

            {/* Clear History Button in Header */}
            {activeTab === 'history' && history.length > 0 && (
              <Pressable
                onPress={handleClearHistory}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.clearHistoryBtn,
                  {
                    backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.clearHistoryText, { color: colors.textMuted }]}>
                  {lang === 'en' ? 'Clear' : 'Hapus'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Minimalist Segmented Pill Control */}
          <View
            style={[
              styles.segmentedContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Pressable
              onPress={() => setActiveTab('bookmarks')}
              style={[
                styles.segmentedTab,
                activeTab === 'bookmarks' && [
                  styles.segmentedTabActive,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.primary + '40',
                  },
                ],
              ]}
            >
              <Ionicons
                name={activeTab === 'bookmarks' ? 'bookmark' : 'bookmark-outline'}
                size={13}
                color={activeTab === 'bookmarks' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.segmentedTabText,
                  {
                    color: activeTab === 'bookmarks' ? colors.primary : colors.textMuted,
                    fontWeight: activeTab === 'bookmarks' ? '700' : '500',
                  },
                ]}
              >
                {t.bookmark || 'Bookmark'} {user ? `(${bookmarks.length})` : ''}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('history')}
              style={[
                styles.segmentedTab,
                activeTab === 'history' && [
                  styles.segmentedTabActive,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.primary + '40',
                  },
                ],
              ]}
            >
              <Ionicons
                name={activeTab === 'history' ? 'time' : 'time-outline'}
                size={13}
                color={activeTab === 'history' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.segmentedTabText,
                  {
                    color: activeTab === 'history' ? colors.primary : colors.textMuted,
                    fontWeight: activeTab === 'history' ? '700' : '500',
                  },
                ]}
              >
                {lang === 'en' ? 'History' : 'Riwayat'} ({history.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Contents */}
        {activeTab === 'bookmarks' ? (
          !user ? (
            <ScrollView
              contentContainerStyle={styles.emptyContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
            >
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.primaryMuted || colors.primary + '18', borderColor: colors.primary + '35' },
                ]}
              >
                <Ionicons name="bookmark" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {lang === 'en' ? 'Sign In to View Bookmarks' : 'Masuk untuk Melihat Simpanan'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {lang === 'en'
                  ? 'Sign in to your account to save novels and access your personal library anytime.'
                  : 'Masuk ke akun Anda untuk menyimpan novel favorit dan mengakses perpustakaan pribadi Anda kapan saja.'}
              </Text>
              <Pressable
                onPress={() => setAuthModalVisible(true)}
                style={[
                  styles.emptyActionBtn,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Ionicons name="log-in-outline" size={16} color="#000" />
                <Text style={[styles.emptyActionBtnText, { color: '#000', fontWeight: '800' }]}>
                  {lang === 'en' ? 'Sign In Now' : 'Masuk Sekarang'}
                </Text>
              </Pressable>
            </ScrollView>
          ) : bookmarkError && bookmarks.length === 0 && !loading ? (
            <ErrorState
              title={lang === 'en' ? 'Failed to Load Bookmarks' : 'Gagal Memuat Bookmark'}
              message={
                lang === 'en'
                  ? 'Slow connection or network error. Please check your internet.'
                  : 'Koneksi internet lambat atau bermasalah. Silakan periksa jaringan.'
              }
              onRetry={loadData}
            />
          ) : bookmarks.length === 0 && !loading ? (
            <ScrollView
              contentContainerStyle={styles.emptyContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
            >
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <Ionicons name="bookmark-outline" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {lang === 'en' ? 'No Saved Novels' : 'Belum Ada Novel Tersimpan'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {lang === 'en'
                  ? 'Bookmark favorite novels to easily access and read them anytime.'
                  : 'Simpan novel favorit Anda lewat ikon bookmark agar mudah dibaca kapan saja.'}
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/explore')}
                style={[
                  styles.emptyActionBtn,
                  { backgroundColor: colors.surface, borderColor: colors.primary + '50' },
                ]}
              >
                <Ionicons name="compass-outline" size={14} color={colors.primary} />
                <Text style={[styles.emptyActionBtnText, { color: colors.primary }]}>
                  {lang === 'en' ? 'Explore Novels' : 'Jelajahi Novel'}
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={bookmarks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/novel/${item.nu_slug}` as any)}
                  style={({ pressed }) => [
                    styles.novelCard,
                    {
                      backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.coverWrapper,
                      { backgroundColor: colors.surfaceElevated },
                    ]}
                  >
                    <CoverImage
                      uri={item.cover_url}
                      title={item.title}
                      width={62}
                      height={86}
                      borderRadius={8}
                    />
                  </View>

                  <View style={styles.cardDetails}>
                    <Text
                      numberOfLines={2}
                      style={[styles.cardTitle, { color: colors.textPrimary }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.cardAuthor, { color: colors.textMuted }]}
                    >
                      {item.author || (lang === 'en' ? 'Author Unknown' : 'Penulis Tidak Diketahui')}
                    </Text>

                    <View style={styles.statsRow}>
                      <View
                        style={[
                          styles.statBadge,
                          {
                            backgroundColor: colors.primaryMuted || colors.primary + '18',
                            borderColor: colors.primary + '30',
                          },
                        ]}
                      >
                        <Text style={[styles.statBadgeText, { color: colors.primary }]}>
                          {item.total_chapters} {lang === 'id' ? 'Bab' : 'Ch'}
                        </Text>
                      </View>

                      {item.rating != null && item.rating > 0 && (
                        <View
                          style={[
                            styles.statBadge,
                            {
                              backgroundColor: colors.surfaceElevated,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Ionicons name="star" size={10} color={colors.primary} />
                          <Text style={[styles.statBadgeText, { color: colors.textPrimary }]}>
                            {item.rating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => removeBookmark(item.id)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.bookmarkActionBtn,
                      {
                        backgroundColor: pressed
                          ? colors.primary + '30'
                          : colors.primaryMuted || colors.primary + '15',
                      },
                    ]}
                  >
                    <Ionicons name="bookmark" size={16} color={colors.primary} />
                  </Pressable>
                </Pressable>
              )}
            />
          )
        ) : history.length === 0 && !loading ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            <View
              style={[
                styles.emptyIconBadge,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <Ionicons name="time-outline" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {t.no_history || 'Riwayat Membaca Kosong'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {lang === 'en'
                ? 'Novels and chapters you read will appear here automatically.'
                : 'Novel dan chapter yang Anda baca akan tercatat di sini secara otomatis.'}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/explore')}
              style={[
                styles.emptyActionBtn,
                { backgroundColor: colors.surface, borderColor: colors.primary + '50' },
              ]}
            >
              <Ionicons name="book-outline" size={14} color={colors.primary} />
              <Text style={[styles.emptyActionBtnText, { color: colors.primary }]}>
                {lang === 'en' ? 'Start Reading' : 'Mulai Membaca'}
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={history}
            keyExtractor={(item) => item.novel_id + '_' + item.last_chapter_id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/read/${item.last_chapter_id}` as any)}
                style={({ pressed }) => [
                  styles.novelCard,
                  {
                    backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.coverWrapper,
                    { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <CoverImage
                    uri={item.cover}
                    title={item.title}
                    width={62}
                    height={86}
                    borderRadius={8}
                  />
                </View>

                <View style={styles.cardDetails}>
                  <Text
                    numberOfLines={2}
                    style={[styles.cardTitle, { color: colors.textPrimary }]}
                  >
                    {item.title}
                  </Text>

                  <View style={styles.historyMetaRow}>
                    <View
                      style={[
                        styles.statBadge,
                        {
                          backgroundColor: colors.primaryMuted || colors.primary + '18',
                          borderColor: colors.primary + '30',
                        },
                      ]}
                    >
                      <Ionicons name="book-outline" size={10} color={colors.primary} />
                      <Text style={[styles.statBadgeText, { color: colors.primary }]}>
                        {lang === 'en' ? 'Ch ' : 'Bab '}
                        {item.last_chapter}
                      </Text>
                    </View>

                    <Text style={[styles.historyTime, { color: colors.textMuted }]}>
                      {formatRelativeTime(item.timestamp, lang)}
                    </Text>
                  </View>
                </View>

                {/* Minimalist Resume Button */}
                <View
                  style={[
                    styles.resumeBtn,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.primary + '40',
                    },
                  ]}
                >
                  <Text style={[styles.resumeBtnText, { color: colors.primary }]}>
                    {lang === 'en' ? 'Read' : 'Lanjut'}
                  </Text>
                  <Ionicons name="arrow-forward" size={11} color={colors.primary} />
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '400',
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  clearHistoryText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Segmented Pill Tab
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    padding: 2.5,
    borderWidth: 1,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 7,
  },
  segmentedTabActive: {
    borderWidth: 1,
  },
  segmentedTabText: {
    fontSize: 12,
  },

  // Novel Card
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  novelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    gap: 10,
  },
  coverWrapper: {
    width: 62,
    height: 86,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardDetails: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardAuthor: {
    fontSize: 11,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  statBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  bookmarkActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },

  // History Meta
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  historyTime: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    marginRight: 2,
  },
  resumeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
