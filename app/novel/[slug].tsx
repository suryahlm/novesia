import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiPost } from '../../lib/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../lib/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatViews, cleanChapterTitle } from '../../lib/utils';
import { CustomDialog } from '../../components/CustomDialog';
import { ErrorState } from '../../components/ErrorState';
import { useTheme } from '../../lib/ThemeProvider';
import { trackBookmarkAdded } from '../../lib/gamification';
import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';
import { requestTranslation } from '../../lib/translationRequestService';
import { useNovelDetail, useNovelChapters } from '../../lib/useNovelsQuery';
import { AuthModal } from '../../components/AuthModal';
import { useAuthStore } from '../../lib/useAuthStore';

const LIBRARY_KEY = 'novesia_library';

interface Novel {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  total_chapters: number;
  rating: number | null;
  genres: string[];
  synopsis: string | null;
  synopsis_translated: string | null;
  author: string | null;
  year: number | null;
  original_status: string | null;
  status: string | null;
  source?: string | null;
  total_views?: number;
}

interface Chapter {
  id: string;
  chapter_number: number;
  chapter_title: string | null;
  translation_status: string;
  word_count_original: number;
  word_count_translated: number;
}

export default function NovelDetailScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug) || '';
  const router = useRouter();
  const { t, lang, changeLang } = useLanguage();
  useFonts({
    'Poppins-Regular': Poppins_400Regular,
    Poppins: Poppins_400Regular,
  });
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    data: novelData,
    isLoading: loadingNovel,
    isError: isErrorNovel,
    refetch: refetchNovel,
  } = useNovelDetail(slug);

  const novel = (novelData as unknown as Novel) || null;

  const {
    data: chaptersData,
    isLoading: loadingChapters,
    isError: isErrorChapters,
    refetch: refetchChapters,
  } = useNovelChapters(slug);

  const chapters: Chapter[] = (chaptersData as any) || [];
  const firstChapterNumber =
    (novel as any)?.first_chapter_number ||
    (novel as any)?.firstChapterNumber ||
    (chapters.length > 0 ? (chapters[0]?.chapter_number ?? 1) : 1);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchNovel(), refetchChapters()]);
    setRefreshing(false);
  }, [refetchNovel, refetchChapters]);

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [lastReadChapterId, setLastReadChapterId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    tone?: 'gold' | 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({ title: '', message: '' });

  // Track Novel View (1 View per day per novel per device)
  useEffect(() => {
    if (!novel) return;
    const trackView = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const viewKey = `view_${novel.id}_${today}`;
        const hasViewedToday = await AsyncStorage.getItem(viewKey);

        if (!hasViewedToday) {
          apiPost(`/api/novels/${novel.id}/view`).catch(() => {});
          await AsyncStorage.setItem(viewKey, 'true');
        }
      } catch {
        // silent fail
      }
    };
    trackView();
  }, [novel]);

  // Check if novel is in library
  useEffect(() => {
    if (!novel) return;
    const checkSaved = async () => {
      try {
        const lib = await AsyncStorage.getItem(LIBRARY_KEY);
        const saved: string[] = lib ? JSON.parse(lib) : [];
        setIsSaved(saved.includes(novel.id));
      } catch {}
    };
    checkSaved();
  }, [novel]);

  const hasIndonesianTranslation = Boolean(
    novel?.synopsis_translated ||
    chapters.some((c) => (c.word_count_translated || 0) > 0)
  );

  const handleLanguageToggle = () => {
    if (!novel) return;
    const nextLang = lang === 'id' ? 'en' : 'id';
    if (nextLang === 'id' && !hasIndonesianTranslation) {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        setDialogConfig({
          title: lang === 'id' ? 'Butuh Login' : 'Login Required',
          message:
            lang === 'id'
              ? 'Silakan masuk (login) terlebih dahulu untuk mengajukan permintaan terjemahan.'
              : 'Please sign in to your account before requesting a translation.',
          tone: 'gold',
          confirmText: lang === 'id' ? 'Masuk Sekarang' : 'Sign In',
          cancelText: t.cancel || 'Batal',
          showCancel: true,
          onConfirm: () => setAuthModalVisible(true),
        });
        setDialogVisible(true);
        return;
      }

      setDialogConfig({
        title: lang === 'id' ? 'Terjemahan Belum Tersedia' : 'Translation Not Available',
        message:
          lang === 'id'
            ? `Novel "${novel.title}" belum memiliki terjemahan Bahasa Indonesia. Mau mengajukan request translate agar segera diterjemahkan?`
            : `"${novel.title}" does not have an Indonesian translation yet. Would you like to request a translation?`,
        tone: 'gold',
        confirmText: 'Request Translate',
        cancelText: t.cancel || 'Batal',
        showCancel: true,
        onConfirm: async () => {
          try {
            await requestTranslation({
              novelId: novel.id,
              novelSlug: novel.nu_slug,
              novelTitle: novel.title,
              novelCover: novel.cover_url,
            });
            setDialogConfig({
              title: lang === 'id' ? 'Permintaan Terkirim' : 'Request Submitted',
              message:
                lang === 'id'
                  ? 'Terima kasih! Permintaan terjemahan untuk novel ini telah dicatat dan akan segera diproses oleh admin.'
                  : 'Thank you! Your translation request has been submitted and will be processed soon.',
              tone: 'success',
              confirmText: 'OK',
              showCancel: false,
            });
            setDialogVisible(true);
          } catch (e: any) {
            setDialogConfig({
              title: 'Gagal Mengirim',
              message: e?.message || 'Gagal mengirim permintaan terjemahan. Silakan coba lagi.',
              tone: 'danger',
              confirmText: 'OK',
              showCancel: false,
            });
            setDialogVisible(true);
          }
        },
      });
      setDialogVisible(true);
      return;
    }

    changeLang(nextLang);
  };

  const toggleSave = async () => {
    if (!novel) return;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      setDialogConfig({
        title: lang === 'id' ? 'Butuh Login' : 'Login Required',
        message:
          lang === 'id'
            ? 'Silakan masuk (login) terlebih dahulu untuk menyimpan novel ke perpustakaan Anda.'
            : 'Please sign in to your account to save this novel to your library.',
        tone: 'gold',
        confirmText: lang === 'id' ? 'Masuk Sekarang' : 'Sign In',
        cancelText: t.cancel || 'Batal',
        showCancel: true,
        onConfirm: () => setAuthModalVisible(true),
      });
      setDialogVisible(true);
      return;
    }

    try {
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      let saved: string[] = lib ? JSON.parse(lib) : [];
      if (saved.includes(novel.id)) {
        saved = saved.filter((id) => id !== novel.id);
        setIsSaved(false);
      } else {
        saved.unshift(novel.id);
        setIsSaved(true);
        trackBookmarkAdded(novel.id);
      }
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(saved));
    } catch {
      setDialogConfig({
        title: 'Gagal Menyimpan',
        message: 'Tidak dapat menyimpan novel ke dalam library Anda.',
        tone: 'danger',
        showCancel: false,
      });
      setDialogVisible(true);
    }
  };

  const handleShare = () => {
    if (!novel) return;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      setDialogConfig({
        title: lang === 'id' ? 'Butuh Login' : 'Login Required',
        message:
          lang === 'id'
            ? 'Silakan masuk (login) terlebih dahulu untuk membagikan novel ini.'
            : 'Please sign in to your account to share this novel.',
        tone: 'gold',
        confirmText: lang === 'id' ? 'Masuk Sekarang' : 'Sign In',
        cancelText: t.cancel || 'Batal',
        showCancel: true,
        onConfirm: () => setAuthModalVisible(true),
      });
      setDialogVisible(true);
      return;
    }

    Share.share({
      message: `📖 ${novel.title}\n\n${lang === 'id' ? 'Baca di Novesia!' : 'Read on Novesia!'}`,
    });
  };

  // Reload last read chapter every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadLastRead = async () => {
        if (!novel) return;
        try {
          const stored = await AsyncStorage.getItem(`lastread_${novel.id}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setLastReadChapter(parsed.chapter_number);
            setLastReadChapterId(parsed.chapter_id);
          }
        } catch {}
      };
      loadLastRead();
    }, [novel])
  );

  if (loadingNovel && !novel) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={{ width: '100%', paddingHorizontal: 16, marginBottom: 32 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{t.back}</Text>
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 14, fontSize: 14 }}>
          {lang === 'id' ? 'Memuat novel...' : 'Loading novel...'}
        </Text>
      </View>
    );
  }

  if (isErrorNovel || !novel) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <View style={{ width: '100%', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{t.back}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <ErrorState
            message={isErrorNovel ? 'Gagal memuat data novel. Periksa koneksi internet Anda.' : t.novel_not_found}
            onRetry={() => {
              refetchNovel();
              refetchChapters();
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // Clean synopsis
  const rawSynopsis = (lang === 'id' && novel.synopsis_translated) 
    ? novel.synopsis_translated 
    : novel.synopsis;

  let cleanedSynopsis = (rawSynopsis || '').trim();
  if (cleanedSynopsis) {
    const lines = cleanedSynopsis.split('\n');
    let cutIdx = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) { cutIdx = i; continue; }
      if (line.length < 40 && !line.includes('.') && !line.includes('!') && !line.includes('?') && /^[A-Z]/.test(line)) {
        cutIdx = i;
      } else {
        break;
      }
    }
    cleanedSynopsis = lines.slice(0, cutIdx).join('\n').trim();
  }

  const isCompleted =
    novel.status === 'completed' ||
    novel.status === 'complete' ||
    novel.status === 'tamat' ||
    ['completed', 'complete', 'finished', 'tamat'].includes((novel.original_status || '').toLowerCase().trim());

  const realGenres = (novel.genres || []).filter((g: string) => g.toLowerCase() !== 'general');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ═══ 1. IMMERSIVE HERO WITH AMBIENT BACKDROP ═══ */}
        <View style={styles.heroContainer}>
          {novel.cover_url && (
            <Image 
              source={{ 
                uri: novel.cover_url,
                headers: { 'User-Agent': 'NovesiaApp/1.0' }
              }} 
              style={[styles.heroBg, { opacity: isDark ? 0.85 : 0.3 }]} 
              blurRadius={36} 
            />
          )}
          <LinearGradient
            colors={[
              isDark ? 'rgba(8,11,18,0.45)' : 'rgba(250,247,242,0.6)',
              isDark ? 'rgba(8,11,18,0.88)' : 'rgba(250,247,242,0.92)',
              colors.background,
            ]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroContent, { paddingTop: Math.max(16, insets.top + 8) }]}>
            {/* 3D Elevated Book Cover */}
            <View
              style={[
                styles.coverWrapper,
                {
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: isDark ? '#111622' : colors.surfaceElevated,
                  shadowOpacity: isDark ? 0.55 : 0.12,
                },
              ]}
            >
              {novel.cover_url ? (
                <Image 
                  source={{ 
                    uri: novel.cover_url, 
                    headers: { 'User-Agent': 'NovesiaApp/1.0' }
                  }} 
                  style={styles.coverImage} 
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.coverImage, styles.noCover]}>
                  <Text style={{ fontSize: 36 }}>📕</Text>
                </View>
              )}
              {/* Spine Lighting Gloss */}
              <LinearGradient
                colors={['rgba(255,255,255,0.22)', 'transparent', 'rgba(0,0,0,0.35)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.coverSpine}
                pointerEvents="none"
              />
            </View>

            {/* Novel Info */}
            <View style={styles.heroInfo}>
              <Text 
                style={[styles.novelTitle, { color: colors.textPrimary }]} 
                numberOfLines={titleExpanded ? undefined : 3}
                onTextLayout={(e) => {
                  if (e.nativeEvent.lines.length > 3) {
                    setIsTitleTruncated(true);
                  }
                }}
              >
                {novel.title}
              </Text>

              {(isTitleTruncated || (novel.title && novel.title.length > 55)) && (
                <TouchableOpacity
                  onPress={() => setTitleExpanded(!titleExpanded)}
                  style={styles.titleToggleBtn}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.titleToggleText, { color: colors.primary }]}>
                    {titleExpanded 
                      ? (lang === 'id' ? 'Sembunyikan ▲' : 'Show Less ▲') 
                      : (lang === 'id' ? 'Judul Lengkap ▼' : 'Full Title ▼')}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.authorRow}>
                <Ionicons name="person-circle-outline" size={13} color={colors.primary} />
                <Text style={[styles.novelAuthor, { color: colors.primary }]} numberOfLines={1}>
                  {novel.author || 'Unknown Author'}
                </Text>
              </View>

              {/* Meta Badges Row */}
              <View style={styles.metaRow}>
                {novel.rating && (
                  <View style={[styles.metaPill, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + (isDark ? '50' : '35') }]}>
                    <Ionicons name="star" size={10} color={colors.primary} />
                    <Text style={[styles.metaPillText, { color: colors.primary }]}>
                      {typeof novel.rating === 'number' ? novel.rating.toFixed(1) : novel.rating}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.metaPill,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                >
                  <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>{novel.total_chapters} ch</Text>
                </View>

                {novel.total_views !== undefined && (
                  <View
                    style={[
                      styles.metaPill,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="eye-outline" size={11} color={colors.textMuted} />
                    <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>{formatViews(novel.total_views)}</Text>
                  </View>
                )}

                <View style={[styles.metaPill, {
                  backgroundColor: isCompleted 
                    ? (isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)') 
                    : (isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)'),
                  borderColor: isCompleted 
                    ? (isDark ? 'rgba(16,185,129,0.45)' : 'rgba(16,185,129,0.35)') 
                    : (isDark ? 'rgba(245,158,11,0.45)' : 'rgba(245,158,11,0.35)'),
                }]}>
                  <View style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: isCompleted 
                      ? (isDark ? '#34D399' : '#059669') 
                      : (isDark ? '#FBBF24' : '#D97706'),
                  }} />
                  <Text style={[styles.metaPillText, { 
                    color: isCompleted 
                      ? (isDark ? '#34D399' : '#059669') 
                      : (isDark ? '#FBBF24' : '#D97706') 
                  }]}>
                    {isCompleted ? (lang === 'id' ? 'Tamat' : 'Complete') : (lang === 'id' ? 'Berjalan' : 'Ongoing')}
                  </Text>
                </View>

                {firstChapterNumber > 1 && (
                  <View style={[styles.metaPill, {
                    backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.12)',
                    borderColor: isDark ? 'rgba(217, 119, 6, 0.45)' : 'rgba(217, 119, 6, 0.35)',
                  }]}>
                    <Ionicons name="information-circle-outline" size={11} color={isDark ? '#FBBF24' : '#D97706'} />
                    <Text style={[styles.metaPillText, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                      {lang === 'id' ? `Mulai Bab ${firstChapterNumber}` : `Starts at Ch. ${firstChapterNumber}`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Toolbar */}
              <View style={styles.actionToolbar}>
                {/* Language Switcher */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.primaryMuted,
                      borderColor: colors.primary + (isDark ? '55' : '40'),
                    },
                  ]}
                  onPress={handleLanguageToggle}
                  activeOpacity={0.7}
                >
                  <Ionicons name="globe-outline" size={13} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                    {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                  </Text>
                </TouchableOpacity>

                {/* Bookmark Button */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isSaved
                        ? colors.primaryMuted
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                      borderColor: isSaved
                        ? (colors.primary + (isDark ? '65' : '50'))
                        : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
                    },
                  ]}
                  onPress={toggleSave}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isSaved ? 'bookmark' : 'bookmark-outline'} 
                    size={13.5} 
                    color={isSaved ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.actionBtnText, { color: isSaved ? colors.primary : colors.textSecondary }]}>
                    {isSaved ? (lang === 'id' ? 'Tersimpan' : 'Saved') : (lang === 'id' ? 'Simpan' : 'Save')}
                  </Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity
                  style={[
                    styles.actionBtnIconOnly,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social-outline" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Genres Inline */}
              {realGenres.length > 0 && (
                <Text style={[styles.genreText, { color: colors.textMuted }]} numberOfLines={1}>
                  {realGenres.join('  •  ')}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* ═══ 2. MINIMALIST READING ACTION BUTTON ═══ */}
        {chapters.length > 0 && (
          <View style={styles.ctaWrapper}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.ctaMinimalBtn,
                {
                  borderColor: colors.primary + (isDark ? '55' : '40'),
                  backgroundColor: colors.primaryMuted || (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                },
              ]}
              onPress={() => {
                if (lastReadChapterId) {
                  router.push(`/read/${lastReadChapterId}` as any);
                } else {
                  const firstWithContent = chapters.find(c => (c.word_count_original || 0) > 0) || chapters[0];
                  if (firstWithContent) router.push(`/read/${firstWithContent.id}` as any);
                }
              }}
            >
              <Ionicons name="play" size={11} color={colors.primary} />
              <Text style={[styles.ctaMinimalText, { color: colors.primary }]}>
                {lastReadChapter 
                  ? `${t.continue_reading_btn || 'Lanjut Membaca'} (Bab ${lastReadChapter})` 
                  : (lang === 'id' ? 'Mulai Membaca' : 'Start Reading')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ 3. SINOPSIS SECTION ═══ */}
        {cleanedSynopsis ? (
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionTitleAccent, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{t.synopsis?.toUpperCase() || 'SINOPSIS'}</Text>
              </View>
            </View>
            <Text 
              style={[styles.synopsisText, { color: colors.textSecondary }]} 
              numberOfLines={synopsisExpanded ? undefined : 4}
            >
              {cleanedSynopsis}
            </Text>
            {cleanedSynopsis.length > 180 && (
              <TouchableOpacity
                onPress={() => setSynopsisExpanded(!synopsisExpanded)}
                style={styles.expandBtn}
                hitSlop={8}
              >
                <Text style={[styles.expandBtnText, { color: colors.primary }]}>
                  {synopsisExpanded 
                    ? (lang === 'id' ? 'Tutup Selengkapnya ▲' : 'Show Less ▲') 
                    : (lang === 'id' ? 'Baca Selengkapnya ▼' : 'Read More ▼')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* ═══ 4. DAFTAR BAB (CHAPTER LIST) SECTION ═══ */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionTitleAccent, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{t.chapter_list?.toUpperCase() || 'DAFTAR BAB'}</Text>
              <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <Text style={[styles.countBadgeText, { color: colors.textMuted }]}>{chapters.length}</Text>
              </View>
            </View>

            {chapters.length > 20 && (
              <TouchableOpacity
                onPress={() => {
                  if (expandedGroups.size === Math.ceil(chapters.length / 20)) {
                    setExpandedGroups(new Set());
                  } else {
                    const all = new Set<number>();
                    for (let i = 0; i < Math.ceil(chapters.length / 20); i++) all.add(i);
                    setExpandedGroups(all);
                  }
                }}
                hitSlop={8}
              >
                <Text style={[styles.toggleAllText, { color: colors.primary }]}>
                  {expandedGroups.size === Math.ceil(chapters.length / 20) ? t.close_all : t.all_chapters}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingChapters && chapters.length === 0 ? (
            <View style={{ paddingVertical: 28, alignItems: 'center', gap: 10 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {lang === 'id' ? 'Memuat daftar bab...' : 'Loading chapters...'}
              </Text>
            </View>
          ) : isErrorChapters && chapters.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center', gap: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                {lang === 'id' ? 'Gagal memuat daftar bab.' : 'Failed to load chapters.'}
              </Text>
              <TouchableOpacity
                onPress={() => refetchChapters()}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                  {lang === 'id' ? 'Coba Lagi' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : chapters.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDark ? 'rgba(18,22,30,0.65)' : colors.surface,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0 : 0.04,
                  shadowRadius: 3,
                  elevation: isDark ? 0 : 1,
                },
              ]}
            >
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.no_chapters}</Text>
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>{t.translate_admin}</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {firstChapterNumber > 1 && (
                <View
                  style={[
                    styles.startingNoticeCard,
                    {
                      backgroundColor: isDark ? 'rgba(217,119,6,0.12)' : 'rgba(254,243,199,0.7)',
                      borderColor: isDark ? 'rgba(217,119,6,0.28)' : '#FDE68A',
                    },
                  ]}
                >
                  <Ionicons name="information-circle" size={17} color={isDark ? '#FBBF24' : '#D97706'} style={{ marginTop: 1 }} />
                  <Text style={[styles.startingNoticeText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                    {lang === 'id'
                      ? `Pemberitahuan: Novel ini di Novesia dimulai dari Bab ${firstChapterNumber}. Bab-bab sebelumnya diterjemahkan oleh grup translator lain atau merupakan bagian rilis terdahulu.`
                      : `Notice: This novel on Novesia begins at Chapter ${firstChapterNumber}. Earlier chapters were translated by other groups or are part of prior releases.`}
                  </Text>
                </View>
              )}
              {Array.from({ length: Math.ceil(chapters.length / 20) }, (_, gi) => {
                const start = gi * 20;
                const end = Math.min(start + 20, chapters.length);
                const group = chapters.slice(start, end);
                const isOpen = expandedGroups.has(gi);
                const groupFirst = group[0]?.chapter_number ?? (start + 1);
                const groupLast = group[group.length - 1]?.chapter_number ?? end;
                const hasLastRead = lastReadChapter != null && lastReadChapter >= groupFirst && lastReadChapter <= groupLast;
                return (
                  <View
                    key={gi}
                    style={[
                      styles.groupContainer,
                      {
                        backgroundColor: isDark ? 'rgba(18,22,30,0.65)' : colors.surface,
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0 : 0.05,
                        shadowRadius: 3,
                        elevation: isDark ? 0 : 1,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.groupHeader,
                        isOpen && {
                          borderColor: colors.primary + (isDark ? '45' : '35'),
                          backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : (colors.primaryMuted || 'rgba(0,0,0,0.02)'),
                        },
                        hasLastRead && !isOpen && {
                          borderColor: '#10B98160',
                          backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.08)',
                        },
                      ]}
                      onPress={() => {
                        setExpandedGroups(prev => {
                          const next = new Set(prev);
                          if (next.has(gi)) next.delete(gi);
                          else next.add(gi);
                          return next;
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons 
                          name={isOpen ? "folder-open-outline" : "folder-outline"} 
                          size={15} 
                          color={isOpen ? colors.primary : colors.textMuted} 
                        />
                        <Text style={[styles.groupTitle, { color: isOpen ? colors.primary : colors.textPrimary }]}>
                          {lang === 'id' ? 'Bab' : 'Chapter'} {groupFirst} – {groupLast}
                        </Text>
                        {hasLastRead && (
                          <View style={styles.lastReadTag}>
                            <Text style={styles.lastReadTagText}>
                              {lang === 'id' ? `Bab ${lastReadChapter}` : `Ch ${lastReadChapter}`}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons 
                        name={isOpen ? "chevron-up" : "chevron-down"} 
                        size={15} 
                        color={isOpen ? colors.primary : colors.textMuted} 
                      />
                    </TouchableOpacity>

                    {isOpen && (
                      <View
                        style={[
                          styles.groupBody,
                          {
                            borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
                            backgroundColor: isDark ? 'rgba(10,14,23,0.4)' : colors.surfaceElevated,
                          },
                        ]}
                      >
                        {group.map((ch, idx) => {
                          const hasContent = (ch.word_count_original || 0) > 0;
                          const wc = ch.word_count_translated || ch.word_count_original || 0;
                          const isLastRead = lastReadChapter === ch.chapter_number;
                          return (
                            <TouchableOpacity
                              key={`${ch.id || ch.chapter_number || idx}-${idx}`}
                              style={[
                                styles.chapterRow,
                                { borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : colors.border },
                                isLastRead && { backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.12)' },
                                !hasContent && { opacity: 0.45 },
                                idx === group.length - 1 && { borderBottomWidth: 0 },
                              ]}
                              onPress={() => hasContent ? router.push(`/read/${ch.id}` as any) : null}
                              activeOpacity={hasContent ? 0.65 : 1}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                <View style={[styles.statusDot, { backgroundColor: hasContent ? (isLastRead ? '#10B981' : colors.primary) : '#94A3B8' }]} />
                                <Text style={[styles.chapterNumText, { color: isLastRead ? '#10B981' : colors.primary }]}>
                                  #{ch.chapter_number}
                                </Text>
                                <Text
                                  style={[
                                    styles.chapterTitleText,
                                    { color: isLastRead ? (isDark ? '#F8FAFC' : colors.textPrimary) : colors.textPrimary },
                                    isLastRead && { fontWeight: '700' },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {cleanChapterTitle(ch.chapter_title, ch.chapter_number)}
                                </Text>
                              </View>
                              <Text style={[styles.chapterWordText, { color: colors.textMuted }]}>
                                {hasContent ? `${wc} ${lang === 'id' ? 'kata' : 'w'}` : (lang === 'id' ? 'Segera' : 'Pending')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        tone={dialogConfig.tone}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        showCancel={dialogConfig.showCancel ?? false}
        onConfirm={dialogConfig.onConfirm}
      />

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => setAuthModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#94a3b8', fontSize: 16 },
  backBtn: { marginTop: 16, padding: 12 },
  backBtnText: { fontSize: 14, fontWeight: '600' },

  // Hero Section
  heroContainer: { minHeight: 210, position: 'relative' },
  heroBg: { position: 'absolute', width: '100%', height: '100%' },
  heroContent: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingHorizontal: 16, 
    paddingBottom: 16,
    gap: 15,
  },
  coverWrapper: {
    width: 114,
    height: 165,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
    backgroundColor: '#111622',
  },
  coverImage: { width: '100%', height: '100%' },
  coverSpine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 },
  noCover: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1e2e' },
  
  heroInfo: { flex: 1, justifyContent: 'flex-start', paddingTop: 2 },
  novelTitle: { 
    fontFamily: 'Poppins-Regular',
    fontSize: 15.5, 
    fontWeight: '400', 
    lineHeight: 23,
    letterSpacing: 0.1,
  },
  titleToggleBtn: {
    marginTop: 2,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  titleToggleText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    marginTop: 4,
    marginBottom: 8,
  },
  novelAuthor: { fontSize: 12, fontWeight: '600' },

  // Meta Badges
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 0.8,
  },
  metaPillText: { fontSize: 10.5, fontWeight: '700' },

  // Action Toolbar
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 10,
    borderWidth: 0.8,
  },
  actionBtnIconOnly: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 0.8,
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  genreText: { fontSize: 11, marginTop: 2, letterSpacing: 0.2 },

  // Primary CTA Button
  ctaWrapper: {
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 14,
  },
  ctaMinimalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6.5,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 0.8,
  },
  ctaMinimalText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.25,
  },

  // Sections
  cardSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitleAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  countBadge: {
    paddingHorizontal: 6.5,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  countBadgeText: { fontSize: 10, fontWeight: '700' },
  toggleAllText: { fontSize: 11.5, fontWeight: '700' },

  // Synopsis
  synopsisText: {
    fontSize: 13.5,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  expandBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  expandBtnText: { fontSize: 11.5, fontWeight: '700' },

  startingNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 0.8,
    marginBottom: 4,
  },
  startingNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    flex: 1,
  },

  // Chapter Accordions
  groupContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11.5,
  },
  groupTitle: { fontSize: 12.5, fontWeight: '700' },
  lastReadTag: {
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 0.8,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  lastReadTagText: { fontSize: 9.5, fontWeight: '800', color: '#34D399' },
  groupBody: {
    borderTopWidth: 0.8,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 0.8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  chapterNumText: { fontSize: 11.5, fontWeight: '700', width: 34 },
  chapterTitleText: { fontSize: 13, flex: 1 },
  chapterWordText: { fontSize: 10.5, color: '#64748B', fontWeight: '600', marginLeft: 8 },

  emptyBox: {
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 0.8,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13.5, fontWeight: '700' },
  emptyHint: { fontSize: 11.5, marginTop: 4 },
});
