/**
 * gamification.ts — XP, Level, Rank, Streak tracking untuk novesia-app
 * Data lokal di AsyncStorage. Sync ke novesia-api /api/me/history jika user login.
 * Tidak ada Supabase dependency.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './useAuthStore';
import { apiPost } from './apiClient';

const GAMIFICATION_KEY = 'novesia_gamification_v1';

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
  let level = 1;
  let accumulated = 0;

  while (true) {
    const needed = getXpRequiredForLevel(level);
    if (totalXp >= accumulated + needed) {
      accumulated += needed;
      level++;
    } else {
      break;
    }
  }

  const xpIntoLevel = totalXp - accumulated;
  const xpForCurrentLevel = getXpRequiredForLevel(level);
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpIntoLevel / Math.max(1, xpForCurrentLevel)) * 100))
  );

  let currentRank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' = 'F';
  let nextRank: string | null = null;
  let xpToNextRank = 0;

  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (totalXp >= RANK_THRESHOLDS[i].minXp) {
      currentRank = RANK_THRESHOLDS[i].rank;
      if (i + 1 < RANK_THRESHOLDS.length) {
        nextRank = RANK_THRESHOLDS[i + 1].rank;
        xpToNextRank = Math.max(0, RANK_THRESHOLDS[i + 1].minXp - totalXp);
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

export async function getRawGamificationData(): Promise<StoredGamificationData> {
  try {
    const raw = await AsyncStorage.getItem(GAMIFICATION_KEY);
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

export async function saveRawGamificationData(data: StoredGamificationData): Promise<void> {
  try {
    await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('saveRawGamificationData error:', e);
  }
}

export async function getUserGamificationStats(): Promise<UserGamificationStats> {
  const raw = await getRawGamificationData();
  const computed = computeLevelStats(raw.totalXp);
  const chapterIds = Object.keys(raw.readChapters);

  let activeStreak = raw.currentStreak;
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();

  if (raw.lastActiveDate && raw.lastActiveDate !== today && raw.lastActiveDate !== yesterday) {
    activeStreak = 0;
  }

  return {
    totalXp: raw.totalXp,
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
    lastActiveDate: raw.lastActiveDate,
  };
}

export async function trackChapterRead(
  novelId: string,
  chapterId: string,
  chapterNumber: number
) {
  const data = await getRawGamificationData();
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
  await saveRawGamificationData(data);

  // Non-blocking sync ke server jika user login
  const { token, user } = useAuthStore.getState();
  if (token && user) {
    apiPost('/api/me/history', {
      novel_id: novelId,
      chapter_id: chapterId,
      chapter_number: chapterNumber,
    }).catch(() => {
      // Non-blocking — gagal sync tidak apa-apa
    });
  }

  return {
    xpGained,
    newTotalXp: data.totalXp,
    streak: data.currentStreak,
  };
}

export async function trackBookmarkAdded(novelId: string) {
  const data = await getRawGamificationData();
  if (!data.bookmarkedNovels.includes(novelId)) {
    data.bookmarkedNovels.push(novelId);
    data.totalXp += 10;
    await saveRawGamificationData(data);
    return { xpGained: 10 };
  }
  return { xpGained: 0 };
}
