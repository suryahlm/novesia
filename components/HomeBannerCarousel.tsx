import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '../lib/ThemeProvider';
import { HomeBanner } from '../lib/useBannersQuery';

const BANNER_MARGIN = 16;
const BANNER_RADIUS = 12;
const AUTO_SLIDE_INTERVAL_MS = 3500;
const ASPECT_RATIO = 2.5; // width:height - rasio banner landscape 1200x480 (2.5:1)

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

export interface HomeBannerCarouselProps {
  banners: HomeBanner[];
}

/**
 * Carousel banner Beranda, persis seperti Komiku:
 * - Terletak di bawah Lanjut Baca (atau sebelum Populer / Update Terbaru).
 * - Auto-slide tiap 3.5 detik jika lebih dari 1 slide.
 * - Snap scroll halus dengan FlatList, jeda saat disentuh/drag.
 * - Setiap gambar membuka tautan target_url (Shopee, link eksternal, dsb).
 * - Indikator dot aktif memanjang dengan warna primary aksen.
 * - Mengembalikan null jika tidak ada banner aktif agar tidak ada ruang kosong.
 */
export function HomeBannerCarousel({ banners }: HomeBannerCarouselProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const listRef = useRef<FlatList<HomeBanner>>(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const slotWidth = screenWidth;
  const cardWidth = screenWidth - BANNER_MARGIN * 2;
  const cardHeight = Math.round(cardWidth / ASPECT_RATIO);
  const itemStride = slotWidth;
  const bannerSetKey = banners.map((b) => b.id).join(',');

  // Set banner berubah (refetch beda urutan/isi) - reset ke slide pertama
  useEffect(() => {
    indexRef.current = 0;
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [bannerSetKey]);

  const shouldAutoSlide = !reducedMotion && banners.length > 1;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!shouldAutoSlide) return;
    intervalRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % banners.length;
      listRef.current?.scrollToOffset({ offset: next * itemStride, animated: true });
      indexRef.current = next;
      setActiveIndex(next);
    }, AUTO_SLIDE_INTERVAL_MS);
  }, [shouldAutoSlide, banners.length, itemStride]);

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
      const next = clampIndex(raw, banners.length);
      indexRef.current = next;
      setActiveIndex(next);
      startAutoSlide();
    },
    [itemStride, banners.length, startAutoSlide]
  );

  const handlePressBanner = useCallback((banner: HomeBanner) => {
    if (banner.target_url) {
      Linking.openURL(banner.target_url).catch((err) => {
        console.warn('Gagal membuka URL banner:', err);
      });
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: HomeBanner }) => (
      <View style={{ width: slotWidth, paddingHorizontal: BANNER_MARGIN }}>
        <Pressable
          onPress={() => handlePressBanner(item)}
          disabled={!item.target_url}
          accessibilityRole={item.target_url ? 'button' : undefined}
          accessibilityLabel={item.title}
          style={({ pressed }) => ({
            width: cardWidth,
            height: cardHeight,
            borderRadius: BANNER_RADIUS,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            opacity: pressed && item.target_url ? 0.9 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          })}
        >
          <Image
            source={{ uri: item.image_url }}
            style={{ width: cardWidth, height: cardHeight }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        </Pressable>
      </View>
    ),
    [slotWidth, cardWidth, cardHeight, colors.surface, handlePressBanner]
  );

  if (!banners.length) return null;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Banner Promo Beranda"
      accessibilityValue={{ text: `Slide ${activeIndex + 1} dari ${banners.length}` }}
      style={{ marginBottom: 24 }}
    >
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        snapToInterval={itemStride}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={renderItem}
      />
      {banners.length > 1 && (
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
          }}
        >
          {banners.map((b, i) => (
            <View
              key={b.id}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === activeIndex ? colors.primary : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
