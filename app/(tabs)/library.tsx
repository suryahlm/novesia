import React, { useState, useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GradientBackground } from '../../components/GradientBackground';
import { ShimmerText } from '../../components/ShimmerText';
import { CoverImage } from '../../components/CoverImage';
import { useTheme } from '../../lib/ThemeProvider';
import { useLanguage } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';
import { getHistory, HistoryItem } from '../../lib/history';

const LIBRARY_KEY = 'novesia_library';

type LibraryTab = 'bookmarks' | 'history';

interface SavedNovel {
  id: string;
  title: string;
  nu_slug: string;
  cover_url: string | null;
  total_chapters: number;
  author: string | null;
  status: string | null;
  total_views?: number;
  rating?: number | null;
}

export default function LibraryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<LibraryTab>('bookmarks');
  const [bookmarks, setBookmarks] = useState<SavedNovel[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBookmarks(), loadHistory()]);
    setLoading(false);
  };

  const loadBookmarks = async () => {
    try {
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      const savedIds: string[] = lib ? JSON.parse(lib) : [];

      if (savedIds.length === 0) {
        setBookmarks([]);
        return;
      }

      const { data } = await supabase
        .from('nu_novels')
        .select('id, title, nu_slug, cover_url, total_chapters, author, status, rating, total_views')
        .eq('is_blacklisted', false)
        .not('status', 'in', '("draft","dropped","blacklisted")')
        .in('id', savedIds);

      const map = new Map((data || []).map((n) => [n.id, n]));
      const ordered = savedIds.map((id) => map.get(id)).filter(Boolean) as SavedNovel[];
      setBookmarks(ordered);
    } catch {
      setBookmarks([]);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await getHistory();
      setHistory(hist);
    } catch {
      setHistory([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const removeBookmark = async (novelId: string) => {
    try {
      const lib = await AsyncStorage.getItem(LIBRARY_KEY);
      let saved: string[] = lib ? JSON.parse(lib) : [];
      saved = saved.filter((id) => id !== novelId);
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(saved));
      setBookmarks((prev) => prev.filter((n) => n.id !== novelId));
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />
      {/* Ambient shimmer top-left */}
      <LinearGradient
        colors={[colors.primary + '2E', colors.primary + '0F', 'rgba(13,16,18,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Ambient shimmer bottom-right */}
      <LinearGradient
        colors={['rgba(13,16,18,0)', colors.primary + '0D', colors.primary + '1F']}
        locations={[0.5, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Title with Shimmer */}
        <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 }}>
          <ShimmerText
            style={{ fontSize: 24, fontWeight: '900', letterSpacing: 0.5 }}
            baseColor={colors.primary}
            shineColor="rgba(255,250,230,0.95)"
          >
            {t.tab_library}
          </ShimmerText>
        </View>

        {/* Tab Switcher (Bookmarks vs History) */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 16,
          }}
        >
          <Pressable
            onPress={() => setActiveTab('bookmarks')}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'bookmarks' }}
            style={{
              paddingVertical: 12,
              marginRight: 24,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'bookmarks' ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: activeTab === 'bookmarks' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'bookmarks' ? '700' : '500',
              }}
            >
              {t.bookmark} ({bookmarks.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('history')}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'history' }}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'history' ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: activeTab === 'history' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'history' ? '700' : '500',
              }}
            >
              {lang === 'en' ? 'History' : 'Riwayat'} ({history.length})
            </Text>
          </Pressable>
        </View>

        {/* Tab Contents */}
        {activeTab === 'bookmarks' ? (
          bookmarks.length === 0 && !loading ? (
            <ScrollView
              contentContainerStyle={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 32,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
            >
              <Ionicons name="bookmark-outline" size={48} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textPrimary,
                  fontWeight: '700',
                  marginTop: 12,
                  textAlign: 'center',
                }}
              >
                {lang === 'en' ? 'Your library is empty' : 'Library Anda masih kosong'}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 18,
                }}
              >
                {lang === 'en'
                  ? 'Save favorite novels via the bookmark icon to read them later.'
                  : 'Simpan novel favorit lewat ikon bookmark di halaman detail untuk membacanya kembali.'}
              </Text>
            </ScrollView>
          ) : (
            <FlatList
              data={bookmarks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 10 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/novel/${item.nu_slug}` as any)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                    borderRadius: 14,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  })}
                >
                  <View
                    style={{
                      width: 58,
                      height: 80,
                      borderRadius: 8,
                      overflow: 'hidden',
                      backgroundColor: colors.surfaceElevated,
                    }}
                  >
                    <CoverImage
                      uri={item.cover_url}
                      title={item.title}
                      width={58}
                      height={80}
                      borderRadius={8}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12, gap: 3 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 13.5,
                        fontWeight: '700',
                        color: colors.textPrimary,
                        lineHeight: 18,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {item.author || 'Author Unknown'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                        {item.total_chapters} Chapters
                      </Text>
                      {item.rating && (
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                          ⭐ {item.rating.toFixed(1)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => removeBookmark(item.id)}
                    hitSlop={8}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.primaryMuted,
                    }}
                  >
                    <Ionicons name="bookmark" size={18} color={colors.primary} />
                  </Pressable>
                </Pressable>
              )}
            />
          )
        ) : history.length === 0 && !loading ? (
          <ScrollView
            contentContainerStyle={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            <Ionicons name="time-outline" size={48} color={colors.textMuted} />
            <Text
              style={{
                fontSize: 16,
                color: colors.textPrimary,
                fontWeight: '700',
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {t.no_history}
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                color: colors.textMuted,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              {lang === 'en'
                ? 'Novels you read will appear here automatically.'
                : 'Novel yang Anda baca akan tercatat di sini secara otomatis.'}
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.novel_id + '_' + item.last_chapter_id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 10 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/read/${item.last_chapter_id}` as any)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                  borderRadius: 14,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <View
                  style={{
                    width: 58,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: colors.surfaceElevated,
                  }}
                >
                  <CoverImage
                    uri={item.cover}
                    title={item.title}
                    width={58}
                    height={80}
                    borderRadius={8}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12, gap: 3 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 13.5,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      lineHeight: 18,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.primary, fontWeight: '700' }}>
                    {lang === 'en' ? 'Last read: Ch ' : 'Terakhir baca: Ch '}
                    {item.last_chapter}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>
                    {new Date(item.timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
