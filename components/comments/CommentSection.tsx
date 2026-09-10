import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../lib/useAuthStore';
import { useLanguage } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeProvider';
import {
  CommentItemData,
  fetchComments,
  sendComment,
  likeComment,
  deleteComment,
} from '../../lib/commentService';
import { CommentItem } from './CommentItem';
import { CustomDialog, DialogTone } from '../CustomDialog';

interface CommentSectionProps {
  novelId: string;
  novelSlug: string;
  chapterId?: string;
  chapterNumber?: number;
  target: 'NOVEL' | 'CHAPTER';
  title?: string;
  isInReader?: boolean;
  themeOverride?: {
    cardBg?: string;
    cardBorder?: string;
    text?: string;
    textMuted?: string;
    goldAccent?: string;
  };
  onOpenAuthModal?: () => void;
}

export function CommentSection({
  novelId,
  novelSlug,
  chapterId,
  chapterNumber,
  target,
  title,
  isInReader = false,
  themeOverride,
  onOpenAuthModal,
}: CommentSectionProps) {
  const { lang } = useLanguage();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [comments, setComments] = useState<CommentItemData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  const [content, setContent] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    tone?: DialogTone;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({ title: '', message: '' });

  // Theme colors
  const textColor = themeOverride?.text || colors.textPrimary;
  const textMutedColor = themeOverride?.textMuted || colors.textMuted;
  const cardBg =
    themeOverride?.cardBg || (isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)');
  const cardBorder =
    themeOverride?.cardBorder || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');
  const goldColor = themeOverride?.goldAccent || colors.primary;

  const loadData = useCallback(
    async (targetPage = 1, targetSort = sort, append = false) => {
      if (!novelId && !novelSlug) {
        setIsLoading(false);
        return;
      }
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);

      try {
        const res = await fetchComments({
          novelId,
          novelSlug,
          chapterId,
          chapterNumber,
          target,
          sort: targetSort,
          page: targetPage,
          limit: 15,
        });

        if (append) {
          setComments((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const uniqueNew = (res.comments || []).filter((c) => !existingIds.has(c.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setComments(res.comments || []);
        }
        setTotalCount(res.total || 0);
        setHasMore(Boolean(res.hasMore));
        setPage(targetPage);
      } catch (err) {
        console.warn('Error loading comments:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [novelId, novelSlug, chapterId, chapterNumber, target, sort]
  );

  useEffect(() => {
    loadData(1, sort, false);
  }, [loadData, sort]);

  // Submit top-level comment
  const handlePostComment = async () => {
    if (!content.trim() || isSubmitting) return;
    if (content.trim().length > 2000) {
      setDialogConfig({
        title: lang === 'en' ? 'Limit Exceeded' : 'Batas Karakter',
        message:
          lang === 'en'
            ? 'Comment exceeds 2000 characters limit.'
            : 'Komentar melebihi batas 2000 karakter.',
        tone: 'danger',
      });
      setDialogVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const newComment = await sendComment({
        novelId,
        novelSlug,
        chapterId,
        chapterNumber,
        target,
        content: content.trim(),
        userName: !user && guestName.trim() ? guestName.trim() : undefined,
      });

      if (newComment) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setComments((prev) => [newComment, ...prev]);
        setTotalCount((prev) => prev + 1);
        setContent('');
      }
    } catch (err: any) {
      setDialogConfig({
        title: lang === 'en' ? 'Error' : 'Gagal Mengirim',
        message: err?.message || (lang === 'en' ? 'Failed to post comment.' : 'Gagal mengirim komentar.'),
        tone: 'danger',
      });
      setDialogVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reply to comment
  const handleReplyComment = async (parentId: string, replyContent: string): Promise<boolean> => {
    if (!replyContent.trim()) return false;
    try {
      const newReply = await sendComment({
        novelId,
        novelSlug,
        chapterId,
        chapterNumber,
        target,
        parentId,
        content: replyContent.trim(),
        userName: !user && guestName.trim() ? guestName.trim() : undefined,
      });

      if (newReply) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              const currentReplies = c.replies || [];
              const existingIds = new Set(currentReplies.map((r) => r.id));
              if (existingIds.has(newReply.id)) return c;
              return {
                ...c,
                replies_count: (c.replies_count || 0) + 1,
                replies: [...currentReplies, newReply],
              };
            }
            return c;
          })
        );
        return true;
      }
      return false;
    } catch (err: any) {
      setDialogConfig({
        title: lang === 'en' ? 'Error' : 'Gagal Membalas',
        message: err?.message || (lang === 'en' ? 'Failed to post reply.' : 'Gagal mengirim balasan.'),
        tone: 'danger',
      });
      setDialogVisible(true);
      return false;
    }
  };

  // Like comment
  const handleLike = async (commentId: string) => {
    await likeComment(commentId);
  };

  // Delete comment
  const handleDelete = (commentId: string) => {
    setDialogConfig({
      title: lang === 'en' ? 'Delete Comment' : 'Hapus Komentar',
      message:
        lang === 'en'
          ? 'Are you sure you want to delete this comment?'
          : 'Apakah Anda yakin ingin menghapus komentar ini?',
      tone: 'danger',
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await deleteComment(commentId);
          if (res?.success || res?.deleted) {
            setComments((prev) => {
              let foundTop = false;
              const filtered = prev.filter((c) => {
                if (c.id === commentId) {
                  foundTop = true;
                  return false;
                }
                return true;
              });

              if (foundTop) {
                setTotalCount((t) => Math.max(0, t - 1));
                return filtered;
              }

              return filtered.map((c) => {
                if (c.replies && c.replies.some((r) => r.id === commentId)) {
                  return {
                    ...c,
                    replies: c.replies.filter((r) => r.id !== commentId),
                    replies_count: Math.max(0, (c.replies_count || 1) - 1),
                  };
                }
                return c;
              });
            });
          }
        } catch (err) {
          console.warn('Delete comment error:', err);
        }
      },
    });
    setDialogVisible(true);
  };

  const defaultTitle =
    title ||
    (target === 'CHAPTER'
      ? lang === 'en'
        ? `Chapter ${chapterNumber || ''} Discussion`
        : `Diskusi Bab ${chapterNumber || ''}`
      : lang === 'en'
      ? 'Novel Comments & Reviews'
      : 'Komentar & Ulasan Novel');

  return (
    <View
      style={[
        styles.sectionWrapper,
        {
          backgroundColor: isInReader ? cardBg : (isDark ? 'rgba(10,14,23,0.5)' : colors.surface),
          borderColor: cardBorder,
        },
      ]}
    >
      {/* ═══ Header ═══ */}
      <View style={[styles.headerRow, { borderBottomColor: cardBorder }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconBadge, { backgroundColor: isDark ? 'rgba(212,168,67,0.15)' : 'rgba(185,151,98,0.15)' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={goldColor} />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{defaultTitle}</Text>
            <Text style={[styles.sectionSubtitle, { color: textMutedColor }]}>
              {totalCount} {lang === 'en' ? 'comments' : 'komentar'}
            </Text>
          </View>
        </View>

        {/* Sort Controls */}
        <View style={[styles.sortPillContainer, { borderColor: cardBorder }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSort('newest')}
            style={[styles.sortBtn, sort === 'newest' && { backgroundColor: goldColor }]}
          >
            <Text
              style={[
                styles.sortBtnText,
                { color: sort === 'newest' ? '#0D1117' : textMutedColor, fontWeight: sort === 'newest' ? '700' : '500' },
              ]}
            >
              {lang === 'en' ? 'New' : 'Terbaru'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSort('popular')}
            style={[styles.sortBtn, sort === 'popular' && { backgroundColor: goldColor }]}
          >
            <Text
              style={[
                styles.sortBtnText,
                { color: sort === 'popular' ? '#0D1117' : textMutedColor, fontWeight: sort === 'popular' ? '700' : '500' },
              ]}
            >
              {lang === 'en' ? 'Top' : 'Populer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ Input Form ═══ */}
      <View style={styles.inputArea}>
        {/* User Status Bar */}
        <View style={styles.statusBar}>
          {user ? (
            <View style={styles.userStatusRow}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              <Text style={[styles.statusText, { color: textMutedColor }]}>
                {lang === 'en' ? 'Commenting as' : 'Komentar sebagai'}{' '}
                <Text style={{ fontWeight: '700', color: textColor }}>{user.name}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.guestStatusRow}>
              <Text style={[styles.statusText, { color: textMutedColor }]}>
                {lang === 'en' ? 'Guest mode' : 'Mode Tamu'}
              </Text>
              {onOpenAuthModal && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onOpenAuthModal}
                  style={styles.signInLink}
                  hitSlop={8}
                >
                  <Ionicons name="log-in-outline" size={13} color={goldColor} />
                  <Text style={[styles.signInLinkText, { color: goldColor }]}>
                    {lang === 'en' ? 'Sign in to sync' : 'Masuk akun'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Guest Name Input */}
        {!user && (
          <TextInput
            value={guestName}
            onChangeText={setGuestName}
            placeholder={lang === 'en' ? 'Your name (Optional)' : 'Nama / Panggilan kamu (Opsional)'}
            placeholderTextColor={textMutedColor}
            maxLength={50}
            style={[
              styles.nameInput,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                borderColor: cardBorder,
                color: textColor,
              },
            ]}
          />
        )}

        {/* Comment Textarea */}
        <View style={styles.textareaWrapper}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={
              target === 'CHAPTER'
                ? lang === 'en'
                  ? 'Share your thoughts on this chapter...'
                  : 'Tulis tanggapanmu tentang bab ini...'
                : lang === 'en'
                ? 'Write your review or thoughts about this novel...'
                : 'Tulis ulasan, kesan, atau komentar tentang novel ini...'
            }
            placeholderTextColor={textMutedColor}
            multiline
            maxLength={2000}
            style={[
              styles.textarea,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                borderColor: cardBorder,
                color: textColor,
              },
            ]}
          />
          <Text style={[styles.charCounter, { color: textMutedColor }]}>
            {content.length}/2000
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePostComment}
            disabled={isSubmitting || !content.trim()}
            style={[
              styles.submitBtn,
              { backgroundColor: goldColor },
              (!content.trim() || isSubmitting) && { opacity: 0.5 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#0D1117" />
            ) : (
              <>
                <Ionicons name="send" size={13} color="#0D1117" />
                <Text style={styles.submitBtnText}>
                  {lang === 'en' ? 'Post Comment' : 'Kirim Komentar'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ Comments List ═══ */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={goldColor} />
            <Text style={[styles.loadingText, { color: textMutedColor }]}>
              {lang === 'en' ? 'Loading comments...' : 'Memuat komentar...'}
            </Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={[styles.emptyWrapper, { borderColor: cardBorder }]}>
            <Ionicons name="chatbubbles-outline" size={32} color={textMutedColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {target === 'CHAPTER'
                ? lang === 'en'
                  ? 'No comments for this chapter yet.'
                  : 'Belum ada diskusi untuk bab ini.'
                : lang === 'en'
                ? 'No comments for this novel yet.'
                : 'Belum ada ulasan untuk novel ini.'}
            </Text>
            <Text style={[styles.emptyDesc, { color: textMutedColor }]}>
              {lang === 'en'
                ? 'Be the first to share your thoughts!'
                : 'Jadilah yang pertama menulis komentar dan memulai diskusi!'}
            </Text>
          </View>
        ) : (
          <View style={styles.commentsList}>
            {comments.map((item) => (
              <CommentItem
                key={item.id}
                comment={item}
                currentUserId={user?.id}
                isAdmin={user?.role === 'ADMIN'}
                onLike={handleLike}
                onDelete={handleDelete}
                onReply={handleReplyComment}
                themeOverride={themeOverride}
              />
            ))}
          </View>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => loadData(page + 1, sort, true)}
            disabled={isLoadingMore}
            style={[styles.loadMoreBtn, { borderColor: cardBorder }]}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color={goldColor} />
            ) : (
              <>
                <Ionicons name="chevron-down" size={14} color={goldColor} />
                <Text style={[styles.loadMoreText, { color: textColor }]}>
                  {lang === 'en' ? 'Load More Comments' : 'Muat Komentar Lainnya'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Confirmation Dialog */}
      <CustomDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        tone={dialogConfig.tone}
        confirmText={lang === 'en' ? 'OK' : 'Ya, Lanjutkan'}
        cancelText={lang === 'en' ? 'Cancel' : 'Batal'}
        showCancel={dialogConfig.showCancel ?? false}
        onConfirm={dialogConfig.onConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrapper: {
    marginVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
  },
  sortPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sortBtnText: {
    fontSize: 10.5,
  },
  inputArea: {
    padding: 16,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  guestStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  statusText: {
    fontSize: 11,
  },
  signInLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signInLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  nameInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  textareaWrapper: {
    position: 'relative',
  },
  textarea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    paddingBottom: 22,
    fontSize: 12.5,
    lineHeight: 18,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  charCounter: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    fontSize: 9.5,
  },
  submitRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#0D1117',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingWrapper: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 11.5,
  },
  emptyWrapper: {
    paddingVertical: 24,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 11,
  },
  commentsList: {
    gap: 6,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
