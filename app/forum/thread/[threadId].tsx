import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '../../../components/GradientBackground';
import { GoldSurface } from '../../../components/GoldSurface';
import { CustomDialog } from '../../../components/CustomDialog';
import { ErrorState } from '../../../components/ErrorState';
import { useTheme } from '../../../lib/ThemeProvider';
import { useLanguage } from '../../../lib/i18n';
import {
  fetchThreadDetail,
  fetchThreadNewPosts,
  createForumPost,
  ForumThread,
  ForumPost,
} from '../../../lib/forumService';
import { useAuthStore } from '../../../lib/useAuthStore';

export default function ThreadDetailScreen() {
  const { threadId: rawThreadId } = useLocalSearchParams<{ threadId: string }>();
  const threadId = Array.isArray(rawThreadId) ? rawThreadId[0] : rawThreadId;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, lang } = useLanguage();

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

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const shouldScrollToEndRef = useRef(false);

  // Real-time synchronization refs
  const latestTimestampRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMsg, setDialogMsg] = useState({ title: '', message: '' });

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadData = useCallback(
    async (isInitial = false) => {
      if (!threadId) return;
      if (isInitial) {
        setLoading(true);
        setIsError(false);
      }

      try {
        const res = await fetchThreadDetail(threadId, !isInitial);
        if (res.thread) {
          setThread(res.thread);
          setPosts(res.posts);
          setIsError(false);
          const newest = res.posts[res.posts.length - 1];
          latestTimestampRef.current = newest?.created_at || res.thread.created_at;
        } else if (isInitial) {
          setIsError(true);
        }
      } catch (err) {
        if (isInitial) {
          setIsError(true);
        }
      } finally {
        if (isInitial) {
          setLoading(false);
        }
      }
    },
    [threadId]
  );

  // Real-time delta sync function (checks for messages posted by other users)
  const syncNewPosts = useCallback(async () => {
    if (!threadId || isSyncingRef.current || !latestTimestampRef.current) return;
    isSyncingRef.current = true;
    try {
      const newPosts = await fetchThreadNewPosts(threadId, latestTimestampRef.current);
      if (newPosts && newPosts.length > 0) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const additions = newPosts.filter((p) => !existingIds.has(p.id));
          if (additions.length === 0) return prev;

          const merged = [...prev, ...additions];
          const lastOne = merged[merged.length - 1];
          if (lastOne?.created_at) {
            latestTimestampRef.current = lastOne.created_at;
          }
          // Smoothly scroll to the bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 80);
          return merged;
        });
      }
    } catch (e) {
      // Silent on sync
    } finally {
      isSyncingRef.current = false;
    }
  }, [threadId]);

  // Real-time active focus listener: Polls every 2.5s only while screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData(true);

      const interval = setInterval(() => {
        syncNewPosts();
      }, 2500);

      return () => {
        clearInterval(interval);
      };
    }, [loadData, syncNewPosts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    if (!thread) return;

    setSubmitting(true);
    const authUser = useAuthStore.getState().user;
    const userName =
      authUser?.name ||
      authUser?.email?.split('@')[0] ||
      t.user_reader ||
      (lang === 'en' ? 'Novesia Reader' : 'Pembaca Novesia');

    const contentToSend = replyContent.trim();
    setReplyContent('');

    const post = await createForumPost({
      thread_id: thread.id,
      content: contentToSend,
      user_name: userName,
      user_avatar: authUser?.avatarUrl || null,
      user_id: authUser?.id || null,
      user_role: (authUser?.role as 'USER' | 'VIP' | 'ADMIN') || 'USER',
    });

    setSubmitting(false);

    if (post) {
      shouldScrollToEndRef.current = true;
      latestTimestampRef.current = post.created_at;
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        if (existingIds.has(post.id)) return prev;
        return [...prev, post];
      });
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToEnd({ animated: true });
        } catch {}
      }, 60);
    } else {
      // Restore input text on error
      setReplyContent(contentToSend);
      setDialogMsg({
        title: lang === 'en' ? 'Failed to Send Reply' : 'Gagal Mengirim Balasan',
        message:
          lang === 'en'
            ? 'Could not send reply at this time. Please try again.'
            : 'Tidak dapat mengirim balasan saat ini. Silakan coba lagi.',
      });
      setDialogVisible(true);
    }
  };

  const isThreadVip = thread?.user_role === 'VIP';

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
        {/* Top Header */}
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
          <Text
            style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, flex: 1 }}
            numberOfLines={1}
          >
            {thread?.title || (lang === 'en' ? 'Discussion Details' : 'Detail Diskusi')}
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : isError && !thread ? (
          <ErrorState
            title={lang === 'en' ? 'Failed to Load Discussion' : 'Gagal Memuat Diskusi'}
            message={
              lang === 'en'
                ? 'Network issue or discussion not found. Please check your connection and try again.'
                : 'Koneksi lambat atau diskusi tidak ditemukan. Silakan periksa jaringan dan coba lagi.'
            }
            onRetry={() => loadData(true)}
          />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <FlatList
              ref={flatListRef}
              data={posts}
              keyExtractor={(p) => p.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onContentSizeChange={() => {
                if (shouldScrollToEndRef.current) {
                  shouldScrollToEndRef.current = false;
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              ListHeaderComponent={
                thread ? (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                      marginBottom: 18,
                    }}
                  >
                    {/* Thread Creator Info */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: isThreadVip ? colors.primaryMuted : colors.surfaceElevated,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: isThreadVip ? colors.primary : colors.border,
                          overflow: 'hidden',
                        }}
                      >
                        {thread.user_avatar ? (
                          <Image
                            source={{ uri: thread.user_avatar }}
                            style={{ width: 36, height: 36 }}
                            contentFit="cover"
                          />
                        ) : (
                          <Ionicons
                            name="person"
                            size={18}
                            color={isThreadVip ? colors.primary : colors.textMuted}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}
                          >
                            {formatAuthorName(thread.user_name)}
                          </Text>
                          {isThreadVip && (
                            <View
                              style={{
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                borderRadius: 4,
                                backgroundColor: colors.primaryMuted,
                                borderWidth: 1,
                                borderColor: colors.primary + '44',
                              }}
                            >
                              <Text
                                style={{ fontSize: 9, fontWeight: '800', color: colors.primary }}
                              >
                                VIP
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {new Date(thread.created_at).toLocaleDateString(
                            lang === 'en' ? 'en-US' : 'id-ID',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Thread Title & Content */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: colors.textPrimary,
                        marginBottom: 8,
                        lineHeight: 22,
                      }}
                    >
                      {thread.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13.5,
                        color: colors.textSecondary,
                        lineHeight: 20,
                      }}
                    >
                      {thread.content}
                    </Text>

                    {/* Separator */}
                    <View
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>
                        {posts.length}{' '}
                        {lang === 'en'
                          ? posts.length === 1
                            ? 'Reply'
                            : 'Replies'
                          : 'Balasan'}
                      </Text>
                    </View>
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const isReplyVip = item.user_role === 'VIP';
                return (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: isReplyVip ? colors.primaryMuted : colors.surfaceElevated,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: isReplyVip ? colors.primary : colors.border,
                          overflow: 'hidden',
                        }}
                      >
                        {item.user_avatar ? (
                          <Image
                            source={{ uri: item.user_avatar }}
                            style={{ width: 26, height: 26 }}
                            contentFit="cover"
                          />
                        ) : (
                          <Ionicons
                            name="person"
                            size={13}
                            color={isReplyVip ? colors.primary : colors.textMuted}
                          />
                        )}
                      </View>
                      <Text
                        style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}
                      >
                        {formatAuthorName(item.user_name)}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: colors.textMuted, flex: 1 }}>
                        {new Date(item.created_at).toLocaleDateString(
                          lang === 'en' ? 'en-US' : 'id-ID',
                          {
                            day: 'numeric',
                            month: 'short',
                          }
                        )}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12.5,
                        color: colors.textSecondary,
                        lineHeight: 18,
                        paddingLeft: 34,
                      }}
                    >
                      {item.content}
                    </Text>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {lang === 'en'
                      ? 'No replies yet. Be the first to reply!'
                      : 'Belum ada balasan. Jadilah yang pertama membalas!'}
                  </Text>
                </View>
              }
            />

            {/* Reply Input Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: keyboardVisible ? 10 : Math.max(10, insets.bottom + 8),
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                gap: 10,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  fontSize: 13,
                  color: colors.textPrimary,
                  maxHeight: 80,
                }}
                placeholder={lang === 'en' ? 'Write a reply...' : 'Tulis balasan...'}
                placeholderTextColor={colors.textMuted}
                value={replyContent}
                onChangeText={setReplyContent}
                multiline
              />

              <Pressable
                onPress={handleSendReply}
                disabled={submitting || !replyContent.trim()}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: replyContent.trim() ? colors.primary : colors.surfaceElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Ionicons
                    name="send"
                    size={18}
                    color={replyContent.trim() ? colors.textOnPrimary : colors.textMuted}
                  />
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      {/* Dialog */}
      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogMsg.title}
        message={dialogMsg.message}
        showCancel={false}
      />
    </View>
  );
}
