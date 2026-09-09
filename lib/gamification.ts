/**
 * gamification.ts — XP, Level, Rank, Streak tracking untuk novesia-app
 * Tersimpan per-akun di AsyncStorage dan tersinkronisasi 2 arah ke PostgreSQL via novesia-api.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './useAuthStore';
import { apiPost } from './apiClient';

const LEGACY_GAMIFICATION_KEY = 'novesia_gamification_v1';

export function getGamificationStorageKey(userId?: string | null): string {
  const currentUserId = userId !== undefined ? userId : useAuthStore.getState().user?.id;
  return currentUserId ? `novesia_gamification_${currentUserId}` : 'novesia_gamification_guest';
}

export interface UserGamificationStats {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForCurrentLevel: number;
  progressPercentage: number;
  rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  nextRank: string | null;
  xpToNextRank: number;
  currentStreak: number;
  totalChaptersRead: number;
  readChapterIds: string[];
  lastActiveDate: string | null;
}

export interface StoredGamificationData {
  totalXp: number;
  currentStreak: number;
  lastActiveDate: string | null;
  readChapters: { [chapterId: string]: number }; // chapterId -> timestamp
  bookmarkedNovels: string[];
}

// XP required to level up from `level` to `level + 1`
export function getXpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.25));
}

// Thresholds for each rank tier
export const RANK_THRESHOLDS: {
  rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  minLevel: number;
  minXp: number;
}[] = [
  { rank: 'F', minLevel: 1, minXp: 0 },
  { rank: 'E', minLevel: 5, minXp: 450 },
  { rank: 'D', minLevel: 10, minXp: 1400 },
  { rank: 'C', minLevel: 20, minXp: 4500 },
  { rank: 'B', minLevel: 30, minXp: 9500 },
  { rank: 'A', minLevel: 45, minXp: 18000 },
  { rank: 'S', minLevel: 60, minXp: 32000 },
];

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

// Calculate level and progress from total XP
export function computeLevelStats(totalXp: number) {
  const safeXp = typeof totalXp === 'number' && Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  let level = 1;
  let accumulated = 0;

  while (true) {
    const needed = getXpRequiredForLevel(level);
    if (safeXp >= accumulated + needed) {
      accumulated += needed;
      level++;
    } else {
      break;
    }
  }

  const xpIntoLevel = safeXp - accumulated;
  const xpForCurrentLevel = getXpRequiredForLevel(level);
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpIntoLevel / Math.max(1, xpForCurrentLevel)) * 100))
  );

  let currentRank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' = 'F';
  let nextRank: string | null = null;
  let xpToNextRank = 0;

  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (safeXp >= RANK_THRESHOLDS[i].minXp) {
      currentRank = RANK_THRESHOLDS[i].rank;
      if (i + 1 < RANK_THRESHOLDS.length) {
        nextRank = RANK_THRESHOLDS[i + 1].rank;
        xpToNextRank = Math.max(0, RANK_THRESHOLDS[i + 1].minXp - safeXp);
      } else {
        nextRank = null;
        xpToNextRank = 0;
      }
    }
  }

  return {
    level,
    xpIntoLevel,
    xpForCurrentLevel,
    progressPercentage,
    rank: currentRank,
    nextRank,
    xpToNextRank,
  };
}

export async function getRawGamificationData(userId?: string | null): Promise<StoredGamificationData> {
  const key = getGamificationStorageKey(userId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalXp: parsed.totalXp || 0,
        currentStreak: parsed.currentStreak || 0,
        lastActiveDate: parsed.lastActiveDate || null,
        readChapters: parsed.readChapters || {},
        bookmarkedNovels: parsed.bookmarkedNovels || [],
      };
    }

    // Migrasi data legacy lokal versi awal (jika belum ada data untuk akun ini)
    if (key !== 'novesia_gamification_guest') {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_GAMIFICATION_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        const migrated: StoredGamificationData = {
          totalXp: legacyParsed.totalXp || 0,
          currentStreak: legacyParsed.currentStreak || 0,
          lastActiveDate: legacyParsed.lastActiveDate || null,
          readChapters: legacyParsed.readChapters || {},
          bookmarkedNovels: legacyParsed.bookmarkedNovels || [],
        };
        await AsyncStorage.setItem(key, JSON.stringify(migrated));
        await AsyncStorage.removeItem(LEGACY_GAMIFICATION_KEY).catch(() => {});
        return migrated;
      }
    }
  } catch (e) {
    console.error('getRawGamificationData error:', e);
  }

  return {
    totalXp: 0,
    currentStreak: 0,
    lastActiveDate: null,
    readChapters: {},
    bookmarkedNovels: [],
  };
}

export async function saveRawGamificationData(
  data: StoredGamificationData,
  userId?: string | null
): Promise<void> {
  const key = getGamificationStorageKey(userId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('saveRawGamificationData error:', e);
  }
}

/**
 * Mengambil statistik gamifikasi user saat ini.
 * Jika login, mengutamakan nilai XP tertinggi antara memori lokal dan data akun di server.
 */
export async function getUserGamificationStats(userId?: string | null): Promise<UserGamificationStats> {
  const currentUserId = userId !== undefined ? userId : useAuthStore.getState().user?.id;
  const raw = await getRawGamificationData(currentUserId);
  const currentUser = useAuthStore.getState().user;

  // Jika akun memiliki XP di server yang lebih tinggi (misal dari perangkat lain), sinkronkan
  let effectiveTotalXp = raw.totalXp;
  let effectiveStreak = raw.currentStreak;
  let effectiveLastActiveDate = raw.lastActiveDate;

  if (currentUserId && currentUser && currentUser.id === currentUserId) {
    if (typeof currentUser.xp === 'number' && currentUser.xp > effectiveTotalXp) {
      effectiveTotalXp = currentUser.xp;
      raw.totalXp = effectiveTotalXp;
      saveRawGamificationData(raw, currentUserId).catch(() => {});
    }
    if (typeof currentUser.streak === 'number' && currentUser.streak > effectiveStreak) {
      effectiveStreak = currentUser.streak;
      raw.currentStreak = effectiveStreak;
      saveRawGamificationData(raw, currentUserId).catch(() => {});
    }
    if (currentUser.lastActiveDate && !effectiveLastActiveDate) {
      effectiveLastActiveDate = currentUser.lastActiveDate;
      raw.lastActiveDate = effectiveLastActiveDate;
    }
  }

  const computed = computeLevelStats(effectiveTotalXp);
  const chapterIds = Object.keys(raw.readChapters);

  let activeStreak = effectiveStreak;
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();

  if (effectiveLastActiveDate && effectiveLastActiveDate !== today && effectiveLastActiveDate !== yesterday) {
    activeStreak = 0;
  }

  return {
    totalXp: effectiveTotalXp,
    level: computed.level,
    xpIntoLevel: computed.xpIntoLevel,
    xpForCurrentLevel: computed.xpForCurrentLevel,
    progressPercentage: computed.progressPercentage,
    rank: computed.rank,
    nextRank: computed.nextRank,
    xpToNextRank: computed.xpToNextRank,
    currentStreak: activeStreak,
    totalChaptersRead: chapterIds.length,
    readChapterIds: chapterIds,
    lastActiveDate: effectiveLastActiveDate,
  };
}

/**
 * Sinkronisasi dua arah ke API server /api/me/gamification/sync.
 * Menjamin level dan rank akun di database PostgreSQL selalu ter-update.
 */
export async function syncGamificationWithServer(
  userId?: string | null
): Promise<UserGamificationStats | null> {
  const { token, user } = useAuthStore.getState();
  const currentUserId = userId !== undefined ? userId : user?.id;

  if (!token || !user || !currentUserId || user.id !== currentUserId) {
    return getUserGamificationStats(currentUserId);
  }

  try {
    const raw = await getRawGamificationData(currentUserId);

    const res = await apiPost<{
      success: boolean;
      gamification: {
        totalXp: number;
        currentStreak: number;
        lastActiveDate: string | null;
      };
      user?: any;
    }>('/api/me/gamification/sync', {
      localTotalXp: raw.totalXp,
      localStreak: raw.currentStreak,
      localLastActiveDate: raw.lastActiveDate,
    }, { timeoutMs: 12000 });

    if (res?.success && res.gamification) {
      const serverGamify = res.gamification;
      raw.totalXp = serverGamify.totalXp;
      raw.currentStreak = serverGamify.currentStreak;
      raw.lastActiveDate = serverGamify.lastActiveDate;
      await saveRawGamificationData(raw, currentUserId);

      useAuthStore.getState().updateUser({
        xp: serverGamify.totalXp,
        streak: serverGamify.currentStreak,
        lastActiveDate: serverGamify.lastActiveDate,
      });

      return getUserGamificationStats(currentUserId);
    }
  } catch (err) {
    console.warn('[Gamification] Sync with server failed (using local data):', err);
  }

  return getUserGamificationStats(currentUserId);
}

/**
 * Catat pembacaan bab novel: menambah XP & streak, menyimpan per-akun,
 * dan mengirim update ke server.
 */
export async function trackChapterRead(
  novelId: string,
  chapterId: string,
  chapterNumber: number
) {
  const currentUserId = useAuthStore.getState().user?.id;
  const data = await getRawGamificationData(currentUserId);
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();

  let xpGained = 0;
  const isFirstTimeChapter = !data.readChapters[chapterId];

  if (isFirstTimeChapter) {
    xpGained += 15;
    data.readChapters[chapterId] = Date.now();
  } else {
    xpGained += 3;
    data.readChapters[chapterId] = Date.now();
  }

  if (!data.lastActiveDate) {
    data.currentStreak = 1;
    data.lastActiveDate = today;
    xpGained += 35;
  } else if (data.lastActiveDate === yesterday) {
    data.currentStreak += 1;
    data.lastActiveDate = today;
    xpGained += 35;
  } else if (data.lastActiveDate !== today) {
    data.currentStreak = 1;
    data.lastActiveDate = today;
    xpGained += 20;
  }

  data.totalXp += xpGained;
  await saveRawGamificationData(data, currentUserId);

  // Sync ke database server secara aman jika user login
  const { token, user } = useAuthStore.getState();
  if (token && user) {
    apiPost<{ success: boolean; gamification?: any; xpGained?: number }>('/api/me/history', {
      novel_id: novelId,
      chapter_id: chapterId,
      chapter_number: chapterNumber,
      xpAwarded: xpGained,
      activeDate: today,
    })
      .then((res) => {
        if (res?.gamification) {
          useAuthStore.getState().updateUser({
            xp: res.gamification.totalXp,
            streak: res.gamification.streak,
            lastActiveDate: res.gamification.lastActiveDate,
          });
        }
      })
      .catch(() => {
        // Non-blocking
      });
  }

  return {
    xpGained,
    newTotalXp: data.totalXp,
    streak: data.currentStreak,
  };
}

export async function trackBookmarkAdded(novelId: string) {
  const currentUserId = useAuthStore.getState().user?.id;
  const data = await getRawGamificationData(currentUserId);
  if (!data.bookmarkedNovels.includes(novelId)) {
    data.bookmarkedNovels.push(novelId);
    data.totalXp += 10;
    await saveRawGamificationData(data, currentUserId);

    // Sync non-blocking jika login
    const { token, user } = useAuthStore.getState();
    if (token && user) {
      apiPost('/api/me/gamification/sync', {
        localTotalXp: data.totalXp,
        localStreak: data.currentStreak,
        localLastActiveDate: data.lastActiveDate,
      }).catch(() => {});
    }

    return { xpGained: 10 };
  }
  return { xpGained: 0 };
}
