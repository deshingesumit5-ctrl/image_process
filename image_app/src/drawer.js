import React, { createContext, useContext, useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './auth';
import { COLORS, FONT_FAMILY, RADII, getInitials } from './theme';
import { AvatarCircle } from './components/ui';

const DrawerContext = createContext(null);

export function DrawerProvider({ children }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  return useContext(DrawerContext);
}

export function Hamburger() {
  const drawer = useDrawer();
  return (
    <Pressable
      onPress={() => drawer?.setOpen(true)}
      style={{ paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' }}
    >
      <Ionicons name="menu-outline" size={24} color={COLORS.textDark} />
    </Pressable>
  );
}

export function AppDrawer() {
  const drawer = useDrawer();
  const nav = useNavigation();
  const { user, logout } = useAuth();
  if (!drawer?.open) return null;

  const go = (name) => {
    drawer.setOpen(false);
    nav.navigate(name);
  };

  const perms = user?.permissions || {};
  const items = [
    { name: 'Home', label: 'Dashboard', icon: 'home-outline', show: true },
    {
      name: 'Categories',
      label: 'Categories',
      icon: 'grid-outline',
      show: !!perms.category?.view || !!perms.product?.view,
    },
    {
      name: 'Process',
      label: 'Image Processing',
      icon: 'sparkles-outline',
      show: !!perms.processing?.view || true,
    },
    { name: 'Shortlist', label: 'Shortlist', icon: 'heart-outline', show: true },
    { name: 'Profile', label: 'Profile', icon: 'person-outline', show: true },
  ].filter((i) => i.show);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={drawer.open}
      onRequestClose={() => drawer.setOpen(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.brandHeader}>
            <Image
              source={require('../assets/applogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>RCD Group</Text>
              <Text style={styles.brandSub}>Image Processing</Text>
            </View>
            <Pressable
              onPress={() => drawer.setOpen(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <View style={styles.userCard}>
            <AvatarCircle initials={getInitials(user?.name)} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Sales Staff'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || ''}
              </Text>
            </View>
          </View>

          <View style={styles.menuList}>
            {items.map((item) => (
              <Pressable
                key={item.name}
                onPress={() => go(item.name)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: COLORS.primaryLight },
                ]}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textLight}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => {
              drawer.setOpen(false);
              logout();
            }}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
        <Pressable style={{ flex: 1 }} onPress={() => drawer.setOpen(false)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 42, 29, 0.35)',
  },
  sheet: {
    width: 292,
    backgroundColor: COLORS.card,
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderTopRightRadius: RADII.xl,
    borderBottomRightRadius: RADII.xl,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  brandSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  menuList: {
    flex: 1,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: RADII.md,
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
    fontFamily: FONT_FAMILY,
  },
});
