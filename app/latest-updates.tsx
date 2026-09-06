import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../lib/apiClient';
import { useLanguage } from '../lib/i18n';
import { formatViews } from '../lib/utils';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 0;

const GRID_PADDING = 12;
const GRID_GAP = 8;

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
  total_views?: number;
}

export default function LatestUpdatesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 30;

  useEffect(() => {
    fetchNovels(0, true);
  }, []);

  const fetchNovels = async (pageNum: number, reset: boolean = false) => {
    if (loading && !reset) return;
    setLoading(true);

    try {
      const res = await apiGet<{ novels?: any[]; data?: any[] }>('/api/novels/latest', {
        limit: PAGE_SIZE,
        page: pageNum + 1,
      });
      const data = (res.novels || res.data || (Array.isArray(res) ? res : [])) as Novel[];

      if (data) {
        const newItems = data;
        if (reset) {
          setNovels(newItems);
        } else {
          setNovels(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const uniqueNew = newItems.filter(n => !existingIds.has(n.id));
            return [...prev, ...uniqueNew];
          });
        }
        setHasMore(newItems.length === PAGE_SIZE);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNovels(nextPage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title}>{(t as any).latest_update || 'LATEST UPDATE'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && page === 0 ? (
        <ActivityIndicator size="large" color="#d4a843" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={novels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={15}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator size="small" color="#d4a843" style={{ marginVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>{t.no_novels_found}</Text> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/novel/${item.nu_slug}` as any)}
              activeOpacity={0.8}
            >
              {item.cover_url ? (
                <Image 
                  source={{ uri: item.cover_url, headers: { 'User-Agent': 'NovesiaApp/1.0' } }} 
                  style={styles.cover} 
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.cover, styles.noCover]}>
                  <Text style={styles.noCoverEmoji}>📕</Text>
                </View>
              )}
              
              <View style={styles.info}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                
                <View style={[styles.metaRow, { justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.cardChapters}>Update Ch {item.total_chapters}</Text>
                    {item.status && item.status !== 'draft' && (
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(96,165,250,0.12)' }
                      ]}>
                        <Text style={[styles.statusText,
                          { color: item.status === 'active' ? '#22c55e' : '#60a5fa' }
                        ]}>
                          {item.status === 'active' ? 'Ongoing' : 'Complete'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {item.total_views !== undefined && (
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', marginRight: 8 }}>
                      👁 {formatViews(item.total_views)}
                    </Text>
                  )}
                </View>
              </View>
              
              <Ionicons name="chevron-forward" size={18} color="#475569" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingTop: STATUSBAR_HEIGHT },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 20,
    backgroundColor: '#0a0a0f',
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#e2e8f0', letterSpacing: 0.5 },

  listContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111118', borderRadius: 14,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  cover: { width: 60, height: 85, borderRadius: 10, borderWidth: 1, borderColor: '#1e1e2e' },
  noCover: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  noCoverEmoji: { fontSize: 24 },
  info: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#e2e8f0', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  cardChapters: { fontSize: 12, color: '#d4a843', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#475569', marginTop: 40, fontSize: 14 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '800' },
});
