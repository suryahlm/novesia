import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../lib/ThemeProvider';

export type GridViewMode = 3 | 2 | 'list';

export interface ViewModeToggleProps {
  mode: GridViewMode;
  accessibilityLabel?: string;
  onPress: () => void;
}

/**
 * Tombol toggle mode tampilan (grid 3 kolom, 2 kolom, atau list baris).
 * Menggambar bentuk bar/garis secara presisi sesuai arsitektur Komiku.
 */
export function ViewModeToggle({ mode, accessibilityLabel, onPress }: ViewModeToggleProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `Ubah mode tampilan (sekarang ${mode})`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: mode === 'list' ? 0 : 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 28,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary + '88',
        backgroundColor: colors.primaryMuted,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {mode === 'list' ? (
        <View style={{ gap: 2.5 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: colors.primary }}
            />
          ))}
        </View>
      ) : (
        Array.from({ length: mode }).map((_, i) => (
          <View
            key={i}
            style={{
              width: mode === 2 ? 6 : 3.5,
              height: 13,
              borderRadius: 1.5,
              backgroundColor: colors.primary,
            }}
          />
        ))
      )}
    </Pressable>
  );
}
