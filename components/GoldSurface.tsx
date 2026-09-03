import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { shimmerProgress, startShimmerClock } from '../lib/shimmerClock';
import { useTheme } from '../lib/ThemeProvider';

export interface GoldSurfaceProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  /** Tambahin sapuan cahaya animasi (shimmer sweep) di atas permukaannya */
  shimmer?: boolean;
}

export function GoldSurface({ style, children, shimmer = false }: GoldSurfaceProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (shimmer && !reducedMotion) startShimmerClock();
  }, [shimmer, reducedMotion]);

  const bandWidth = Math.max(width * 0.5, 24);
  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerProgress.value,
          [0, 1],
          [-bandWidth, width + bandWidth]
        ),
      },
    ],
  }));

  const handleLayout = shimmer
    ? (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)
    : undefined;

  return (
    <LinearGradient
      colors={[colors.gradientLight, colors.gradientDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ overflow: 'hidden', backgroundColor: colors.gradientDark }, style]}
      onLayout={handleLayout}
    >

      {/* Sheen putih diagonal sangat tipis */}
      <LinearGradient
        colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
        locations={[0, 0.4, 0.75]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {shimmer && !reducedMotion && width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, bottom: 0, width: bandWidth }, shineStyle]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.65)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      {children}
    </LinearGradient>
  );
}
