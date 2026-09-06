import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost } from '../../lib/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../lib/i18n';
import { formatViews, cleanChapterTitle } from '../../lib/utils';
import { CustomDialog } from '../../components/CustomDialog';
import { useTheme } from '../../lib/ThemeProvider';
import { trackBookmarkAdded } from '../../lib/gamification';

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
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { colors } = useTheme();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [lastReadChapterId, setLastReadChapterId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    tone?: 'gold' | 'danger' | 'success' | 'warning' | 'info';
  }>({ title: '', message: '' });

  useEffect(() => {
    fetchNovel();
  }, [slug]);

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
      } catch (e) {
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

  const toggleSave = async () => {
    if (!novel) return;
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
      });
      setDialogVisible(true);
    }
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

  const fetchNovel = async () => {
    try {
      const novelData = await apiGet<Novel>(`/api/novels/${slug}`);

      if (novelData && novelData.id) {
        setNovel(novelData);
        // Fetch chapters
        const chapterRes = await apiGet<{ chapters?: any[]; data?: any[] }>(
          `/api/chapters/${slug}`,
          { limit: 2000 }
        );
        const chapterData = chapterRes.chapters || chapterRes.data || (Array.isArray(chapterRes) ? chapterRes : []);
        setChapters(chapterData);
      }
    } catch (e) {
      console.error('fetchNovel error:', e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!novel) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>{t.novel_not_found}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← {t.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Cover + Overlay */}
      <View style={styles.heroContainer}>
        {novel.cover_url && (
          <Image 
            source={{ 
              uri: novel.cover_url,
              headers: { 'User-Agent': 'NovesiaApp/1.0' }
            }} 
            style={styles.heroBg} 
            blurRadius={20} 
          />
        )}
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
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
            <Text style={{ fontSize: 40 }}>📕</Text>
          </View>
        )}
        <View style={styles.heroInfo}>
          <Text style={styles.novelTitle}>{novel.title}</Text>
          <Text style={styles.novelAuthor}>{novel.author || 'Unknown Author'}</Text>
          <View style={styles.statRow}>
            {novel.rating && (
              <View style={[styles.statBadge, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '40' }]}>
                <Text style={[styles.statText, { color: colors.primary }]}>★ {typeof novel.rating === 'number' ? novel.rating.toFixed(1) : novel.rating}</Text>
              </View>
            )}
            <View style={[styles.statBadge, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '40' }]}>
              <Text style={[styles.statText, { color: colors.primary }]}>{novel.total_chapters} ch</Text>
            </View>
            {novel.year && (
              <View style={[styles.statBadge, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '40' }]}>
                <Text style={[styles.statText, { color: colors.primary }]}>{novel.year}</Text>
              </View>
            )}
            {novel.total_views !== undefined && (
              <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.statText, { color: '#e2e8f0' }]}>👁 {formatViews(novel.total_views)}</Text>
              </View>
            )}
              {(() => {
                const eff = (novel.status && novel.status !== 'draft') ? novel.status
                  : (['completed','complete','finished'].includes((novel.original_status||'').toLowerCase())) ? 'completed'
                  : (['ongoing','active'].includes((novel.original_status||'').toLowerCase())) ? 'active'
                  : null;
                if (!eff) return null;
                return (
                  <View style={{
                    backgroundColor: eff === 'active' ? 'rgba(34,197,94,0.7)' : 'rgba(96,165,250,0.7)',
                    borderColor: eff === 'active' ? '#22c55e' : '#60a5fa',
                    borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.5 }}>
                      {eff === 'active' ? 'Ongoing' : 'Complete'}
                    </Text>
                  </View>
                );
              })()}
              {/* Save to Library */}
              <TouchableOpacity
                style={[
                  styles.saveBadge,
                  isSaved && {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primary + '60',
                  },
                ]}
                onPress={toggleSave}
              >
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={14} color={isSaved ? colors.primary : '#94a3b8'} />
              </TouchableOpacity>
              {/* Share */}
              <TouchableOpacity style={styles.saveBadge} onPress={() => {
                Share.share({
                  message: `📖 ${novel.title}\n\nBaca di Novesia!`,
                });
              }}>
                <Ionicons name="share-social-outline" size={14} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {/* Genre inline in hero */}
            {(() => {
              const realGenres = (novel.genres || []).filter((g: string) => g.toLowerCase() !== 'general');
              if (realGenres.length === 0) return null;
              return (
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 18 }}>
                  {realGenres.join('  -  ')}
                </Text>
              );
            })()}
          </View>
        </View>
      </View>

      {/* Synopsis */}
      {(() => {
        const rawSynopsis = (lang === 'id' && novel.synopsis_translated) 
          ? novel.synopsis_translated 
          : novel.synopsis;
          
        if (!rawSynopsis) return null;

        // Clean synopsis: strip trailing genre/tag lines embedded in the text
        let cleaned = rawSynopsis.trim();
        // Split into lines and remove trailing short lines that look like tags
        const lines = cleaned.split('\n');
        let cutIdx = lines.length;
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (!line) { cutIdx = i; continue; }
          // Genre/tag lines are short (< 40 chars), often Title Case, no periods
          if (line.length < 40 && !line.includes('.') && !line.includes('!') && !line.includes('?') && /^[A-Z]/.test(line)) {
            cutIdx = i;
          } else {
            break;
          }
        }
        cleaned = lines.slice(0, cutIdx).join('\n').trim();
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.synopsis}</Text>
            <Text style={styles.synopsisText}>{cleaned}</Text>
          </View>
        );
      })()}

      {/* Chapter List */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>{t.chapter_list} ({chapters.length})</Text>
          {chapters.length > 0 && (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                if (lastReadChapterId) {
                  router.push(`/read/${lastReadChapterId}` as any);
                } else {
                  const firstWithContent = chapters.find(c => (c.word_count_original || 0) > 0);
                  if (firstWithContent) router.push(`/read/${firstWithContent.id}` as any);
                }
              }}
            >
              <Text style={styles.continueBtnText}>
                ▶ {t.continue_reading_btn} {lastReadChapter ? `Ch-${lastReadChapter}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {chapters.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>{t.no_chapters}</Text>
            <Text style={styles.emptyHint}>{t.translate_admin}</Text>
          </View>
        ) : (
          <>
            {/* Semua Chapter button */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.loadChapterBtn,
                  expandedGroups.size === Math.ceil(chapters.length / 20) && {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  if (expandedGroups.size === Math.ceil(chapters.length / 20)) {
                    setExpandedGroups(new Set());
                  } else {
                    const all = new Set<number>();
                    for (let i = 0; i < Math.ceil(chapters.length / 20); i++) all.add(i);
                    setExpandedGroups(all);
                  }
                }}
              >
                <Text
                  style={[
                    styles.loadChapterBtnText,
                    expandedGroups.size === Math.ceil(chapters.length / 20) && { color: colors.primary },
                  ]}
                >
                  {expandedGroups.size === Math.ceil(chapters.length / 20) ? t.close_all : t.all_chapters}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Accordion groups of 20 */}
            {Array.from({ length: Math.ceil(chapters.length / 20) }, (_, gi) => {
              const start = gi * 20;
              const end = Math.min(start + 20, chapters.length);
              const group = chapters.slice(start, end);
              const isOpen = expandedGroups.has(gi);
              const hasLastRead = lastReadChapter != null && lastReadChapter >= (start + 1) && lastReadChapter <= end;
              return (
                <View key={gi}>
                  <TouchableOpacity
                    style={[
                      styles.groupBtn,
                      isOpen && { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
                      hasLastRead && !isOpen && styles.groupBtnLastRead,
                    ]}
                    onPress={() => {
                      setExpandedGroups(prev => {
                        const next = new Set(prev);
                        if (next.has(gi)) next.delete(gi);
                        else next.add(gi);
                        return next;
                      });
                    }}
                  >
                    <Text style={[styles.groupBtnText, isOpen && { color: colors.primary }, hasLastRead && !isOpen && { color: '#22c55e' }]}>
                      Chapter {start + 1} - {end} {hasLastRead && !isOpen ? `(Ch-${lastReadChapter})` : ''} {isOpen ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  {isOpen && group.map((ch) => {
                    const hasContent = (ch.word_count_original || 0) > 0;
                    const wc = ch.word_count_translated || ch.word_count_original || 0;
                    const isLastRead = lastReadChapter === ch.chapter_number;
                    return (
                      <TouchableOpacity
                        key={ch.id}
                        style={[styles.chapterItem, !hasContent && styles.chapterPending, isLastRead && styles.chapterLastRead]}
                        onPress={() => hasContent ? router.push(`/read/${ch.id}` as any) : null}
                        activeOpacity={hasContent ? 0.7 : 1}
                      >
                        <View style={styles.chapterLeft}>
                          <View style={[styles.chapterDot, { backgroundColor: hasContent ? '#22c55e' : '#334155' }]} />
                          <Text style={[styles.chapterNum, { color: colors.primary }, !hasContent && { color: '#475569' }]}>#{ch.chapter_number}</Text>
                          <Text style={[styles.chapterTitle, !hasContent && { color: '#475569' }]} numberOfLines={1}>
                            {cleanChapterTitle(ch.chapter_title, ch.chapter_number)}
                          </Text>
                        </View>
                        {hasContent ? (
                          <Text style={styles.chapterWords}>{wc} words</Text>
                        ) : (
                          <Text style={styles.chapterStatusPending}>Pending</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}
      </View>

      <View style={{ height: 40 }} />

      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        tone={dialogConfig.tone}
        showCancel={false}
      />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#94a3b8', fontSize: 16 },
  backBtn: { marginTop: 16, padding: 12 },
  backBtnText: { fontSize: 14, fontWeight: '600' },

  heroContainer: { minHeight: 220, position: 'relative' },
  heroBg: { position: 'absolute', width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(10,10,15,0.75)' },
  heroContent: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, gap: 16 },
  coverImage: { width: 110, height: 160, borderRadius: 12, backgroundColor: '#1a1a2e' },
  noCover: { justifyContent: 'center', alignItems: 'center' },
  heroInfo: { flex: 1, justifyContent: 'center' },
  novelTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', lineHeight: 22 },
  novelAuthor: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' },
  statBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statText: { fontSize: 11.5, fontWeight: '700' },

  genreContainer: { paddingHorizontal: 20, paddingTop: 16 },
  genreParagraph: {
    fontSize: 13, color: '#94a3b8', lineHeight: 22,
  },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  continueBtn: {
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#22c55e',
  },
  continueBtnText: { fontSize: 11, fontWeight: '700', color: '#22c55e' },
  loadChapterBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#111118', borderWidth: 1, borderColor: '#1e1e2e',
  },
  loadChapterBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  groupBtn: {
    backgroundColor: '#111118', borderRadius: 10, padding: 12,
    marginBottom: 4, borderWidth: 1, borderColor: '#1e1e2e',
    alignItems: 'center',
  },
  groupBtnLastRead: { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: '#22c55e' },
  groupBtnText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  synopsisText: { fontSize: 14, color: '#94a3b8', lineHeight: 22 },

  emptyBox: {
    backgroundColor: '#111118',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  emptyHint: { fontSize: 12, color: '#475569', marginTop: 4 },

  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111118',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  chapterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  chapterDot: { width: 8, height: 8, borderRadius: 4 },
  chapterPending: { opacity: 0.5 },
  chapterNum: { fontSize: 12, fontWeight: '700', width: 30 },
  chapterTitle: { fontSize: 14, color: '#e2e8f0', flex: 1 },
  chapterWords: { fontSize: 11, color: '#64748b' },
  chapterStatusPending: { fontSize: 10, color: '#475569', fontWeight: '600' },
  chapterLastRead: { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: '#22c55e' },
});

