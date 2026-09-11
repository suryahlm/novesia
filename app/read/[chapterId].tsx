import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHistory } from '../../lib/history';
import { trackChapterRead } from '../../lib/gamification';
import { useLanguage } from '../../lib/i18n';
import { useChapterInterstitialAd } from '../../lib/useChapterInterstitialAd';
import { AD_NOTICE_MESSAGE } from '../../lib/ads';
import { useTheme } from '../../lib/ThemeProvider';
import { cleanChapterTitle } from '../../lib/utils';
import { cleanChapterText } from '../../lib/chapterCleaner';
import { CustomDialog } from '../../components/CustomDialog';
import { ErrorState } from '../../components/ErrorState';
import { requestTranslation } from '../../lib/translationRequestService';
import { useChapterDetail } from '../../lib/useNovelsQuery';
import { AuthModal } from '../../components/AuthModal';
import { useAuthStore } from '../../lib/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentSection } from '../../components/comments/CommentSection';

type ThemeMode = 'dark' | 'light' | 'sepia';
type ThemeChoice = 'auto' | 'dark' | 'light' | 'sepia';
type Language = 'en' | 'id';

export interface ReaderThemeConfig {
  bg: string;
  text: string;
  textMuted: string;
  cardBg: string;
  cardBgActive: string;
  cardBorder: string;
  surfaceBorder: string;
  sheetBg: string;
  headerBorder: string;
  stepperBg: string;
  stepperBorder: string;
  sliderTrack: string;
  goldAccent: string;
  closeCircleBg: string;
  chipBg: string;
  chipBgActive: string;
  navBtnBg: string;
  navBtnBorder: string;
  badgeBg: string;
}

const THEMES: Record<ThemeMode, ReaderThemeConfig> = {
  dark: {
    bg: '#0a0a0f',
    text: '#d4d4d8',
    textMuted: '#64748b',
    cardBg: '#161B20',
    cardBgActive: '#1B222A',
    cardBorder: 'rgba(255,255,255,0.08)',
    surfaceBorder: 'rgba(212,168,67,0.22)',
    sheetBg: '#12161A',
    headerBorder: 'rgba(255,255,255,0.06)',
    stepperBg: '#181E24',
    stepperBorder: 'rgba(255,255,255,0.08)',
    sliderTrack: '#1E242B',
    goldAccent: '#d4a843',
    closeCircleBg: '#1A2026',
    chipBg: '#161B20',
    chipBgActive: '#1E252D',
    navBtnBg: '#11151A',
    navBtnBorder: 'rgba(255,255,255,0.08)',
    badgeBg: 'rgba(212,168,67,0.12)',
  },
  light: {
    bg: '#FAF7F2',
    text: '#211D17',
    textMuted: '#716B61',
    cardBg: '#FFFFFF',
    cardBgActive: '#F3EEE5',
    cardBorder: 'rgba(23,19,13,0.08)',
    surfaceBorder: 'rgba(212,168,67,0.3)',
    sheetBg: '#FFFFFF',
    headerBorder: 'rgba(23,19,13,0.08)',
    stepperBg: '#F3EEE5',
    stepperBorder: 'rgba(23,19,13,0.1)',
    sliderTrack: '#E6E0D5',
    goldAccent: '#d4a843',
    closeCircleBg: '#F3EEE5',
    chipBg: '#F3EEE5',
    chipBgActive: '#FEF3C7',
    navBtnBg: '#FFFFFF',
    navBtnBorder: 'rgba(23,19,13,0.12)',
    badgeBg: 'rgba(212,168,67,0.12)',
  },
  sepia: {
    bg: '#f5f0e8',
    text: '#3d3225',
    textMuted: '#786551',
    cardBg: '#EDE4D6',
    cardBgActive: '#FFF8EA',
    cardBorder: 'rgba(133,77,14,0.12)',
    surfaceBorder: 'rgba(202,138,4,0.3)',
    sheetBg: '#FAF6F0',
    headerBorder: 'rgba(133,77,14,0.1)',
    stepperBg: '#E8DECE',
    stepperBorder: 'rgba(133,77,14,0.15)',
    sliderTrack: '#DFD3C3',
    goldAccent: '#b45309',
    closeCircleBg: '#EDE4D6',
    chipBg: '#EDE4D6',
    chipBgActive: '#FEF3C7',
    navBtnBg: '#FAF5EE',
    navBtnBorder: 'rgba(133,77,14,0.18)',
    badgeBg: 'rgba(180,83,9,0.12)',
  },
};

interface ChapterData {
  id: string;
  chapter_number: number;
  chapter_title: string | null;
  content_original: string | null;
  content_translated: string | null;
  word_count_original: number;
  word_count_translated: number;
  novel_id: string;
  novel_slug?: string;
  novel?: { title: string; cover_url: string | null; nu_slug: string };
  prev_chapter?: SiblingChapter | null;
  next_chapter?: SiblingChapter | null;
}

interface SiblingChapter {
  id: string;
  chapter_number: number;
}

export default function ReadChapterScreen() {
  const { chapterId: rawChapterId } = useLocalSearchParams<{ chapterId: string }>();
  const chapterId = (Array.isArray(rawChapterId) ? rawChapterId[0] : rawChapterId) || '';
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { lang: globalLang, t, changeLang } = useLanguage();
  const { showForChapter, noticeVisible: adNoticeVisible, noticeMessage: adNoticeMessage } = useChapterInterstitialAd();

  const {
    data: chapterData,
    isLoading: loading,
    isError,
    refetch,
  } = useChapterDetail(chapterId);

  const chapter: ChapterData | null = (chapterData as any) || null;
  const isLocked = false;
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [novelTitle, setNovelTitle] = useState('');
  const [prevChapter, setPrevChapter] = useState<SiblingChapter | null>(null);
  const [nextChapter, setNextChapter] = useState<SiblingChapter | null>(null);

  // Reading settings
  const [fontSize, setFontSize] = useState(18);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>('auto');

  // Automatically follows app theme (Light / Dark) when set to 'auto', or uses explicit preference
  const theme: ThemeMode = useMemo(() => {
    if (themeChoice === 'auto') {
      return isDark ? 'dark' : 'light';
    }
    return themeChoice;
  }, [themeChoice, isDark]);

  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [readProgress, setReadProgress] = useState(0);

  // Dialog State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    tone?: 'gold' | 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({ title: '', message: '' });

  const promptTranslationRequest = () => {
    if (!chapter) return;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      setDialogConfig({
        title: language === 'id' ? 'Butuh Login' : 'Login Required',
        message:
          language === 'id'
            ? 'Silakan masuk (login) terlebih dahulu untuk mengajukan permintaan terjemahan.'
            : 'Please sign in to your account before requesting a translation.',
        tone: 'gold',
        confirmText: language === 'id' ? 'Masuk Sekarang' : 'Sign In',
        cancelText: t.cancel || 'Batal',
        showCancel: true,
        onConfirm: () => setAuthModalVisible(true),
      });
      setDialogVisible(true);
      return;
    }

    setDialogConfig({
      title: language === 'id' ? 'Terjemahan Belum Tersedia' : 'Translation Not Available',
      message:
        language === 'id'
          ? `Bab #${chapter.chapter_number} belum memiliki terjemahan Bahasa Indonesia. Mau mengajukan request translate agar segera diterjemahkan?`
          : `Chapter #${chapter.chapter_number} does not have an Indonesian translation yet. Would you like to request a translation?`,
      tone: 'gold',
      confirmText: 'Request Translate',
      cancelText: t.cancel || 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          await requestTranslation({
            novelId: chapter.novel_id,
            novelSlug: chapter.novel_slug || chapter.novel?.nu_slug,
            novelTitle: novelTitle || chapter.novel?.title || '',
            novelCover: chapter.novel?.cover_url || null,
            chapterId: chapter.id,
            chapterNumber: chapter.chapter_number,
          });
          setDialogConfig({
            title: language === 'id' ? 'Permintaan Terkirim' : 'Request Submitted',
            message:
              language === 'id'
                ? 'Terima kasih! Permintaan terjemahan untuk bab ini telah dicatat dan akan segera diproses oleh admin.'
                : 'Thank you! Your translation request for this chapter has been submitted and will be processed soon.',
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
  };

  const SETTINGS_KEY = 'novesia_reading_settings';

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const s = JSON.parse(stored);
        if (s.fontSize) setFontSize(s.fontSize);
        if (s.lineHeight) setLineHeight(s.lineHeight);
        if (s.themeChoice) {
          setThemeChoice(s.themeChoice);
        } else if (s.manualThemeSelected && (s.theme === 'dark' || s.theme === 'light' || s.theme === 'sepia')) {
          setThemeChoice(s.theme);
        } else {
          // Default to 'auto' so it automatically adapts to light or dark mode!
          setThemeChoice('auto');
        }
      }
    } catch {}
  };

  const saveSettings = useCallback(async (fs: number, th: ThemeChoice, lh: number, manual: boolean = false) => {
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ fontSize: fs, theme: th, themeChoice: th, manualThemeSelected: manual, lineHeight: lh })
      );
    } catch {}
  }, []);

  const handleSelectTheme = (th: ThemeChoice) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      setShowSettings(false);
      setDialogConfig({
        title: globalLang === 'en' ? 'Login Required' : 'Butuh Login',
        message:
          globalLang === 'en'
            ? 'Please sign in to change the reading theme (Auto, Dark, Light, Sepia).'
            : 'Silakan masuk (login) terlebih dahulu untuk mengubah tema tampilan membaca (Auto, Dark, Light, Sepia).',
        tone: 'gold',
        confirmText: globalLang === 'en' ? 'Sign In' : 'Masuk Sekarang',
        cancelText: t.cancel || 'Batal',
        showCancel: true,
        onConfirm: () => setAuthModalVisible(true),
      });
      setDialogVisible(true);
      return;
    }
    setThemeChoice(th);
    saveSettings(fontSize, th, lineHeight, th !== 'auto');
  };

  useEffect(() => {
    loadSettings();
    setLanguage(globalLang);
  }, [globalLang]);

  useEffect(() => {
    if (chapter) {
      const title = chapter.novel?.title || '';
      if (title) setNovelTitle(title);

      // Save to Global History only if unlocked
      if (chapter.novel_id && !isLocked) {
        addHistory({
          novel_id: chapter.novel_id,
          title,
          cover: chapter.novel?.cover_url || '',
          last_chapter: chapter.chapter_number,
          last_chapter_id: chapter.id,
        });

        // Record gamification stats & XP
        trackChapterRead(chapter.novel_id, chapter.id, chapter.chapter_number);

        // Save last read chapter per-novel
        AsyncStorage.setItem(
          `lastread_${chapter.novel_id}`,
          JSON.stringify({
            chapter_id: chapter.id,
            chapter_number: chapter.chapter_number,
          })
        ).catch(() => {});
      }

      // Prev/Next dari response
      setPrevChapter(chapter.prev_chapter || null);
      setNextChapter(chapter.next_chapter || null);
    }
  }, [chapter, isLocked]);

  useEffect(() => {
    if (chapter && !isLocked) {
      showForChapter(chapter.id);
    }
  }, [chapter, isLocked, showForChapter]);

  const navigateChapter = (id: string) => {
    router.replace(`/read/${id}` as any);
  };

  // Refs to avoid stale closures in PanResponder
  const prevRef = useRef<SiblingChapter | null>(null);
  const nextRef = useRef<SiblingChapter | null>(null);
  prevRef.current = prevChapter;
  nextRef.current = nextChapter;

  // Swipe gesture for chapter navigation
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.2;
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) > 50) {
          if (gs.dx < 0 && nextRef.current) {
            navigateChapter(nextRef.current.id);
          } else if (gs.dx > 0 && prevRef.current) {
            navigateChapter(prevRef.current.id);
          }
        }
      },
    })
  ).current;

  // Determine which content to show
  const getContent = () => {
    if (!chapter) return { text: '', wordCount: 0 };
    const rawText =
      language === 'id' && chapter.content_translated
        ? chapter.content_translated
        : (chapter.content_original || '');

    if (!rawText) return { text: '', wordCount: 0 };

    const cleaned = cleanChapterText(rawText, {
      novelTitle: novelTitle || chapter.novel?.title || null,
      chapterNumber: chapter.chapter_number,
      chapterTitle: chapter.chapter_title || null,
    });

    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    return { text: cleaned, wordCount };
  };

  const hasTranslation = chapter?.content_translated != null;
  const { text: displayContent, wordCount: displayWordCount } = getContent();

  const currentTheme = useMemo(() => {
    const base = THEMES[theme];
    const accent = colors.primary;
    const accentMuted = colors.primaryMuted || (colors.primary + '1F');
    return {
      ...base,
      goldAccent: accent,
      surfaceBorder: colors.primary + '38',
      badgeBg: accentMuted,
    };
  }, [theme, colors]);

  if (loading && !chapter) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.bg }]}>
        <View style={{ position: 'absolute', top: 48, left: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={22} color={currentTheme.text} />
            <Text style={{ color: currentTheme.text, fontSize: 15, fontWeight: '600' }}>{t.back}</Text>
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color={currentTheme.goldAccent} />
        <Text style={{ color: currentTheme.textMuted, marginTop: 14, fontSize: 14 }}>
          {language === 'id' ? 'Memuat bab...' : 'Loading chapter...'}
        </Text>
      </View>
    );
  }

  if (isError || !chapter) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: currentTheme.bg,
              borderBottomColor: currentTheme.headerBorder,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            style={[styles.topIconButton, { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
          >
            <Ionicons name="arrow-back" size={19} color={currentTheme.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={[styles.topTitle, { color: currentTheme.text }]} numberOfLines={1}>
              {novelTitle || (globalLang === 'id' ? 'Pembaca Bab' : 'Chapter Reader')}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            message={isError ? 'Gagal memuat isi bab. Periksa koneksi internet Anda.' : t.chapter_not_found}
            onRetry={() => refetch()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: currentTheme.bg,
            borderBottomColor: currentTheme.headerBorder,
            paddingTop: Math.max(42, insets.top + 6),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          style={[styles.topIconButton, { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
        >
          <Ionicons name="arrow-back" size={19} color={currentTheme.text} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={[styles.topTitle, { color: currentTheme.text }]} numberOfLines={1}>
            {novelTitle}
          </Text>
          <Text style={[styles.topChapter, { color: currentTheme.goldAccent }]}>
            Chapter {chapter.chapter_number}
          </Text>
        </View>

        {/* Language quick switcher */}
        <TouchableOpacity
          onPress={() => {
            const nextLang = language === 'en' ? 'id' : 'en';
            if (nextLang === 'id' && !hasTranslation) {
              promptTranslationRequest();
              return;
            }
            setLanguage(nextLang);
            changeLang(nextLang);
          }}
          activeOpacity={0.7}
          style={[
            styles.topPillBtn,
            {
              backgroundColor: currentTheme.badgeBg,
              borderColor: currentTheme.goldAccent + '4D',
            },
          ]}
        >
          <Text style={{ fontSize: 13 }}>{language === 'en' ? '🇬🇧' : '🇮🇩'}</Text>
          <Text
            style={{
              fontSize: 11.5,
              fontWeight: '700',
              color: currentTheme.goldAccent,
              marginLeft: 4,
            }}
          >
            {language.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* Font size quick steppers */}
        <TouchableOpacity
          onPress={() => {
            const v = Math.max(12, fontSize - 1);
            setFontSize(v);
            saveSettings(v, themeChoice, lineHeight, themeChoice !== 'auto');
          }}
          activeOpacity={0.7}
          style={[
            styles.topSizeBtn,
            {
              backgroundColor: currentTheme.cardBg,
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <Text style={[styles.topSizeBtnText, { color: currentTheme.text }]}>A-</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const v = Math.min(28, fontSize + 1);
            setFontSize(v);
            saveSettings(v, themeChoice, lineHeight, themeChoice !== 'auto');
          }}
          activeOpacity={0.7}
          style={[
            styles.topSizeBtn,
            {
              backgroundColor: currentTheme.cardBg,
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <Text style={[styles.topSizeBtnText, { color: currentTheme.text }]}>A+</Text>
        </TouchableOpacity>

        {/* Settings button */}
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
          hitSlop={8}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Pengaturan Membaca"
          style={[
            styles.topIconButton,
            {
              backgroundColor: currentTheme.badgeBg,
              borderColor: currentTheme.goldAccent + '4D',
            },
          ]}
        >
          <Ionicons name="options-outline" size={18} color={currentTheme.goldAccent} />
        </TouchableOpacity>
      </View>

      {/* Reading Progress Bar */}
      <View style={[styles.progressBarBg, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${readProgress}%`,
              backgroundColor: currentTheme.goldAccent,
            },
          ]}
        />
      </View>

      {/* Floating Ad Cooldown Notice (Pola Komiku) */}
      {adNoticeVisible && (
        <View
          pointerEvents="none"
          style={[styles.adNoticeContainer, { top: Math.max(16, insets.top + 8) }]}
        >
          <View
            style={[
              styles.adNoticeCapsule,
              {
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.surfaceBorder,
              },
            ]}
          >
            <Ionicons name="megaphone-outline" size={14} color={currentTheme.goldAccent} />
            <Text style={[styles.adNoticeText, { color: currentTheme.text }]}>
              {adNoticeMessage || AD_NOTICE_MESSAGE}
            </Text>
          </View>
        </View>
      )}

      {/* Language Info Banner — hanya tampil jika bab TIDAK terkunci */}
      {!isLocked && language === 'id' && !hasTranslation && (
        <View
          style={[
            styles.langBanner,
            {
              backgroundColor: currentTheme.goldAccent + '12',
              borderBottomColor: currentTheme.goldAccent + '25',
            },
          ]}
        >
          <View style={styles.langBannerLeft}>
            <View
              style={[
                styles.langBannerIconBadge,
                { backgroundColor: currentTheme.goldAccent + '22' },
              ]}
            >
              <Ionicons name="language" size={13} color={currentTheme.goldAccent} />
            </View>
            <View style={styles.langBannerTextCol}>
              <Text
                style={[styles.langBannerTitle, { color: currentTheme.text }]}
                numberOfLines={1}
              >
                Terjemahan ID belum tersedia
              </Text>
              <Text
                style={[styles.langBannerSub, { color: currentTheme.textMuted }]}
                numberOfLines={1}
              >
                Menampilkan versi original bahasa Inggris
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={promptTranslationRequest}
            activeOpacity={0.8}
            style={[
              styles.langBannerBtn,
              {
                backgroundColor: currentTheme.goldAccent,
                shadowColor: currentTheme.goldAccent,
              },
            ]}
          >
            <Ionicons name="sparkles" size={11} color="#000" style={{ marginRight: 4 }} />
            <Text style={styles.langBannerBtnText}>Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chapter Content / Locked / No Content */}
      {isLocked ? (
        <View style={styles.lockedContainer}>
          <ScrollView
            contentContainerStyle={[
              styles.lockedScrollContent,
              { paddingBottom: Math.max(48, insets.bottom + 36) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Ultra-Premium Glassmorphism Gold Card */}
            <View
              style={[
                styles.lockedCard,
                {
                  backgroundColor: theme === 'dark' ? '#13171E' : (theme === 'sepia' ? '#EAE1D2' : '#FFFFFF'),
                  borderColor: theme === 'dark' ? 'rgba(212,168,67,0.28)' : 'rgba(212,168,67,0.38)',
                },
              ]}
            >
              {/* Luminous Login Glow Badge */}
              <View style={styles.lockedIconWrapper}>
                <View
                  style={[
                    styles.lockedIconBadge,
                    {
                      backgroundColor: currentTheme.badgeBg,
                      borderColor: currentTheme.goldAccent + '66',
                    },
                  ]}
                >
                  <Ionicons name="log-in-outline" size={32} color={currentTheme.goldAccent} />
                </View>
                <View style={[styles.lockedSparkleBadge, { backgroundColor: currentTheme.goldAccent }]}>
                  <Ionicons name="sparkles" size={11} color="#0D1117" />
                </View>
              </View>

              {/* Chapter Meta & Title */}
              <Text style={[styles.lockedChapterNumber, { color: currentTheme.goldAccent }]}>
                {globalLang === 'en' ? 'CHAPTER' : 'BAB'} {chapter.chapter_number}
              </Text>
              <Text style={[styles.lockedTitle, { color: currentTheme.text }]} numberOfLines={2}>
                {cleanChapterTitle(chapter.chapter_title, chapter.chapter_number) || `Bab ${chapter.chapter_number}`}
              </Text>

              {/* Status Pill */}
              <View
                style={[
                  styles.lockedPill,
                  {
                    backgroundColor: currentTheme.badgeBg,
                    borderColor: currentTheme.goldAccent + '40',
                  },
                ]}
              >
                <Ionicons name="log-in-outline" size={12} color={currentTheme.goldAccent} />
                <Text style={[styles.lockedPillText, { color: currentTheme.goldAccent }]}>
                  {globalLang === 'en' ? 'LOGIN REQUIRED' : 'BUTUH LOGIN'}
                </Text>
              </View>

              {/* Description */}
              <Text style={[styles.lockedDescription, { color: currentTheme.textMuted }]}>
                {(chapter as any).lock_message ||
                  (globalLang === 'en'
                    ? 'Login is required to read this chapter. Sign in to your account to read all chapters 100% free!'
                    : 'Butuh login untuk membaca bab ini. Silakan masuk (login) dengan akun Anda untuk membaca seluruh bab 100% gratis!')}
              </Text>

              {/* VIP Perks Card */}
              <View
                style={[
                  styles.lockedBenefitBox,
                  {
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
                    borderColor: theme === 'dark' ? 'rgba(212,168,67,0.18)' : 'rgba(212,168,67,0.28)',
                  },
                ]}
              >
                <View style={styles.lockedBenefitRow}>
                  <View style={[styles.lockedCheckCircle, { backgroundColor: currentTheme.badgeBg }]}>
                    <Ionicons name="checkmark" size={12} color={currentTheme.goldAccent} />
                  </View>
                  <Text style={[styles.lockedBenefitText, { color: currentTheme.text }]}>
                    {globalLang === 'en' ? 'Read all chapters of your favorite novels 100% free' : 'Baca semua bab novel favorit gratis 100%'}
                  </Text>
                </View>
                <View style={styles.lockedBenefitRow}>
                  <View style={[styles.lockedCheckCircle, { backgroundColor: currentTheme.badgeBg }]}>
                    <Ionicons name="checkmark" size={12} color={currentTheme.goldAccent} />
                  </View>
                  <Text style={[styles.lockedBenefitText, { color: currentTheme.text }]}>
                    {globalLang === 'en' ? 'Automatic reading history & bookmark synchronization' : 'Tersinkronisasi otomatis riwayat baca & bookmark'}
                  </Text>
                </View>
                <View style={styles.lockedBenefitRow}>
                  <View style={[styles.lockedCheckCircle, { backgroundColor: currentTheme.badgeBg }]}>
                    <Ionicons name="checkmark" size={12} color={currentTheme.goldAccent} />
                  </View>
                  <Text style={[styles.lockedBenefitText, { color: currentTheme.text }]}>
                    {globalLang === 'en' ? 'Join community discussions and reply in forum' : 'Bisa ikut berkomentar dan berdiskusi di forum'}
                  </Text>
                </View>
              </View>

              {/* Primary Action Button with Rich Gold Gradient */}
              <TouchableOpacity
                onPress={() => setAuthModalVisible(true)}
                activeOpacity={0.88}
                style={styles.lockedPrimaryBtnWrapper}
              >
                <LinearGradient
                  colors={['#E5C378', '#D4A843', '#B88B2E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.lockedPrimaryBtnGradient}
                >
                  <Ionicons name="log-in" size={18} color="#0D1117" />
                  <Text style={styles.lockedPrimaryBtnText}>
                    {globalLang === 'en' ? 'Sign In / Register' : 'Masuk / Daftar Akun'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary Button */}
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.75}
                style={[
                  styles.lockedSecondaryBtn,
                  {
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  },
                ]}
              >
                <Ionicons name="list-outline" size={16} color={currentTheme.text} />
                <Text style={[styles.lockedSecondaryBtnText, { color: currentTheme.text }]}>
                  {globalLang === 'en' ? 'Back to Chapter List' : 'Kembali ke Daftar Bab'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sibling navigation with Safe Area Bottom buffer (Never touches Android navbar) */}
            {(prevChapter || nextChapter) && (
              <View
                style={[
                  styles.lockedNavRow,
                  {
                    marginBottom: Math.max(36, insets.bottom + 28),
                  },
                ]}
              >
                {prevChapter ? (
                  <TouchableOpacity
                    style={[
                      styles.lockedNavBtn,
                      {
                        backgroundColor: currentTheme.cardBg,
                        borderColor: currentTheme.cardBorder,
                      },
                    ]}
                    onPress={() => navigateChapter(prevChapter.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={15} color={currentTheme.text} />
                    <Text style={[styles.lockedNavBtnText, { color: currentTheme.text }]}>
                      Ch {prevChapter.chapter_number}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                <View style={{ width: 14 }} />

                {nextChapter ? (
                  <TouchableOpacity
                    style={[
                      styles.lockedNavBtn,
                      {
                        backgroundColor: currentTheme.badgeBg,
                        borderColor: currentTheme.surfaceBorder,
                      },
                    ]}
                    onPress={() => navigateChapter(nextChapter.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.lockedNavBtnText, { color: currentTheme.goldAccent, fontWeight: '700' }]}>
                      Ch {nextChapter.chapter_number}
                    </Text>
                    <Ionicons name="chevron-forward" size={15} color={currentTheme.goldAccent} />
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            )}
          </ScrollView>
        </View>
      ) : !displayContent ? (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentIcon}>📝</Text>
          <Text style={styles.noContentText}>{t.chapter_not_found}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.noContentBtn}>
            <Text style={[styles.noContentBtnText, { color: currentTheme.goldAccent }]}>← {t.back}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(100, insets.bottom + 60) }}
            {...panResponder.panHandlers}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const scrollable = contentSize.height - layoutMeasurement.height;
              if (scrollable > 0) {
                setReadProgress(Math.min(100, (contentOffset.y / scrollable) * 100));
              }
            }}
            scrollEventThrottle={16}
          >
            {/* Estimated reading time */}
            <Text style={[styles.readingTime, { color: currentTheme.textMuted }]}>
              ⏱️ ~{Math.max(1, Math.round(displayWordCount / 200))} min read
            </Text>
            <Text style={[styles.chapterHeading, { color: currentTheme.text }]}>
              {cleanChapterTitle(chapter.chapter_title, chapter.chapter_number)}
            </Text>

            <Text
              style={{
                color: currentTheme.text,
                fontSize: fontSize,
                lineHeight: fontSize * lineHeight,
                textAlign: 'justify' as const,
              }}
            >
              {displayContent}
            </Text>

            <Text style={[styles.wordCount, { color: currentTheme.textMuted }]}>
              {displayWordCount} {language === 'id' ? 'kata' : 'words'}
            </Text>

            {/* Navigation */}
            <View style={styles.navRow}>
              {prevChapter ? (
                <TouchableOpacity
                  style={[styles.navBtn, { backgroundColor: currentTheme.navBtnBg, borderColor: currentTheme.navBtnBorder }]}
                  onPress={() => navigateChapter(prevChapter.id)}
                >
                  <Text style={[styles.navBtnText, { color: currentTheme.text }]}>← Ch {prevChapter.chapter_number}</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              {nextChapter ? (
                <TouchableOpacity
                  style={[styles.navBtn, { backgroundColor: currentTheme.goldAccent, borderColor: currentTheme.goldAccent }]}
                  onPress={() => navigateChapter(nextChapter.id)}
                >
                  <Text style={[styles.navBtnText, { color: colors.textOnPrimary }]}>
                    Ch {nextChapter.chapter_number} →
                  </Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
            </View>

            {/* Chapter Comments & Discussion */}
            {chapter && chapter.novel_id && (
              <View style={{ marginTop: 24 }}>
                <CommentSection
                  novelId={chapter.novel_id}
                  novelSlug={chapter.novel_slug || chapter.novel?.nu_slug || ''}
                  chapterId={chapter.id}
                  chapterNumber={chapter.chapter_number}
                  target="CHAPTER"
                  isInReader={true}
                  themeOverride={{
                    cardBg: currentTheme.cardBg,
                    cardBorder: currentTheme.cardBorder,
                    text: currentTheme.text,
                    textMuted: currentTheme.textMuted,
                    goldAccent: currentTheme.goldAccent,
                  }}
                  onOpenAuthModal={() => setAuthModalVisible(true)}
                />
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* ═══ LUXURY READING PREFERENCES MODAL (THEME-REACTIVE) ═══ */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowSettings(false)}
          />

          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: currentTheme.sheetBg,
                borderColor: currentTheme.surfaceBorder,
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 44 : 16) + 20,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' },
              ]}
            />

            {/* Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: currentTheme.headerBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalHeaderIconBadge, { backgroundColor: currentTheme.badgeBg }]}>
                  <Ionicons name="options-outline" size={15} color={currentTheme.goldAccent} />
                </View>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  {t.reading_preferences || 'Reading Preferences'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                hitSlop={8}
                style={[styles.modalCloseCircle, { backgroundColor: currentTheme.closeCircleBg }]}
              >
                <Ionicons name="close" size={16} color={currentTheme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* 1. Language Preference */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <View style={styles.settingLabelLeft}>
                  <Ionicons name="language-outline" size={14} color={currentTheme.goldAccent} />
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.language || 'Bahasa Teks'}</Text>
                </View>
              </View>
              <View style={styles.langGridRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: language === 'en' ? currentTheme.cardBgActive : currentTheme.cardBg,
                      borderColor: language === 'en' ? currentTheme.goldAccent : currentTheme.cardBorder,
                    },
                    language === 'en' && styles.langCardActive,
                  ]}
                  onPress={() => {
                    setLanguage('en');
                    changeLang('en');
                  }}
                >
                  <Text style={styles.langCardFlag}>🇬🇧</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.langCardTitle,
                        { color: language === 'en' ? currentTheme.text : currentTheme.textMuted },
                      ]}
                    >
                      English
                    </Text>
                    <Text style={[styles.langCardSubtitle, { color: currentTheme.textMuted }]}>Original Text</Text>
                  </View>
                  {language === 'en' ? (
                    <Ionicons name="checkmark-circle" size={17} color={currentTheme.goldAccent} />
                  ) : (
                    <View style={[styles.radioUnchecked, { borderColor: currentTheme.textMuted }]} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: language === 'id' ? currentTheme.cardBgActive : currentTheme.cardBg,
                      borderColor: language === 'id' ? currentTheme.goldAccent : currentTheme.cardBorder,
                    },
                    language === 'id' && styles.langCardActive,
                  ]}
                  onPress={() => {
                    if (!hasTranslation) {
                      setShowSettings(false);
                      setTimeout(() => {
                        promptTranslationRequest();
                      }, 250);
                      return;
                    }
                    setLanguage('id');
                    changeLang('id');
                  }}
                >
                  <Text style={styles.langCardFlag}>🇮🇩</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.langCardTitle,
                        { color: language === 'id' ? currentTheme.text : currentTheme.textMuted },
                      ]}
                    >
                      Indonesia
                    </Text>
                    <Text style={[styles.langCardSubtitle, { color: currentTheme.textMuted }]}>Terjemahan</Text>
                  </View>
                  {language === 'id' ? (
                    <Ionicons name="checkmark-circle" size={17} color={currentTheme.goldAccent} />
                  ) : (
                    <View style={[styles.radioUnchecked, { borderColor: currentTheme.textMuted }]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Font Size */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <View style={styles.settingLabelLeft}>
                  <Ionicons name="text-outline" size={14} color={currentTheme.goldAccent} />
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.font_size || 'Ukuran Teks'}</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: currentTheme.badgeBg, borderColor: currentTheme.goldAccent + '30' }]}>
                  <Text style={[styles.badgePillText, { color: currentTheme.goldAccent }]}>{fontSize}px</Text>
                </View>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.stepperBtn, { backgroundColor: currentTheme.stepperBg, borderColor: currentTheme.stepperBorder }]}
                  onPress={() => {
                    const v = Math.max(12, fontSize - 1);
                    setFontSize(v);
                    saveSettings(v, themeChoice, lineHeight, themeChoice !== 'auto');
                  }}
                >
                  <Text style={[styles.stepperBtnText, { color: currentTheme.goldAccent }]}>A-</Text>
                </TouchableOpacity>
                <View style={[styles.sliderTrack, { backgroundColor: currentTheme.sliderTrack }]}>
                  <View
                    style={[
                      styles.sliderProgress,
                      {
                        width: `${((fontSize - 12) / 16) * 100}%`,
                        backgroundColor: currentTheme.goldAccent,
                      },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.stepperBtn, { backgroundColor: currentTheme.stepperBg, borderColor: currentTheme.stepperBorder }]}
                  onPress={() => {
                    const v = Math.min(28, fontSize + 1);
                    setFontSize(v);
                    saveSettings(v, themeChoice, lineHeight, themeChoice !== 'auto');
                  }}
                >
                  <Text style={[styles.stepperBtnText, { color: currentTheme.goldAccent }]}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Theme Mode */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <View style={styles.settingLabelLeft}>
                  <Ionicons name="color-palette-outline" size={14} color={currentTheme.goldAccent} />
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.theme || 'Tema Latar'}</Text>
                </View>
                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: currentTheme.badgeBg,
                      borderColor: currentTheme.goldAccent + '40',
                    },
                  ]}
                >
                  <Text style={[styles.badgePillText, { color: currentTheme.goldAccent }]}>
                    {themeChoice === 'auto'
                      ? (isDark ? 'Auto (Dark)' : 'Auto (Light)')
                      : themeChoice.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.themeGridRow}>
                {/* 1. Auto */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: themeChoice === 'auto'
                        ? (isDark ? '#161B20' : '#FFFFFF')
                        : (isDark ? '#0A0D10' : '#F1F5F9'),
                      borderColor: themeChoice === 'auto'
                        ? currentTheme.goldAccent
                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                    },
                    themeChoice === 'auto' && styles.themeCardActive,
                  ]}
                  onPress={() => handleSelectTheme('auto')}
                >
                  <Ionicons
                    name="contrast-outline"
                    size={14}
                    color={themeChoice === 'auto' ? currentTheme.goldAccent : (isDark ? '#94A3B8' : '#64748B')}
                  />
                  <Text
                    style={[
                      styles.themeCardText,
                      {
                        color: themeChoice === 'auto'
                          ? currentTheme.goldAccent
                          : (isDark ? '#E2E8F0' : '#334155'),
                        fontWeight: themeChoice === 'auto' ? '700' : '500',
                      },
                    ]}
                  >
                    Auto
                  </Text>
                </TouchableOpacity>

                {/* 2. Dark */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#0A0D10',
                      borderColor: themeChoice === 'dark' ? currentTheme.goldAccent : 'rgba(255,255,255,0.08)',
                    },
                    themeChoice === 'dark' && styles.themeCardActive,
                  ]}
                  onPress={() => handleSelectTheme('dark')}
                >
                  <Ionicons name="moon" size={14} color={themeChoice === 'dark' ? currentTheme.goldAccent : '#94a3b8'} />
                  <Text style={[styles.themeCardText, { color: '#E2E8F0', fontWeight: themeChoice === 'dark' ? '700' : '500' }]}>Dark</Text>
                </TouchableOpacity>

                {/* 3. Light */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: themeChoice === 'light' ? currentTheme.goldAccent : 'rgba(0,0,0,0.1)',
                    },
                    themeChoice === 'light' && styles.themeCardActive,
                  ]}
                  onPress={() => handleSelectTheme('light')}
                >
                  <Ionicons name="sunny" size={14} color={themeChoice === 'light' ? currentTheme.goldAccent : '#f59e0b'} />
                  <Text style={[styles.themeCardText, { color: '#1A1A2E', fontWeight: themeChoice === 'light' ? '700' : '500' }]}>Light</Text>
                </TouchableOpacity>

                {/* 4. Sepia */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#F5F0E8',
                      borderColor: themeChoice === 'sepia' ? currentTheme.goldAccent : 'rgba(0,0,0,0.1)',
                    },
                    themeChoice === 'sepia' && styles.themeCardActive,
                  ]}
                  onPress={() => handleSelectTheme('sepia')}
                >
                  <Ionicons name="book" size={14} color={themeChoice === 'sepia' ? currentTheme.goldAccent : '#b45309'} />
                  <Text style={[styles.themeCardText, { color: '#3D3225', fontWeight: themeChoice === 'sepia' ? '700' : '500' }]}>Sepia</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Line Spacing */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <View style={styles.settingLabelLeft}>
                  <Ionicons name="reorder-three-outline" size={14} color={currentTheme.goldAccent} />
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.line_spacing || 'Spasi Baris'}</Text>
                </View>
              </View>
              <View style={styles.lineSpacingRow}>
                {[1.5, 1.8, 2.2].map((val) => {
                  const active = Math.abs(lineHeight - val) < 0.05;
                  return (
                    <TouchableOpacity
                      key={val}
                      activeOpacity={0.7}
                      style={[
                        styles.lineSpacingChip,
                        {
                          backgroundColor: active ? currentTheme.chipBgActive : currentTheme.chipBg,
                          borderColor: active ? currentTheme.goldAccent : currentTheme.cardBorder,
                        },
                        active && styles.lineSpacingChipActive,
                      ]}
                      onPress={() => {
                        setLineHeight(val);
                        saveSettings(fontSize, themeChoice, val, themeChoice !== 'auto');
                      }}
                    >
                      <Text
                        style={[
                          styles.lineSpacingChipText,
                          {
                            color: active ? currentTheme.goldAccent : currentTheme.textMuted,
                            fontWeight: active ? '700' : '500',
                          },
                        ]}
                      >
                        {val.toFixed(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Close Button - Minimalist & Luxury */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.doneBtn,
                {
                  backgroundColor: currentTheme.cardBgActive,
                  borderColor: currentTheme.goldAccent + '4D',
                },
              ]}
              onPress={() => setShowSettings(false)}
            >
              <Text style={[styles.doneBtnText, { color: currentTheme.goldAccent }]}>
                {t.close || 'Tutup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Request Translate Dialog */}
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
        onSuccess={() => {
          setAuthModalVisible(false);
          refetch();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  topIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  topTitle: { fontSize: 13.5, fontWeight: '700' },
  topChapter: { fontSize: 11, marginTop: 1, fontWeight: '600' },

  // Top bar quick controls
  topPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  topSizeBtn: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSizeBtnText: { fontSize: 11.5, fontWeight: '800' },

  // Language info banner
  langBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  langBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  langBannerIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  langBannerTextCol: {
    flex: 1,
  },
  langBannerTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  langBannerSub: {
    fontSize: 10,
    marginTop: 0.5,
  },
  langBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  langBannerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.2,
  },

  // No content state
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noContentIcon: { fontSize: 48, marginBottom: 16 },
  noContentText: { fontSize: 16, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  noContentBtn: { marginTop: 24, padding: 12 },
  noContentBtnText: { color: '#d4a843', fontWeight: '700', fontSize: 14 },

  content: { flex: 1 },
  chapterHeading: {
    fontSize: 22,
    fontWeight: '800',
    paddingTop: 24,
    paddingBottom: 20,
    textAlign: 'center',
  },
  wordCount: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: 32,
    marginBottom: 16,
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  navBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#11151A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  navBtnPrimary: { backgroundColor: '#d4a843', borderColor: '#d4a843' },
  navBtnText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  navBtnPrimaryText: { color: '#0D1012' },

  // Reading Progress Bar
  progressBarBg: {
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  readingTime: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },

  // ══════════════════════════════════════════════════════════════
  // LUXURY READING PREFERENCES MODAL STYLES (MINIMALIST)
  // ══════════════════════════════════════════════════════════════
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  modalHeaderIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingSection: {
    marginBottom: 16,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  settingLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  settingLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Language Cards
  langGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  langCardActive: {
    borderWidth: 1.2,
  },
  langCardFlag: {
    fontSize: 18,
  },
  langCardTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  langCardSubtitle: {
    fontSize: 9.5,
    marginTop: 1,
  },
  radioUnchecked: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
  },

  // Stepper & Slider
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 2,
  },

  // Theme Cards
  themeGridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  themeCard: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  themeCardActive: {
    borderWidth: 1.5,
  },
  themeCardText: {
    fontSize: 11.5,
  },

  // Line Spacing Chips
  lineSpacingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lineSpacingChip: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineSpacingChipActive: {
    borderWidth: 1.2,
  },
  lineSpacingChipText: {
    fontSize: 12,
  },

  // Done Button
  doneBtn: {
    marginTop: 4,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Locked Chapter Styles
  lockedContainer: {
    flex: 1,
  },
  lockedScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  lockedCard: {
    width: '100%',
    maxWidth: 440,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1.2,
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  lockedIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  lockedIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedSparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  lockedChapterNumber: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  lockedTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  lockedPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  lockedDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  lockedBenefitBox: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 11,
    marginBottom: 20,
  },
  lockedBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBenefitText: {
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  lockedPrimaryBtnWrapper: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#d4a843',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  lockedPrimaryBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  lockedPrimaryBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A0E14',
    letterSpacing: 0.2,
  },
  lockedSecondaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  lockedNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  lockedNavBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedNavBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Ad Notice Capsule Styles (Komiku Pattern)
  adNoticeContainer: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  adNoticeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 7,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  adNoticeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

