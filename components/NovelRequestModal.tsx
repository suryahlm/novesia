import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../lib/i18n';
import { useTheme } from '../lib/ThemeProvider';
import { useAuthStore } from '../lib/useAuthStore';
import { sendNovelRequest } from '../lib/novelRequestService';

interface NovelRequestModalProps {
  visible: boolean;
  initialTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const LANGUAGE_OPTIONS = [
  { key: 'China', labelId: '🇨🇳 China', labelEn: '🇨🇳 Chinese' },
  { key: 'Korea', labelId: '🇰🇷 Korea', labelEn: '🇰🇷 Korean' },
  { key: 'Jepang', labelId: '🇯🇵 Jepang', labelEn: '🇯🇵 Japanese' },
  { key: 'Inggris', labelId: '🇬🇧 Inggris', labelEn: '🇬🇧 English' },
  { key: 'Lainnya', labelId: '🌐 Lainnya', labelEn: '🌐 Other' },
];

export function NovelRequestModal({
  visible,
  initialTitle = '',
  onClose,
  onSuccess,
}: NovelRequestModalProps) {
  const { lang, t } = useLanguage();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 16;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedLang, setSelectedLang] = useState('China');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    tone?: 'gold' | 'danger' | 'success' | 'warning' | 'info';
    isSuccess?: boolean;
  }>({ title: '', message: '' });

  useEffect(() => {
    if (visible) {
      if (initialTitle) setTitle(initialTitle);
      else setTitle('');
      setAuthor('');
      setSelectedLang('China');
      setSourceUrl('');
      setNotes('');
      setGuestName('');
      setGuestEmail('');
    }
  }, [visible, initialTitle]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setDialogConfig({
        title: lang === 'en' ? 'Incomplete Form' : 'Form Belum Lengkap',
        message: t.request_novel_title_required || 'Judul novel wajib diisi.',
        tone: 'warning',
      });
      setDialogVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      await sendNovelRequest({
        title: title.trim(),
        author: author.trim() || undefined,
        language: selectedLang,
        sourceUrl: sourceUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        userName: !user && guestName.trim() ? guestName.trim() : undefined,
        userEmail: !user && guestEmail.trim() ? guestEmail.trim() : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDialogConfig({
        title: t.request_novel_success_title || 'Permintaan Terkirim!',
        message:
          t.request_novel_success_msg ||
          'Terima kasih! Permintaan novelmu telah berhasil dikirimkan ke tim kurasi redaksi.',
        tone: 'gold',
        isSuccess: true,
      });
      setDialogVisible(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setDialogConfig({
        title: lang === 'en' ? 'Failed to Submit' : 'Gagal Mengirim',
        message:
          err?.message ||
          (lang === 'en'
            ? 'Failed to submit novel request. Please try again.'
            : 'Gagal mengirimkan permintaan novel. Silakan coba lagi.'),
        tone: 'danger',
      });
      setDialogVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setDialogVisible(false);
    if (dialogConfig.isSuccess) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.backdropPressable}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </View>

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#0e1117' : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: colors.primaryMuted || colors.primary + '20',
                    borderColor: colors.primary + '40',
                  },
                ]}
              >
                <Ionicons name="sparkles" size={17} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {t.request_novel_modal_title || 'Permintaan Novel Baru'}
                </Text>
                <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
                  Novesia Curation Request
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Form Scroll Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Description Banner */}
            <View
              style={[
                styles.descBanner,
                {
                  backgroundColor: isDark ? 'rgba(212,168,67,0.08)' : 'rgba(185,151,98,0.1)',
                  borderColor: isDark ? 'rgba(212,168,67,0.22)' : 'rgba(185,151,98,0.25)',
                },
              ]}
            >
              <Ionicons name="information-circle" size={16} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={[styles.descBannerText, { color: colors.textSecondary }]}>
                {t.request_novel_modal_desc ||
                  'Tidak menemukan novel favoritmu di Novesia? Ajukan permohonan judul novel agar tim kurasi kami dapat meninjau dan menambahkannya!'}
              </Text>
            </View>

            {/* Field: Judul Novel (Wajib) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t.request_novel_title_label || 'Judul Novel *'}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={
                  t.request_novel_title_placeholder ||
                  'Contoh: Shadow Slave, Lord of the Mysteries...'
                }
                placeholderTextColor={colors.textMuted}
                maxLength={250}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Field: Penulis */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t.request_novel_author_label || 'Penulis (Opsional)'}
              </Text>
              <TextInput
                value={author}
                onChangeText={setAuthor}
                placeholder={t.request_novel_author_placeholder || 'Nama penulis asli'}
                placeholderTextColor={colors.textMuted}
                maxLength={100}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Field: Bahasa Asal Novel (Chips) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t.request_novel_lang_label || 'Bahasa Asal Novel'}
              </Text>
              <View style={styles.langChipsRow}>
                {LANGUAGE_OPTIONS.map((item) => {
                  const isSelected = selectedLang === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedLang(item.key);
                      }}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.langChipText,
                          {
                            color: isSelected ? '#0D1117' : colors.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {lang === 'en' ? item.labelEn : item.labelId}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Field: Link Sumber / NU / RAW */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t.request_novel_source_label || 'Link Sumber / RAW / NU (Opsional)'}
              </Text>
              <TextInput
                value={sourceUrl}
                onChangeText={setSourceUrl}
                placeholder={t.request_novel_source_placeholder || 'https://...'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
                maxLength={500}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Field: Catatan Tambahan */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t.request_novel_notes_label || 'Alasan / Catatan Tambahan (Opsional)'}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  t.request_novel_notes_placeholder ||
                  'Ceritakan mengapa kamu ingin membaca novel ini...'
                }
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={1000}
                style={[
                  styles.textarea,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Info User / Guest Fields */}
            {user ? (
              <View
                style={[
                  styles.userStatusCard,
                  {
                    backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)',
                    borderColor: isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.3)',
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                <Text style={[styles.userStatusText, { color: colors.textSecondary }]}>
                  {lang === 'en' ? 'Submitting as verified account:' : 'Mengajukan sebagai akun terdaftar:'}{' '}
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                    {user.name} ({user.email})
                  </Text>
                </Text>
              </View>
            ) : (
              <View style={styles.guestGroup}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                    {t.request_novel_guest_name || 'Nama Anda (Opsional)'}
                  </Text>
                  <TextInput
                    value={guestName}
                    onChangeText={setGuestName}
                    placeholder="Nama Anda"
                    placeholderTextColor={colors.textMuted}
                    maxLength={50}
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                    {t.request_novel_guest_email || 'Email / Kontak (Opsional)'}
                  </Text>
                  <TextInput
                    value={guestEmail}
                    onChangeText={setGuestEmail}
                    placeholder="email@contoh.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    maxLength={100}
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                disabled={submitting}
                style={[
                  styles.cancelBtn,
                  { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  {t.cancel || 'Batal'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSubmit}
                disabled={submitting}
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  submitting && { opacity: 0.6 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#0D1117" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={14} color="#0D1117" />
                    <Text style={styles.submitBtnText}>
                      {t.request_novel_submit || 'Kirim Permintaan'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: bottomPadding }} />
          </ScrollView>

          {/* Inline Dialog Overlay (Zero Nested Modal issues on iOS) */}
          {dialogVisible && (
            <View style={styles.dialogOverlay}>
              <View
                style={[
                  styles.dialogCard,
                  {
                    backgroundColor: isDark ? '#161B22' : colors.surface,
                    borderColor:
                      dialogConfig.tone === 'danger'
                        ? colors.danger
                        : dialogConfig.tone === 'warning'
                        ? '#F59E0B'
                        : colors.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dialogIconBadge,
                    {
                      backgroundColor:
                        dialogConfig.tone === 'danger'
                          ? colors.danger + '20'
                          : dialogConfig.tone === 'warning'
                          ? '#F59E0B20'
                          : colors.primary + '20',
                      borderColor:
                        dialogConfig.tone === 'danger'
                          ? colors.danger + '40'
                          : dialogConfig.tone === 'warning'
                          ? '#F59E0B40'
                          : colors.primary + '40',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      dialogConfig.tone === 'danger'
                        ? 'alert-circle'
                        : dialogConfig.tone === 'warning'
                        ? 'warning'
                        : 'checkmark-circle'
                    }
                    size={28}
                    color={
                      dialogConfig.tone === 'danger'
                        ? colors.danger
                        : dialogConfig.tone === 'warning'
                        ? '#F59E0B'
                        : colors.primary
                    }
                  />
                </View>
                <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
                  {dialogConfig.title}
                </Text>
                <Text style={[styles.dialogMessage, { color: colors.textSecondary }]}>
                  {dialogConfig.message}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleDialogClose}
                  style={[styles.dialogBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.dialogBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sheetSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  descBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  descBannerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12.5,
  },
  textarea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12.5,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  langChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 11.5,
  },
  userStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  userStatusText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  guestGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnText: {
    color: '#0D1117',
    fontSize: 12.5,
    fontWeight: '700',
  },
  dialogOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnText: {
    color: '#0D1117',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
