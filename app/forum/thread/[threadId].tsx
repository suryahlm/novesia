import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '../../../components/GradientBackground';
import { GoldSurface } from '../../../components/GoldSurface';
import { CustomDialog } from '../../../components/CustomDialog';
import { useTheme } from '../../../lib/ThemeProvider';
import {
  fetchThreadDetail,
  createForumPost,
  ForumThread,
  ForumPost,
} from '../../../lib/forumService';
import { useAuthStore } from '../../../lib/useAuthStore';

export default function ThreadDetailScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMsg, setDialogMsg] = useState({ title: '', message: '' });

  useEffect(() => {
    loadData();
  }, [threadId]);

  const loadData = async () => {
    if (!threadId) return;
    const res = await fetchThreadDetail(threadId);
    setThread(res.thread);
    setPosts(res.posts);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    if (!thread) return;

    setSubmitting(true);
    const authUser = useAuthStore.getState().user;
    const userName = authUser?.name || authUser?.email?.split('@')[0] || 'Pembaca Novesia';

    const post = await createForumPost({
      thread_id: thread.id,
      content: replyContent,
      user_name: userName,
      user_id: authUser?.id || null,
      user_role: (authUser?.role as 'USER' | 'VIP' | 'ADMIN') || 'USER',
    });

    setSubmitting(false);

    if (post) {
      setReplyContent('');
      setPosts((prev) => [...prev, post]);
    } else {
      setDialogMsg({
        title: 'Gagal Mengirim Balasan',
        message: 'Tidak dapat mengirim balasan saat ini. Silakan coba lagi.',
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
            {thread?.title || 'Detail Diskusi'}
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <FlatList
              data={posts}
              keyExtractor={(p) => p.id}
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
                        }}
                      >
                        <Ionicons
                          name="person"
                          size={18}
                          color={isThreadVip ? colors.primary : colors.textMuted}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}
                          >
                            {thread.user_name}
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
                          {new Date(thread.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
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
                        {posts.length} Balasan
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
                        }}
                      >
                        <Ionicons
                          name="person"
                          size={13}
                          color={isReplyVip ? colors.primary : colors.textMuted}
                        />
                      </View>
                      <Text
                        style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}
                      >
                        {item.user_name}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: colors.textMuted, flex: 1 }}>
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
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
                    Belum ada balasan. Jadilah yang pertama membalas!
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
                paddingBottom: Math.max(10, insets.bottom + 8),
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
                placeholder="Tulis balasan..."
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
