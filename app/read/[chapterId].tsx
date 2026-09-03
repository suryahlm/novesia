import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHistory } from '../../lib/history';
import { trackChapterRead } from '../../lib/gamification';
import { useLanguage } from '../../lib/i18n';
import { useInterstitialAd } from '../../lib/useInterstitialAd';

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
}

interface SiblingChapter {
  id: string;
  chapter_number: number;
}

export default function ReadChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { lang: globalLang, t } = useLanguage();
  const { onChapterRead } = useInterstitialAd();

  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [novelTitle, setNovelTitle] = useState('');
  const [prevChapter, setPrevChapter] = useState<SiblingChapter | null>(null);
  const [nextChapter, setNextChapter] = useState<SiblingChapter | null>(null);
  const [loading, setLoading] = useState(true);

  // Reading settings
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    loadSettings();
    setLanguage(globalLang);
  }, [globalLang]);

  useEffect(() => {
    if (chapterId) {
      fetchChapter();
      onChapterRead();
    }
  }, [chapterId]);

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

  const fetchChapter = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('nu_chapter_content')
      .select('id, chapter_number, chapter_title, content_original, content_translated, word_count_original, word_count_translated, novel_id')
      .eq('id', chapterId)
      .single();

    if (data) {
      setChapter(data);

      const { data: novelData } = await supabase
        .from('nu_novels')
        .select('title, cover_url, is_blacklisted, status')
        .eq('id', data.novel_id)
        .maybeSingle();
      
      if (!novelData || novelData.is_blacklisted || novelData.status === 'dropped' || novelData.status === 'blacklisted') {
        setChapter(null);
        setLoading(false);
        return;
      }

      if (novelData) {
        setNovelTitle(novelData.title);
        
        // Save to Global History (for Profile tab)
        addHistory({
          novel_id: data.novel_id,
          title: novelData.title,
          cover: novelData.cover_url || '',
          last_chapter: data.chapter_number,
          last_chapter_id: data.id
        });

        // Record gamification stats & XP
        trackChapterRead(data.novel_id, data.id, data.chapter_number);
      }

      // Save last read chapter to AsyncStorage (Legacy/Per-novel)
      try {
        await AsyncStorage.setItem(`lastread_${data.novel_id}`, JSON.stringify({
          chapter_id: data.id,
          chapter_number: data.chapter_number,
        }));
      } catch {}

      // Prev/Next: any chapter with content (original OR translated)
      const { data: prevData } = await supabase
        .from('nu_chapter_content')
        .select('id, chapter_number')
        .eq('novel_id', data.novel_id)
        .not('content_original', 'is', null)
        .lt('chapter_number', data.chapter_number)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .single();
      setPrevChapter(prevData);

      const { data: nextData } = await supabase
        .from('nu_chapter_content')
        .select('id, chapter_number')
        .eq('novel_id', data.novel_id)
        .not('content_original', 'is', null)
        .gt('chapter_number', data.chapter_number)
        .order('chapter_number', { ascending: true })
        .limit(1)
        .single();
      setNextChapter(nextData);
    }

    setLoading(false);
  };

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

  const currentTheme = THEMES[theme];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.bg }]}>
        <ActivityIndicator size="large" color="#d4a843" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#94a3b8', fontSize: 15 }}>{t.chapter_not_found}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#d4a843', fontWeight: '600' }}>← {t.back}</Text>
        </TouchableOpacity>
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
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
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
          <Text style={[styles.topChapter, { color: theme === 'dark' ? '#d4a843' : '#b45309' }]}>
            Chapter {chapter.chapter_number}
          </Text>
        </View>

        {/* Language quick switcher */}
        <TouchableOpacity
          onPress={() => setLanguage(language === 'en' ? 'id' : 'en')}
          activeOpacity={0.7}
          style={[
            styles.topPillBtn,
            {
              backgroundColor: theme === 'dark' ? 'rgba(212,168,67,0.12)' : 'rgba(0,0,0,0.05)',
              borderColor: theme === 'dark' ? 'rgba(212,168,67,0.3)' : 'rgba(0,0,0,0.1)',
            },
          ]}
        >
          <Text style={{ fontSize: 13 }}>{language === 'en' ? '🇬🇧' : '🇮🇩'}</Text>
          <Text
            style={{
              fontSize: 11.5,
              fontWeight: '700',
              color: theme === 'dark' ? '#d4a843' : '#334155',
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
              backgroundColor: theme === 'dark' ? 'rgba(212,168,67,0.12)' : 'rgba(0,0,0,0.05)',
              borderColor: theme === 'dark' ? 'rgba(212,168,67,0.3)' : 'rgba(0,0,0,0.1)',
            },
          ]}
        >
          <Ionicons name="options-outline" size={18} color={theme === 'dark' ? '#d4a843' : '#334155'} />
        </TouchableOpacity>
      </View>

      {/* Reading Progress Bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${readProgress}%`,
              backgroundColor: theme === 'dark' ? '#d4a843' : '#b45309',
            },
          ]}
        />
      </View>

      {/* Language Info Banner */}
      {language === 'id' && !hasTranslation && (
        <View style={styles.langBanner}>
          <Text style={styles.langBannerText}>
            🇮🇩 {language === 'id' ? 'Terjemahan belum tersedia — menampilkan versi original Inggris' : 'Translation not available — showing English'}
          </Text>
        </View>
      )}

      {/* No Content */}
      {!displayContent ? (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentIcon}>📝</Text>
          <Text style={styles.noContentText}>{t.chapter_not_found}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.noContentBtn}>
            <Text style={styles.noContentBtnText}>← {t.back}</Text>
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
              {chapter.chapter_title || `Chapter ${chapter.chapter_number}`}
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
                  <Text style={[styles.navBtnText, { color: '#0D1012' }]}>
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
                  <Ionicons name="options-outline" size={17} color={currentTheme.goldAccent} />
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
                <Ionicons name="close" size={18} color={currentTheme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* 1. Language Preference */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <Ionicons name="language-outline" size={15} color={currentTheme.goldAccent} />
                <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.language || 'Bahasa Teks'}</Text>
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
                  ]}
                  onPress={() => setLanguage('en')}
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
                    <Ionicons name="checkmark-circle" size={18} color={currentTheme.goldAccent} />
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
                  ]}
                  onPress={() => setLanguage('id')}
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
                    <Ionicons name="checkmark-circle" size={18} color={currentTheme.goldAccent} />
                  ) : (
                    <View style={[styles.radioUnchecked, { borderColor: currentTheme.textMuted }]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Font Size */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="text-outline" size={15} color={currentTheme.goldAccent} />
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.font_size || 'Ukuran Teks'}</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: currentTheme.badgeBg, borderColor: currentTheme.goldAccent + '40' }]}>
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
                <Ionicons name="color-palette-outline" size={15} color={currentTheme.goldAccent} />
                <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.theme || 'Tema Latar'}</Text>
              </View>
              <View style={styles.themeGridRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#0A0D10',
                      borderColor: theme === 'dark' ? currentTheme.goldAccent : 'rgba(255,255,255,0.1)',
                    },
                  ]}
                  onPress={() => {
                    setTheme('dark');
                    saveSettings(fontSize, 'dark', lineHeight);
                  }}
                >
                  <Ionicons name="moon" size={18} color="#d4a843" />
                  <Text style={[styles.themeCardText, { color: '#E2E8F0' }]}>Dark</Text>
                  {theme === 'dark' && <View style={[styles.themeCheckDot, { backgroundColor: currentTheme.goldAccent }]} />}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#FAFAFA',
                      borderColor: theme === 'light' ? currentTheme.goldAccent : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                  onPress={() => {
                    setTheme('light');
                    saveSettings(fontSize, 'light', lineHeight);
                  }}
                >
                  <Ionicons name="sunny" size={18} color="#D97706" />
                  <Text style={[styles.themeCardText, { color: '#0F172A' }]}>Light</Text>
                  {theme === 'light' && <View style={[styles.themeCheckDot, { backgroundColor: currentTheme.goldAccent }]} />}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: '#F5EFE6',
                      borderColor: theme === 'sepia' ? currentTheme.goldAccent : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                  onPress={() => {
                    setTheme('sepia');
                    saveSettings(fontSize, 'sepia', lineHeight);
                  }}
                >
                  <Ionicons name="book-outline" size={18} color="#854D0E" />
                  <Text style={[styles.themeCardText, { color: '#451A03' }]}>Sepia</Text>
                  {theme === 'sepia' && <View style={[styles.themeCheckDot, { backgroundColor: currentTheme.goldAccent }]} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Line Spacing */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="reorder-three-outline" size={17} color={currentTheme.goldAccent} />
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>{t.line_spacing || 'Jarak Baris'}</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: currentTheme.badgeBg, borderColor: currentTheme.goldAccent + '40' }]}>
                  <Text style={[styles.badgePillText, { color: currentTheme.goldAccent }]}>{lineHeight.toFixed(1)}x</Text>
                </View>
              </View>
              <View style={styles.lineSpacingRow}>
                {[1.4, 1.6, 1.8, 2.0, 2.2].map((val) => {
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
                            fontWeight: active ? '800' : '600',
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

            {/* Done / Close Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.doneBtn}
              onPress={() => setShowSettings(false)}
            >
              <LinearGradient
                colors={['#E5B84B', '#B88728']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.doneBtnGradient}
              >
                <Text style={styles.doneBtnText}>{t.close || 'Tutup & Simpan'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // LUXURY READING PREFERENCES MODAL STYLES
  // ══════════════════════════════════════════════════════════════
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalContent: {
    backgroundColor: '#12161A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.22)',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  modalHeaderIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(212,168,67,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A2026',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingSection: {
    marginBottom: 18,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 6,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(212,168,67,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.25)',
  },
  badgePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#d4a843',
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
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#161B20',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  langCardActive: {
    backgroundColor: '#1B222A',
    borderColor: '#d4a843',
  },
  langCardFlag: {
    fontSize: 20,
  },
  langCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  langCardTitleActive: {
    color: '#F8FAFC',
  },
  langCardSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  radioUnchecked: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#475569',
  },

  // Stepper & Slider
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 42,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#181E24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d4a843',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E242B',
    overflow: 'hidden',
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: '#d4a843',
    borderRadius: 3,
  },

  // Theme Cards
  themeGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeCard: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  themeCardText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  themeCheckDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4a843',
  },

  // Line Spacing Chips
  lineSpacingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lineSpacingChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#161B20',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineSpacingChipActive: {
    backgroundColor: '#1E252D',
    borderColor: '#d4a843',
  },
  lineSpacingChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  lineSpacingChipTextActive: {
    color: '#d4a843',
    fontWeight: '800',
  },

  // Done Button
  doneBtn: {
    marginTop: 6,
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#d4a843',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  doneBtnGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D1012',
    letterSpacing: 0.3,
  },
});

