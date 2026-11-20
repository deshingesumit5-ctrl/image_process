import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth';
import { API_BASE_URL } from '../config';
import { COLORS, FONT_FAMILY, RADII, SHADOWS } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    try {
      setBusy(true);
      setError('');
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  const onSaveReset = async () => {
    if (!resetEmail.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setResetError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      setResetBusy(true);
      setResetError('');

      const response = await fetch(`${API_BASE_URL}/password/reset-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Could not reset password.');
      }

      // Auto-fill and log in with the new password
      setEmail(resetEmail.trim());
      setPassword(newPassword);
      closeModal();
      await login(resetEmail.trim(), newPassword);
    } catch (e) {
      setResetError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setResetBusy(false);
    }
  };

  const webGradient =
    Platform.OS === 'web'
      ? {
        backgroundImage: `linear-gradient(180deg, #FFFFFF 0%, ${COLORS.bg} 45%, ${COLORS.bgGradientEnd} 100%)`,
      }
      : null;

  return (
    <ScrollView
      style={[styles.root, webGradient]}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.brandBadge}>
          <Image
            source={require('../../assets/applogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.brandName}>RCD Group</Text>
        <Text style={styles.title}>Image Processing</Text>
        <Text style={styles.subtitle}>Sign in with your sales staff credentials</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email Address</Text>
        <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
          <Feather name="mail" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            keyboardType="email-address"
            placeholder="Enter email"
            placeholderTextColor={COLORS.textLight}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
          <Feather name="lock" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={Platform.OS === 'web' ? 'new-password' : 'off'}
            textContentType="none"
            importantForAutofill="no"
            placeholder="Enter password"
            placeholderTextColor={COLORS.textLight}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            style={styles.input}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textMuted}
            />
          </Pressable>
        </View>

        <Pressable onPress={openForgotPassword} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>

        <Pressable
          onPress={onSubmit}
          disabled={busy}
          style={({ pressed }) => [
            styles.loginButton,
            busy && { opacity: 0.65 },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.loginButtonText}>
            {busy ? 'SIGNING IN…' : 'LOGIN'}
          </Text>
          {!busy ? (
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          ) : null}
        </Pressable>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalIcon}>
                  <Ionicons name="key-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.modalTitle}>Reset Password</Text>
              </View>
              <Pressable onPress={closeModal} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                placeholder="admin@gmail.com"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>New Password *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm New Password *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Repeat new password"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>

            {resetError ? <Text style={styles.resetErrorText}>{resetError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onSaveReset} disabled={resetBusy} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>
                  {resetBusy ? 'Saving…' : 'Update Password'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    ...SHADOWS.soft,
  },
  brandBadge: {
    alignSelf: 'center',
    width: 74,
    height: 74,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    padding: 6,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryText,
    textAlign: 'center',
    letterSpacing: 0.4,
    fontFamily: FONT_FAMILY,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 22,
    fontFamily: FONT_FAMILY,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADII.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
    fontFamily: FONT_FAMILY,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 16,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: COLORS.textBody,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  eyeButton: { padding: 6 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 20, paddingVertical: 4 },
  forgotText: { color: COLORS.primaryText, fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.pill,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.4,
    fontFamily: FONT_FAMILY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 29, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    ...SHADOWS.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: COLORS.textDark,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetErrorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.pill,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  cancelButtonText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.pill,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
});
