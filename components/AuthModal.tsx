import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GoldSurface } from './GoldSurface';
import { ShimmerText } from './ShimmerText';
import { useTheme } from '../lib/ThemeProvider';
import { signInWithEmail, signUpWithEmail } from '../lib/authService';

export interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ visible, onClose, onSuccess, initialMode = 'signin' }: AuthModalProps) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Nama lengkap wajib diisi.');
        return;
      }
      if (name.trim().length < 3 || name.trim().length > 15) {
        setErrorMsg('Nama harus 3-15 karakter.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal 6 karakter.');
        return;
      }

      setLoading(true);
      const res = await signUpWithEmail(email, password, name);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setName('');
        setEmail('');
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      }
    } else {
      setLoading(true);
      const res = await signInWithEmail(email, password);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setName('');
        setEmail('');
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Hairline */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 24,
              right: 24,
              height: 2,
              backgroundColor: colors.primary,
              opacity: 0.8,
            }}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {mode === 'signin' ? 'Masuk ke Novesia' : 'Daftar Akun Baru'}
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Mode Switcher Tabs */}
          <View
            style={[
              styles.tabRow,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              style={[
                styles.tabBtn,
                mode === 'signin' && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'signin' ? colors.primary : colors.textMuted },
                ]}
              >
                Masuk
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              style={[
                styles.tabBtn,
                mode === 'signup' && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'signup' ? colors.primary : colors.textMuted },
                ]}
              >
                Daftar Akun
              </Text>
            </Pressable>
          </View>

          {errorMsg && (
            <View style={[styles.errorBanner, { backgroundColor: 'rgba(216,102,102,0.12)', borderColor: colors.danger + '44' }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600', flex: 1 }}>
                {errorMsg}
              </Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 6 }}>
            {mode === 'signup' && (
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nama Tampilan</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Mis: Surya Halim"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  maxLength={15}
                />
                <Text style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 3 }}>
                  {name.trim().length}/15 karakter
                </Text>
              </View>
            )}

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                  placeholder={mode === 'signup' ? 'Minimal 6 karakter' : 'Masukkan password'}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} style={{ paddingRight: 10 }}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={{ marginTop: 8, borderRadius: 14, overflow: 'hidden' }}
            >
              <GoldSurface
                shimmer
                style={{
                  paddingVertical: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <ShimmerText
                    style={{ fontSize: 14, fontWeight: '800' }}
                    baseColor={colors.textOnPrimary}
                    shineColor="rgba(255,250,230,0.95)"
                  >
                    {mode === 'signin' ? 'Masuk Sekarang' : 'Daftarkan Akun'}
                  </ShimmerText>
                )}
              </GoldSurface>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
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
    fontSize: 13.5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
  },
});
