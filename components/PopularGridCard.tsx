import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlossyBadge, GlossyBadgeTone } from './GlossyBadge';
import { CoverImage } from './CoverImage';
import { useTheme } from '../lib/ThemeProvider';

const FRAME_PADDING = 6;
const HOT_RANK_THRESHOLD = 3;
const RATING_SCALE_BASE_WIDTH = 104;
const RATING_MAX_SCALE = 1.35;

function ratingScale(width: number) {
  return Math.min(RATING_MAX_SCALE, Math.max(1, width / RATING_SCALE_BASE_WIDTH));
}

const NARROW_CARD_WIDTH_THRESHOLD = 150;

export interface PopularGridCardProps {
  novel: {
    id: string;
    title: string;
    nu_slug: string;
    cover_url: string | null;
    total_chapters: number;
    rating: number | null;
    status: string | null;
    genres?: string[];
  };
  width: number;
  onPress: (slug: string) => void;
  onLongPress?: () => void;
  rank?: number;
}

function PopularGridCardBase({ novel, width, onPress, onLongPress, rank }: PopularGridCardProps) {
  const { colors } = useTheme();
  const coverWidth = width - FRAME_PADDING * 2;
  const height = Math.round(coverWidth * 1.3);
  const handlePress = useCallback(() => onPress(novel.nu_slug), [onPress, novel.nu_slug]);

  const isHot = rank !== undefined && rank < HOT_RANK_THRESHOLD;
  const statusTone: GlossyBadgeTone =
    novel.status === 'completed' || novel.status === 'complete'
      ? 'completed'
      : novel.status === 'hiatus'
      ? 'hiatus'
      : 'ongoing';

  const badge = isHot
    ? { label: 'Hot', tone: 'hot' as GlossyBadgeTone }
    : { label: novel.status === 'completed' ? 'Completed' : 'Ongoing', tone: statusTone };

  const scale = ratingScale(width);
  const isNarrow = width < NARROW_CARD_WIDTH_THRESHOLD;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={240}
      accessible
      accessibilityRole="button"
      accessibilityLabel={novel.title}
      style={{ width }}
    >
      <View
        style={{
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: FRAME_PADDING,
          gap: 8,
        }}
      >
        <View style={{ borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
          <CoverImage
            uri={novel.cover_url}
            title={novel.title}
            width={coverWidth}
            height={height}
            borderRadius={6}
          />

          {badge ? (
            <View style={{ position: 'absolute', top: 0, right: 0 }}>
              <GlossyBadge label={badge.label} tone={badge.tone} cardWidth={width} />
            </View>
          ) : null}

          {/* Rating Pill di Kiri Bawah */}
          <View
            style={{
              position: 'absolute',
              left: 4,
              bottom: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3 * scale,
              backgroundColor: 'rgba(13,16,18,0.75)',
              paddingHorizontal: 4 * scale,
              paddingVertical: 3 * scale,
              borderRadius: 6,
            }}
          >
            <Ionicons name="star" size={10 * scale} color={colors.primary} />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10 * scale,
                lineHeight: 10 * scale * 1.3,
                fontWeight: '700',
              }}
            >
              {novel.rating ? novel.rating.toFixed(1) : '9.0'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: isNarrow ? 12 : 13.5,
              fontWeight: '700',
              color: colors.textPrimary,
              lineHeight: isNarrow ? 16 : 18,
            }}
          >
            {novel.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 10.5,
              color: colors.textMuted,
              fontWeight: '500',
              lineHeight: 14,
            }}
          >
            {novel.total_chapters} Ch · {novel.genres && novel.genres.length > 0 ? novel.genres[0] : 'Novel'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const PopularGridCard = React.memo(PopularGridCardBase);
