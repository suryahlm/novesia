import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeProvider';

const ANIM_MS = 220;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, icon, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  useEffect(() => {
    const duration = reducedMotion ? 0 : ANIM_MS;
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
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 32 }],
  }));

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)' }, backdropStyle]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup"
        />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        importantForAccessibility="yes"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            paddingBottom: insets.bottom + 16,
            maxHeight: '80%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 16,
          },
          sheetStyle,
        ]}
      >
        {/* Hairline accent on top edge */}
        <View
          style={{
            position: 'absolute',
            top: -1,
            left: 24,
            right: 24,
            height: 2,
            borderRadius: 1,
            backgroundColor: colors.primary,
            opacity: 0.7,
          }}
        />

        {/* Grab Handle */}
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: colors.border }} />
        </View>

        {/* Sheet Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 10,
          }}
        >
          {icon && (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={icon} size={15} color={colors.primary} />
            </View>
          )}
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {children}
      </Animated.View>
    </View>
  );
}
