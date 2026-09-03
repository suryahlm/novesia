import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '../../components/GradientBackground';
import { ShimmerText } from '../../components/ShimmerText';
import { useTheme } from '../../lib/ThemeProvider';
import { fetchForumCategories, ForumCategory } from '../../lib/forumService';

function CategoryCard({
  category,
  onPress,
}: {
  category: ForumCategory;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const iconName: any = category.icon || 'chatbubbles-outline';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={category.name}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 16,
        backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.primary + '33',
        }}
      >
        <Ionicons name={iconName} size={22} color={colors.primary} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
          {category.name}
        </Text>
        {category.description ? (
          <Text style={{ fontSize: 11.5, color: colors.textMuted }} numberOfLines={2}>
            {category.description}
          </Text>
        ) : null}
        <Text style={{ fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: '600' }}>
          {category.threadCount} diskusi
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ForumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    const data = await fetchForumCategories();
    setCategories(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
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
        {/* Header with Shimmer */}
        <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 }}>
          <ShimmerText
            style={{ fontSize: 24, fontWeight: '900', letterSpacing: 0.5 }}
            baseColor={colors.primary}
            shineColor="rgba(255,250,230,0.95)"
          >
            Forum Komunitas
          </ShimmerText>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            Ruang diskusi dan obrolan sesama pembaca novel Novesia
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
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
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 12 }}>
                  Belum ada kategori diskusi forum.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
