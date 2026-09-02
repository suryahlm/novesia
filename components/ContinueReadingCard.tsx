import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CoverImage } from './CoverImage';
import { useTheme } from '../lib/ThemeProvider';

const CARD_WIDTH = 104;
const FRAME_PADDING = 6;
const COVER_WIDTH = CARD_WIDTH - FRAME_PADDING * 2;
const COVER_HEIGHT = Math.round(COVER_WIDTH * (120 / 104)); // ~106px

export interface ContinueReadingCardProps {
  item: {
    novel_id: string;
    title: string;
    cover: string | null;
    last_chapter: number;
    last_chapter_id: string;
    total_chapters?: number;
    rating?: number | null;
  };
  onPress: (chapterId: string) => void;
}

function ContinueReadingCardBase({ item, onPress }: ContinueReadingCardProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onPress(item.last_chapter_id), [onPress, item.last_chapter_id]);
  const totalCh = item.total_chapters || item.last_chapter || 1;
  const progressRatio = Math.min(1, item.last_chapter / totalCh);

  return (
    <Pressable
      onPress={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Lanjut baca ${item.title}`}
      style={{ width: CARD_WIDTH }}
    >
      <View
        style={{
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: FRAME_PADDING,
          gap: 4,
        }}
      >
        <View style={{ borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
          <CoverImage
            uri={item.cover}
            title={item.title}
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            borderRadius={6}
          />

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
              {item.rating ? item.rating.toFixed(1) : '9.0'}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={2}
          style={{
            fontSize: 11.5,
            fontWeight: '600',
            color: colors.textPrimary,
            height: 32,
            lineHeight: 16,
          }}
        >
          {item.title}
        </Text>

        {/* Progress Bar */}
        <View style={{ height: 4, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden', marginTop: 2 }}>
          <View
            style={{
              height: '100%',
              width: `${Math.round(progressRatio * 100)}%`,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}

export const ContinueReadingCard = React.memo(ContinueReadingCardBase);
