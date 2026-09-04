import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Share,
} from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/ThemeProvider';
import { trackBookmarkAdded } from '../lib/gamification';

const LIBRARY_KEY = 'novesia_library';

const { width, height } = Dimensions.get('window');

interface Novel {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  total_chapters: number;
  rating: number | null;
  genres?: string[];
  author?: string | null;
  status?: string | null;
  synopsis?: string | null;
  total_views?: number;
}

interface Props {
  visible: boolean;
  novel: Novel | null;
  onClose: () => void;
  onRead: (slug: string) => void;
  onAddToLibrary?: (id: string) => void;
}

export default function NovelPreviewSheet({ visible, novel, onClose, onRead, onAddToLibrary }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [synopsis, setSynopsis] = useState<string | null>(null);
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (visible && novel) {
      if (novel.synopsis) {
        setSynopsis(novel.synopsis);
      } else {
        fetchSynopsis(novel.id);
      }
      checkLibraryStatus(novel.id);
    } else {
      setSynopsis(null);
      setIsSaved(false);
    }
  }, [visible, novel?.id]);

  const checkLibraryStatus = async (novelId: string) => {
    try {
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      if (lib) {
        const saved: string[] = JSON.parse(lib);
        setIsSaved(saved.includes(novelId));
      }
    } catch {}
  };

  const toggleSave = async () => {
    if (!novel) return;
    try {
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      let saved: string[] = lib ? JSON.parse(lib) : [];
      if (saved.includes(novel.id)) {
        saved = saved.filter(id => id !== novel.id);
        setIsSaved(false);
      } else {
        saved.unshift(novel.id);
        setIsSaved(true);
        trackBookmarkAdded(novel.id);
      }
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(saved));
    } catch {
      console.log('Error saving to library');
    }
  };

  const fetchSynopsis = async (novelId: string) => {
    setLoadingSynopsis(true);
    try {
      const { data } = await supabase
        .from('nu_novels')
        .select('synopsis')
        .eq('id', novelId)
        .single();
      setSynopsis(data?.synopsis || null);
    } catch {}
    setLoadingSynopsis(false);
  };

  const shareNovel = async () => {
    if (!novel) return;
    try {
      await Share.share({
        message: `Check out "${novel.title}" on Novesia App!\n\nRead here: novesiaapp://novel/${novel.nu_slug}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  if (!novel) return null;

  const statusColor = novel.status === 'active' ? '#22c55e' : '#60a5fa';
  const statusLabel = novel.status === 'active' ? 'Ongoing' : 'Completed';
  const statusIcon = novel.status === 'active' ? 'time-outline' : 'checkmark-circle-outline';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      {...{ navigationBarTranslucent: true }}
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <View style={styles.overlay}>
        {/* Tap-to-dismiss */}
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 28 }]}>
          {/* Top accent line */}
          <LinearGradient
            colors={['transparent', colors.primary, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topAccent}
          />

          {/* Drag Handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.primary + '50' }]} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Cover + Info Row */}
          <View style={styles.topRow}>
            {/* Cover with glow */}
            <View style={styles.coverWrapper}>
              {novel.cover_url ? (
                <Image
                  source={{ uri: novel.cover_url, headers: { 'User-Agent': 'NovesiaApp/1.0' } }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.cover, styles.noCover]}>
                  <Text style={{ fontSize: 40 }}>📕</Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.info}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { onClose(); onRead(novel.nu_slug); }}>
                <Text style={styles.title} numberOfLines={2}>{novel.title}</Text>
              </TouchableOpacity>
              {novel.author && (
                <View style={styles.authorRow}>
                  <Ionicons name="person-outline" size={12} color="#64748b" />
                  <Text style={styles.author} numberOfLines={1}>{novel.author}</Text>
                </View>
              )}

              {/* Meta chips */}
              <View style={styles.metaRow}>
                <View style={[styles.statusChip, { borderColor: statusColor }]}>
                  <Ionicons name={statusIcon as any} size={10} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="book-outline" size={10} color="#94a3b8" />
                  <Text style={styles.metaText}>{novel.total_chapters}</Text>
                </View>
                {novel.rating && novel.rating > 0 && (
                  <View style={[styles.metaChip, styles.ratingChip, { borderColor: colors.primary + '40', backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="star" size={10} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.primary }]}>{novel.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>

              {/* Genres */}
              {novel.genres && novel.genres.length > 0 && (
                <View style={styles.genreRow}>
                  {novel.genres.slice(0, 3).map((g, i) => (
                    <View key={i} style={[styles.genreChip, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '30' }]}>
                      <Text style={[styles.genreText, { color: colors.primary }]}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Extra Action Icons (Save & Share) */}
              <View style={styles.extraActionRow}>
                <TouchableOpacity
                  style={[
                    styles.smallIconBtn,
                    isSaved && { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
                  ]}
                  onPress={toggleSave}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? colors.primary : "#94a3b8"} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallIconBtn}
                  onPress={shareNovel}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social-outline" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Divider */}
          <LinearGradient
            colors={['transparent', colors.primary + '30', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          {/* Synopsis */}
          <View style={styles.synopsisContainer}>
            <View style={styles.synopsisHeader}>
              <Ionicons name="document-text-outline" size={14} color={colors.primary} />
              <Text style={[styles.synopsisLabel, { color: colors.primary }]}>Synopsis</Text>
            </View>
            {loadingSynopsis ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
            ) : synopsis ? (
              <ScrollView
                style={styles.synopsisScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={false}
                indicatorStyle="white"
              >
                <Text style={styles.synopsis}>{synopsis}</Text>
                <View style={{ height: 12 }} />
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="reader-outline" size={24} color="#1e1e2e" />
                <Text style={styles.synopsisEmpty}>No synopsis available</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.readBtn}
              onPress={() => { onClose(); onRead(novel.nu_slug); }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.gradientLight, colors.gradientDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.readBtnGradient}
              >
                <Ionicons name="book" size={18} color="#0a0a0f" />
                <Text style={styles.readBtnText}>Read Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#0d0d14',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 0,
    maxHeight: height * 0.85,
    minHeight: height * 0.65,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.12)',
    borderBottomWidth: 0,
    // Glow effect
    shadowColor: '#d4a843',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 25,
  },
  topAccent: {
    height: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginHorizontal: -24,
    marginBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212,168,67,0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
  },
  coverWrapper: {
    position: 'relative',
  },
  cover: {
    width: 115,
    height: 168,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.15)',
  },
  noCover: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 18,
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#f1f5f9',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  author: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ratingChip: {
    backgroundColor: 'rgba(212,168,67,0.1)',
    borderColor: 'rgba(212,168,67,0.2)',
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  genreChip: {
    backgroundColor: 'rgba(212,168,67,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.12)',
  },
  genreText: {
    fontSize: 10,
    color: '#d4a843',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  extraActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  smallIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginTop: 22,
    marginBottom: 0,
    marginHorizontal: -24,
  },
  synopsisContainer: {
    marginTop: 16,
    flex: 1,
  },
  synopsisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  synopsisLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.3,
  },
  synopsisScroll: {
    flex: 1,
    maxHeight: height * 0.35,
  },
  synopsis: {
    fontSize: 13.5,
    color: '#8896ab',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  synopsisEmpty: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  readBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    // Button shadow
    shadowColor: '#d4a843',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  readBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  readBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a0f',
    letterSpacing: 0.3,
  },
  libraryBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(212,168,67,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,168,67,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
