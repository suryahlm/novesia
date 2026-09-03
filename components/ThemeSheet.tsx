import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from './BottomSheet';
import { GoldSurface } from './GoldSurface';
import { ACCENT_REGISTRY, AccentId } from '../lib/accents';
import { useThemeStore } from '../lib/useThemeStore';
import { useTheme } from '../lib/ThemeProvider';

interface ThemeSheetProps {
  visible: boolean;
  onClose: () => void;
  isVip?: boolean;
  onVipRequired?: () => void;
}

const MODE_OPTIONS: { key: 'dark' | 'light'; label: string; icon: 'moon' | 'sunny' }[] = [
  { key: 'dark', label: 'Gelap', icon: 'moon' },
  { key: 'light', label: 'Terang', icon: 'sunny' },
];

export function ThemeSheet({
  visible,
  onClose,
}: ThemeSheetProps) {
  const { colors } = useTheme();
  const accentId = useThemeStore((s) => s.accentId);
  const setAccent = useThemeStore((s) => s.setAccent);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const accents = Object.values(ACCENT_REGISTRY) as (typeof ACCENT_REGISTRY)[AccentId][];

  const handlePress = (accent: (typeof ACCENT_REGISTRY)[AccentId]) => {
    setAccent(accent.id as AccentId);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Pilihan Tema & Aksen" icon="color-palette-outline">
      {/* Mode Tampilan */}
      <Text
        style={{
          fontSize: 11,
          color: colors.textMuted,
          paddingHorizontal: 16,
          marginBottom: 8,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        Mode Tampilan
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 18 }}>
        {MODE_OPTIONS.map((option) => {
          const isActive = option.key === mode;
          return (
            <Pressable
              key={option.key}
              onPress={() => setMode(option.key)}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel={`Mode ${option.label}`}
            >
              {isActive ? (
                <GoldSurface
                  style={{
                    borderRadius: 10,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name={option.icon} size={16} color={colors.textOnPrimary} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textOnPrimary }}>
                    {option.label}
                  </Text>
                </GoldSurface>
              ) : (
                <View
                  style={{
                    borderRadius: 10,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name={option.icon} size={16} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>
                    {option.label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Aksen Warna */}
      <Text
        style={{
          fontSize: 11,
          color: colors.textMuted,
          paddingHorizontal: 16,
          marginBottom: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        Pilihan Aksen Warna (Semua Terbuka)
      </Text>

      <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 24,
          }}
        >
          {accents.map((accent) => {
            const isActive = accent.id === accentId;

            return (
              <Pressable
                key={accent.id}
                onPress={() => handlePress(accent)}
                style={({ pressed }) => ({
                  width: '18%',
                  alignItems: 'center',
                  gap: 4,
                  opacity: pressed ? 0.7 : 1,
                })}
                accessibilityRole="button"
                accessibilityLabel={`Tema ${accent.name}`}
              >
                <View
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: 10,
                    overflow: 'hidden',
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? accent.primary : colors.border,
                  }}
                >
                  <LinearGradient
                    colors={[accent.gradientLight, accent.gradientDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {/* Metallic Glass Highlight Sheen */}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0)']}
                      locations={[0, 0.6]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />

                    <Text style={{ fontSize: 15 }}>{accent.emoji}</Text>

                    {isActive && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? accent.primary : colors.textMuted,
                  }}
                >
                  {accent.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
