import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../lib/ThemeProvider';
import { AppNotification } from '../lib/useNotificationsQuery';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  INFO: 'information-circle',
  maintenance: 'construct',
  MAINTENANCE: 'construct',
  warning: 'warning',
  WARNING: 'warning',
  success: 'checkmark-circle',
  SUCCESS: 'checkmark-circle',
};

interface AnnouncementBannerProps {
  announcements: AppNotification[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
}

/**
 * Stack pengumuman admin di Beranda - persis sama dengan Komiku (AnnouncementBanner.tsx).
 * Tampilan flat translucent yang bersih tanpa kotak bayangan/elevation di dalam card.
 */
export function AnnouncementBanner({ announcements, dismissedIds, onDismiss }: AnnouncementBannerProps) {
  const { colors } = useTheme();
  const visible = announcements.filter((a) => !dismissedIds.has(a.id));

  if (!visible.length) return null;

  const typeAccent: Record<string, string> = {
    info: colors.info || '#6F9FC8',
    INFO: colors.info || '#6F9FC8',
    maintenance: colors.warning || '#E5A94B',
    MAINTENANCE: colors.warning || '#E5A94B',
    warning: colors.danger || '#D86666',
    WARNING: colors.danger || '#D86666',
    success: colors.success || '#66C47A',
    SUCCESS: colors.success || '#66C47A',
  };

  return (
    <View style={{ paddingHorizontal: 16, gap: 8, marginBottom: 20 }}>
      {visible.map((a) => {
        const key = a.type || 'info';
        const accent = typeAccent[key] || colors.info || '#6F9FC8';
        const iconName = TYPE_ICON[key] || 'information-circle';

        return (
          <View
            key={a.id}
            style={{
              flexDirection: 'row',
              gap: 8,
              padding: 12,
              borderRadius: 16,
              backgroundColor: `${accent}1A`,
              borderWidth: 1,
              borderColor: `${accent}59`,
            }}
          >
            <Ionicons name={iconName} size={20} color={accent} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                {a.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                {a.message}
              </Text>
            </View>
            <Pressable
              onPress={() => onDismiss(a.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Tutup pengumuman"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
