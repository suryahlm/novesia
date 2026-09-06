import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type GlossyBadgeTone = 'hot' | 'ongoing' | 'completed' | 'hiatus';

const TONE_GRADIENT: Record<GlossyBadgeTone, [string, string]> = {
  hot: ['#991B2E', '#560B18'],      // merah sedikit gelap mewah (deep imperial ruby)
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
        paddingVertical: 4.5 * scale,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: tone === 'hot' ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.38)',
        borderTopColor: 'rgba(255,255,255,0.55)',
        overflow: 'hidden',
      }}
    >
      {/* Gradasi putih yang tipis, halus, dan mewah */}
      <LinearGradient
        colors={
          tone === 'hot'
            ? ['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.01)', 'transparent']
            : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.15)', 'transparent', 'transparent']
        }
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text
        style={{
          color: '#FFFFFF',
          fontWeight: '800',
          letterSpacing: 0.4,
          fontSize,
          lineHeight: fontSize * 1.3,
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
