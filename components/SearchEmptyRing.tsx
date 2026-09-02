import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../lib/ThemeProvider';

const ORBIT_SIZE = 112;
const INNER_ORBIT_SIZE = ORBIT_SIZE - 32;
const BADGE_SIZE = 58;
const COMET_LENGTH = 16;
const COMET_THICKNESS = 3;
const INNER_COMET_LENGTH = 9;
const INNER_COMET_THICKNESS = 2;

/**
 * Cincin orbit comet berputar berlawanan arah dengan aksen dinamis tema (Reanimated + LinearGradient).
 * Menghadirkan efek motion graphic mewah seperti di Komiku.
 */
function CometOrbit({
  size,
  cometLength,
  cometThickness,
  cometColors,
  trackColor,
  durationMs,
  cometCount,
  reverse,
}: {
  size: number;
  cometLength: number;
  cometThickness: number;
  cometColors: [string, string];
  trackColor: string;
  durationMs: number;
  cometCount: number;
  reverse?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    rotation.value = withRepeat(
      withTiming(reverse ? -360 : 360, { duration: durationMs, easing: Easing.linear }),
      -1,
      false
    );
  }, [reducedMotion, durationMs, reverse, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const comets = Array.from({ length: cometCount }, (_, i) => (360 / cometCount) * i);

  return (
    <View style={{ position: 'absolute', width: size, height: size }} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: trackColor,
        }}
      />
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, spinStyle]}>
        {comets.map((angle) => (
          <View
            key={angle}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              transform: [{ rotate: `${angle}deg` }],
            }}
          >
            <LinearGradient
              colors={cometColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                top: -cometThickness / 2,
                left: size / 2 - cometLength / 2,
                width: cometLength,
                height: cometThickness,
                borderRadius: cometThickness / 2,
              }}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

/**
 * Empty/Focus state pencarian motion graphic:
 * Medali terisi gradient emas di tengah + 2 lapis orbit partikel berputar berlawanan arah.
 */
export function SearchEmptyRing() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        width: ORBIT_SIZE,
        height: ORBIT_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Orbit Luar (Searah jarum jam) */}
      <CometOrbit
        size={ORBIT_SIZE}
        cometLength={COMET_LENGTH}
        cometThickness={COMET_THICKNESS}
        cometColors={[colors.gradientLight + '00', colors.gradientLight]}
        trackColor={colors.primary + '33'}
        durationMs={4200}
        cometCount={6}
      />
      {/* Orbit Dalam (Berlawanan arah jarum jam) */}
      <CometOrbit
        size={INNER_ORBIT_SIZE}
        cometLength={INNER_COMET_LENGTH}
        cometThickness={INNER_COMET_THICKNESS}
        cometColors={[colors.gradientDark + '00', colors.gradientDark]}
        trackColor={colors.border}
        durationMs={7000}
        cometCount={3}
        reverse
      />

      {/* Medali Pusat dengan Glow */}
      <LinearGradient
        colors={[colors.gradientLight, colors.gradientDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: BADGE_SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 14,
          elevation: 10,
        }}
      >
        <Ionicons name="search" size={26} color={colors.textOnPrimary} />
      </LinearGradient>
    </View>
  );
}
