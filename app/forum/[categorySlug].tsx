import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '../../components/GradientBackground';
import { ShimmerText } from '../../components/ShimmerText';
import { GoldSurface } from '../../components/GoldSurface';
import { CustomDialog } from '../../components/CustomDialog';
import { useTheme } from '../../lib/ThemeProvider';
import {
  fetchCategoryThreads,
  createForumThread,
  ForumCategory,
  ForumThread,
} from '../../lib/forumService';
import { useAuthStore } from '../../lib/useAuthStore';

function ThreadCard({ thread, onPress }: { thread: ForumThread; onPress: () => void }) {
  const { colors } = useTheme();
  const isVip = thread.user_role === 'VIP';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 14,
        backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 10,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isVip ? colors.primaryMuted : colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isVip ? colors.primary : colors.border,
          }}
        >
          <Ionicons name="person" size={14} color={isVip ? colors.primary : colors.textMuted} />
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>
          {thread.user_name}
        </Text>

        {isVip && (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: colors.primaryMuted,
              borderWidth: 1,
              borderColor: colors.primary + '44',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.primary }}>VIP</Text>
          </View>
        )}

        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          {new Date(thread.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>

      <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>
        {thread.title}
      </Text>

      <Text style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={2}>
        {thread.content}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            {thread.post_count} balasan
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            {thread.view_count} dilihat
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function CategoryThreadsScreen() {
  const { categorySlug } = useLocalSearchParams<{ categorySlug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Thread Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMsg, setDialogMsg] = useState({ title: '', message: '' });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [categorySlug])
  );

  const loadData = async () => {
    if (!categorySlug) return;
    const res = await fetchCategoryThreads(categorySlug);
    setCategory(res.category);
    setThreads(res.threads);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setDialogMsg({
        title: 'Form Belum Lengkap',
        message: 'Mohon isi judul dan isi diskusi sebelum menerbitkan thread.',
      });
      setDialogVisible(true);
      return;
    }

    if (!category) return;
    setSubmitting(true);

    const authUser = useAuthStore.getState().user;
    const userName = authUser?.name || authUser?.email?.split('@')[0] || 'Pembaca Novesia';

    const created = await createForumThread({
      category_id: category.id,
      title: newTitle,
      content: newContent,
      user_name: userName,
      user_id: authUser?.id || null,
      user_role: (authUser?.role as 'USER' | 'VIP' | 'ADMIN') || 'USER',
    });

    setSubmitting(false);

    if (created) {
      setModalVisible(false);
      setNewTitle('');
      setNewContent('');
      await loadData();
    } else {
      setDialogMsg({
        title: 'Gagal Membuat Thread',
        message: 'Terjadi kesalahan saat menerbitkan diskusi baru. Silakan coba lagi.',
      });
      setDialogVisible(true);
    }
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
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}
              numberOfLines={1}
            >
              {category?.name || 'Diskusi Forum'}
            </Text>
            {category?.description ? (
              <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
                {category.description}
              </Text>
            ) : null}
          </View>

          {/* Top Header Compose Button (Komiku Pattern) */}
          <Pressable onPress={() => setModalVisible(true)} hitSlop={8}>
            <GoldSurface
              shimmer
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={20} color={colors.textOnPrimary} />
            </GoldSurface>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingTop: 14, paddingBottom: Math.max(20, insets.bottom + 20) }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <ThreadCard
                thread={item}
                onPress={() => router.push(`/forum/thread/${item.id}` as any)}
              />
            )}
            ListEmptyComponent={
              <View style={{ paddingVertical: 60, alignItems: 'center', paddingHorizontal: 24 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="chatbubbles-outline" size={26} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>
                  Belum Ada Diskusi
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  Jadilah orang pertama yang memulai topik obrolan di kategori ini!
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>


      {/* New Thread Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              maxHeight: '90%',
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                Buat Diskusi Baru
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Input Judul */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
              Judul Topik
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.textPrimary,
                marginBottom: 14,
              }}
              placeholder="Mis: Teori plot chapter terbaru..."
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {/* Input Isi */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
              Isi Diskusi
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.textPrimary,
                height: 120,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
              placeholder="Tuliskan pendapat atau topik obrolan Anda..."
              placeholderTextColor={colors.textMuted}
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />

            {/* Submit Button */}
            <Pressable
              onPress={handleCreateThread}
              disabled={submitting}
              style={{ borderRadius: 14, overflow: 'hidden' }}
            >
              <GoldSurface
                shimmer
                style={{
                  paddingVertical: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textOnPrimary }}>
                    Terbitkan Diskusi
                  </Text>
                )}
              </GoldSurface>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Dialog */}
      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogMsg.title}
        message={dialogMsg.message}
        tone="warning"
        showCancel={false}
      />
    </View>
  );
}
