import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '../../components/GradientBackground';
import { ErrorState } from '../../components/ErrorState';
import { useTheme } from '../../lib/ThemeProvider';
import { useLanguage } from '../../lib/i18n';
import {
  fetchForumCategories,
  ForumCategory,
  getLocalizedCategory,
} from '../../lib/forumService';

function CategoryCard({
  category,
  onPress,
}: {
  category: ForumCategory;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const localized = getLocalizedCategory(category, lang);
  const iconName: any = category.icon || 'chatbubbles-outline';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={localized.name}
      style={({ pressed }) => [
        styles.categoryCard,
        {
          backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: colors.primaryMuted || colors.primary + '18',
            borderColor: colors.primary + '30',
          },
        ]}
      >
        <Ionicons name={iconName} size={20} color={colors.primary} />
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text
            style={[styles.categoryTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {localized.name}
          </Text>
          <View
            style={[
              styles.countPill,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={10} color={colors.primary} />
            <Text style={[styles.countPillText, { color: colors.textPrimary }]}>
              {category.threadCount} {lang === 'en' ? 'topics' : 'topik'}
            </Text>
          </View>
        </View>

        {localized.description ? (
          <Text
            style={[styles.categoryDescription, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {localized.description}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.chevronBadge,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        ]}
      >
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function CategorySkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.categoryCard,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.6 },
      ]}
    >
      <View
        style={[styles.iconBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <View
          style={{ width: '45%', height: 13, borderRadius: 4, backgroundColor: colors.surfaceElevated }}
        />
        <View
          style={{ width: '80%', height: 10, borderRadius: 3, backgroundColor: colors.surfaceElevated }}
        />
      </View>
    </View>
  );
}

export default function ForumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lang, t } = useLanguage();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategories(true);
    }, [])
  );

  const loadCategories = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
      setIsError(false);
    }
    try {
      const data = await fetchForumCategories();
      setCategories(data);
      setIsError(false);
    } catch (e) {
      if (categories.length === 0) {
        setIsError(true);
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories(false);
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground />

      {/* Subtle ambient lighting */}
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '06', 'rgba(13,16,18,0)']}
        locations={[0, 0.3, 0.6]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {lang === 'en' ? 'Community Forum' : 'Forum Komunitas'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {lang === 'en'
                  ? 'Connect, discuss, and share theories with readers'
                  : 'Ruang obrolan, rekomendasi & diskusi pembaca'}
              </Text>
            </View>

            {categories.length > 0 && (
              <View
                style={[
                  styles.categoryCounterPill,
                  {
                    backgroundColor: colors.primaryMuted || colors.primary + '18',
                    borderColor: colors.primary + '35',
                  },
                ]}
              >
                <Ionicons name="chatbubbles" size={12} color={colors.primary} />
                <Text style={[styles.categoryCounterText, { color: colors.primary }]}>
                  {categories.length} {lang === 'en' ? 'Rooms' : 'Ruang'}
                </Text>
              </View>
            )}
          </View>

          {/* Minimalist Community Welcome Banner */}
          <View
            style={[
              styles.communityBanner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.communityBannerIcon,
                { backgroundColor: colors.primaryMuted || colors.primary + '20' },
              ]}
            >
              <Ionicons name="sparkles" size={13} color={colors.primary} />
            </View>
            <Text style={[styles.communityBannerText, { color: colors.textSecondary }]}>
              {lang === 'en'
                ? 'Be respectful, avoid spoilers without warnings, and enjoy friendly discussions!'
                : 'Jaga kesopanan, beri peringatan spoiler, dan nikmati diskusi santai sesama pembaca!'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.listContainer}>
            {Array.from({ length: 5 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </View>
        ) : isError && categories.length === 0 ? (
          <ErrorState
            title={lang === 'en' ? 'Failed to Load Forum' : 'Gagal Memuat Forum'}
            message={
              lang === 'en'
                ? 'Network issue or slow connection. Please check your internet and try again.'
                : 'Koneksi internet lambat atau bermasalah. Silakan periksa jaringan dan coba lagi.'
            }
            onRetry={() => loadCategories(true)}
          />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <CategoryCard
                category={item}
                onPress={() => router.push(`/forum/${item.slug}` as any)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconBadge,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {lang === 'en' ? 'No Forum Rooms' : 'Belum Ada Ruang Diskusi'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {lang === 'en'
                    ? 'Community discussion rooms will appear here soon.'
                    : 'Kategori diskusi komunitas akan segera hadir.'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '400',
  },
  categoryCounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  categoryCounterText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Community Banner
  communityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  communityBannerIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityBannerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },

  // Category Card
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  chevronBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
