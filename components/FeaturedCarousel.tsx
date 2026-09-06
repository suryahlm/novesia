import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

const BANNER_MARGIN = 14;
const BANNER_RADIUS = 18;
const AUTO_SLIDE_INTERVAL_MS = 4500;
const COVER_WIDTH = 96;
const COVER_HEIGHT = 144; // 2:3 aspect ratio
const CARD_HEIGHT = 224;

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
  const { lang } = useLanguage();
  const coverUri = novel.cover_url || novel.cover_landscape_url;
  const bgArtworkUri = novel.cover_landscape_url || novel.cover_url;
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
            borderColor: 'rgba(185,151,98,0.38)',
            backgroundColor: '#0A0E17',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 14,
            elevation: 7,
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
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={16}
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : null}
          {/* Gradients for high text contrast */}
          <LinearGradient
            colors={['rgba(10,14,23,0.96)', 'rgba(10,14,23,0.85)', 'rgba(10,14,23,0.72)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'rgba(10,14,23,0.25)', 'rgba(10,14,23,0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ─── Foreground Content: Left Cover + Right Info ─── */}
        <View
          style={{
            flex: 1,
            paddingTop: 54,
            paddingHorizontal: 14,
            paddingBottom: 14,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
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
              borderColor: 'rgba(255,255,255,0.22)',
              backgroundColor: '#141E2C',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
              elevation: 5,
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
                backgroundColor: 'rgba(13,27,47,0.88)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <Ionicons name="star" size={9.5} color="#B99762" />
              <Text
                style={{
                  color: '#FAF5EE',
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
            {/* Top Row: Badges */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: 7.5,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: 'rgba(185,151,98,0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(185,151,98,0.42)',
                }}
              >
                <Text
                  style={{
                    color: '#E5C99B',
                    fontSize: 9,
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
                  backgroundColor: completed ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  borderWidth: 1,
                  borderColor: completed ? 'rgba(16,185,129,0.42)' : 'rgba(245,158,11,0.42)',
                }}
              >
                <Text
                  style={{
                    color: completed ? '#34D399' : '#FBBF24',
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
                  color: '#FAF5EE',
                  fontSize: 14.5,
                  lineHeight: 19,
                  fontWeight: '700',
                  textShadowColor: 'rgba(0,0,0,0.85)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {novel.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  color: '#D4C9BD',
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
                colors={['#B99762', '#D8B47E', '#B99762']}
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
                  borderColor: 'rgba(245,229,201,0.4)',
                  shadowColor: '#B99762',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    color: '#0D1520',
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {lang === 'id' ? 'Mulai Membaca' : 'Read Now'}
                </Text>
                <Ionicons name="arrow-forward" size={11.5} color="#0D1520" />
              </LinearGradient>
            </View>
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
  const { colors } = useTheme();
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
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item }) => (
            <CarouselSlide
              novel={item}
              slotWidth={slotWidth}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              onPress={onPressNovel}
            />
          )}
        />

        {/* Pinned Header Overlay inside top of card */}
        {headerOverlay && (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              left: BANNER_MARGIN,
              right: BANNER_MARGIN,
              height: 54,
              paddingHorizontal: 14,
              paddingTop: 10,
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
                  backgroundColor: isActive ? '#B99762' : 'rgba(255,255,255,0.22)',
                  shadowColor: isActive ? '#B99762' : 'transparent',
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
