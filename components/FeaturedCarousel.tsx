import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../lib/ThemeProvider';
import { useLanguage } from '../lib/i18n';

const BANNER_MARGIN = 8;
const BANNER_RADIUS = 18;
const AUTO_SLIDE_INTERVAL_MS = 4500;
const COVER_WIDTH = 106;
const COVER_HEIGHT = 159; // 2:3 aspect ratio
const CARD_HEIGHT = 194;

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

export function cleanSynopsis(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function isNovelCompleted(novel?: { status?: string | null } | null): boolean {
  if (!novel?.status) return false;
  const s = novel.status.toLowerCase();
  return s === 'completed' || s === 'tamat';
}

export interface FeaturedNovel {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  cover_landscape_url?: string | null;
  total_chapters: number;
  rating: number | null;
  genres?: string[];
  status?: string | null;
  author?: string;
  synopsis?: string | null;
  synopsis_translated?: string | null;
}

interface CarouselSlideProps {
  novel: FeaturedNovel;
  slotWidth: number;
  cardWidth: number;
  cardHeight: number;
  onPress: (slug: string) => void;
}

const CarouselSlide = React.memo(function CarouselSlide({
  novel,
  slotWidth,
  cardWidth,
  cardHeight,
  onPress,
}: CarouselSlideProps) {
  const { colors, isDark } = useTheme();
  const { lang } = useLanguage();
  const coverUri = novel.cover_url;
  const bgArtworkUri = novel.cover_url;
  const ratingText = novel.rating ? novel.rating.toFixed(1) : '9.8';
  const completed = isNovelCompleted(novel);

  const rawSynopsis =
    lang === 'id' && novel.synopsis_translated ? novel.synopsis_translated : novel.synopsis;
  const synopsisText =
    cleanSynopsis(rawSynopsis) ||
    (lang === 'id'
      ? 'Temukan kisah novel web terbaik yang diterjemahkan secara rapi di NOVESIA.'
      : 'Discover the finest translated Asian web novels on NOVESIA.');

  return (
    <View style={{ width: slotWidth, paddingHorizontal: BANNER_MARGIN }}>
      <Pressable
        onPress={() => onPress(novel.nu_slug)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Buka novel ${novel.title}`}
        style={({ pressed }) => [
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: BANNER_RADIUS,
            overflow: 'hidden',
            borderWidth: 1.2,
            borderColor: isDark ? (colors.primary + '55') : (colors.primary + '35'),
            backgroundColor: isDark ? '#0A0E17' : colors.surface,
            shadowColor: isDark ? '#000' : colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.45 : 0.08,
            shadowRadius: 14,
            elevation: isDark ? 7 : 3,
            opacity: pressed ? 0.95 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        {/* ─── Background Artwork with Blur & Gradient Overlay ─── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {bgArtworkUri ? (
            <Image
              source={{
                uri: bgArtworkUri,
                headers: { 'User-Agent': 'NovesiaApp/1.0' },
              }}
              style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.85 : 0.35 }]}
              contentFit="cover"
              blurRadius={16}
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : null}
          {/* Gradients for high text contrast in both dark and light mode */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(10,14,23,0.96)', 'rgba(10,14,23,0.85)', 'rgba(10,14,23,0.72)']
                : ['rgba(255,255,255,0.97)', 'rgba(255,255,255,0.88)', 'rgba(255,255,255,0.75)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(0,0,0,0.35)', 'rgba(10,14,23,0.25)', 'rgba(10,14,23,0.92)']
                : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.95)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ─── Foreground Content: Left Cover + Right Info ─── */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 13,
            gap: 13,
          }}
        >
          {/* LEFT: Novel Portrait Cover */}
          <View
            style={{
              width: COVER_WIDTH,
              height: COVER_HEIGHT,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)',
              backgroundColor: isDark ? '#141E2C' : colors.surfaceElevated,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.5 : 0.12,
              shadowRadius: 8,
              elevation: isDark ? 5 : 2,
              position: 'relative',
            }}
          >
            {coverUri ? (
              <Image
                source={{
                  uri: coverUri,
                  headers: { 'User-Agent': 'NovesiaApp/1.0' },
                }}
                style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#1B263B',
                }}
              >
                <Text style={{ fontSize: 28 }}>📕</Text>
              </View>
            )}

            {/* 3D Spine Lighting */}
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'rgba(255,255,255,0.18)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7 }}
              pointerEvents="none"
            />

            {/* Rating Chip on Cover (Bottom Right) */}
            <View
              style={{
                position: 'absolute',
                bottom: 5,
                right: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2.5,
                paddingHorizontal: 5.5,
                paddingVertical: 1.5,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(13,27,47,0.88)' : 'rgba(255,255,255,0.95)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
              }}
            >
              <Ionicons name="star" size={9.5} color={colors.primary} />
              <Text
                style={{
                  color: isDark ? '#FAF5EE' : colors.textPrimary,
                  fontSize: 10,
                  fontWeight: '700',
                }}
              >
                {ratingText}
              </Text>
            </View>
          </View>

          {/* RIGHT: Novel Info & Action */}
          <View
            style={{
              flex: 1,
              height: COVER_HEIGHT,
              justifyContent: 'space-between',
              paddingVertical: 1,
            }}
          >
            {/* Top Row: Badges (aligned horizontally with search icon overlay) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                paddingRight: 34,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 7.5,
                  paddingVertical: 2.5,
                  borderRadius: 999,
                  backgroundColor: colors.primaryMuted || colors.primary + '22',
                  borderWidth: 1,
                  borderColor: colors.primary + '55',
                }}
              >
                <Text
                  style={{
                    color: colors.gradientLight || colors.primary,
                    fontSize: 9.5,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  {lang === 'id' ? 'Pilihan Utama' : 'Featured Novel'}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: completed
                    ? (isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.12)')
                    : (isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)'),
                  borderWidth: 1,
                  borderColor: completed
                    ? (isDark ? 'rgba(16,185,129,0.42)' : 'rgba(16,185,129,0.35)')
                    : (isDark ? 'rgba(245,158,11,0.42)' : 'rgba(245,158,11,0.35)'),
                }}
              >
                <Text
                  style={{
                    color: completed
                      ? (isDark ? '#34D399' : '#059669')
                      : (isDark ? '#FBBF24' : '#D97706'),
                    fontSize: 9,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  {completed
                    ? lang === 'id'
                      ? 'Tamat'
                      : 'Complete'
                    : lang === 'id'
                    ? 'Berjalan'
                    : 'Ongoing'}
                </Text>
              </View>
            </View>

            {/* Middle: Title & Synopsis */}
            <View style={{ gap: 3.5 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: isDark ? '#FAF5EE' : colors.textPrimary,
                  fontSize: 14.5,
                  lineHeight: 19,
                  fontWeight: '700',
                  textShadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'transparent',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: isDark ? 4 : 0,
                }}
              >
                {novel.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  color: isDark ? '#D4C9BD' : colors.textSecondary,
                  fontSize: 10.5,
                  lineHeight: 14.5,
                  opacity: 0.9,
                }}
              >
                {synopsisText}
              </Text>
            </View>

            {/* Bottom: Action CTA Button */}
            <View style={{ alignSelf: 'flex-start' }}>
              <LinearGradient
                colors={[colors.gradientDark, colors.gradientLight, colors.gradientDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 5.5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.primary + '55',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    color: colors.textOnPrimary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {lang === 'id' ? 'Mulai Membaca' : 'Read Now'}
                </Text>
                <Ionicons name="arrow-forward" size={11.5} color={colors.textOnPrimary} />
              </LinearGradient>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
});

export interface FeaturedCarouselProps {
  novels: FeaturedNovel[];
  onPressNovel: (slug: string) => void;
  headerOverlay?: React.ReactNode;
}

export function FeaturedCarousel({ novels, onPressNovel, headerOverlay }: FeaturedCarouselProps) {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const listRef = useRef<FlatList<FeaturedNovel>>(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const slotWidth = screenWidth;
  const cardWidth = screenWidth - BANNER_MARGIN * 2;
  const cardHeight = CARD_HEIGHT;
  const itemStride = slotWidth;

  const bannerSetKey = novels.map((n) => n.id).join(',');

  // Set banner berubah (refetch/ganti filter bahasa) - balik ke slide pertama
  useEffect(() => {
    indexRef.current = 0;
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [bannerSetKey]);

  const shouldAutoSlide = !reducedMotion && novels.length > 1;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!shouldAutoSlide) return;
    intervalRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % novels.length;
      listRef.current?.scrollToOffset({ offset: next * itemStride, animated: true });
      indexRef.current = next;
      setActiveIndex(next);
    }, AUTO_SLIDE_INTERVAL_MS);
  }, [shouldAutoSlide, novels.length, itemStride]);

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoSlide]);

  const handleScrollBeginDrag = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const raw = Math.round(event.nativeEvent.contentOffset.x / itemStride);
      const next = clampIndex(raw, novels.length);
      indexRef.current = next;
      setActiveIndex(next);
      startAutoSlide();
    },
    [itemStride, novels.length, startAutoSlide]
  );

  const goToSlide = useCallback(
    (index: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const target = clampIndex(index, novels.length);
      listRef.current?.scrollToOffset({ offset: target * itemStride, animated: true });
      indexRef.current = target;
      setActiveIndex(target);
      startAutoSlide();
    },
    [itemStride, novels.length, startAutoSlide]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemStride,
      offset: itemStride * index,
      index,
    }),
    [itemStride]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeaturedNovel }) => (
      <CarouselSlide
        novel={item}
        slotWidth={slotWidth}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        onPress={onPressNovel}
      />
    ),
    [slotWidth, cardWidth, cardHeight, onPressNovel]
  );

  if (novels.length === 0) return null;

  return (
    <View style={{ width: screenWidth }}>
      {/* Container Carousel */}
      <View style={{ position: 'relative' }}>
        <FlatList
          ref={listRef}
          data={novels}
          horizontal
          snapToInterval={itemStride}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={renderItem}
        />

        {/* Pinned Search Icon Overlay aligned with badges row */}
        {headerOverlay && (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 10,
              right: BANNER_MARGIN + 12,
              zIndex: 20,
            }}
          >
            {headerOverlay}
          </View>
        )}
      </View>

      {/* Dots Indicator (Active elongated pill, inactive round dot) */}
      {novels.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
            paddingTop: 10,
          }}
        >
          {novels.map((n, i) => {
            const isActive = i === activeIndex;
            return (
              <Pressable
                key={n.id}
                onPress={() => goToSlide(i)}
                hitSlop={8}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Slide ${i + 1}`}
                style={{
                  width: isActive ? 22 : 5,
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: isActive ? colors.primary : (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'),
                  shadowColor: isActive ? colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isActive ? 0.7 : 0,
                  shadowRadius: 4,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
