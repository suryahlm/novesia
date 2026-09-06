import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '../../components/GradientBackground';
import { GoldSurface } from '../../components/GoldSurface';
import { ShimmerText } from '../../components/ShimmerText';
import { PopularGridCard } from '../../components/PopularGridCard';
import { NovelListRow, NovelListRowSkeleton } from '../../components/NovelListRow';
import { SkeletonNovelGrid } from '../../components/SkeletonLoader';
import { ViewModeToggle, GridViewMode } from '../../components/ViewModeToggle';
import NovelPreviewSheet from '../../components/NovelPreviewSheet';
import { useTheme } from '../../lib/ThemeProvider';
import { useLanguage } from '../../lib/i18n';
import { apiGet } from '../../lib/apiClient';

const STATUS_OPTIONS = [
  { key: 'ALL', label: 'Semua Status' },
  { key: 'ONGOING', label: 'Ongoing' },
  { key: 'COMPLETED', label: 'Completed' },
] as const;

const SORT_OPTIONS = [
  { key: 'POPULAR', label: 'Terpopuler' },
  { key: 'LATEST', label: 'Terbaru' },
  { key: 'RATING', label: 'Rating Tertinggi' },
  { key: 'CHAPTERS', label: 'Chapter Terbanyak' },
] as const;

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

function InlineFilterRow<T extends string>({
  options,
  activeKey,
  onChange,
}: {
  options: readonly { key: T; label: string }[] | { key: T; label: string }[];
  activeKey: T;
  onChange: (key: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <FlatList
      data={options}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      renderItem={({ item }) => {
        const active = item.key === activeKey;
        const chipStyle = {
          paddingHorizontal: 14,
          paddingVertical: 5,
          borderRadius: 999,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        };

        if (active) {
          return (
            <Pressable onPress={() => onChange(item.key)}>
              <GoldSurface shimmer style={chipStyle}>
                <ShimmerText
                  style={{ fontSize: 11.5, fontWeight: '700' }}
                  baseColor={colors.textOnPrimary}
                  shineColor="rgba(255,250,230,0.95)"
                >
                  {item.label}
                </ShimmerText>
              </GoldSurface>
            </Pressable>
          );
        }

        return (
          <Pressable onPress={() => onChange(item.key)}>
            <View
              style={[
                chipStyle,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '600' }}>
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const PAGE_SIZE = 18;

export default function ExploreScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const { lang, t } = useLanguage();

  const statusOptions = useMemo(
    () => [
      { key: 'ALL' as const, label: lang === 'en' ? 'All Status' : 'Semua Status' },
      { key: 'ONGOING' as const, label: lang === 'en' ? 'Ongoing' : 'Berjalan' },
      { key: 'COMPLETED' as const, label: lang === 'en' ? 'Completed' : 'Tamat' },
    ],
    [lang]
  );

  const sortOptions = useMemo(
    () => [
      { key: 'POPULAR' as const, label: lang === 'en' ? 'Most Popular' : 'Terpopuler' },
      { key: 'LATEST' as const, label: lang === 'en' ? 'Latest' : 'Terbaru' },
      { key: 'RATING' as const, label: lang === 'en' ? 'Highest Rating' : 'Rating Tertinggi' },
      { key: 'CHAPTERS' as const, label: lang === 'en' ? 'Most Chapters' : 'Chapter Terbanyak' },
    ],
    [lang]
  );

  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [activeSort, setActiveSort] = useState<'POPULAR' | 'LATEST' | 'RATING' | 'CHAPTERS'>('POPULAR');
  const [activeGenre, setActiveGenre] = useState('Semua');
  const [viewMode, setViewMode] = useState<GridViewMode>(3);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [previewNovel, setPreviewNovel] = useState<any | null>(null);

  const isFetchingRef = useRef(false);

  const gridGap = 12;
  const gridItemWidth3 = Math.floor((screenWidth - 16 * 2 - gridGap * 2) / 3);
  const gridItemWidth2 = Math.floor((screenWidth - 16 * 2 - gridGap) / 2);

  const cycleViewMode = () => {
    setViewMode((prev) => (prev === 3 ? 2 : prev === 2 ? 'list' : 3));
  };

  // Debounce search query 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchNovels(0, true);
  }, [activeStatus, activeSort, activeGenre, debouncedSearch]);

  const fetchNovels = async (pageNum: number, reset: boolean) => {
    if (isFetchingRef.current && !reset) return;
    isFetchingRef.current = true;
    if (reset) setLoading(true);

    try {
      // Bangun params untuk REST API
      const sortMap: Record<string, string> = {
        POPULAR: 'views',
        LATEST: 'updated',
        RATING: 'rating',
        CHAPTERS: 'chapters',
      };
      const params: Record<string, string | number> = {
        sort: sortMap[activeSort] || 'rating',
        limit: PAGE_SIZE,
        page: pageNum + 1,
      };
      if (debouncedSearch.trim()) params['q'] = debouncedSearch.trim();
      if (activeStatus === 'ONGOING') params['status'] = 'active,ongoing,published';
      else if (activeStatus === 'COMPLETED') params['status'] = 'completed';
      if (activeGenre !== 'Semua') params['genre'] = activeGenre;

      const endpoint = debouncedSearch.trim() ? '/api/novels/search' : '/api/novels';
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
        locations={[0.5, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Title with Shimmer & ViewModeToggle */}
        <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ShimmerText
              style={{ fontSize: 24, fontWeight: '900', letterSpacing: 0.5 }}
              baseColor={colors.primary}
              shineColor="rgba(255,250,230,0.95)"
            >
              {t.tab_explore}
            </ShimmerText>
            <ViewModeToggle
              mode={viewMode}
              onPress={cycleViewMode}
              accessibilityLabel={`Ganti tampilan (sekarang ${viewMode === 'list' ? 'list' : viewMode + ' kolom'})`}
            />
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {lang === 'en' ? 'Discover thousands of high quality translated novels' : 'Temukan ribuan novel terjemahan berkualitas tinggi'}
          </Text>

          {/* Search Bar Button (Opens /search with SearchEmptyRing animation - Komiku Pattern) */}
          <Pressable
            onPress={() => router.push('/search' as any)}
            accessibilityRole="button"
            accessibilityLabel="Cari judul novel, author, atau genre"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              marginTop: 12,
              height: 46,
              gap: 10,
            })}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <Text style={{ flex: 1, color: colors.textMuted, fontSize: 13 }}>
              {lang === 'en' ? 'Search novel title, author, or genre…' : 'Cari judul novel, author, atau genre…'}
            </Text>
          </Pressable>
        </View>


        {/* Filter Rows */}
        <View style={{ gap: 8, paddingBottom: 12 }}>
          {/* Status Filter */}
          <InlineFilterRow
            options={statusOptions}
            activeKey={activeStatus}
            onChange={setActiveStatus}
          />

          {/* Sort Filter */}
          <InlineFilterRow
            options={sortOptions}
            activeKey={activeSort}
            onChange={setActiveSort}
          />

          {/* Genre Filter */}
          <FlatList
            data={GENRE_OPTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => {
              const active = item === activeGenre;
              return (
                <Pressable onPress={() => setActiveGenre(item)}>
                  {active ? (
                    <GoldSurface
                      shimmer
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 5,
                        borderRadius: 999,
                      }}
                    >
                      <ShimmerText
                        style={{ fontSize: 11.5, fontWeight: '700' }}
                        baseColor={colors.textOnPrimary}
                        shineColor="rgba(255,250,230,0.95)"
                      >
                        {item}
                      </ShimmerText>
                    </GoldSurface>
                  ) : (
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '600' }}
                      >
                        {item}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>

        {/* Novel Catalog Grid / List */}
        {loading && novels.length === 0 ? (
          viewMode === 'list' ? (
            <View>
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
            data={novels}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
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
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                  <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                    Tidak ada novel ditemukan
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                    Coba gunakan kata kunci atau filter lain
                  </Text>
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList
            key={`grid-${viewMode}`}
            data={novels}
            keyExtractor={(item) => item.id}
            numColumns={viewMode as number}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 40,
              gap: 12,
            }}
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
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                  <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                    Tidak ada novel ditemukan
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                    Coba gunakan kata kunci atau filter lain
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>

      <NovelPreviewSheet
        visible={!!previewNovel}
        novel={previewNovel}
        onClose={() => setPreviewNovel(null)}
        onRead={(slug) => openNovel(slug)}
      />
    </View>
  );
}
