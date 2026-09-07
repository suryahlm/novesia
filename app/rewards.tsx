import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  Clipboard,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useLanguage } from '../lib/i18n';
import { useTheme } from '../lib/ThemeProvider';
import { GradientBackground } from '../components/GradientBackground';
import { getAppConfig, AppConfig } from '../lib/appConfig';

const { width } = Dimensions.get('window');

const DEFAULT_REWARDS = [10, 20, 30, 40, 50, 60, 70];
const CHECKIN_KEY = 'novesia_daily_checkin';
const COINS_KEY = 'novesia_coins';

interface CheckinData {
  lastDate: string;
  streak: number;
  weekStart: string;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

export default function RewardsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [coins, setCoins] = useState(0);
  const [checkin, setCheckin] = useState<CheckinData>({ lastDate: '', streak: 0, weekStart: '' });
  const [checkedToday, setCheckedToday] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  // Watch ads state
  const [adWatchCount, setAdWatchCount] = useState(0);
  const [adCooldownEnd, setAdCooldownEnd] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const MAX_AD_WATCHES = 3;
  const COOLDOWN_MS = 40 * 60 * 1000;
  const AD_WATCH_KEY = 'novesia_ad_watches';

  const DAILY_REWARDS = appConfig?.daily_checkin_rewards || DEFAULT_REWARDS;
  const adReward = appConfig?.watch_ad_reward || 40;

  useEffect(() => {
    loadData();
    loadAdWatchData();
    getAppConfig().then(setAppConfig);
  }, []);

  useEffect(() => {
    if (adCooldownEnd <= 0) return;
    const interval = setInterval(() => {
      const remaining = adCooldownEnd - Date.now();
      if (remaining <= 0) {
        setCooldownRemaining(0);
        setAdCooldownEnd(0);
        setAdWatchCount(0);
        AsyncStorage.setItem(AD_WATCH_KEY, JSON.stringify({ count: 0, cooldownEnd: 0 }));
        clearInterval(interval);
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [adCooldownEnd]);

  const loadData = async () => {
    try {
      const [storedCoins, storedCheckin, storedRef, storedClaimed] = await Promise.all([
        AsyncStorage.getItem(COINS_KEY),
        AsyncStorage.getItem(CHECKIN_KEY),
        AsyncStorage.getItem('novesia_referral_code'),
        AsyncStorage.getItem('novesia_referral_claimed'),
      ]);

      setCoins(storedCoins ? parseInt(storedCoins, 10) : 0);
      if (storedClaimed) setAlreadyClaimed(true);

      if (storedCheckin) {
        const data: CheckinData = JSON.parse(storedCheckin);
        const currentWeek = getWeekStart();

        if (data.weekStart !== currentWeek) {
          const resetData = { lastDate: '', streak: 0, weekStart: currentWeek };
          setCheckin(resetData);
          await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(resetData));
        } else {
          setCheckin(data);
          setCheckedToday(data.lastDate === getToday());
        }
      } else {
        const initData = { lastDate: '', streak: 0, weekStart: getWeekStart() };
        setCheckin(initData);
        await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(initData));
      }

      if (storedRef) {
        setReferralCode(storedRef);
      } else {
        const code = generateCode();
        setReferralCode(code);
        await AsyncStorage.setItem('novesia_referral_code', code);
      }
    } catch {}
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCheckin = async () => {
    if (checkedToday) return;
    const today = getToday();
    const reward = DAILY_REWARDS[checkin.streak] || 10;
    const newCoins = coins + reward;
    const newData: CheckinData = {
      lastDate: today,
      streak: checkin.streak + 1,
      weekStart: checkin.weekStart || getWeekStart(),
    };

    setCoins(newCoins);
    setCheckin(newData);
    setCheckedToday(true);

    await AsyncStorage.setItem(COINS_KEY, newCoins.toString());
    await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(newData));
    showToast(`+${reward} 🪙`);
  };

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    showToast(t.referral_copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimReferral = async () => {
    const code = friendCode.trim().toUpperCase();
    if (!code || code.length < 5) return;

    if (code === referralCode) {
      showToast('❌ ' + t.referral_own_code);
      return;
    }

    if (alreadyClaimed) {
      showToast('❌ ' + t.referral_already_claimed);
      return;
    }

    const bonus = appConfig?.referral_bonus || 50;
    const newCoins = coins + bonus;
    setCoins(newCoins);
    setAlreadyClaimed(true);
    await AsyncStorage.setItem(COINS_KEY, newCoins.toString());
    await AsyncStorage.setItem('novesia_referral_claimed', code);
    setFriendCode('');
    showToast(`+${bonus} 🪙`);
  };

  const handleWatchAd = async () => {
    if (cooldownRemaining > 0) return;
    if (adWatchCount >= MAX_AD_WATCHES) return;

    const reward = adReward;
    const newCoins = coins + reward;
    const newCount = adWatchCount + 1;

    setCoins(newCoins);
    setAdWatchCount(newCount);
    await AsyncStorage.setItem(COINS_KEY, newCoins.toString());

    if (newCount >= MAX_AD_WATCHES) {
      const cooldownEnd = Date.now() + COOLDOWN_MS;
      setAdCooldownEnd(cooldownEnd);
      setCooldownRemaining(COOLDOWN_MS);
      await AsyncStorage.setItem(AD_WATCH_KEY, JSON.stringify({ count: newCount, cooldownEnd }));
    } else {
      await AsyncStorage.setItem(AD_WATCH_KEY, JSON.stringify({ count: newCount, cooldownEnd: 0 }));
    }

    showToast(`+${reward} 🪙`);
  };

  const loadAdWatchData = async () => {
    try {
      const stored = await AsyncStorage.getItem(AD_WATCH_KEY);
      if (stored) {
        const { count, cooldownEnd } = JSON.parse(stored);
        if (cooldownEnd && cooldownEnd > Date.now()) {
          setAdWatchCount(count);
          setAdCooldownEnd(cooldownEnd);
          setCooldownRemaining(cooldownEnd - Date.now());
        } else if (cooldownEnd && cooldownEnd <= Date.now()) {
          setAdWatchCount(0);
          await AsyncStorage.setItem(AD_WATCH_KEY, JSON.stringify({ count: 0, cooldownEnd: 0 }));
        } else {
          setAdWatchCount(count || 0);
        }
      }
    } catch {}
  };

  const formatCountdown = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientBackground />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
          <Text style={[styles.toastText, { color: colors.textPrimary }]}>{toast}</Text>
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerTitleRow}>
            <Text style={{ fontSize: 20 }}>🎁</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.rewards}</Text>
          </View>
          <View
            style={[
              styles.coinsBadge,
              {
                backgroundColor: colors.primaryMuted || colors.primary + '18',
                borderColor: colors.primary + '40',
              },
            ]}
          >
            <Text style={{ fontSize: 13 }}>🪙</Text>
            <Text style={[styles.coinsText, { color: colors.primary }]}>
              {coins.toLocaleString()}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* DAILY CHECK-IN */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {t.daily_checkin}
              </Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              {t.checkin_week}: {checkin.streak}/7 {t.checkin_days}
            </Text>

            {/* 7-day grid */}
            <View style={styles.dayGrid}>
              {DAILY_REWARDS.map((reward, i) => {
                const isDone = i < checkin.streak;
                const isToday = i === checkin.streak && !checkedToday;
                return (
                  <View key={i} style={styles.dayItem}>
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                        isDone && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primaryMuted || colors.primary + '18',
                        },
                        isToday && {
                          borderColor: colors.primary,
                          borderWidth: 2,
                        },
                      ]}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      ) : (
                        <Text
                          style={[
                            styles.dayReward,
                            { color: isToday ? colors.primary : colors.textMuted },
                          ]}
                        >
                          +{reward}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
                      {t.day} {i + 1}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Check-in button */}
            {checkedToday ? (
              <View
                style={[
                  styles.checkinDone,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={[styles.checkinDoneText, { color: colors.primary }]}>
                  {t.checkin_done}
                </Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.checkinBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
                onPress={handleCheckin}
                accessibilityRole="button"
                accessibilityLabel="Klaim reward harian"
              >
                <Text style={[styles.checkinBtnText, { color: colors.textOnPrimary }]}>
                  {t.checkin_btn}
                </Text>
              </Pressable>
            )}
          </View>

          {/* REFERRAL CODE */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.refRow}>
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={[styles.cardTitleSmall, { color: colors.textPrimary }]}>
                {t.referral_code}
              </Text>
              <View
                style={[
                  styles.refCodeBox,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.refCodeText, { color: colors.primary }]}>
                  {referralCode}
                </Text>
              </View>
              <Pressable
                onPress={handleCopy}
                style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Salin kode referral"
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? colors.primary : colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {/* Friend's referral */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.refRow}>
              <Ionicons name="gift" size={18} color={colors.primary} />
              <TextInput
                style={[
                  styles.refInputField,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={friendCode}
                onChangeText={setFriendCode}
                placeholder={t.referral_friend_code}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                maxLength={10}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.claimBtn,
                  {
                    backgroundColor: friendCode.trim() ? colors.primary : colors.surfaceElevated,
                    borderColor: colors.border,
                    opacity: !friendCode.trim() ? 0.5 : pressed ? 0.8 : 1,
                  },
                ]}
                onPress={handleClaimReferral}
                disabled={!friendCode.trim()}
                accessibilityRole="button"
                accessibilityLabel="Klaim bonus referral teman"
              >
                <Text
                  style={[
                    styles.claimBtnText,
                    {
                      color: friendCode.trim() ? colors.textOnPrimary : colors.textMuted,
                    },
                  ]}
                >
                  {t.referral_claim}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* WATCH ADS */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.refRow}>
              <Ionicons name="videocam" size={18} color={colors.primary} />
              <Text style={[styles.cardTitleSmall, { color: colors.textPrimary }]}>
                {t.watch_ads}
              </Text>
              <View style={styles.adBadges}>
                {Array.from({ length: MAX_AD_WATCHES }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.adBadge,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                      i < adWatchCount && {
                        backgroundColor: colors.primaryMuted || colors.primary + '18',
                        borderColor: colors.primary + '40',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.adBadgeText,
                        {
                          color: i < adWatchCount ? colors.primary : colors.textMuted,
                        },
                      ]}
                    >
                      +{adReward}
                    </Text>
                  </View>
                ))}
              </View>
              {cooldownRemaining > 0 ? (
                <View
                  style={[
                    styles.cooldownBadge,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.cooldownBadgeText, { color: colors.textMuted }]}>
                    {formatCountdown(cooldownRemaining)}
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.adRewardBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: adWatchCount >= MAX_AD_WATCHES ? 0.4 : pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={handleWatchAd}
                  disabled={adWatchCount >= MAX_AD_WATCHES}
                  accessibilityRole="button"
                  accessibilityLabel="Tonton iklan dan klaim koin"
                >
                  <Text style={[styles.adRewardText, { color: colors.textOnPrimary }]}>
                    +{adReward}
                  </Text>
                  <Text style={{ fontSize: 11 }}>🪙</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* VIP HINT */}
          <View
            style={[
              styles.card,
              {
                borderColor: colors.primary + '40',
                backgroundColor: colors.primaryMuted || colors.primary + '12',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 24 }}>💎</Text>
              <Text style={[styles.vipText, { color: colors.textPrimary }]}>
                {t.rewards_vip_hint}
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    zIndex: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  toastText: {
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  coinsText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 14,
  },
  dayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayItem: {
    alignItems: 'center',
    width: (width - 64) / 7,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayReward: {
    fontSize: 10,
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  checkinDone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  checkinDoneText: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkinBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkinBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refCodeBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  refCodeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  copyBtn: {
    padding: 6,
  },
  refInputField: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  claimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  claimBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  adBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  adBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  adRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adRewardText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cooldownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cooldownBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  vipText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
});
