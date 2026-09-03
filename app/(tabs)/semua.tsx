import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/i18n';
import { SkeletonGrid2Col } from '../../components/SkeletonLoader';
import NovelPreviewSheet from '../../components/NovelPreviewSheet';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 0;

const GOLD = '#d4a843';
const DARK_BG = '#0a0a0f';
const CARD_BG = '#111118';
const BORDER = '#1a1a2e';
const TEXT_PRIMARY = '#e2e8f0';
const TEXT_DIM = '#64748b';
const GREEN = '#22c55e';
const GREEN_BG = 'rgba(34,197,94,0.12)';
const GOLD_DIM = 'rgba(212,168,67,0.15)';

const GRID_PADDING = 16;
const GRID_GAP = 10;
const GRID_KEY = 'novesia_grid_columns';

// Calculate card width dynamically (using Math.floor to fix subpixel rounding overflow on Samsung/certain Android devices)
const getCardWidth = (cols: number) =>
  Math.floor((width - GRID_PADDING * 2 - GRID_GAP * (cols - 1)) / cols);

interface Novel {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  total_chapters: number;
  rating: number | null;
  genres: string[];
  author: string | null;
  status: string | null;
}

const ITEMS_PER_PAGE = 36;

export default function SemuaScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [numColumns, setNumColumns] = useState(3);
  const [previewNovel, setPreviewNovel] = useState<Novel | null>(null);

  useEffect(() => {
    fetchAll();
    loadGridPreference();
  }, []);

  const loadGridPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(GRID_KEY);
      if (saved) setNumColumns(parseInt(saved, 10));
    } catch {}
  };

  const toggleGrid = async () => {
    const next = numColumns === 3 ? 2 : 3;
    setNumColumns(next);
    try { await AsyncStorage.setItem(GRID_KEY, String(next)); } catch {}
  };

  const fetchAll = async () => {
    try {
      const { data } = await supabase
        .from('nu_novels')
        .select('id, title, nu_slug, cover_url, total_chapters, rating, genres, author, status')
        .eq('is_blacklisted', false)
        .not('status', 'in', '("draft","dropped","blacklisted")')
        .order('title', { ascending: true });
      setNovels(data || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 150;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && visibleCount < filtered.length && !loading) {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.all}</Text>
        </View>
        <SkeletonGrid2Col count={8} />
      </View>
    );
  }

  const getEffectiveStatus = (n: Novel): string => {
    if (n.status === 'active') return 'active';
    if (n.status === 'completed') return 'completed';
    if (n.status === 'draft') return 'coming_soon';
    return 'active';
  };

  const filtered = statusFilter
    ? novels.filter((n) => getEffectiveStatus(n) === statusFilter)
    : novels;

  const cardWidth = getCardWidth(numColumns);
  const is2Col = numColumns === 2;

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t.all}</Text>
          <Text style={styles.count}>{filtered.length} {t.novels_count}</Text>
        </View>

        {/* Filter chips + Grid toggle */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'active' && styles.filterActive]}
            onPress={() => { setStatusFilter(statusFilter === 'active' ? null : 'active'); setVisibleCount(ITEMS_PER_PAGE); }}
          >
            <Text style={[styles.filterText, statusFilter === 'active' && styles.filterTextActive]}>{t.ongoing}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, { marginLeft: 8 }, statusFilter === 'completed' && styles.filterActiveBlue]}
            onPress={() => { setStatusFilter(statusFilter === 'completed' ? null : 'completed'); setVisibleCount(ITEMS_PER_PAGE); }}
          >
            <Text style={[styles.filterText, statusFilter === 'completed' && styles.filterTextActiveBlue]}>{t.completed}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, { marginLeft: 8 }, statusFilter === 'coming_soon' && styles.filterActiveOrange]}
            onPress={() => { setStatusFilter(statusFilter === 'coming_soon' ? null : 'coming_soon'); setVisibleCount(ITEMS_PER_PAGE); }}
          >
            <Text style={[styles.filterText, statusFilter === 'coming_soon' && styles.filterTextActiveOrange]}>{t.coming_soon}</Text>
          </TouchableOpacity>

          {/* Grid toggle button */}
          <TouchableOpacity
            style={styles.gridToggle}
            onPress={toggleGrid}
            activeOpacity={0.7}
          >
            <Ionicons name={is2Col ? 'grid-outline' : 'grid'} size={18} color={GOLD} />
          </TouchableOpacity>
        </View>

        <View style={[styles.grid, { paddingHorizontal: GRID_PADDING }]}>
          {filtered.slice(0, visibleCount).map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                { width: cardWidth, marginBottom: is2Col ? 16 : GRID_GAP },
                (index % numColumns !== numColumns - 1) && { marginRight: GRID_GAP },
              ]}
              onPress={() => router.push(`/novel/${item.nu_slug}` as any)}
              onLongPress={() => setPreviewNovel(item)}
              delayLongPress={240}
              activeOpacity={0.85}
            >
              {item.cover_url ? (
                <Image
                  source={{ uri: item.cover_url, headers: { 'User-Agent': 'NovesiaApp/1.0' } }}
                  style={[styles.cover, { borderRadius: is2Col ? 12 : 10 }]}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.cover, { backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', borderRadius: is2Col ? 12 : 10 }]}>
                  <Text style={{ fontSize: is2Col ? 32 : 24 }}>📕</Text>
                </View>
              )}
              {(() => {
                const eff = getEffectiveStatus(item);
                if (!eff) return null;
                return (
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: eff === 'active' ? 'rgba(34,197,94,0.7)' : 
                                      eff === 'coming_soon' ? 'rgba(251,146,60,0.7)' : 'rgba(96,165,250,0.7)',
                      borderColor: eff === 'active' ? GREEN : 
                                   eff === 'coming_soon' ? '#fb923c' : '#60a5fa',
                      top: is2Col ? 8 : 6,
                      left: is2Col ? 8 : 6,
                      paddingHorizontal: is2Col ? 8 : 7,
                      paddingVertical: is2Col ? 4 : 3,
                    }
                  ]}>
                    <Text style={[styles.statusText, { color: '#fff', fontSize: is2Col ? 10 : 9 }]}>
                      {eff === 'active' ? 'Ongoing' : eff === 'coming_soon' ? 'Soon' : 'Complete'}
                    </Text>
                  </View>
                );
              })()}
              <Text style={[styles.cardTitle, { fontSize: is2Col ? 13 : 11, marginTop: is2Col ? 8 : 6, lineHeight: is2Col ? 17 : 14 }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.cardMeta, { fontSize: is2Col ? 11 : 9, marginTop: is2Col ? 3 : 2 }]}>
                {item.total_chapters} ch
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {visibleCount < filtered.length && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={GOLD} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Sheet Preview */}
      <NovelPreviewSheet
        visible={!!previewNovel}
        novel={previewNovel}
        onClose={() => setPreviewNovel(null)}
        onRead={(slug) => router.push(`/novel/${slug}` as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG, paddingTop: STATUSBAR_HEIGHT + 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK_BG },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: TEXT_PRIMARY },
  count: { fontSize: 13, fontWeight: '600', color: GOLD },
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER,
  },
  filterActive: { backgroundColor: GREEN_BG, borderColor: GREEN },
  filterActiveBlue: { backgroundColor: 'rgba(96,165,250,0.12)', borderColor: '#60a5fa' },
  filterText: { fontSize: 12, fontWeight: '600', color: TEXT_DIM },
  filterTextActive: { color: GREEN },
  filterTextActiveBlue: { color: '#60a5fa' },
  filterActiveOrange: { backgroundColor: 'rgba(251,146,60,0.12)', borderColor: '#fb923c' },
  filterTextActiveOrange: { color: '#fb923c' },
  gridToggle: {
    marginLeft: 'auto',
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: GOLD_DIM, borderWidth: 1, borderColor: GOLD,
    justifyContent: 'center', alignItems: 'center',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  cover: {
    width: '100%', aspectRatio: 0.68,
    borderWidth: 1, borderColor: BORDER,
  },
  statusBadge: {
    position: 'absolute',
    borderRadius: 6, borderWidth: 1,
  },
  statusText: { fontWeight: '900', letterSpacing: 0.5 },
  cardTitle: { fontWeight: '700', color: TEXT_PRIMARY },
  cardMeta: { color: TEXT_DIM },
  loadMoreBtn: {
    marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center',
  },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: GOLD },
});
