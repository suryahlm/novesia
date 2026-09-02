import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../lib/ThemeProvider';

export interface SkeletonBoxProps {
  width?: number | `${number}%` | '100%';
  height?: number | `${number}%`;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Blok skeleton dasar dengan shimmer sweep (gradient bergerak kiri->kanan secara halus).
 */
export function SkeletonBox({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonBoxProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    return () => cancelAnimation(translateX);
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value * 150}%` }],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.skeletonBase,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[colors.skeletonBase, colors.skeletonHighlight, colors.skeletonBase]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Skeleton kartu novel (Cover + Judul + Bab) — persis seukuran PopularGridCard & TrendingRankCard.
 */
export function SkeletonNovelCard({
  coverWidth = 100,
  coverHeight = 130,
}: {
  coverWidth?: number;
  coverHeight?: number;
}) {
  return (
    <View style={{ width: coverWidth, gap: 6 }}>
      <SkeletonBox width={coverWidth} height={coverHeight} borderRadius={12} />
      <SkeletonBox height={13} width="92%" borderRadius={4} style={{ marginTop: 2 }} />
      <SkeletonBox height={11} width="58%" borderRadius={4} />
    </View>
  );
}

/**
 * Skeleton Banner Hero Carousel
 */
export function SkeletonCarousel() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 12; // BANNER_MARGIN = 6 * 2

  return (
    <View style={{ width: screenWidth, paddingHorizontal: 6, marginBottom: 20 }}>
      <SkeletonBox width={cardWidth} height={248} borderRadius={12} />
    </View>
  );
}

export interface SkeletonNovelGridProps {
  count?: number;
  cardWidth?: number;
  cardHeight?: number;
  horizontal?: boolean;
  gap?: number;
  columnGap?: number;
  rowGap?: number;
}

/**
 * Grid/Row skeleton novel placeholder persis seperti layout aslinya
 */
export function SkeletonNovelGrid({
  count = 6,
  cardWidth = 100,
  cardHeight = 130,
  horizontal = false,
  gap = 12,
  columnGap = 12,
  rowGap = 12,
}: SkeletonNovelGridProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: horizontal ? 'nowrap' : 'wrap',
        columnGap: horizontal ? gap : columnGap,
        rowGap: horizontal ? 0 : rowGap,
        paddingHorizontal: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNovelCard
          key={i}
          coverWidth={cardWidth}
          coverHeight={cardHeight}
        />
      ))}
    </View>
  );
}

// Backward-compatible exports
export const SkeletonLoader = SkeletonBox;
export const SkeletonHorizontalCards = ({ count = 6 }: { count?: number }) => (
  <SkeletonNovelGrid count={count} cardWidth={96} cardHeight={Math.round(96 * 1.3)} horizontal gap={12} />
);
export const SkeletonGrid2Col = ({ count = 6 }: { count?: number }) => (
  <SkeletonNovelGrid count={count} cardWidth={100} cardHeight={130} columnGap={12} rowGap={12} />
);
