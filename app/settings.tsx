import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import * as Haptics from 'expo-haptics';

import { useLanguage } from '../lib/i18n';
import { useTheme } from '../lib/ThemeProvider';
import { useNotificationSettingsStore } from '../lib/useNotificationSettingsStore';
import { GradientBackground } from '../components/GradientBackground';
import { LanguageSheet } from '../components/LanguageSheet';
import { CustomDialog } from '../components/CustomDialog';
import { useInAppUpdate } from '../hooks/useInAppUpdate';

const SETTINGS_KEY = 'novesia_reading_settings';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  colors,
}: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: pressed && !isSwitch ? colors.surfaceElevated : 'transparent',
        },
      ]}
      onPress={onPress}
      disabled={isSwitch}
      accessibilityRole={isSwitch ? 'switch' : 'button'}
      accessibilityLabel={label}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primaryMuted || colors.primary + '18',
              borderColor: colors.primary + '30',
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      </View>

      <View style={styles.rowRight}>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
            thumbColor={switchValue ? colors.textOnPrimary : colors.textMuted}
          />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {value ? (
              <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const notifications = useNotificationSettingsStore((s) => s.enabled);
  const setNotifications = useNotificationSettingsStore((s) => s.setEnabled);
  const [langSheetVisible, setLangSheetVisible] = useState(false);
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [updateDialogMessage, setUpdateDialogMessage] = useState('');
  const [updateDialogIcon, setUpdateDialogIcon] = useState<'cloud-done-outline' | 'alert-circle-outline'>('cloud-done-outline');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [textSize, setTextSize] = useState(18);

  const inAppUpdate = useInAppUpdate();

  const handleCheckUpdate = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    try {
      const result = await inAppUpdate.checkNow(true);
      if (result) {
        // Update ditemukan — prompt update global akan otomatis muncul
        setUpdateDialogVisible(false);
      } else {
        const curVer = Constants.expoConfig?.version ?? '1.1.8';
        setUpdateDialogIcon('cloud-done-outline');
        setUpdateDialogMessage(`${t.app_is_up_to_date} (v${curVer})`);
        setUpdateDialogVisible(true);
      }
    } catch {
      const curVer = Constants.expoConfig?.version ?? '1.1.8';
      setUpdateDialogIcon('cloud-done-outline');
      setUpdateDialogMessage(`${t.app_is_up_to_date} (v${curVer})`);
      setUpdateDialogVisible(true);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((stored) => {
        if (isMounted && stored) {
          try {
            const s = JSON.parse(stored);
            if (s.fontSize) setTextSize(s.fontSize);
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const updateTextSize = async (newSize: number) => {
    setTextSize(newSize);
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      const s = stored ? JSON.parse(stored) : {};
      s.fontSize = newSize;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {}
  };

  const openWebLegal = (path: 'privacy' | 'terms') => {
    const url = `https://novesia.cc/${path}?lang=${lang}`;
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientBackground />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t.settings}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.primary }]}>
              {t.preferences}
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <SettingRow
                colors={colors}
                icon="language-outline"
                label={t.language}
                value={lang === 'en' ? 'English 🇬🇧' : 'Indonesia 🇮🇩'}
                onPress={() => setLangSheetVisible(true)}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingRow
                colors={colors}
                icon={notifications ? 'notifications-outline' : 'notifications-off-outline'}
                label={t.notifications}
                isSwitch
                switchValue={notifications}
                onSwitchChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setNotifications(val);
                }}
              />
            </View>
          </View>

          {/* Reading Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.primary }]}>
              {t.reading_section}
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.settingRow}>
                <View style={styles.rowLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: colors.primaryMuted || colors.primary + '18',
                        borderColor: colors.primary + '30',
                      },
                    ]}
                  >
                    <Ionicons name="text-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textPrimary, marginLeft: 0 }]}>
                      {t.text_size}
                    </Text>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      {t.text_size_desc}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.sizeBtn,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => updateTextSize(Math.max(12, textSize - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Kecilkan teks"
                  >
                    <Text style={[styles.sizeBtnText, { color: colors.primary }]}>A-</Text>
                  </Pressable>

                  <View
                    style={[
                      styles.sizeSliderTrack,
                      { backgroundColor: colors.surfaceElevated },
                    ]}
                  >
                    <View
                      style={[
                        styles.sizeSliderFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${((textSize - 12) / 16) * 100}%`,
                        },
                      ]}
                    />
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.sizeBtn,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => updateTextSize(Math.min(28, textSize + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Besarkan teks"
                  >
                    <Text style={[styles.sizeBtnText, { color: colors.primary }]}>A+</Text>
                  </Pressable>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {t.text_size_small}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.primary,
                      fontWeight: '800',
                    }}
                  >
                    {textSize}px
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {t.text_size_large}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: textSize,
                    color: colors.textSecondary,
                    marginTop: 14,
                    lineHeight: textSize * 1.6,
                    paddingHorizontal: 4,
                  }}
                >
                  {lang === 'id'
                    ? 'Rubah cokelat yang lincah melompati anjing pemalas.'
                    : 'The quick brown fox jumps over the lazy dog.'}
                </Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.primary }]}>
              {t.about}
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <SettingRow
                colors={colors}
                icon="cloud-download-outline"
                label={t.check_updates}
                value={
                  isCheckingUpdate
                    ? (lang === 'id' ? 'Memeriksa...' : 'Checking...')
                    : `v${Constants.expoConfig?.version ?? '1.1.8'}`
                }
                onPress={handleCheckUpdate}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingRow
                colors={colors}
                icon="shield-checkmark-outline"
                label={t.privacy_policy}
                onPress={() => openWebLegal('privacy')}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingRow
                colors={colors}
                icon="document-text-outline"
                label={t.terms}
                onPress={() => openWebLegal('terms')}
              />
            </View>
          </View>

          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {`Novesia App v${Constants.expoConfig?.version ?? '1.1.8'} Build ${Constants.expoConfig?.android?.versionCode ?? 18}`}
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Language Bottom Sheet */}
      <LanguageSheet
        visible={langSheetVisible}
        onClose={() => setLangSheetVisible(false)}
      />

      {/* Update Check Info Dialog */}
      <CustomDialog
        visible={updateDialogVisible}
        onClose={() => setUpdateDialogVisible(false)}
        title={t.check_updates}
        message={updateDialogMessage || `${t.app_is_up_to_date} (v${Constants.expoConfig?.version ?? '1.1.8'})`}
        icon={updateDialogIcon}
        tone="gold"
        showCancel={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 1.2,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11.5,
    marginTop: 16,
    fontWeight: '500',
  },
  sizeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  sizeSliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sizeSliderFill: {
    height: '100%',
    borderRadius: 3,
  },
});
