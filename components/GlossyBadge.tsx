import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type GlossyBadgeTone = 'hot' | 'ongoing' | 'completed' | 'hiatus';

const TONE_GRADIENT: Record<GlossyBadgeTone, [string, string]> = {
  hot: ['#F0723A', '#D6432A'],      // oranye->merah bata
  ongoing: ['#F59E0B', '#D97706'],  // amber (sama dengan warna ongoing di banner)
  completed: ['#10B981', '#059669'],// emerald hijau (sama dengan warna completed di banner)
  hiatus: ['#8B93A6', '#636B7E'],   // abu kebiruan netral
};

export interface GlossyBadgeProps {
  label: string;
  tone: GlossyBadgeTone;
  cardWidth?: number;
}

const REFERENCE_WIDTH = 170;
const MIN_SCALE = 0.6;
const MAX_SCALE = 1;

export function GlossyBadge({ label, tone, cardWidth }: GlossyBadgeProps) {
  const scale = cardWidth
    ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, cardWidth / REFERENCE_WIDTH))
    : 1;
  const fontSize = 10 * scale;

  return (
    <LinearGradient
      colors={TONE_GRADIENT[tone]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 10 * scale,
        paddingHorizontal: 10 * scale,
        paddingVertical: 5 * scale,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text
        style={{
          color: '#FFFFFF',
          fontWeight: '700',
          letterSpacing: 0.3,
          fontSize,
          lineHeight: fontSize * 1.3,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </LinearGradient>
  );
}
