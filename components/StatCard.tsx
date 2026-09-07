import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeProvider';

export interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  onPress?: () => void;
}

export function StatCard({ icon, label, value, onPress }: StatCardProps) {
  const { colors } = useTheme();

  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name={icon} size={14} color={colors.primary} />
        <Text style={{ fontSize: 15.5, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 }}>
          {value}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '500', marginTop: 1 }}>
        {label}
      </Text>
    </>
  );

  const containerStyle = (pressed?: boolean) => ({
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  });

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }: { pressed: boolean }) => containerStyle(pressed)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle()}>
      {content}
    </View>
  );
}
