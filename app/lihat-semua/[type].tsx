import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NovelListRow, NovelListRowSkeleton } from '../../components/NovelListRow';
import { GradientBackground } from '../../components/GradientBackground';
import { PopularGridCard } from '../../components/PopularGridCard';
import { SkeletonNovelGrid } from '../../components/SkeletonLoader';
import { GridViewMode, ViewModeToggle } from '../../components/ViewModeToggle';
import NovelPreviewSheet from '../../components/NovelPreviewSheet';
import {
  NovelItem,
  useLatestNovelsInfinite,
  usePopularNovelsInfinite,
} from '../../lib/useNovelsQuery';
import { useTheme } from '../../lib/ThemeProvider';

const TYPE_CONFIG: Record<string, { title: string; source: 'popular' | 'latest' }> = {
  trending: { title: 'Trending & Populer', source: 'popular' },
  populer: { title: 'Populer Minggu Ini', source: 'popular' },
  rankings: { title: 'Top Rankings', source: 'popular' },
  terbaru: { title: 'Update Terbaru', source: 'latest' },
  rekomendasi: { title: 'Recommended For You', source: 'latest' },
};

const GRID_COLUMNS = 3;

export default function LihatSemuaScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const config = TYPE_CONFIG[type ?? ''] ?? { title: 'Semua Novel', source: 'popular' as const };
  const isPopular = config.source === 'popular';

  const popular = usePopularNovelsInfinite({ enabled: isPopular });
  const latest = useLatestNovelsInfinite({ enabled: !isPopular });
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = isPopular ? popular : latest;

  const novels = useMemo(() => {
    const rawList = data?.pages?.flat() ?? [];
    return rawList.filter((item): item is NovelItem => Boolean(item && (item.id || item.nu_slug)));
  }, [data]);

  const [viewMode, setViewMode] = useState<GridViewMode>(3);
  const cycleViewMode = useCallback(() => setViewMode((m) => (m === 3 ? 'list' : 3)), []);
  const [previewNovel, setPreviewNovel] = useState<NovelItem | null>(null);

  const screenWidth = Math.max(windowWidth || 0, 360);
  const gridGap = 12;
  const gridItemWidth = Math.max(
    80,
    Math.floor((screenWidth - 16 * 2 - gridGap * (GRID_COLUMNS - 1)) / GRID_COLUMNS)
  );
  const gridItemHeight = Math.max(104, Math.round(gridItemWidth * 1.3));

  const openNovel = useCallback(
    (slug: string) => {
      router.push(`/novel/${slug}` as any);
    },
    [router]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const keyExtractor = useCallback((item: NovelItem, index: number) => {
    return item?.id ?? item?.nu_slug ?? String(index);
  }, []);

  const renderListItem = useCallback(
    ({ item }: { item: NovelItem }) => {
      if (!item) return null;
      return (
        <NovelListRow
          novel={item}
          onPress={openNovel}
          onLongPress={() => setPreviewNovel(item)}
        />
      );
    },
    [openNovel]
  );

  const renderGridItem = useCallback(
    ({ item, index }: { item: NovelItem; index: number }) => {
      if (!item) return null;
      return (
        <PopularGridCard
          novel={item}
          width={gridItemWidth}
          onPress={openNovel}
          onLongPress={() => setPreviewNovel(item)}
          rank={isPopular ? index : undefined}
        />
      );
    },
    [openNovel, gridItemWidth, isPopular]
  );

  const footer = isFetchingNextPage ? (
    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : null;

  const emptyComponent = !isLoading ? (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Ionicons name="book-outline" size={48} color={colors.textMuted} />
      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
        Belum ada novel tersedia
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
        Tarik ke bawah untuk menyegarkan daftar
      </Text>
    </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Bar */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            marginBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}
              >
                {config.title}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' }}>
                {novels.length} Novel dimuat
              </Text>
            </View>
            <ViewModeToggle
              mode={viewMode}
              accessibilityLabel={`Tampilkan ${viewMode === 3 ? 'mode list' : '3 kolom'}`}
              onPress={cycleViewMode}
            />
          </View>
        </View>

        {isError && novels.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
              Gagal memuat daftar novel
            </Text>
            <Pressable
              onPress={() => refetch()}
              style={{
                marginTop: 16,
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: colors.primary,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#0D1012', fontWeight: '700' }}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : isLoading && novels.length === 0 ? (
          viewMode === 'list' ? (
            <View style={{ flex: 1, paddingTop: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <NovelListRowSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={{ flex: 1, paddingTop: 12 }}>
              <SkeletonNovelGrid
                count={9}
                cardWidth={gridItemWidth}
                cardHeight={gridItemHeight}
                columnGap={gridGap}
                rowGap={12}
              />
            </View>
          )
        ) : viewMode === 'list' ? (
          <FlatList
            key="list"
            style={{ flex: 1 }}
            data={novels}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
            renderItem={renderListItem}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android' ? false : true}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={footer}
            ListEmptyComponent={emptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        ) : (
          <FlatList
            key="grid"
            style={{ flex: 1 }}
            data={novels}
            keyExtractor={keyExtractor}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={{ gap: gridGap }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 40,
              gap: 12,
            }}
            renderItem={renderGridItem}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            initialNumToRender={12}
            maxToRenderPerBatch={9}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android' ? false : true}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={footer}
            ListEmptyComponent={emptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
      </SafeAreaView>

      {/* Novel Preview Sheet on Long Press */}
      <NovelPreviewSheet
        visible={!!previewNovel}
        onClose={() => setPreviewNovel(null)}
        novel={previewNovel}
        onRead={openNovel}
      />
    </View>
  );
}
