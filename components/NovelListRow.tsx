import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../lib/ThemeProvider';
import { CoverImage } from './CoverImage';
import { GlossyBadge, GlossyBadgeTone } from './GlossyBadge';
import { SkeletonBox } from './SkeletonLoader';

const COVER_WIDTH = 80;

export interface NovelListRowProps {
  novel: {
    id: string;
    title: string;
    nu_slug: string;
    cover_url: string | null;
    total_chapters: number;
    rating: number | null;
    status: string | null;
    genres?: string[];
    synopsis?: string | null;
    author?: string | null;
  };
  onPress: (slug: string) => void;
  onLongPress?: () => void;
}

function NovelListRowBase({ novel, onPress, onLongPress }: NovelListRowProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onPress(novel.nu_slug), [onPress, novel.nu_slug]);

  const statusTone: GlossyBadgeTone =
    novel.status === 'completed' || novel.status === 'complete'
      ? 'completed'
      : novel.status === 'hiatus'
      ? 'hiatus'
      : 'ongoing';

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={240}
      accessible
      accessibilityRole="button"
      accessibilityLabel={novel.title}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
      })}
    >
      <View style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
        <CoverImage
          uri={novel.cover_url}
          title={novel.title}
          width={COVER_WIDTH}
          height={Math.round(COVER_WIDTH * 1.35)}
          borderRadius={8}
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 19 }}
        >
          {novel.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <GlossyBadge
            label={novel.status === 'completed' ? 'Completed' : 'Ongoing'}
            tone={statusTone}
          />
          {novel.genres && novel.genres.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surfaceElevated,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' }}>
                {novel.genres[0]}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="star" size={12} color={colors.primary} />
            <Text style={{ fontSize: 11.5, color: colors.textPrimary, fontWeight: '700' }}>
              {novel.rating ? novel.rating.toFixed(1) : '9.0'}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>·</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            {novel.total_chapters} Chapters
          </Text>
        </View>

        {novel.synopsis ? (
          <Text numberOfLines={2} style={{ fontSize: 11, color: colors.textMuted, lineHeight: 15, marginTop: 2 }}>
            {novel.synopsis.replace(/\s+/g, ' ').trim()}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const NovelListRow = React.memo(NovelListRowBase);

export function NovelListRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <SkeletonBox width={COVER_WIDTH} height={Math.round(COVER_WIDTH * 1.35)} borderRadius={8} />
      <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
        <SkeletonBox height={15} width="85%" borderRadius={4} />
        <SkeletonBox height={15} width="50%" borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
          <SkeletonBox height={18} width={60} borderRadius={6} />
          <SkeletonBox height={18} width={50} borderRadius={6} />
        </View>
        <SkeletonBox height={12} width="40%" borderRadius={4} style={{ marginTop: 2 }} />
      </View>
    </View>
  );
}
