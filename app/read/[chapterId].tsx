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
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHistory } from '../../lib/history';
import { useLanguage } from '../../lib/i18n';
import { useInterstitialAd } from '../../lib/useInterstitialAd';

type ThemeMode = 'dark' | 'light' | 'sepia';
type Language = 'en' | 'id';

const THEMES: Record<ThemeMode, { bg: string; text: string; label: string }> = {
  dark: { bg: '#0a0a0f', text: '#d4d4d8', label: '🌙' },
  light: { bg: '#fafafa', text: '#1a1a2e', label: '☀️' },
  sepia: { bg: '#f5f0e8', text: '#3d3225', label: '📜' },
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
        .select('title, cover_url')
        .eq('id', data.novel_id)
        .single();
      
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
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#94a3b8', fontSize: 15 }}>{t.chapter_not_found}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#7c3aed', fontWeight: '600' }}>← {t.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: currentTheme.bg, borderBottomColor: theme === 'dark' ? '#1e1e2e' : '#e2e8f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn}>
          <Text style={[styles.topBtnText, { color: currentTheme.text }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={[styles.topTitle, { color: currentTheme.text }]} numberOfLines={1}>
            {novelTitle}
          </Text>
          <Text style={styles.topChapter}>Chapter {chapter.chapter_number}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setLanguage(language === 'en' ? 'id' : 'en')}
          style={styles.langToggle}
        >
          <Text style={styles.langFlag}>{language === 'en' ? '🇬🇧' : '🇮🇩'}</Text>
        </TouchableOpacity>
        {/* Font Size Controls */}
        <TouchableOpacity
          onPress={() => { const v = Math.max(12, fontSize - 1); setFontSize(v); saveSettings(v, theme, lineHeight); }}
          style={styles.topSizeBtn}
        >
          <Text style={styles.topSizeBtnText}>A-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { const v = Math.min(28, fontSize + 1); setFontSize(v); saveSettings(v, theme, lineHeight); }}
          style={styles.topSizeBtn}
        >
          <Text style={styles.topSizeBtnText}>A+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.topBtn}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Reading Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${readProgress}%`, backgroundColor: theme === 'dark' ? '#d4a843' : '#7c3aed' }]} />
      </View>

      {/* Language Info Banner */}
      {language === 'id' && !hasTranslation && (
        <View style={styles.langBanner}>
          <Text style={styles.langBannerText}>
            🇮🇩 {language === 'id' ? 'Terjemahan tidak tersedia - menampilkan versi Inggris' : 'Translation not available — showing English'}
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
                  style={styles.navBtn}
                  onPress={() => navigateChapter(prevChapter.id)}
                >
                  <Text style={styles.navBtnText}>← Ch {prevChapter.chapter_number}</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              {nextChapter ? (
                <TouchableOpacity
                  style={[styles.navBtn, styles.navBtnPrimary]}
                  onPress={() => navigateChapter(nextChapter.id)}
                >
                  <Text style={[styles.navBtnText, styles.navBtnPrimaryText]}>
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

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111118' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#e2e8f0' : '#1a1a2e' }]}>
              ⚙️ {t.reading_preferences}
            </Text>

            {/* Language */}
            <Text style={[styles.settingLabel, { color: theme === 'dark' ? '#94a3b8' : '#64748b' }]}>
              {t.language}
            </Text>
            <View style={styles.settingRow}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={styles.langBtnText}>🇬🇧 English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'id' && styles.langBtnActive]}
                onPress={() => setLanguage('id')}
              >
                <Text style={styles.langBtnText}>🇮🇩 Indonesia</Text>
              </TouchableOpacity>
            </View>

            {/* Font Size */}
            <Text style={[styles.settingLabel, { color: theme === 'dark' ? '#94a3b8' : '#64748b' }]}>
              {t.font_size}: {fontSize}px
            </Text>
            <View style={styles.settingRow}>
              <TouchableOpacity
                style={styles.settingBtn}
                onPress={() => { const v = Math.max(12, fontSize - 1); setFontSize(v); saveSettings(v, theme, lineHeight); }}
              >
                <Text style={styles.settingBtnText}>A-</Text>
              </TouchableOpacity>
              <View style={styles.settingSlider}>
                <View style={[styles.settingSliderFill, { width: `${((fontSize - 12) / 16) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.settingBtn}
                onPress={() => { const v = Math.min(28, fontSize + 1); setFontSize(v); saveSettings(v, theme, lineHeight); }}
              >
                <Text style={styles.settingBtnText}>A+</Text>
              </TouchableOpacity>
            </View>

            {/* Theme */}
            <Text style={[styles.settingLabel, { color: theme === 'dark' ? '#94a3b8' : '#64748b' }]}>
              {t.theme}
            </Text>
            <View style={styles.settingRow}>
              {(Object.keys(THEMES) as ThemeMode[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeBtn,
                    { backgroundColor: THEMES[t].bg, borderColor: theme === t ? '#7c3aed' : '#333' },
                  ]}
                  onPress={() => { setTheme(t); saveSettings(fontSize, t, lineHeight); }}
                >
                  <Text style={{ fontSize: 18 }}>{THEMES[t].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Line Height */}
            <Text style={[styles.settingLabel, { color: theme === 'dark' ? '#94a3b8' : '#64748b' }]}>
              {t.line_spacing}: {lineHeight.toFixed(1)}
            </Text>
            <View style={styles.settingRow}>
              <TouchableOpacity
                style={styles.settingBtn}
                onPress={() => { const v = Math.max(1.2, lineHeight - 0.2); setLineHeight(v); saveSettings(fontSize, theme, v); }}
              >
                <Text style={styles.settingBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingBtn}
                onPress={() => { const v = Math.min(2.6, lineHeight + 0.2); setLineHeight(v); saveSettings(fontSize, theme, v); }}
              >
                <Text style={styles.settingBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Close */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeBtnText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBtn: { padding: 8, width: 40, alignItems: 'center' },
  topBtnText: { fontSize: 20, fontWeight: '700' },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 14, fontWeight: '600' },
  topChapter: { fontSize: 11, color: '#7c3aed', marginTop: 2, fontWeight: '600' },

  // Language toggle in top bar
  langToggle: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.15)',
    marginRight: 4,
  },
  langFlag: { fontSize: 18 },

  // Font size +/- in top bar
  topSizeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.15)',
    marginRight: 2,
  },
  topSizeBtnText: { fontSize: 13, fontWeight: '800', color: '#a78bfa' },

  // Language info banner
  langBanner: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.2)',
  },
  langBannerText: { fontSize: 12, color: '#a78bfa', textAlign: 'center' },

  // No content state
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noContentIcon: { fontSize: 48, marginBottom: 16 },
  noContentText: { fontSize: 16, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  noContentHint: { fontSize: 13, color: '#475569', marginTop: 8, textAlign: 'center' },
  noContentBtn: { marginTop: 24, padding: 12 },
  noContentBtnText: { color: '#7c3aed', fontWeight: '700', fontSize: 14 },

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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  navBtnPrimary: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  navBtnText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  navBtnPrimaryText: { color: '#fff' },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingBtnText: { fontSize: 16, fontWeight: '700', color: '#a78bfa' },
  settingSlider: {
    flex: 1,
    height: 6,
    backgroundColor: '#1e1e2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  settingSliderFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 3 },

  // Language buttons in settings
  langBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,46,0.5)',
  },
  langBtnActive: { borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.15)' },
  langBtnText: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },

  themeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

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
});
