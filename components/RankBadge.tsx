import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ShimmerText } from './ShimmerText';
import { useTheme } from '../lib/ThemeProvider';
import { ColorScheme } from '../lib/colors';

export function rankTierColor(rank: string, colors: ColorScheme): string {
  switch (rank) {
    case 'F':
      return colors.textMuted;
    case 'E':
      return colors.info;
    case 'D':
      return colors.success;
    case 'C':
      return colors.warning;
    case 'B':
      return colors.gradientDark;
    case 'A':
      return colors.primary;
    case 'S':
      return colors.primaryPressed;
    default:
      return colors.textMuted;
  }
}

export interface RankBadgeProps {
  rank: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function RankBadge({ rank, size = 'md', style }: RankBadgeProps) {
  const { colors } = useTheme();
  const tierColor = rankTierColor(rank, colors);
  const fontSize = size === 'sm' ? 11 : 13;
  const textStyle = { fontSize, fontWeight: '800' as const, letterSpacing: 0.3 };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: 2,
          borderRadius: 999,
          backgroundColor: tierColor + '22',
          borderWidth: 1,
          borderColor: tierColor + '66',
        },
        style,
      ]}
    >
      <Ionicons name="ribbon" size={fontSize} color={tierColor} />
      {rank === 'S' ? (
        <ShimmerText style={textStyle} baseColor={tierColor} shineColor="rgba(255,250,230,0.95)">
          {`Rank ${rank}`}
        </ShimmerText>
      ) : (
        <Text style={[textStyle, { color: tierColor }]}>{`Rank ${rank}`}</Text>
      )}
    </View>
  );
}
