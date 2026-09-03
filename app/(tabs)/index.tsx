import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useFonts } from 'expo-font';

import { GradientBackground } from '../../components/GradientBackground';
import { FeaturedCarousel } from '../../components/FeaturedCarousel';
import { ShimmerText } from '../../components/ShimmerText';
import { GoldSurface } from '../../components/GoldSurface';
import { TrendingRankCard } from '../../components/TrendingRankCard';
import { ContinueReadingCard } from '../../components/ContinueReadingCard';
import { PopularGridCard } from '../../components/PopularGridCard';
import { NovelListRow } from '../../components/NovelListRow';
import { ViewModeToggle, GridViewMode } from '../../components/ViewModeToggle';
import NovelPreviewSheet from '../../components/NovelPreviewSheet';
import { useTheme } from '../../lib/ThemeProvider';
import { usePopularNovels, useLatestNovels, useIndonesianNovels, NovelItem } from '../../lib/useNovelsQuery';
import { getHistory, HistoryItem } from '../../lib/history';
import { SkeletonCarousel, SkeletonNovelGrid, SkeletonBox } from '../../components/SkeletonLoader';

const LANGUAGE_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'en', label: 'English' },
  { key: 'id', label: 'Indonesia' },
] as const;

type LanguageFilterKey = typeof LANGUAGE_FILTERS[number]['key'];

export default function HomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [logoFontLoaded] = useFonts({ BarberChop: require('../../assets/fonts/BarberChop.otf') });
  const logoFontStyle = logoFontLoaded ? { fontFamily: 'BarberChop', fontWeight: '400' as const } : { fontWeight: '700' as const };

  // Fast TanStack Query with 5-minute memory cache
  const { data: novels = [], isLoading: loadingPopular } = usePopularNovels();
  const { data: latestNovels = [], isLoading: loadingLatest } = useLatestNovels();
  const { data: indonesianNovels = [], isLoading: loadingIndonesian } = useIndonesianNovels();

  const [activeLang, setActiveLang] = useState<LanguageFilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [continueReading, setContinueReading] = useState<HistoryItem[]>([]);
  const [previewNovel, setPreviewNovel] = useState<NovelItem | null>(null);
  const [updateViewMode, setUpdateViewMode] = useState<GridViewMode>(3);
  const cycleUpdateViewMode = useCallback(
    () => setUpdateViewMode((m) => (m === 3 ? 2 : m === 2 ? 'list' : 3)),
    []
  );

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setContinueReading);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['novels'] }),
      getHistory().then(setContinueReading),
    ]);
    setRefreshing(false);
  };

  const openNovel = useCallback(
    (slug: string) => {
      router.push(`/novel/${slug}` as any);
    },
    [router]
  );

  const openChapter = useCallback(
    (chapterId: string) => {
      router.push(`/read/${chapterId}` as any);
    },
    [router]
  );

  // Filter novels by language ("Semua" / "English" / "Indonesia")
  // 1. "all" (Semua): Menampilkan semua novel tanpa memandang bulu dari terjemahan
  // 2. "en" (English): Menampilkan novel bahasa inggris (meski sudah ada terjemahan indo tetap tampil)
  // 3. "id" (Indonesia): HANYA menampilkan novel yang benar-benar punya terjemahan bahasa indonesia (walaupun baru 1 chapter)
  const filteredNovels = useMemo(() => {
    if (activeLang === 'id') return indonesianNovels;
    return novels;
  }, [novels, indonesianNovels, activeLang]);

  const filteredLatestNovels = useMemo(() => {
    if (activeLang === 'id') return indonesianNovels;
    return latestNovels;
  }, [latestNovels, indonesianNovels, activeLang]);

  const featuredList = useMemo(() => filteredNovels.slice(0, 10), [filteredNovels]);
  const trendingList = useMemo(() => filteredNovels.slice(0, 10), [filteredNovels]);
  const weeklyList = useMemo(() => (filteredNovels.length > 10 ? filteredNovels.slice(10, 22) : filteredNovels), [filteredNovels]);

  const gridGap = 12;
  const updateGridColumns = updateViewMode === 'list' ? 3 : updateViewMode;
  const updateGridItemWidth = Math.floor(
    (screenWidth - 16 * 2 - gridGap * (updateGridColumns - 1)) / updateGridColumns
  );

  const isInitialLoading = loadingPopular && novels.length === 0;

  if (isInitialLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GradientBackground />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Banner Skeleton */}
            <SkeletonCarousel />

            {/* Section 1: Trending & Populer Skeleton */}
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                <SkeletonBox width={140} height={20} borderRadius={6} />
                <SkeletonBox width={64} height={14} borderRadius={4} />
              </View>
              <SkeletonNovelGrid
                count={6}
                cardWidth={96}
                cardHeight={Math.round(96 * 1.3)}
                horizontal
                gap={12}
              />
            </View>

            {/* Section 2: Terbaru di Novesia Skeleton */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                <SkeletonBox width={160} height={20} borderRadius={6} />
                <SkeletonBox width={64} height={14} borderRadius={4} />
              </View>
              <SkeletonNovelGrid
                count={6}
                cardWidth={updateGridItemWidth}
                cardHeight={Math.round(updateGridItemWidth * 1.3)}
                columnGap={12}
                rowGap={12}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
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
        >
          {/* ═══ SECTION 0: HERO CAROUSEL ═══ */}
          <View style={{ marginBottom: 20 }}>
            <FeaturedCarousel
              novels={featuredList}
              onPressNovel={openNovel}
              headerOverlay={
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingTop: 16,
                  }}
                >
                  {/* Luxury Refined Logo (BarberChop Font from Komiku) */}
                  <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
                    {[
                      { left: -0.5, top: -0.5 },
                      { left: 0.5, top: -0.5 },
                      { left: -0.5, top: 0.5 },
                      { left: 0.5, top: 0.5 },
                    ].map((offset, i) => (
                      <Text
                        key={i}
                        numberOfLines={1}
                        style={[
                          {
                            position: 'absolute',
                            left: offset.left,
                            top: offset.top,
                            fontSize: 26,
                            lineHeight: 34,
                            color: 'rgba(0,0,0,0.5)',
                            includeFontPadding: false,
                          },
                          logoFontStyle,
                        ]}
                      >
                        Novesia
                      </Text>
                    ))}
                    <ShimmerText
                      style={[
                        {
                          fontSize: 26,
                          lineHeight: 34,
                          includeFontPadding: false,
                        },
                        logoFontStyle,
                      ]}
                      baseColor={colors.primary}
                      shineColor="rgba(255,250,230,0.95)"
                    >
                      Novesia
                    </ShimmerText>
                  </View>


                  {/* Circular Floating Search Button */}
                  <Pressable
                    onPress={() => router.push('/search' as any)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Cari novel"
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(13,16,18,0.65)',
                      borderWidth: 1,
                      borderColor: colors.primary + '8C',
                      opacity: pressed ? 0.7 : 1,
                      shadowColor: colors.primary,
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 6,
                    })}
                  >
                    <Ionicons name="search" size={19} color={colors.primary} />
                  </Pressable>
                </View>
              }
            />
          </View>

          {/* ═══ LANGUAGE FILTER TABS ("Semua" - "English" - "Indonesia") ═══ */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              paddingHorizontal: 16,
              marginTop: -6,
              marginBottom: 22,
            }}
          >
            {LANGUAGE_FILTERS.map((option) => {
              const active = option.key === activeLang;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setActiveLang(option.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{ minWidth: 96 }}
                >
                  {active ? (
                    <GoldSurface
                      shimmer
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 20,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: colors.primary,
                        shadowOpacity: 0.45,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 5,
                      }}
                    >
                      <ShimmerText
                        style={{ fontSize: 13, fontWeight: '800' }}
                        baseColor="#000000"
                        shineColor="rgba(255,250,230,0.95)"
                      >
                        {option.label}
                      </ShimmerText>
                    </GoldSurface>
                  ) : (
                    <View
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 20,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.12)',
                        backgroundColor: 'rgba(20,24,33,0.85)',
                      }}
                    >
                      <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '600' }}>
                        {option.label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* ═══ SECTION 1: TRENDING & POPULER (Big stylized ranks 1, 2, 3) ═══ */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                Trending &amp; Populer
              </Text>
              <Pressable onPress={() => router.push('/lihat-semua/trending' as any)} hitSlop={8}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                  Lihat semua
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={trendingList}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item, index }) => (
                <TrendingRankCard
                  novel={item}
                  rank={index + 1}
                  onPress={openNovel}
                  onLongPress={() => setPreviewNovel(item)}
                />
              )}
            />
          </View>

          {/* ═══ SECTION 2: LANJUT BACA (History with Real Progress) ═══ */}
          {continueReading.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                  Lanjut Baca
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/library' as any)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                    Lihat semua
                  </Text>
                </Pressable>
              </View>

              <FlatList
                data={continueReading.filter((h) => novels.some((n) => n.id === h.novel_id))}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.novel_id}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={({ item }) => {
                  const match = novels.find((n) => n.id === item.novel_id);
                  return (
                    <ContinueReadingCard
                      item={{
                        novel_id: item.novel_id,
                        title: item.title,
                        cover: item.cover,
                        last_chapter: item.last_chapter,
                        last_chapter_id: item.last_chapter_id,
                        total_chapters: match?.total_chapters,
                        rating: match?.rating,
                      }}
                      onPress={openChapter}
                    />
                  );
                }}
              />
            </View>
          )}

          {/* ═══ SECTION 3: POPULER MINGGU INI (Recommended with frame cards) ═══ */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                Populer Minggu Ini
              </Text>
              <Pressable onPress={() => router.push('/lihat-semua/populer' as any)} hitSlop={8}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                  Lihat semua
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={weeklyList}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id + '_weekly'}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item, index }) => (
                <PopularGridCard
                  novel={item}
                  width={112}
                  onPress={openNovel}
                  onLongPress={() => setPreviewNovel(item)}
                  rank={index}
                />
              )}
            />
          </View>

          {/* ═══ SECTION 4: UPDATE TERBARU (Komiku Pattern: Top 18 Items + Lihat Semua) ═══ */}
          {/* ═══ SECTION 4: UPDATE TERBARU (Komiku Pattern: 3-Mode View Toggle + Top 18 Items + Lihat Semua) ═══ */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                Update Terbaru
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ViewModeToggle
                  mode={updateViewMode}
                  accessibilityLabel={`Tampilkan ${updateViewMode === 3 ? '2 kolom' : updateViewMode === 2 ? 'mode list' : '3 kolom'}`}
                  onPress={cycleUpdateViewMode}
                />
                <Pressable onPress={() => router.push('/lihat-semua/terbaru' as any)} hitSlop={8}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                    Lihat semua
                  </Text>
                </Pressable>
              </View>
            </View>

            {updateViewMode === 'list' ? (
              <View>
                {filteredLatestNovels.slice(0, 18).map((item) => (
                  <NovelListRow
                    key={item.id}
                    novel={item}
                    onPress={openNovel}
                    onLongPress={() => setPreviewNovel(item)}
                  />
                ))}
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  paddingHorizontal: 16,
                }}
              >
                {filteredLatestNovels.slice(0, 18).map((item, index) => (
                  <View
                    key={item.id}
                    style={{
                      width: updateGridItemWidth,
                      marginBottom: 14,
                      marginRight: index % updateGridColumns !== updateGridColumns - 1 ? gridGap : 0,
                    }}
                  >
                    <PopularGridCard
                      novel={item}
                      width={updateGridItemWidth}
                      onPress={openNovel}
                      onLongPress={() => setPreviewNovel(item)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>


      {/* Novel Preview Bottom Sheet */}
      <NovelPreviewSheet
        visible={!!previewNovel}
        onClose={() => setPreviewNovel(null)}
        novel={previewNovel}
        onRead={openNovel}
      />
    </View>
  );
}
