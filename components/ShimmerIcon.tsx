import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { shimmerProgress, startShimmerClock } from '../lib/shimmerClock';
import { useTheme } from '../lib/ThemeProvider';

export interface ShimmerIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size: number;
  /** Warna dasar ikon (sebelum kena sapuan cahaya). */
  baseColor?: string;
  /** Warna puncak sapuan cahaya. */
  shineColor?: string;
}

export function ShimmerIcon({
  name,
  size,
  baseColor,
  shineColor = 'rgba(255,250,230,0.95)',
}: ShimmerIconProps) {
  const { colors } = useTheme();
  const effectiveBaseColor = baseColor || colors.primary;

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!reducedMotion) startShimmerClock();
  }, [reducedMotion]);

  const bandWidth = Math.max(size * 0.6, 20);
  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerProgress.value,
          [0, 1],
          [-bandWidth, size + bandWidth]
        ),
      },
    ],
  }));

  return (
    <MaskedView
      style={{ width: size, height: size }}
      maskElement={<Ionicons name={name} size={size} color="#000000" />}
    >
      <View style={{ width: size, height: size }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: effectiveBaseColor }]} />
        {!reducedMotion && (

          <Animated.View
            style={[{ position: 'absolute', top: 0, bottom: 0, width: bandWidth }, shineStyle]}
          >
            <LinearGradient
              colors={['transparent', shineColor, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </View>
    </MaskedView>
  );
}
