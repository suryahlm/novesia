import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHistory } from '../../lib/history';
import { trackChapterRead } from '../../lib/gamification';
import { useLanguage } from '../../lib/i18n';
import { useInterstitialAd } from '../../lib/useInterstitialAd';
import { useTheme } from '../../lib/ThemeProvider';
import { cleanChapterTitle } from '../../lib/utils';
import { CustomDialog } from '../../components/CustomDialog';
import { ErrorState } from '../../components/ErrorState';
import { requestTranslation } from '../../lib/translationRequestService';
import { useChapterDetail } from '../../lib/useNovelsQuery';

type ThemeMode = 'dark' | 'light' | 'sepia';
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
    bg: '#fafafa',
    text: '#1a1a2e',
    textMuted: '#64748b',
    cardBg: '#F1F5F9',
    cardBgActive: '#FFFBEB',
    cardBorder: 'rgba(0,0,0,0.08)',
    surfaceBorder: 'rgba(212,168,67,0.3)',
    sheetBg: '#FFFFFF',
    headerBorder: 'rgba(0,0,0,0.06)',
    stepperBg: '#F1F5F9',
    stepperBorder: 'rgba(0,0,0,0.08)',
    sliderTrack: '#E2E8F0',
    goldAccent: '#d4a843',
    closeCircleBg: '#F1F5F9',
    chipBg: '#F1F5F9',
    chipBgActive: '#FEF3C7',
    navBtnBg: '#FFFFFF',
    navBtnBorder: 'rgba(0,0,0,0.1)',
    badgeBg: 'rgba(212,168,67,0.15)',
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
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { lang: globalLang, t, changeLang } = useLanguage();
  const { onChapterRead } = useInterstitialAd();

  const {
    data: chapterData,
    isLoading: loading,
    isError,
    refetch,
  } = useChapterDetail(chapterId);

  const chapter: ChapterData | null = (chapterData as any) || null;
  const [novelTitle, setNovelTitle] = useState('');
  const [prevChapter, setPrevChapter] = useState<SiblingChapter | null>(null);
  const [nextChapter, setNextChapter] = useState<SiblingChapter | null>(null);

  // Reading settings
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ThemeMode>('dark');
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
        if (s.theme) setTheme(s.theme);
        if (s.lineHeight) setLineHeight(s.lineHeight);
      }
    } catch {}
  };

  const saveSettings = useCallback(async (fs: number, th: ThemeMode, lh: number) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ fontSize: fs, theme: th, lineHeight: lh }));
    } catch {}
  }, []);

  useEffect(() => {
    loadSettings();
    setLanguage(globalLang);
  }, [globalLang]);

  useEffect(() => {
    if (chapter) {
      const title = chapter.novel?.title || '';
      if (title) setNovelTitle(title);

      // Save to Global History
      if (chapter.novel_id) {
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
  }, [chapter]);

  useEffect(() => {
    if (chapterId) {
      onChapterRead();
    }
  }, [chapterId]);

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
    if (language === 'id' && chapter.content_translated) {
      return { text: chapter.content_translated, wordCount: chapter.word_count_translated };
    }
    if (chapter.content_original) {
      return { text: chapter.content_original, wordCount: chapter.word_count_original };
    }
    return { text: '', wordCount: 0 };
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
            saveSettings(v, theme, lineHeight);
          }}
          activeOpacity={0.7}
          style={[styles.topSizeBtn, { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
        >
          <Text style={[styles.topSizeBtnText, { color: theme === 'dark' ? '#d4d4d8' : '#334155' }]}>A-</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const v = Math.min(28, fontSize + 1);
            setFontSize(v);
            saveSettings(v, theme, lineHeight);
          }}
          activeOpacity={0.7}
          style={[styles.topSizeBtn, { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
        >
          <Text style={[styles.topSizeBtnText, { color: theme === 'dark' ? '#d4d4d8' : '#334155' }]}>A+</Text>
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
      <View style={styles.progressBarBg}>
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

      {/* Language Info Banner */}
      {language === 'id' && !hasTranslation && (
        <View style={[styles.langBanner, { backgroundColor: currentTheme.badgeBg, borderBottomColor: currentTheme.goldAccent + '40' }]}>
          <Text style={[styles.langBannerText, { color: currentTheme.goldAccent, flex: 1 }]}>
            🇮🇩 {language === 'id' ? 'Terjemahan belum tersedia — menampilkan versi original Inggris' : 'Translation not available — showing English'}
          </Text>
          <TouchableOpacity
            onPress={promptTranslationRequest}
            activeOpacity={0.8}
            style={{
              backgroundColor: currentTheme.goldAccent,
              paddingHorizontal: 9,
              paddingVertical: 4.5,
              borderRadius: 7,
              marginLeft: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#000' }}>
              Request
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No Content */}
      {!displayContent ? (
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
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
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
            <Text style={[styles.readingTime, { color: theme === 'dark' ? '#64748b' : '#94a3b8' }]}>
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

            <Text style={styles.wordCount}>
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
          </ScrollView>
        </>
      )}

      {/* ═══ LUXURY READING PREFERENCES MODAL (THEME-REACTIVE) ═══ */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowSettings(false)}
          />

          <View style={[styles.modalContent, { backgroundColor: currentTheme.sheetBg, borderColor: currentTheme.surfaceBorder }]}>
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
                    saveSettings(v, theme, lineHeight);
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
                    saveSettings(v, theme, lineHeight);
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
              </View>
              <View style={styles.themeGridRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#0A0D10',
                      borderColor: theme === 'dark' ? currentTheme.goldAccent : 'rgba(255,255,255,0.08)',
                    },
                    theme === 'dark' && styles.themeCardActive,
                  ]}
                  onPress={() => {
                    setTheme('dark');
                    saveSettings(fontSize, 'dark', lineHeight);
                  }}
                >
                  <Ionicons name="moon" size={15} color={theme === 'dark' ? currentTheme.goldAccent : '#94a3b8'} />
                  <Text style={[styles.themeCardText, { color: '#E2E8F0', fontWeight: theme === 'dark' ? '700' : '500' }]}>Dark</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: theme === 'light' ? currentTheme.goldAccent : 'rgba(0,0,0,0.1)',
                    },
                    theme === 'light' && styles.themeCardActive,
                  ]}
                  onPress={() => {
                    setTheme('light');
                    saveSettings(fontSize, 'light', lineHeight);
                  }}
                >
                  <Ionicons name="sunny" size={15} color={theme === 'light' ? currentTheme.goldAccent : '#f59e0b'} />
                  <Text style={[styles.themeCardText, { color: '#1A1A2E', fontWeight: theme === 'light' ? '700' : '500' }]}>Light</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#F5F0E8',
                      borderColor: theme === 'sepia' ? currentTheme.goldAccent : 'rgba(0,0,0,0.1)',
                    },
                    theme === 'sepia' && styles.themeCardActive,
                  ]}
                  onPress={() => {
                    setTheme('sepia');
                    saveSettings(fontSize, 'sepia', lineHeight);
                  }}
                >
                  <Ionicons name="book" size={15} color={theme === 'sepia' ? currentTheme.goldAccent : '#b45309'} />
                  <Text style={[styles.themeCardText, { color: '#3D3225', fontWeight: theme === 'sepia' ? '700' : '500' }]}>Sepia</Text>
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
                        saveSettings(fontSize, theme, val);
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
    backgroundColor: 'rgba(212,168,67,0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,168,67,0.25)',
  },
  langBannerText: { fontSize: 11.5, color: '#d4a843', textAlign: 'center', fontWeight: '500' },

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
    gap: 10,
  },
  themeCard: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  themeCardActive: {
    borderWidth: 1.5,
  },
  themeCardText: {
    fontSize: 12,
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
});

