import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../lib/ThemeProvider';

const CONTENT_HEIGHT = 248;
const BANNER_MARGIN = 6;
const BANNER_RADIUS = 12;
const AUTO_SLIDE_INTERVAL_MS = 3500;

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

export interface FeaturedNovel {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  total_chapters: number;
  rating: number | null;
  genres?: string[];
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
  const { colors } = useTheme();

  return (
    <View style={{ width: slotWidth, paddingHorizontal: BANNER_MARGIN }}>
      <Pressable
        onPress={() => onPress(novel.nu_slug)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Buka novel ${novel.title}`}
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: BANNER_RADIUS,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: colors.primary + 'A6', // frame aksen
          backgroundColor: colors.surface,
        }}
      >
        {novel.cover_url ? (
          <Image
            source={{
              uri: novel.cover_url,
              headers: { 'User-Agent': 'NovesiaApp/1.0' },
            }}
            style={{ width: cardWidth, height: cardHeight }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View
            style={{
              width: cardWidth,
              height: cardHeight,
              backgroundColor: colors.surfaceElevated,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 36 }}>📕</Text>
          </View>
        )}


        {/* Top Vignette */}
        <LinearGradient
          colors={['rgba(10,12,14,0.68)', 'rgba(10,12,14,0.2)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '34%' }}
        />

        {/* Bottom Vignette */}
        <LinearGradient
          colors={['transparent', 'rgba(10,12,14,0.85)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%' }}
        />

        {/* Bottom Metadata Info */}
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 }}>
          <Text
            numberOfLines={2}
            style={{
              color: '#FFFFFF',
              fontSize: 22,
              lineHeight: 28,
              fontWeight: '800',
              textShadowColor: 'rgba(0,0,0,0.6)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            }}
          >
            {novel.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="star" size={13} color={colors.primary} />
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>
              {novel.rating ? novel.rating.toFixed(1) : '9.2'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' }}>
              · {novel.total_chapters} Chapters
              {novel.genres && novel.genres.length > 0 ? ` · ${novel.genres[0]}` : ''}
            </Text>
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
  const cardHeight = CONTENT_HEIGHT;
  const itemStride = slotWidth;

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

        {/* Fixed Header Overlay on top of banner */}
        {headerOverlay && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
            {headerOverlay}
          </View>
        )}
      </View>

      {/* Dots Indicator (Komiku elongated dot active) */}
      {novels.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            marginTop: 8,
          }}
        >
          {novels.map((n, i) => (
            <View
              key={n.id}
              style={{
                width: i === activeIndex ? 18 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === activeIndex ? colors.primary : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </View>
      )}

    </View>
  );
}
