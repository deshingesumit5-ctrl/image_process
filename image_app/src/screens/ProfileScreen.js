import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuth } from '../auth';
import {
  AvatarCircle,
  Card,
  PageContainer,
  PillButton,
} from '../components/ui';
import { COLORS, FONT_FAMILY, RADII, getInitials } from '../theme';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');

  const save = async () => {
    try {
      await api.updateProfile(token, {
        name,
        ...(password ? { password, current_password: current } : {}),
      });
      Alert.alert('Saved');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <PageContainer maxWidth={580}>
      <Card style={styles.profileCard}>
        <AvatarCircle initials={getInitials(user?.name)} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Sales Staff'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.role ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Profile Settings</Text>

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={17} color={COLORS.textMuted} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={17} color={COLORS.textMuted} />
          <TextInput
            value={current}
            onChangeText={setCurrent}
            placeholder="Current password"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="key-outline" size={17} color={COLORS.textMuted} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <PillButton
          label="Update Profile"
          icon="checkmark-circle-outline"
          onPress={save}
          style={{ marginTop: 6 }}
        />

        <PillButton
          label="Logout"
          icon="log-out-outline"
          variant="danger"
          onPress={logout}
          style={{ marginTop: 12 }}
        />
      </Card>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  formCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 14,
    fontFamily: FONT_FAMILY,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
    fontFamily: FONT_FAMILY,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textBody,
    paddingVertical: 10,
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
});
