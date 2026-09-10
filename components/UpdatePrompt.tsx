import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AvailableUpdate } from '../hooks/useInAppUpdate';
import { useTheme } from '../lib/ThemeProvider';

const ANIM_MS = 240;

export interface UpdatePromptProps {
  update: AvailableUpdate | null;
  starting: boolean;
  startUpdate: () => void;
  dismiss: () => void;
  visible: boolean;
}

/**
 * UpdatePrompt
 * Custom dialog popup untuk in-app update Google Play Store.
 *
 * Menggunakan overlay View kustom (bukan modal native RN) agar tidak merusak
 * konfigurasi edge-to-edge dan warna background navigation bar Android.
 */
export function UpdatePrompt({
  update,
  starting,
  startUpdate,
  dismiss,
  visible,
}: UpdatePromptProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  // Cache data update terakhir agar konten kartu tidak hilang mendadak saat update di-null-kan saat animasi keluar
  const [cachedUpdate, setCachedUpdate] = useState(update);
  if (update && update !== cachedUpdate) {
    setCachedUpdate(update);
  }
  const shown = update ?? cachedUpdate;

  // Pertahankan render saat closing agar animasi keluar selesai berjalan
  const [rendered, setRendered] = useState(visible);
  if (visible && !rendered) {
    setRendered(true);
  }

  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    const duration = reducedMotion ? 0 : ANIM_MS;
    if (visible) {
      progress.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else if (rendered) {
      progress.value = withTiming(
        0,
        { duration, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(setRendered)(false);
          }
        }
      );
    }
  }, [visible, reducedMotion, rendered, progress]);

  // Handle tombol hardware back Android
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Update opsional: back button = snooze / nanti
      // Update wajib: dismiss() diabaikan, back button diblokir total
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [visible, dismiss]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.92 + progress.value * 0.08 },
      { translateY: (1 - progress.value) * 16 },
    ],
  }));

  if (!rendered || !shown) return null;

  const stale = shown.daysSinceRelease !== null && shown.daysSinceRelease >= 1;

  return (
    <View style={[StyleSheet.absoluteFill, styles.rootOverlay]}>
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.72)' },
          backdropStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={shown.mandatory ? undefined : dismiss}
          accessibilityRole={shown.mandatory ? 'none' : 'button'}
          accessibilityLabel={shown.mandatory ? undefined : 'Tutup, perbarui nanti'}
        />
      </Animated.View>

      {/* Card Container */}
      <View style={styles.centerWrapper} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={[
            styles.dialogCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            cardStyle,
          ]}
        >
          {/* Top ambient hairline */}
          <View
            style={[
              styles.topHairline,
              { backgroundColor: colors.primary },
            ]}
          />

          {/* Hero Icon */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={[
                colors.gradientLight || colors.primary,
                colors.gradientDark || colors.primaryPressed || colors.primary,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons
                name={shown.mandatory ? 'alert-circle' : 'cloud-download'}
                size={32}
                color={colors.textOnPrimary}
              />
            </LinearGradient>
          </View>

          {/* Judul */}
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
            ]}
          >
            {shown.mandatory ? 'Update Wajib Tersedia' : 'Versi Baru Tersedia'}
          </Text>

          {/* Deskripsi */}
          <Text
            style={[
              styles.description,
              { color: colors.textSecondary },
            ]}
          >
            {shown.mandatory
              ? 'Versi Novesia yang kamu gunakan sudah tidak didukung. Perbarui sekarang untuk melanjutkan membaca.'
              : 'Ada pembaruan Novesia di Google Play Store — peningkatan performa, perbaikan bug, dan fitur terbaru.'}
          </Text>

          {/* Badge Pending Days (hanya untuk update opsional jika sudah tertunda >= 1 hari) */}
          {stale && !shown.mandatory ? (
            <View
              style={[
                styles.badgeContainer,
                {
                  backgroundColor: colors.primaryMuted || colors.primary + '18',
                  borderColor: colors.primary + '35',
                },
              ]}
            >
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                Tertunda {shown.daysSinceRelease} hari
              </Text>
            </View>
          ) : null}

          {/* Tombol Aksi */}
          <View style={styles.actionGroup}>
            <Pressable
              onPress={startUpdate}
              disabled={starting}
              accessibilityRole="button"
              accessibilityLabel="Perbarui sekarang"
              accessibilityState={{ disabled: starting, busy: starting }}
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: starting ? 0.75 : pressed ? 0.88 : 1 },
              ]}
            >
              <LinearGradient
                colors={[
                  colors.primary,
                  colors.primaryPressed || colors.primary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnGradient}
              >
                {starting ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Ionicons name="arrow-down-circle" size={19} color={colors.textOnPrimary} />
                )}
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: colors.textOnPrimary },
                  ]}
                >
                  {starting ? 'Menyiapkan…' : 'Perbarui Sekarang'}
                </Text>
              </LinearGradient>
            </Pressable>

            {shown.mandatory ? null : (
              <Pressable
                onPress={dismiss}
                disabled={starting}
                accessibilityRole="button"
                accessibilityLabel="Perbarui nanti"
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textMuted }]}>
                  Nanti
                </Text>
              </Pressable>
            )}
          </View>

          {/* Catatan Google Play */}
          <Text style={[styles.playStoreNote, { color: colors.textMuted }]}>
            Pembaruan diunduh dan dipasang langsung oleh Google Play
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootOverlay: {
    zIndex: 998,
    elevation: 998,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 36,
    right: 36,
    height: 2.5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.75,
  },
  iconWrapper: {
    marginBottom: 16,
    borderRadius: 34,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 19,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11.5,
  },
  actionGroup: {
    width: '100%',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13.5,
  },
  playStoreNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    textAlign: 'center',
  },
});
