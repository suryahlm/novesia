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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '../../components/GradientBackground';
import { ShimmerText } from '../../components/ShimmerText';
import { GoldSurface } from '../../components/GoldSurface';
import { CustomDialog } from '../../components/CustomDialog';
import { AuthModal } from '../../components/AuthModal';
import { ErrorState } from '../../components/ErrorState';
import { useTheme } from '../../lib/ThemeProvider';
import { useLanguage } from '../../lib/i18n';
import {
  fetchCategoryThreads,
  createForumThread,
  ForumCategory,
  ForumThread,
  getLocalizedCategory,
} from '../../lib/forumService';
import { useAuthStore } from '../../lib/useAuthStore';

function ThreadCard({ thread, onPress }: { thread: ForumThread; onPress: () => void }) {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const isVip = thread.user_role === 'VIP';

  const formatAuthorName = (name?: string | null) => {
    if (
      !name ||
      name === 'Pembaca Novesia' ||
      name === 'Novesia Reader' ||
      name === 'Reader' ||
      !name.trim()
    ) {
      return t.user_reader || (lang === 'en' ? 'Novesia Reader' : 'Pembaca Novesia');
    }
    return name;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 12,
        backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 8,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: isVip ? (colors.primaryMuted || colors.primary + '20') : colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isVip ? colors.primary : colors.border,
            overflow: 'hidden',
          }}
        >
          {thread.user_avatar ? (
            <Image
              source={{ uri: thread.user_avatar }}
              style={{ width: 26, height: 26 }}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="person" size={13} color={isVip ? colors.primary : colors.textMuted} />
          )}
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>
          {formatAuthorName(thread.user_name)}
        </Text>

        {isVip && (
          <View
            style={{
              paddingHorizontal: 5,
              paddingVertical: 1.5,
              borderRadius: 4,
              backgroundColor: colors.primaryMuted || colors.primary + '20',
              borderWidth: 1,
              borderColor: colors.primary + '40',
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary }}>VIP</Text>
          </View>
        )}

        <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
          {new Date(thread.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>

      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 }}>
        {thread.title}
      </Text>

      <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }} numberOfLines={2}>
        {thread.content}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 7,
            paddingVertical: 2.5,
            borderRadius: 5,
            backgroundColor: colors.surfaceElevated,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="chatbubble-outline" size={11} color={colors.primary} />
          <Text style={{ fontSize: 10.5, color: colors.textPrimary, fontWeight: '600' }}>
            {thread.post_count}{' '}
            {lang === 'en'
              ? thread.post_count === 1
                ? 'reply'
                : 'replies'
              : 'balasan'}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 7,
            paddingVertical: 2.5,
            borderRadius: 5,
            backgroundColor: colors.surfaceElevated,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="eye-outline" size={11} color={colors.textMuted} />
          <Text style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '600' }}>
            {thread.view_count}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function CategoryThreadsScreen() {
  const { categorySlug: rawSlug } = useLocalSearchParams<{ categorySlug: string }>();
  const categorySlug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, lang } = useLanguage();

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const localizedCategory = getLocalizedCategory(category, lang);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // New Thread Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMsg, setDialogMsg] = useState({ title: '', message: '' });

  const handleOpenCreateModal = () => {
    const authUser = useAuthStore.getState().user;
    if (!authUser) {
      setAuthModalVisible(true);
      return;
    }
    setModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [categorySlug])
  );

  const loadData = async (showLoader = false) => {
    if (!categorySlug) {
      if (showLoader) {
        setLoading(false);
        setIsError(true);
      }
      return;
    }
    if (showLoader) {
      setLoading(true);
      setIsError(false);
    }
    try {
      const res = await fetchCategoryThreads(categorySlug);
      setCategory(res.category);
      setThreads(res.threads);
      setIsError(false);
    } catch (e) {
      if (!category) {
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
    await loadData(false);
    setRefreshing(false);
  };

  const handleCreateThread = async () => {
    const authUser = useAuthStore.getState().user;
    if (!authUser) {
      setModalVisible(false);
      setAuthModalVisible(true);
      return;
    }

    if (!newTitle.trim() || !newContent.trim()) {
      setDialogMsg({
        title: lang === 'en' ? 'Incomplete Form' : 'Form Belum Lengkap',
        message:
          lang === 'en'
            ? 'Please fill in both title and content before posting.'
            : 'Mohon isi judul dan isi diskusi sebelum menerbitkan thread.',
      });
      setDialogVisible(true);
      return;
    }

    if (!category) return;
    setSubmitting(true);

    const userName =
      authUser.name ||
      authUser.email?.split('@')[0] ||
      t.user_reader ||
      (lang === 'en' ? 'Novesia Reader' : 'Pembaca Novesia');

    const created = await createForumThread({
      category_id: category.id,
      title: newTitle,
      content: newContent,
      user_name: userName,
      user_avatar: authUser?.avatarUrl || null,
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
        title: lang === 'en' ? 'Failed to Create Thread' : 'Gagal Membuat Thread',
        message:
          lang === 'en'
            ? 'An error occurred while publishing the new discussion. Please try again.'
            : 'Terjadi kesalahan saat menerbitkan diskusi baru. Silakan coba lagi.',
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
              {localizedCategory.name}
            </Text>
            {localizedCategory.description ? (
              <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
                {localizedCategory.description}
              </Text>
            ) : null}
          </View>

          {/* Top Header Compose Button */}
          <Pressable
            onPress={handleOpenCreateModal}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: pressed ? colors.primary + 'D9' : colors.primary,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            })}
          >
            <Ionicons name="add" size={16} color={colors.textOnPrimary} />
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.textOnPrimary }}>
              {lang === 'en' ? 'Discussion' : 'Diskusi'}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : isError && !category ? (
          <ErrorState
            title={lang === 'en' ? 'Failed to Load Discussions' : 'Gagal Memuat Diskusi'}
            message={
              lang === 'en'
                ? 'Network issue or discussion room not found. Please check your connection and try again.'
                : 'Koneksi internet lambat atau ruang diskusi tidak ditemukan. Silakan periksa jaringan dan coba lagi.'
            }
            onRetry={() => loadData(true)}
          />
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
                  {lang === 'en' ? 'No Discussions Yet' : 'Belum Ada Diskusi'}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  {lang === 'en'
                    ? 'Be the first to start a conversation in this category!'
                    : 'Jadilah orang pertama yang memulai topik obrolan di kategori ini!'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>


      {/* New Thread Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 44 : 16) + 20,
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
                {lang === 'en' ? 'Create New Discussion' : 'Buat Diskusi Baru'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Input Judul */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
              {lang === 'en' ? 'Topic Title' : 'Judul Topik'}
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
              placeholder={lang === 'en' ? 'e.g. Theory about latest chapter...' : 'Mis: Teori plot chapter terbaru...'}
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {/* Input Isi */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
              {lang === 'en' ? 'Discussion Content' : 'Isi Diskusi'}
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
              placeholder={lang === 'en' ? 'Write your thoughts or discussion topic...' : 'Tuliskan pendapat atau topik obrolan Anda...'}
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
                    {lang === 'en' ? 'Publish Discussion' : 'Terbitkan Diskusi'}
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

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </View>
  );
}
