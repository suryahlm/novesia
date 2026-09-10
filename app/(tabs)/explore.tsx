import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '../../components/GradientBackground';
import { PopularGridCard } from '../../components/PopularGridCard';
import { NovelListRow, NovelListRowSkeleton } from '../../components/NovelListRow';
import { SkeletonNovelGrid } from '../../components/SkeletonLoader';
import { ViewModeToggle, GridViewMode } from '../../components/ViewModeToggle';
import NovelPreviewSheet from '../../components/NovelPreviewSheet';
import { NovelRequestModal } from '../../components/NovelRequestModal';
import { AuthModal } from '../../components/AuthModal';
import { useAuthStore } from '../../lib/useAuthStore';
import { useTheme } from '../../lib/ThemeProvider';
import { useLanguage } from '../../lib/i18n';
import { apiGet } from '../../lib/apiClient';
import { ErrorState } from '../../components/ErrorState';

const GENRE_OPTIONS = [
  'Semua',
  'Action',
  'Adventure',
  'Comedy',
  'Cultivation',
  'Drama',
  'Fantasy',
  'Harem',
  'Martial Arts',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-fi',
  'Supernatural',
  'Xianxia',
  'Xuanhuan',
];

const PAGE_SIZE = 18;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const { lang, t } = useLanguage();

  // Safe bottom padding for modals to prevent overlap with Android 3-button or gesture navigation bar
  const sheetBottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 44 : 16) + 20;

  const statusOptions = useMemo(
    () => [
      {
        key: 'ALL' as const,
        label: lang === 'en' ? 'All Status' : 'Semua Status',
        sub: lang === 'en' ? 'Show ongoing and completed novels' : 'Tampilkan semua status novel',
      },
      {
        key: 'ONGOING' as const,
        label: lang === 'en' ? 'Ongoing' : 'Berjalan',
        sub: lang === 'en' ? 'Still releasing new chapters' : 'Masih aktif rilis chapter baru',
      },
      {
        key: 'COMPLETED' as const,
        label: lang === 'en' ? 'Completed' : 'Tamat',
        sub: lang === 'en' ? 'Full story completed' : 'Cerita sudah selesai sepenuhnya',
      },
      {
        key: 'COMING_SOON' as const,
        label: lang === 'en' ? 'Coming Soon' : 'Segera Hadir',
        sub: lang === 'en' ? 'Novels in translation preparation' : 'Dalam persiapan rilis bab perdana',
      },
    ],
    [lang]
  );

  const sortOptions = useMemo(
    () => [
      {
        key: 'POPULAR' as const,
        label: lang === 'en' ? 'Most Popular' : 'Terpopuler',
        icon: 'flame-outline',
        sub: lang === 'en' ? 'Ranked by reader views' : 'Paling banyak dibaca pembaca',
      },
      {
        key: 'LATEST' as const,
        label: lang === 'en' ? 'Latest' : 'Terbaru',
        icon: 'time-outline',
        sub: lang === 'en' ? 'Recently updated chapters' : 'Pembaruan chapter terbaru',
      },
      {
        key: 'RATING' as const,
        label: lang === 'en' ? 'Highest Rating' : 'Rating Tertinggi',
        icon: 'star-outline',
        sub: lang === 'en' ? 'Highest rated by readers' : 'Skor ulasan tertinggi pembaca',
      },
      {
        key: 'CHAPTERS' as const,
        label: lang === 'en' ? 'Most Chapters' : 'Chapter Terbanyak',
        icon: 'layers-outline',
        sub: lang === 'en' ? 'Largest chapter count' : 'Jumlah chapter paling banyak',
      },
    ],
    [lang]
  );

  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState<'ALL' | 'ONGOING' | 'COMPLETED' | 'COMING_SOON'>('ALL');
  const [activeSort, setActiveSort] = useState<'POPULAR' | 'LATEST' | 'RATING' | 'CHAPTERS'>('POPULAR');
  const [activeGenre, setActiveGenre] = useState('Semua');
  const [viewMode, setViewMode] = useState<GridViewMode>(3);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isError, setIsError] = useState(false);
  const [previewNovel, setPreviewNovel] = useState<any | null>(null);

  const user = useAuthStore((s) => s.user);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestInitialTitle, setRequestInitialTitle] = useState('');
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const handleOpenRequestModal = (initialTitle: string = '') => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    setRequestInitialTitle(initialTitle);
    setRequestModalVisible(true);
  };

  const isFetchingRef = useRef(false);

  const gridGap = 12;
  const gridItemWidth3 = Math.floor((screenWidth - 16 * 2 - gridGap * 2) / 3);
  const gridItemWidth2 = Math.floor((screenWidth - 16 * 2 - gridGap) / 2);

  const cycleViewMode = () => {
    setViewMode((prev) => (prev === 3 ? 2 : prev === 2 ? 'list' : 3));
  };

  const hasActiveFilter = activeGenre !== 'Semua' || activeStatus !== 'ALL' || activeSort !== 'POPULAR';

  const resetFilters = () => {
    setActiveGenre('Semua');
    setActiveStatus('ALL');
    setActiveSort('POPULAR');
  };

  const activeSortObj = sortOptions.find((o) => o.key === activeSort) || sortOptions[0];
  const activeStatusObj = statusOptions.find((o) => o.key === activeStatus) || statusOptions[0];

  useEffect(() => {
    fetchNovels(0, true);
  }, [activeStatus, activeSort, activeGenre]);

  const fetchNovels = async (pageNum: number, reset: boolean) => {
    if (isFetchingRef.current && !reset) return;
    isFetchingRef.current = true;
    if (reset) {
      setLoading(true);
      setIsError(false);
    }

    try {
      const sortMap: Record<string, string> = {
        POPULAR: 'views',
        LATEST: 'updated',
        RATING: 'rating',
        CHAPTERS: 'chapters',
      };
      const params: Record<string, string | number> = {
        sort: sortMap[activeSort] || 'views',
        limit: PAGE_SIZE,
        page: pageNum + 1,
      };
      if (activeStatus === 'ONGOING') params['status'] = 'active,ongoing,published';
      else if (activeStatus === 'COMPLETED') params['status'] = 'completed';
      else if (activeStatus === 'COMING_SOON') params['status'] = 'coming_soon';
      if (activeGenre !== 'Semua') params['genre'] = activeGenre;

      const endpoint = activeStatus === 'COMING_SOON' ? '/api/novels/coming-soon' : '/api/novels';
      const res = await apiGet<{ novels?: any[]; data?: any[] }>(endpoint, params);
      const data = res.novels || res.data || (Array.isArray(res) ? res : []);

      if (data) {
        if (reset) {
          setNovels(data);
        } else {
          setNovels((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newUnique = data.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newUnique];
          });
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (e) {
      console.error(e);
      if (reset) setIsError(true);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNovels(0, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading && !isFetchingRef.current) {
      fetchNovels(page + 1, false);
    }
  };

  const openNovel = useCallback(
    (slug: string) => {
      router.push(`/novel/${slug}` as any);
    },
    [router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />

      {/* Subtle ambient lighting */}
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '06', 'rgba(13,16,18,0)']}
        locations={[0, 0.3, 0.6]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Title & ViewModeToggle */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {t.tab_explore}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {lang === 'en'
                  ? 'Discover thousands of translated web novels'
                  : 'Temukan ribuan novel terjemahan berkualitas'}
              </Text>
            </View>
            <ViewModeToggle
              mode={viewMode}
              onPress={cycleViewMode}
              accessibilityLabel={`Ganti tampilan (sekarang ${viewMode === 'list' ? 'list' : viewMode + ' kolom'})`}
            />
          </View>

          {/* Minimalist Search Bar */}
          <Pressable
            onPress={() => router.push('/search' as any)}
            accessibilityRole="button"
            accessibilityLabel="Cari judul novel, author, atau genre"
            style={({ pressed }) => [
              styles.searchBar,
              {
                backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search-outline" size={16} color={colors.primary} />
            <Text style={[styles.searchBarPlaceholder, { color: colors.textMuted }]}>
              {lang === 'en'
                ? 'Search title, author, or genre…'
                : 'Cari judul novel, author, atau genre…'}
            </Text>
          </Pressable>
        </View>

        {/* 1. Primary Genre Pill Tabs (Horizontal ScrollView - Zero Overlap Bug) */}
        <View style={styles.genreWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreListContent}
          >
            {GENRE_OPTIONS.map((item) => {
              const active = item === activeGenre;
              const label = item === 'Semua' && lang === 'en' ? 'All' : item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setActiveGenre(item)}
                  style={[
                    styles.genrePill,
                    active
                      ? [styles.genrePillActive, { backgroundColor: colors.primary }]
                      : [
                          styles.genrePillInactive,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.genrePillText,
                      {
                        color: active ? colors.textOnPrimary : colors.textSecondary,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Control Bar: Status Dropdown + Sort Dropdown (Equal 50/50 Flex - Cannot Collide) */}
        <View style={styles.controlRow}>
          {/* Status Dropdown */}
          <Pressable
            onPress={() => setStatusModalVisible(true)}
            style={({ pressed }) => [
              styles.dropdownBtn,
              {
                backgroundColor: activeStatus !== 'ALL' ? colors.primary + '18' : colors.surface,
                borderColor: activeStatus !== 'ALL' ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name="filter-outline"
              size={13}
              color={activeStatus !== 'ALL' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.dropdownBtnText,
                {
                  color: activeStatus !== 'ALL' ? colors.primary : colors.textPrimary,
                  fontWeight: activeStatus !== 'ALL' ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {activeStatus === 'ALL'
                ? (lang === 'en' ? 'All Status' : 'Semua Status')
                : activeStatusObj.label}
            </Text>
            <Ionicons name="chevron-down" size={11} color={colors.textMuted} />
          </Pressable>

          {/* Sort Dropdown */}
          <Pressable
            onPress={() => setSortModalVisible(true)}
            style={({ pressed }) => [
              styles.dropdownBtn,
              {
                backgroundColor:
                  activeSort !== 'POPULAR' ? colors.primary + '18' : colors.surface,
                borderColor: activeSort !== 'POPULAR' ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name="swap-vertical"
              size={13}
              color={activeSort !== 'POPULAR' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.dropdownBtnText,
                {
                  color: activeSort !== 'POPULAR' ? colors.primary : colors.textPrimary,
                  fontWeight: activeSort !== 'POPULAR' ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {activeSortObj.label}
            </Text>
            <Ionicons name="chevron-down" size={11} color={colors.textMuted} />
          </Pressable>

          {/* Request Novel Button */}
          <Pressable
            onPress={() => handleOpenRequestModal('')}
            style={({ pressed }) => [
              styles.requestBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={lang === 'en' ? 'Request Novel' : 'Permintaan Novel'}
          >
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={[styles.requestBtnText, { color: colors.primary }]}>
              {lang === 'en' ? 'Request' : 'Request'}
            </Text>
          </Pressable>

          {/* Reset button if filter is active */}
          {hasActiveFilter && (
            <Pressable
              onPress={resetFilters}
              hitSlop={6}
              style={({ pressed }) => [
                styles.resetBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="refresh-outline" size={14} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {/* 3. Novel Catalog Grid / List */}
        {loading && novels.length === 0 ? (
          viewMode === 'list' ? (
            <View style={{ flex: 1 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <NovelListRowSkeleton key={i} />
              ))}
            </View>
          ) : (
            <SkeletonNovelGrid
              count={viewMode === 2 ? 8 : 12}
              cardWidth={viewMode === 2 ? gridItemWidth2 : gridItemWidth3}
              cardHeight={Math.round((viewMode === 2 ? gridItemWidth2 : gridItemWidth3) * 1.3)}
              columnGap={gridGap}
              rowGap={12}
            />
          )
        ) : viewMode === 'list' ? (
          <FlatList
            key="list"
            style={{ flex: 1 }}
            data={novels}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <NovelListRow
                novel={item}
                onPress={openNovel}
                onLongPress={() => setPreviewNovel(item)}
              />
            )}
            ListFooterComponent={
              loading && novels.length > 0 ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                isError && novels.length === 0 ? (
                  <ErrorState
                    message={lang === 'en' ? 'Failed to load novels. Please check your internet connection.' : 'Gagal memuat novel. Periksa koneksi internet Anda.'}
                    onRetry={() => fetchNovels(0, true)}
                  />
                ) : (
                <View style={styles.emptyContainer}>
                  <View
                    style={[
                      styles.emptyIconBadge,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="compass-outline" size={28} color={colors.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    {lang === 'en' ? 'No Novels Found' : 'Tidak Ada Novel Ditemukan'}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    {lang === 'en'
                      ? 'Try selecting a different genre or status filter'
                      : 'Coba gunakan genre atau filter status lainnya'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    {hasActiveFilter && (
                      <Pressable
                        onPress={resetFilters}
                        style={[
                          styles.emptyResetBtn,
                          { backgroundColor: colors.surface, borderColor: colors.primary + '50', marginTop: 0 },
                        ]}
                      >
                        <Ionicons name="refresh-outline" size={13} color={colors.primary} />
                        <Text style={[styles.emptyResetBtnText, { color: colors.primary }]}>
                          {lang === 'en' ? 'Reset Filters' : 'Atur Ulang Filter'}
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleOpenRequestModal('')}
                      style={[
                        styles.emptyResetBtn,
                        { backgroundColor: colors.surface, borderColor: colors.primary, marginTop: 0 },
                      ]}
                    >
                      <Ionicons name="sparkles" size={13} color={colors.primary} />
                      <Text style={[styles.emptyResetBtnText, { color: colors.primary, fontWeight: '700' }]}>
                        {t.explore_empty_request_btn || (lang === 'en' ? 'Request This Novel' : 'Request Novel Ini')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                )
              ) : null
            }
          />
        ) : (
          <FlatList
            key={`grid-${viewMode}`}
            style={{ flex: 1 }}
            data={novels}
            keyExtractor={(item) => item.id}
            numColumns={viewMode as number}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={{ gap: gridGap }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <PopularGridCard
                novel={item}
                width={viewMode === 2 ? gridItemWidth2 : gridItemWidth3}
                onPress={openNovel}
                onLongPress={() => setPreviewNovel(item)}
              />
            )}
            ListFooterComponent={
              loading && novels.length > 0 ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                isError && novels.length === 0 ? (
                  <ErrorState
                    message={lang === 'en' ? 'Failed to load novels. Please check your internet connection.' : 'Gagal memuat novel. Periksa koneksi internet Anda.'}
                    onRetry={() => fetchNovels(0, true)}
                  />
                ) : (
                <View style={styles.emptyContainer}>
                  <View
                    style={[
                      styles.emptyIconBadge,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="compass-outline" size={28} color={colors.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    {lang === 'en' ? 'No Novels Found' : 'Tidak Ada Novel Ditemukan'}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    {lang === 'en'
                      ? 'Try selecting a different genre or status filter'
                      : 'Coba gunakan genre atau filter status lainnya'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    {hasActiveFilter && (
                      <Pressable
                        onPress={resetFilters}
                        style={[
                          styles.emptyResetBtn,
                          { backgroundColor: colors.surface, borderColor: colors.primary + '50', marginTop: 0 },
                        ]}
                      >
                        <Ionicons name="refresh-outline" size={13} color={colors.primary} />
                        <Text style={[styles.emptyResetBtnText, { color: colors.primary }]}>
                          {lang === 'en' ? 'Reset Filters' : 'Atur Ulang Filter'}
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleOpenRequestModal('')}
                      style={[
                        styles.emptyResetBtn,
                        { backgroundColor: colors.surface, borderColor: colors.primary, marginTop: 0 },
                      ]}
                    >
                      <Ionicons name="sparkles" size={13} color={colors.primary} />
                      <Text style={[styles.emptyResetBtnText, { color: colors.primary, fontWeight: '700' }]}>
                        {t.explore_empty_request_btn || (lang === 'en' ? 'Request This Novel' : 'Request Novel Ini')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                )
              ) : null
            }
          />
        )}
      </SafeAreaView>

      {/* ═══ MINIMALIST STATUS SHEET MODAL ═══ */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setStatusModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surfaceElevated || '#12161A',
                borderColor: colors.primary + '30',
                paddingBottom: sheetBottomPadding,
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.modalHeaderIconBadge,
                    { backgroundColor: colors.primaryMuted || colors.primary + '20' },
                  ]}
                >
                  <Ionicons name="filter-outline" size={15} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {lang === 'en' ? 'Filter by Status' : 'Filter Status Novel'}
                </Text>
              </View>
              <Pressable
                onPress={() => setStatusModalVisible(false)}
                hitSlop={8}
                style={[styles.modalCloseCircle, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              {statusOptions.map((opt) => {
                const active = opt.key === activeStatus;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      setActiveStatus(opt.key);
                      setStatusModalVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.sortOptionCard,
                      {
                        backgroundColor: active
                          ? colors.primaryMuted || colors.primary + '18'
                          : pressed
                          ? colors.surfaceElevated
                          : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.sortOptionIconBadge,
                        {
                          backgroundColor: active
                            ? colors.primary + '25'
                            : colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          opt.key === 'ALL'
                            ? 'grid-outline'
                            : opt.key === 'ONGOING'
                            ? 'flash-outline'
                            : opt.key === 'COMPLETED'
                            ? 'checkmark-done-circle-outline'
                            : 'time-outline'
                        }
                        size={17}
                        color={active ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 1.5 }}>
                      <Text
                        style={[
                          styles.sortOptionTitle,
                          {
                            color: active ? colors.primary : colors.textPrimary,
                            fontWeight: active ? '700' : '600',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.sortOptionSub, { color: colors.textMuted }]}>
                        {opt.sub}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    ) : (
                      <View
                        style={[
                          styles.sortRadioCircle,
                          { borderColor: colors.border },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ MINIMALIST SORT SHEET MODAL ═══ */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSortModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surfaceElevated || '#12161A',
                borderColor: colors.primary + '30',
                paddingBottom: sheetBottomPadding,
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.modalHeaderIconBadge,
                    { backgroundColor: colors.primaryMuted || colors.primary + '20' },
                  ]}
                >
                  <Ionicons name="swap-vertical" size={15} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {lang === 'en' ? 'Sort Novels' : 'Urutkan Novel'}
                </Text>
              </View>
              <Pressable
                onPress={() => setSortModalVisible(false)}
                hitSlop={8}
                style={[styles.modalCloseCircle, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              {sortOptions.map((opt) => {
                const active = opt.key === activeSort;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      setActiveSort(opt.key);
                      setSortModalVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.sortOptionCard,
                      {
                        backgroundColor: active
                          ? colors.primaryMuted || colors.primary + '18'
                          : pressed
                          ? colors.surfaceElevated
                          : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.sortOptionIconBadge,
                        {
                          backgroundColor: active
                            ? colors.primary + '25'
                            : colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={17}
                        color={active ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 1.5 }}>
                      <Text
                        style={[
                          styles.sortOptionTitle,
                          {
                            color: active ? colors.primary : colors.textPrimary,
                            fontWeight: active ? '700' : '600',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.sortOptionSub, { color: colors.textMuted }]}>
                        {opt.sub}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    ) : (
                      <View
                        style={[
                          styles.sortRadioCircle,
                          { borderColor: colors.border },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Novel Preview Modal */}
      <NovelPreviewSheet
        visible={!!previewNovel}
        novel={previewNovel}
        onClose={() => setPreviewNovel(null)}
        onRead={(slug) => openNovel(slug)}
      />

      {/* Novel Request Modal */}
      <NovelRequestModal
        visible={requestModalVisible}
        initialTitle={requestInitialTitle}
        onClose={() => setRequestModalVisible(false)}
        onOpenAuthModal={() => {
          setRequestModalVisible(false);
          setAuthModalVisible(true);
        }}
      />

      {/* Auth Modal for Guests */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 10,
    height: 40,
    gap: 8,
  },
  searchBarPlaceholder: {
    flex: 1,
    fontSize: 12.5,
  },

  // 1. Genre pills row (horizontal ScrollView, clean container)
  genreWrapper: {
    marginBottom: 8,
  },
  genreListContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  genrePill: {
    height: 30,
    paddingHorizontal: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genrePillActive: {},
  genrePillInactive: {
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 11.5,
  },

  // 2. Dropdown Control Row (Equal 50/50 flex, impossible to overlap)
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  dropdownBtn: {
    flex: 1,
    height: 35,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  dropdownBtnText: {
    fontSize: 11.5,
    flexShrink: 1,
  },
  resetBtn: {
    width: 35,
    height: 35,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBtn: {
    height: 35,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    gap: 5,
  },
  requestBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Grid
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
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
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  modalHeaderIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
    gap: 10,
  },
  sortOptionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptionTitle: {
    fontSize: 12.5,
  },
  sortOptionSub: {
    fontSize: 10.5,
  },
  sortRadioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});
