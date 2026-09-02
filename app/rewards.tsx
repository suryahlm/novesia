import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Clipboard,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../lib/i18n';
import { getAppConfig, AppConfig } from '../lib/appConfig';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 0;
const GOLD = '#d4a843';
const GOLD_DIM = 'rgba(212,168,67,0.15)';
const DARK_BG = '#0a0a0f';
const CARD_BG = '#111118';
const BORDER = '#1e1e2e';

const DEFAULT_REWARDS = [10, 20, 30, 40, 50, 60, 70];
const CHECKIN_KEY = 'novesia_daily_checkin';
const COINS_KEY = 'novesia_coins';

interface CheckinData {
  lastDate: string; // ISO date string
  streak: number;   // 0-6 (day index in the week)
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
  const COOLDOWN_MS = 40 * 60 * 1000; // 40 minutes
  const AD_WATCH_KEY = 'novesia_ad_watches';

  const DAILY_REWARDS = appConfig?.daily_checkin_rewards || DEFAULT_REWARDS;
  const adReward = appConfig?.watch_ad_reward || 40;

  useEffect(() => {
    loadData();
    loadAdWatchData();
    getAppConfig().then(setAppConfig);
  }, []);

  // Countdown timer
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

        // Reset if new week
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

      // Generate referral code if not exists
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

    // Cannot claim own code
    if (code === referralCode) {
      showToast('❌ ' + t.referral_own_code);
      return;
    }

    // Cannot claim twice
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

    // TODO: Show actual rewarded ad here
    const reward = adReward;
    const newCoins = coins + reward;
    const newCount = adWatchCount + 1;

    setCoins(newCoins);
    setAdWatchCount(newCount);
    await AsyncStorage.setItem(COINS_KEY, newCoins.toString());

    if (newCount >= MAX_AD_WATCHES) {
      // Start cooldown
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
          // Cooldown expired — reset
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Toast */}
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={{ fontSize: 22 }}>🎁</Text>
          <Text style={styles.headerTitle}>{t.rewards}</Text>
        </View>
        <View style={styles.coinsBadge}>
          <Text style={{ fontSize: 14 }}>🪙</Text>
          <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ═══ DAILY CHECK-IN ═══ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: 18 }}>📅</Text>
            <Text style={styles.cardTitle}>{t.daily_checkin}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {t.checkin_week}: {checkin.streak}/7 {t.checkin_days}
          </Text>

          {/* 7-day grid */}
          <View style={styles.dayGrid}>
            {DAILY_REWARDS.map((reward, i) => {
              const isDone = i < checkin.streak;
              const isToday = i === checkin.streak && !checkedToday;
              return (
                <View key={i} style={styles.dayItem}>
                  <View style={[
                    styles.dayCircle,
                    isDone && styles.dayCircleDone,
                    isToday && styles.dayCircleToday,
                  ]}>
                    {isDone ? (
                      <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
                    ) : (
                      <Text style={[styles.dayReward, isDone && { color: '#22c55e' }]}>
                        🪙{reward}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.dayLabel}>{t.day} {i + 1}</Text>
                </View>
              );
            })}
          </View>

          {/* Check-in button */}
          {checkedToday ? (
            <View style={styles.checkinDone}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.checkinDoneText}>{t.checkin_done}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.checkinBtn} onPress={handleCheckin}>
              <Text style={styles.checkinBtnText}>{t.checkin_btn}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ═══ REFERRAL CODE ═══ */}
        <View style={styles.card}>
          <View style={styles.refRow}>
            <Ionicons name="people" size={20} color={GOLD} />
            <Text style={styles.cardTitleSmall}>{t.referral_code}</Text>
            <View style={styles.refCodeBox}>
              <Text style={styles.refCodeText}>{referralCode}</Text>
            </View>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? '#22c55e' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Friend's referral */}
        <View style={styles.card}>
          <View style={styles.refRow}>
            <Ionicons name="gift" size={20} color={GOLD} />
            <TextInput
              style={styles.refInputField}
              value={friendCode}
              onChangeText={setFriendCode}
              placeholder={t.referral_friend_code}
              placeholderTextColor="#475569"
              autoCapitalize="characters"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.claimBtn, !friendCode.trim() && { opacity: 0.4 }]}
              onPress={handleClaimReferral}
              disabled={!friendCode.trim()}
            >
              <Text style={styles.claimBtnText}>{t.referral_claim}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ WATCH ADS ═══ */}
        <View style={styles.card}>
          <View style={styles.refRow}>
            <Ionicons name="videocam" size={20} color={GOLD} />
            <Text style={styles.cardTitleSmall}>{t.watch_ads}</Text>
            <View style={styles.adBadges}>
              {Array.from({ length: MAX_AD_WATCHES }).map((_, i) => (
                <View key={i} style={[styles.adBadge, i < adWatchCount && { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)', borderWidth: 1 }]}>
                  <Text style={[styles.adBadgeText, i < adWatchCount && { color: '#22c55e' }]}>+{adReward}</Text>
                </View>
              ))}
            </View>
            {cooldownRemaining > 0 ? (
              <View style={styles.cooldownBadge}>
                <Ionicons name="time-outline" size={14} color="#f59e0b" />
                <Text style={styles.cooldownBadgeText}>{formatCountdown(cooldownRemaining)}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.adRewardBtn, adWatchCount >= MAX_AD_WATCHES && { opacity: 0.4 }]}
                onPress={handleWatchAd}
                disabled={adWatchCount >= MAX_AD_WATCHES}
              >
                <Text style={styles.adRewardText}>+{adReward}</Text>
                <Text style={{ fontSize: 12 }}>🪙</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ═══ VIP HINT ═══ */}
        <View style={[styles.card, { borderColor: 'rgba(212,168,67,0.3)', backgroundColor: 'rgba(212,168,67,0.06)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 28 }}>💎</Text>
            <Text style={styles.vipText}>{t.rewards_vip_hint}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },

  toast: {
    position: 'absolute', top: STATUSBAR_HEIGHT + 60, alignSelf: 'center', zIndex: 50,
    backgroundColor: 'rgba(34,197,94,0.9)', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: STATUSBAR_HEIGHT + 12, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { padding: 8 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#e2e8f0' },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GOLD_DIM, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
  },
  coinsText: { fontSize: 15, fontWeight: '800', color: GOLD },

  scrollContent: { padding: 16 },

  card: {
    backgroundColor: CARD_BG, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: BORDER,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#e2e8f0' },
  cardTitleSmall: { fontSize: 15, fontWeight: '700', color: '#cbd5e1', flex: 1 },
  cardSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 16 },

  // Daily check-in grid
  dayGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dayItem: { alignItems: 'center', width: (width - 68) / 7 },
  dayCircle: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#1e1e2e',
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
  },
  dayCircleDone: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)' },
  dayCircleToday: { borderColor: GOLD, borderWidth: 2 },
  dayReward: { fontSize: 9, fontWeight: '700', color: '#64748b' },
  dayLabel: { fontSize: 9, color: '#475569', marginTop: 4, fontWeight: '600' },

  checkinDone: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  checkinDoneText: { fontSize: 14, fontWeight: '700', color: '#22c55e' },

  checkinBtn: {
    backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  checkinBtnText: { fontSize: 15, fontWeight: '800', color: '#0a0a0f' },

  // Referral
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refCodeBox: {
    backgroundColor: 'rgba(212,168,67,0.08)', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)',
  },
  refCodeText: { fontSize: 16, fontWeight: '900', color: GOLD, letterSpacing: 2 },
  copyBtn: { padding: 8 },

  refInputField: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: BORDER,
    fontSize: 13, color: '#e2e8f0', fontWeight: '700', letterSpacing: 1,
  },

  claimBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER,
  },
  claimBtnText: { fontSize: 13, fontWeight: '700', color: '#cbd5e1' },

  // Watch Ads
  adBadges: { flexDirection: 'row', gap: 6 },
  adBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  adBadgeText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  adRewardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  adRewardText: { fontSize: 14, fontWeight: '800', color: '#22c55e' },
  cooldownBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  cooldownBadgeText: { fontSize: 13, fontWeight: '800', color: '#f59e0b' },

  // VIP Hint
  vipText: { fontSize: 13, color: '#94a3b8', lineHeight: 20, flex: 1 },
});
