import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../lib/ThemeProvider';
import { AppNotification, NotificationType } from '../lib/useNotificationsQuery';

const TYPE_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  warning: 'warning',
  maintenance: 'construct',
};

const TYPE_ACCENT: Record<NotificationType, string> = {
  info: '#8B5CF6',
  warning: '#F59E0B',
  maintenance: '#3B82F6',
};

interface AnnouncementBannerProps {
  announcements: AppNotification[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
}

/**
 * Banner notifikasi/pengumuman in-app di Beranda (seperti di Komiku):
 * - Tampil di bawah tab filter Bahasa dan di atas Trending & Populer.
 * - Warna dan ikon dinamis sesuai tipe ('info' | 'warning' | 'maintenance').
 * - Dapat di-dismiss per sesi dan muncul kembali saat pull-to-refresh.
 */
export function AnnouncementBanner({ announcements, dismissedIds, onDismiss }: AnnouncementBannerProps) {
  const { colors } = useTheme();
  const visible = announcements.filter((a) => !dismissedIds.has(a.id));

  if (!visible.length) return null;

  return (
    <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 20 }}>
      {visible.map((a) => {
        const accent = TYPE_ACCENT[a.type] || colors.primary;
        const iconName = TYPE_ICON[a.type] || 'information-circle';

        return (
          <View
            key={a.id}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              padding: 14,
              borderRadius: 12,
              backgroundColor: `${accent}18`,
              borderWidth: 1,
              borderColor: `${accent}50`,
              shadowColor: accent,
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Ionicons name={iconName} size={22} color={accent} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                {a.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 }}>
                {a.message}
              </Text>
            </View>
            <Pressable
              onPress={() => onDismiss(a.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Tutup pengumuman"
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 0.8,
                padding: 4,
                marginTop: -2,
                marginRight: -4,
              })}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
