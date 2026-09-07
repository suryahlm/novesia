import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from './BottomSheet';
import { ACCENT_REGISTRY, AccentId } from '../lib/accents';
import { useThemeStore } from '../lib/useThemeStore';
import { useTheme } from '../lib/ThemeProvider';
import { useLanguage } from '../lib/i18n';

interface ThemeSheetProps {
  visible: boolean;
  onClose: () => void;
  isVip?: boolean;
  onVipRequired?: () => void;
}

export function ThemeSheet({ visible, onClose }: ThemeSheetProps) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const accentId = useThemeStore((s) => s.accentId);
  const setAccent = useThemeStore((s) => s.setAccent);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const accents = Object.values(ACCENT_REGISTRY) as (typeof ACCENT_REGISTRY)[AccentId][];

  const handlePress = (accent: (typeof ACCENT_REGISTRY)[AccentId]) => {
    setAccent(accent.id as AccentId);
    onClose();
  };

  const isId = lang === 'id';

  const MODE_OPTIONS: { key: 'dark' | 'light'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'dark', label: isId ? 'Gelap' : 'Dark', icon: 'moon' },
    { key: 'light', label: isId ? 'Terang' : 'Light', icon: 'sunny' },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.theme_accent || 'Pilihan Tema & Aksen'}
      icon="color-palette-outline"
    >
      <View style={styles.sheetBody}>
        {/* Section 1: Appearance Mode (Segmented Capsule) */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          {isId ? 'MODE TAMPILAN' : 'APPEARANCE'}
        </Text>

        <View
          style={[
            styles.modeSegmentContainer,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {MODE_OPTIONS.map((option) => {
            const isActive = option.key === mode;
            return (
              <Pressable
                key={option.key}
                onPress={() => setMode(option.key)}
                style={({ pressed }) => [
                  styles.modeSegmentItem,
                  isActive && [
                    styles.modeSegmentItemActive,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ],
                  { opacity: pressed ? 0.75 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Mode ${option.label}`}
              >
                <Ionicons
                  name={option.icon}
                  size={15}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.modeSegmentText,
                    {
                      color: isActive ? colors.textPrimary : colors.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Section 2: Accent Color Palette (5 columns x 2 rows) */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          {isId ? 'AKSEN WARNA' : 'COLOR ACCENT'}
        </Text>

        <View style={styles.accentGrid}>
          {accents.map((accent) => {
            const isActive = accent.id === accentId;

            return (
              <Pressable
                key={accent.id}
                onPress={() => handlePress(accent)}
                style={({ pressed }) => [
                  styles.accentItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Aksen ${accent.name}`}
              >
                {/* Gemstone Swatch Circle */}
                <View
                  style={[
                    styles.swatchOuterRing,
                    {
                      borderColor: isActive ? accent.primary : colors.border,
                      borderWidth: isActive ? 2 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[accent.gradientLight, accent.gradientDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.swatchInner}
                  >
                    {/* Subtle Luxury Glass Sheen */}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
                      locations={[0, 0.65]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />

                    {/* Centered Checkmark for Active Accent */}
                    {isActive && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color="#FFFFFF"
                        style={styles.checkmarkIcon}
                      />
                    )}
                  </LinearGradient>
                </View>

                {/* Accent Label */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.accentLabel,
                    {
                      color: isActive ? colors.textPrimary : colors.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {accent.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  modeSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    marginBottom: 18,
    gap: 3,
  },
  modeSegmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modeSegmentItemActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  modeSegmentText: {
    fontSize: 12.5,
  },
  accentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    marginBottom: 6,
  },
  accentItem: {
    width: '20%',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  swatchOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchInner: {
    flex: 1,
    width: '100%',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkmarkIcon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  accentLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
