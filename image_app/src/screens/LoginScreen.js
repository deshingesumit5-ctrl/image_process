import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useAuth } from '../auth';
import { API_BASE_URL } from '../config';
import { Feather } from '@expo/vector-icons';

// Color palette matching the dark admin panel design
const COLORS = {
  bg: '#0b0f1a',
  card: '#111726',
  border: 'rgba(255,255,255,0.1)',
  inputBg: '#0b0f1a',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  placeholder: '#64748b',
  emerald: '#059669',
  emeraldLight: '#34d399',
  emeraldDark: '#047857',
  iconCircle: 'rgba(6, 95, 70, 0.4)',
  errorBg: 'rgba(244,63,94,0.1)',
  errorText: '#fb7185',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('sales@image.test');
  const [password, setPassword] = useState('password');
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

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
             <View style={styles.iconCircle}>
          <Feather name="user" size={28} color={COLORS.emeraldLight} />
        </View>

        <Text style={styles.title}>Image Process App</Text>
        <Text style={styles.subtitle}>Sign in with your credentials</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email Address</Text>
         <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
          <Feather name="mail" size={16} color={COLORS.placeholder} style={styles.inputIcon} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholder="Enter email"
            placeholderTextColor={COLORS.placeholder}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
          <Feather name="lock" size={16} color={COLORS.placeholder} style={styles.inputIcon} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Enter password"
            placeholderTextColor={COLORS.placeholder}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            style={styles.input}
          />
        </View>
        <Pressable onPress={openForgotPassword} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>

        <Pressable onPress={onSubmit} disabled={busy} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>
            {busy ? 'SIGNING IN…' : 'LOGIN'}{!busy ? '  →' : ''}
          </Text>
        </Pressable>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑  Forgot / Reset Password</Text>
              <Pressable onPress={closeModal}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Admin Email Address *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                placeholder="admin@gmail.com"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Enter New Password *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showNewPassword ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm New Password *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Repeat new password"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>

            {resetError ? (
              <Text style={styles.resetErrorText}>{resetError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onSaveReset} disabled={resetBusy} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>
                  {resetBusy ? 'Saving…' : 'Save & Update Password'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.iconCircle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconGlyph: { fontSize: 26 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: { color: COLORS.errorText, fontSize: 13 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputWrapperFocused: {
    borderColor: COLORS.emeraldLight,
  },

  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    fontSize: 14,
    outlineStyle: 'none', // removes default browser focus ring on web
  },
  eyeButton: { padding: 6 },
  eyeIcon: { fontSize: 16 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 20 },
  forgotText: { color: COLORS.emeraldLight, fontSize: 13, fontWeight: '600' },
  loginButton: {
    backgroundColor: COLORS.emerald,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
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
  modalTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  modalClose: { color: COLORS.textSecondary, fontSize: 18 },
  resetErrorText: { color: COLORS.errorText, fontSize: 13, marginBottom: 8 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: { color: '#e2e8f0', fontSize: 13 },
  saveButton: {
    backgroundColor: COLORS.emerald,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveButtonText: { color: 'white', fontSize: 13, fontWeight: '600' },
});