import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { GoldSurface } from './GoldSurface';
import { ShimmerText } from './ShimmerText';
import { useTheme } from '../lib/ThemeProvider';

const ROTATION_MS = 20000;

function RotatingGoldGradient({ intensity = 'strong' }: { intensity?: 'strong' | 'soft' }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: ROTATION_MS, easing: Easing.linear }),
      -1,
      false
    );
  }, [reducedMotion, rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const gradientColors =
    intensity === 'strong'
      ? ([colors.gradientDark + '00', colors.gradientLight + '4D', colors.gradientDark + '00'] as const)
      : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)'] as const);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {!reducedMotion && (
          <Animated.View style={[{ width: '300%', height: '300%' }, style]}>
            <LinearGradient
              colors={gradientColors}
              locations={[0.3, 0.5, 0.7]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

export function VipCard({
  isVip,
  onUpgrade,
}: {
  isVip: boolean;
  onUpgrade: () => void;
}) {
  const { colors } = useTheme();

  if (isVip) {
    return (
      <GoldSurface
        style={{
          marginBottom: 20,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.3)',
        }}
      >
        <RotatingGoldGradient intensity="soft" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.4)',
            }}
          >
            <Ionicons name="sparkles" size={22} color={colors.textOnPrimary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <ShimmerText
              style={{ fontSize: 16, fontWeight: '900' }}
              baseColor={colors.textOnPrimary}
              shineColor="rgba(255,250,230,0.95)"
            >
              VIP MEMBER NOVESIA
            </ShimmerText>
            <Text style={{ fontSize: 11.5, color: colors.textOnPrimary + 'D9', fontWeight: '600' }}>
              Akses tanpa batas ke seluruh chapter &amp; novel VIP
            </Text>
          </View>
        </View>
      </GoldSurface>
    );
  }

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.primary + '55',
        backgroundColor: colors.surface,
        padding: 16,
        marginBottom: 20,
        overflow: 'hidden',
      }}
    >
      <RotatingGoldGradient intensity="strong" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.primary + '88',
          }}
        >
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>
            Upgrade ke VIP Member
          </Text>
          <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 1 }}>
            Baca chapter terbaru lebih awal tanpa batas
          </Text>
        </View>
      </View>

      <Pressable onPress={onUpgrade} style={{ overflow: 'hidden', borderRadius: 12 }}>
        <GoldSurface
          shimmer
          style={{
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShimmerText
            style={{ fontSize: 13, fontWeight: '800' }}
            baseColor={colors.textOnPrimary}
            shineColor="rgba(255,250,230,0.95)"
          >
            Aktifkan VIP Sekarang
          </ShimmerText>
        </GoldSurface>
      </Pressable>
    </View>
  );
}
