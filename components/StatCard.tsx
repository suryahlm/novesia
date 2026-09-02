import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeProvider';

export interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={15} color={colors.primary} />
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 11, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
