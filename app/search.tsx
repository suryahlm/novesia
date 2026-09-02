import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GradientBackground } from '../components/GradientBackground';
import { ShimmerText } from '../components/ShimmerText';
import { PopularGridCard } from '../components/PopularGridCard';
import { SearchEmptyRing } from '../components/SearchEmptyRing';
import { SkeletonNovelGrid } from '../components/SkeletonLoader';
import NovelPreviewSheet from '../components/NovelPreviewSheet';
import { useTheme } from '../lib/ThemeProvider';
import { supabase } from '../lib/supabase';

const RECENT_SEARCHES_KEY = 'novesia_recent_searches';
const MAX_RECENT_SEARCHES = 8;
const COMIC_GRID_COLUMNS = 3;

function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((raw) => {
      if (raw) {
        try {
          setItems(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const add = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setItems((prev) => {
      const next = [
        trimmed,
        ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  return { items, add, clear };
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [previewNovel, setPreviewNovel] = useState<any | null>(null);

  const recent = useRecentSearches();

  const gridGap = 12;
  const gridItemWidth = Math.floor(
    (screenWidth - 16 * 2 - gridGap * (COMIC_GRID_COLUMNS - 1)) / COMIC_GRID_COLUMNS
  );

  const searchNovels = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: results, error } = await supabase
        .from('nu_novels')
        .select('id, title, nu_slug, cover_url, total_chapters, rating, genres, synopsis, author, status, total_views')
        .neq('status', 'draft')
        .ilike('title', `%${trimmed}%`)
        .order('total_chapters', { ascending: false })
        .limit(30);

      if (!error && results) {
        setData(results);
        recent.add(trimmed);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  // Debounce search 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim()) {
        searchNovels(query);
      } else {
        setData([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query, searchNovels]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (query.trim()) await searchNovels(query);
    setRefreshing(false);
  };

  const openNovel = useCallback(
    (slug: string) => {
      router.push(`/novel/${slug}` as any);
    },
    [router]
  );

  const showEmpty = query.trim().length > 0 && !loading && data.length === 0;
  const showPrompt = query.trim().length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <ShimmerText
            style={{ fontSize: 22, fontWeight: '900', letterSpacing: 0.5 }}
            baseColor={colors.primary}
            shineColor="rgba(255,250,230,0.95)"
          >
            Cari Novel
          </ShimmerText>
        </View>

        {/* Search Input Box */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 46,
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: focused ? colors.primary : colors.border,
            }}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Cari judul novel, author, atau genre…"
              placeholderTextColor={colors.textMuted}
              autoFocus
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 10,
                color: colors.textPrimary,
                fontSize: 13.5,
              }}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Content Area */}
        {showPrompt ? (
          <View style={{ flex: 1 }}>
            {/* Recent Searches Tags */}
            {recent.items.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.textPrimary }}>
                    Pencarian Terakhir
                  </Text>
                  <Pressable onPress={recent.clear} hitSlop={8}>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                      Hapus semua
                    </Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {recent.items.map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => setQuery(q)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                        {q}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Centered Rotating Motion Graphic Empty State (Locked dead-center like Komiku) */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
                gap: 16,
              }}
            >
              <SearchEmptyRing />
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
                  Cari Judul Novel
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    textAlign: 'center',
                    maxWidth: 260,
                    lineHeight: 17,
                  }}
                >
                  Masukkan kata kunci judul atau author untuk menemukan novel favoritmu.
                </Text>
              </View>
            </View>
          </View>

        ) : loading ? (
          <SkeletonNovelGrid
            count={12}
            cardWidth={gridItemWidth}
            cardHeight={Math.round(gridItemWidth * 1.3)}
            columnGap={gridGap}
            rowGap={12}
          />
        ) : showEmpty ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 }}>
            <Ionicons name="alert-circle-outline" size={42} color={colors.textMuted} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
              "{query}" tidak ditemukan
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              Coba gunakan kata kunci lain atau periksa ejaan judul.
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            numColumns={COMIC_GRID_COLUMNS}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 40,
              gap: 12,
            }}
            columnWrapperStyle={{ gap: gridGap }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <PopularGridCard
                novel={item}
                width={gridItemWidth}
                onPress={openNovel}
                onLongPress={() => setPreviewNovel(item)}
              />
            )}
          />
        )}
      </SafeAreaView>

      <NovelPreviewSheet
        visible={!!previewNovel}
        novel={previewNovel}
        onClose={() => setPreviewNovel(null)}
        onRead={(slug) => openNovel(slug)}
      />
    </View>
  );
}
