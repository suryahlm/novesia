import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type GlossyBadgeTone = 'hot' | 'ongoing' | 'completed' | 'hiatus';

const TONE_GRADIENT: Record<GlossyBadgeTone, [string, string]> = {
  hot: ['#DC2626', '#8B1124'],      // merah ruby mewah (vibrant yet deep ruby red)
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
const MIN_SCALE = 0.82;
const MAX_SCALE = 1.1;

export function GlossyBadge({ label, tone, cardWidth }: GlossyBadgeProps) {
  const isCorner = cardWidth !== undefined;
  const scale = isCorner
    ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, cardWidth / REFERENCE_WIDTH))
    : 1;
  const fontSize = 11 * scale;

  return (
    <LinearGradient
      colors={TONE_GRADIENT[tone]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        alignSelf: 'flex-start',
        borderBottomLeftRadius: isCorner ? 9 * scale : 6,
        borderTopRightRadius: 6,
        borderTopLeftRadius: isCorner ? 0 : 6,
        borderBottomRightRadius: isCorner ? 0 : 6,
        paddingHorizontal: 10 * scale,
        paddingTop: isCorner ? 2.5 * scale : 3.5 * scale,
        paddingBottom: isCorner ? 4.5 * scale : 3.5 * scale,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderTopWidth: isCorner ? 0 : 1,
        borderRightWidth: isCorner ? 0 : 1,
        borderColor: tone === 'hot' ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.38)',
        overflow: 'hidden',
      }}
    >
      {/* Gradasi putih yang tipis, halus, dan mewah */}
      <LinearGradient
        colors={
          tone === 'hot'
            ? ['rgba(255,255,255,0.40)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.01)', 'transparent']
            : ['rgba(255,255,255,0.50)', 'rgba(255,255,255,0.15)', 'transparent', 'transparent']
        }
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Text
        style={{
          color: '#FFFFFF',
          fontWeight: '800',
          letterSpacing: 0.4,
          fontSize,
          lineHeight: Math.round(fontSize * 1.25),
          textShadowColor: 'rgba(0, 0, 0, 0.45)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </LinearGradient>
  );
}
