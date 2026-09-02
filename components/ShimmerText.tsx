import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { shimmerProgress, startShimmerClock } from '../lib/shimmerClock';
import { useTheme } from '../lib/ThemeProvider';

export interface ShimmerTextProps {
  children: string;
  style?: TextStyle | TextStyle[];
  /** Warna dasar teks (sebelum kena sapuan cahaya) - default gold / primary. */
  baseColor?: string;
  /** Warna puncak sapuan cahaya. */
  shineColor?: string;
}

export function ShimmerText({
  children,
  style,
  baseColor,
  shineColor = 'rgba(255,250,230,0.95)',
}: ShimmerTextProps) {
  const { colors } = useTheme();
  const effectiveBaseColor = baseColor || colors.primary;

  const [size, setSize] = useState({ width: 0, height: 0 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!reducedMotion) startShimmerClock();
  }, [reducedMotion]);

  const bandWidth = Math.max(size.width * 0.4, 40);
  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerProgress.value,
          [0, 1],
          [-bandWidth, size.width + bandWidth]
        ),
      },
    ],
  }));

  return (
    <View>
      <Text style={[style, { opacity: 0 }]} onLayout={(e) => setSize(e.nativeEvent.layout)}>
        {children}
      </Text>
      {size.width > 0 && (
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={<Text style={style}>{children}</Text>}
        >
          <View style={{ width: size.width, height: size.height }}>
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
      )}
    </View>
  );
}
