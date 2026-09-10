import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CommentItemData } from '../../lib/commentService';
import { timeAgo } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeProvider';

interface CommentItemProps {
  comment: CommentItemData;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onLike: (commentId: string) => Promise<void>;
  onDelete?: (commentId: string) => void;
  onReply?: (parentId: string, content: string) => Promise<boolean>;
  isReply?: boolean;
  themeOverride?: {
    cardBg?: string;
    cardBorder?: string;
    text?: string;
    textMuted?: string;
    goldAccent?: string;
  };
}

export function CommentItem({
  comment,
  currentUserId,
  isAdmin = false,
  onLike,
  onDelete,
  onReply,
  isReply = false,
  themeOverride,
}: CommentItemProps) {
  const { lang } = useLanguage();
  const { colors, isDark } = useTheme();

  const [likes, setLikes] = useState<number>(comment.likes_count || comment.likesCount || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const [showReplyBox, setShowReplyBox] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  const authorName =
    comment.user_name || comment.userName || comment.user?.name || (lang === 'en' ? 'Reader' : 'Pembaca');
  const authorAvatar =
    (comment.user_avatar || comment.userAvatar || comment.user?.avatarUrl || '').trim() || null;
  const authorRole = comment.user?.role;
  const isOwner = Boolean(currentUserId && comment.user_id && currentUserId === comment.user_id);
  const canDelete = isOwner || isAdmin;

  // Inisial avatar fallback
  const initials =
    authorName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'P';

  // Dynamic Theme Colors
  const textColor = themeOverride?.text || colors.textPrimary;
  const textMutedColor = themeOverride?.textMuted || colors.textMuted;
  const cardBg =
    themeOverride?.cardBg || (isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)');
  const cardBorder =
    themeOverride?.cardBorder || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');
  const goldColor = themeOverride?.goldAccent || colors.primary;

  const handleLike = async () => {
    if (isLiking || hasLiked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsLiking(true);
    setHasLiked(true);
    setLikes((prev) => prev + 1);
    try {
      await onLike(comment.id);
    } catch {
      setHasLiked(false);
      setLikes((prev) => Math.max(0, prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleSendReply = async () => {
    if (!onReply || !replyText.trim() || isSubmittingReply) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsSubmittingReply(true);
    try {
      const ok = await onReply(comment.id, replyText.trim());
      if (ok) {
        setReplyText('');
        setShowReplyBox(false);
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        isReply
          ? [
              styles.replyContainer,
              { borderLeftColor: isDark ? 'rgba(212,168,67,0.3)' : 'rgba(185,151,98,0.35)' },
            ]
          : [
              styles.cardContainer,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ],
      ]}
    >
      <View style={styles.contentRow}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {authorAvatar ? (
            <Image
              source={{ uri: authorAvatar }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarFallback}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Comment Details */}
        <View style={styles.bodyWrapper}>
          {/* Header row: Author, Badges, Time */}
          <View style={styles.headerRow}>
            <View style={styles.authorBadgeRow}>
              <Text style={[styles.authorName, { color: textColor }]} numberOfLines={1}>
                {authorName}
              </Text>

              {/* Role Badges */}
              {authorRole === 'ADMIN' && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#EF4444" />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}

              {authorRole === 'VIP' && (
                <View style={styles.vipBadge}>
                  <Ionicons name="sparkles" size={10} color="#F59E0B" />
                  <Text style={styles.vipBadgeText}>VIP</Text>
                </View>
              )}

              {comment.chapter_number !== null && comment.chapter_number !== undefined && (
                <View style={styles.chapterBadge}>
                  <Text style={styles.chapterBadgeText}>Bab {comment.chapter_number}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.timeText, { color: textMutedColor }]}>
              {timeAgo(comment.created_at || comment.createdAt, lang)}
            </Text>
          </View>

          {/* Comment Body */}
          <Text style={[styles.commentContent, { color: textColor }]}>{comment.content}</Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            {/* Like Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLike}
              style={styles.actionBtn}
              hitSlop={8}
            >
              <Ionicons
                name={hasLiked ? 'heart' : 'heart-outline'}
                size={14}
                color={hasLiked ? '#EF4444' : textMutedColor}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: hasLiked ? '#EF4444' : textMutedColor, fontWeight: hasLiked ? '700' : '500' },
                ]}
              >
                {likes > 0 ? likes : lang === 'en' ? 'Like' : 'Suka'}
              </Text>
            </TouchableOpacity>

            {/* Reply Button (top-level only) */}
            {!isReply && onReply && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowReplyBox((p) => !p)}
                style={styles.actionBtn}
                hitSlop={8}
              >
                <Ionicons name="arrow-undo-outline" size={14} color={textMutedColor} />
                <Text style={[styles.actionBtnText, { color: textMutedColor }]}>
                  {lang === 'en' ? 'Reply' : 'Balas'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete Button */}
            {canDelete && onDelete && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onDelete(comment.id)}
                style={[styles.actionBtn, styles.deleteBtn]}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={13} color="#EF4444" />
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>
                  {lang === 'en' ? 'Delete' : 'Hapus'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Inline Reply Input Box */}
          {showReplyBox && (
            <View
              style={[
                styles.replyBoxWrapper,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                  borderColor: cardBorder,
                },
              ]}
            >
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder={
                  lang === 'en' ? `Reply to ${authorName}...` : `Balas komentar ${authorName}...`
                }
                placeholderTextColor={textMutedColor}
                multiline
                maxLength={1000}
                style={[styles.replyTextInput, { color: textColor }]}
              />
              <View style={styles.replyActionRow}>
                <TouchableOpacity
                  onPress={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                  style={styles.replyCancelBtn}
                >
                  <Text style={[styles.replyCancelText, { color: textMutedColor }]}>
                    {lang === 'en' ? 'Cancel' : 'Batal'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendReply}
                  disabled={isSubmittingReply || !replyText.trim()}
                  style={[
                    styles.replySubmitBtn,
                    { backgroundColor: goldColor },
                    (!replyText.trim() || isSubmittingReply) && { opacity: 0.5 },
                  ]}
                >
                  {isSubmittingReply ? (
                    <ActivityIndicator size="small" color="#0D1117" />
                  ) : (
                    <>
                      <Ionicons name="send" size={11} color="#0D1117" />
                      <Text style={styles.replySubmitText}>
                        {lang === 'en' ? 'Send' : 'Kirim'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Nested Replies List */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesList}>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onLike={onLike}
                  onDelete={onDelete}
                  isReply={true}
                  themeOverride={themeOverride}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  cardContainer: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  replyContainer: {
    paddingTop: 10,
    paddingBottom: 4,
    paddingLeft: 12,
    borderLeftWidth: 2,
    marginTop: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#0D1117',
    fontWeight: '700',
    fontSize: 12,
  },
  bodyWrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  authorName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  adminBadgeText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '700',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  vipBadgeText: {
    color: '#F59E0B',
    fontSize: 9.5,
    fontWeight: '700',
  },
  chapterBadge: {
    backgroundColor: 'rgba(185, 151, 98, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(185, 151, 98, 0.25)',
  },
  chapterBadgeText: {
    color: '#D4A843',
    fontSize: 9.5,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 10.5,
  },
  commentContent: {
    fontSize: 12.5,
    lineHeight: 18,
    marginVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
  },
  actionBtnText: {
    fontSize: 11,
  },
  deleteBtn: {
    marginLeft: 'auto',
  },
  replyBoxWrapper: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  replyTextInput: {
    fontSize: 12,
    minHeight: 44,
    textAlignVertical: 'top',
    padding: 0,
  },
  replyActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  replyCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  replyCancelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  replySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  replySubmitText: {
    color: '#0D1117',
    fontSize: 11,
    fontWeight: '700',
  },
  repliesList: {
    marginTop: 6,
  },
});
