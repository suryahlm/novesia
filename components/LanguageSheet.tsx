import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from './BottomSheet';
import { GoldSurface } from './GoldSurface';
import { useLanguage, Language } from '../lib/i18n';
import { useTheme } from '../lib/ThemeProvider';

interface LanguageSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (selectedLang: Language) => void;
}

const LANGUAGE_OPTIONS: {
  id: Language;
  flag: string;
  nameKey: 'lang_id_name' | 'lang_en_name';
  subKey: 'lang_id_sub' | 'lang_en_sub';
}[] = [
  {
    id: 'id',
    flag: '🇮🇩',
    nameKey: 'lang_id_name',
    subKey: 'lang_id_sub',
  },
  {
    id: 'en',
    flag: '🇬🇧',
    nameKey: 'lang_en_name',
    subKey: 'lang_en_sub',
  },
];

export function LanguageSheet({ visible, onClose, onSelect }: LanguageSheetProps) {
  const { colors } = useTheme();
  const { lang, t, changeLang } = useLanguage();

  const handleSelectLanguage = (newLang: Language) => {
    changeLang(newLang);
    if (onSelect) {
      onSelect(newLang);
    }
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.choose_language_title}
      icon="language-outline"
    >
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text
          style={{
            fontSize: 12.5,
            color: colors.textMuted,
            marginBottom: 16,
            lineHeight: 18,
          }}
        >
          {t.choose_language_sub}
        </Text>

        {/* Options List */}
        <View style={{ gap: 10, marginBottom: 18 }}>
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.id === lang;
            const title = t[option.nameKey];
            const subtitle = t[option.subKey];

            return (
              <Pressable
                key={option.id}
                onPress={() => handleSelectLanguage(option.id)}
                accessibilityRole="button"
                accessibilityLabel={`${title} - ${subtitle}`}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                {isSelected ? (
                  <View
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      backgroundColor: colors.surfaceElevated,
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.primaryMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.primary + '60',
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{option.flag}</Text>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: colors.textPrimary,
                          }}
                        >
                          {title}
                        </Text>
                        <GoldSurface
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9.5,
                              fontWeight: '800',
                              color: colors.textOnPrimary,
                              letterSpacing: 0.4,
                              textTransform: 'uppercase',
                            }}
                          >
                            Aktif
                          </Text>
                        </GoldSurface>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textMuted,
                        }}
                      >
                        {subtitle}
                      </Text>
                    </View>

                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  </View>
                ) : (
                  <View
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      backgroundColor: colors.surfaceElevated,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{option.flag}</Text>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: colors.textPrimary,
                        }}
                      >
                        {title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textMuted,
                        }}
                      >
                        {subtitle}
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Notice Info Box */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.primaryMuted,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary + '30',
          }}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text
            style={{
              flex: 1,
              fontSize: 11.5,
              color: colors.textPrimary,
              lineHeight: 16,
            }}
          >
            {t.language_switch_notice}
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}
