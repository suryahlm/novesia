import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../lib/ThemeProvider';

export interface CoverImageProps {
  uri?: string | null;
  title: string;
  width: number;
  height: number;
  borderRadius?: number;
}

function initials(title: string): string {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Placeholder cover 100% lokal (gradient + ikon buku + inisial judul).
 * Tidak bergantung koneksi jaringan, langsung muncul seketika tanpa jeda.
 */
function LocalCoverPlaceholder({ title, width, height, borderRadius = 6 }: Omit<CoverImageProps, 'uri'>) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={['#1D2225', '#121619']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width,
        height,
        borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Ionicons
        name="book"
        size={width * 0.75}
        color={colors.primaryMuted}
        style={StyleSheet.absoluteFill}
      />
      <Text
        style={{
          color: colors.primary,
          fontSize: Math.max(12, width * 0.2),
          fontWeight: '700',
          letterSpacing: 1,
        }}
      >
        {initials(title)}
      </Text>
    </LinearGradient>
  );
}

export function CoverImage({ uri, title, width, height, borderRadius = 6 }: CoverImageProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <LocalCoverPlaceholder
        title={title}
        width={width}
        height={height}
        borderRadius={borderRadius}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: colors.surfaceElevated,
      }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
      onError={() => setFailed(true)}
      accessibilityLabel={`Sampul novel ${title}`}
    />
  );

}
