import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeProvider';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle | ViewStyle[];
  retryLabel?: string;
}

/**
 * Komponen ErrorState generik (Pola Komiku).
 * Ditampilkan saat request jaringan gagal atau timeout, memberikan feedback jelas
 * ke user dan tombol "Coba Lagi" (Retry) tanpa perlu menutup paksa app.
 */
export function ErrorState({
  title,
  message = 'Gagal memuat data. Periksa koneksi internet Anda.',
  onRetry,
  style,
  retryLabel = 'Coba Lagi',
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.primary} />
      </View>
      {title && (
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
      )}
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Ionicons name="refresh-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
          <Text style={styles.retryBtnText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 280,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  retryBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
