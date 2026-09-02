import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CoverImage } from './CoverImage';
import { useTheme } from '../lib/ThemeProvider';

const CARD_WIDTH = 96;
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.36); // ~130px

export interface TrendingRankCardProps {
  novel: {
    id: string;
    title: string;
    nu_slug: string;
    cover_url: string | null;
    rating: number | null;
  };
  rank: number;
  onPress: (slug: string) => void;
  onLongPress?: () => void;
}

function TrendingRankCardBase({ novel, rank, onPress, onLongPress }: TrendingRankCardProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onPress(novel.nu_slug), [onPress, novel.nu_slug]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={240}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Peringkat ${rank}, ${novel.title}`}
      style={{ width: CARD_WIDTH, gap: 8 }}
    >
      <View style={{ width: CARD_WIDTH, height: COVER_HEIGHT }}>
        <View style={{ width: CARD_WIDTH, height: COVER_HEIGHT, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
          <CoverImage
            uri={novel.cover_url}
            title={novel.title}
            width={CARD_WIDTH}
            height={COVER_HEIGHT}
            borderRadius={6}
          />


          {/* Rating Badge Kanan Atas */}
          <View
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              backgroundColor: 'rgba(13,16,18,0.75)',
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Ionicons name="star" size={9} color={colors.primary} />
            <Text style={{ color: '#FFFFFF', fontSize: 9, lineHeight: 9 * 1.3, fontWeight: '700' }}>
              {novel.rating ? novel.rating.toFixed(1) : (9.7 - (rank - 1) * 0.1).toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Big stylized rank number overlay at bottom-left */}
        <Text
          style={{
            position: 'absolute',
            left: -4,
            bottom: -10,
            fontSize: 42,
            fontWeight: '800',
            fontStyle: 'italic',
            color: rank <= 3 ? colors.primary : '#FFFFFF',
            textShadowColor: 'rgba(0,0,0,0.65)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 6,
          }}
        >
          {rank}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textPrimary, fontWeight: '600' }}>
        {novel.title}
      </Text>
    </Pressable>

  );
}

export const TrendingRankCard = React.memo(TrendingRankCardBase);
