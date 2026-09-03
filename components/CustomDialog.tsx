import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { GoldSurface } from './GoldSurface';
import { useTheme } from '../lib/ThemeProvider';

export type DialogTone = 'gold' | 'danger' | 'success' | 'warning' | 'info';

export interface CustomDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: DialogTone;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

export function CustomDialog({
  visible,
  onClose,
  title,
  message,
  icon,
  tone = 'gold',
  confirmText = 'OK',
  cancelText = 'Batal',
  onConfirm,
  showCancel = true,
}: CustomDialogProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    const duration = reducedMotion ? 0 : 200;
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration, easing: Easing.in(Easing.cubic) });
      const timer = setTimeout(() => setMounted(false), duration + 10);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }],
  }));

  if (!mounted) return null;

  const toneColor =
    tone === 'danger'
      ? colors.danger
      : tone === 'success'
      ? colors.success
      : tone === 'warning'
      ? colors.warning
      : tone === 'info'
      ? colors.info
      : colors.primary;

  const defaultIcon: keyof typeof Ionicons.glyphMap =
    icon ||
    (tone === 'danger'
      ? 'trash-outline'
      : tone === 'success'
      ? 'checkmark-circle-outline'
      : tone === 'warning'
      ? 'alert-circle-outline'
      : 'sparkles');

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Dark Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0, 0, 0, 0.72)', zIndex: 998 },
          backdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Centered Modal Card */}
      <View
        style={{
          ...StyleSheet.absoluteFill,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          zIndex: 999,
          pointerEvents: 'box-none',
        }}
      >
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 340,
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 22,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 20,
              overflow: 'hidden',
            },
            cardStyle,
          ]}
        >
          {/* Top Hairline Accent */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 20,
              right: 20,
              height: 2,
              backgroundColor: toneColor,
              opacity: 0.8,
            }}
          />

          {/* Dialog Icon */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: tone === 'danger' ? 'rgba(216,102,102,0.14)' : colors.primaryMuted,
              borderWidth: 1,
              borderColor: toneColor + '44',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              marginTop: 4,
            }}
          >
            <Ionicons name={defaultIcon} size={26} color={toneColor} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 13,
              color: colors.textMuted,
              textAlign: 'center',
              lineHeight: 19,
              marginBottom: 20,
            }}
          >
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            {showCancel && (
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? colors.surfaceElevated : colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted }}>
                  {cancelText}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
            >
              {tone === 'danger' ? (
                <View
                  style={{
                    backgroundColor: colors.danger,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                    {confirmText}
                  </Text>
                </View>
              ) : (
                <GoldSurface
                  shimmer
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textOnPrimary }}>
                    {confirmText}
                  </Text>
                </GoldSurface>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
