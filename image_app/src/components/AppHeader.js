import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth';
import { useDrawer } from '../drawer';
import { COLORS, FONT_FAMILY, getInitials, useResponsive } from '../theme';
import { AvatarCircle } from './ui';

export const NAV_ITEMS = [
  { name: 'Home', label: 'Dashboard', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Categories', label: 'Categories', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'Processing', label: 'Processing', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { name: 'Shortlist', label: 'Shortlist', icon: 'heart-outline', activeIcon: 'heart' },
  { name: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function AppHeader({
  title,
  subtitle,
  isDashboard = false,
  showBack = false,
  onBack,
  showSearch = true,
  onSearchPress,
}) {
  const { user } = useAuth();
  const drawer = useDrawer();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDesktop, containerMaxWidth, horizontalPadding } = useResponsive();
  const initials = getInitials(user?.name);

  const handleBack = () => {
    if (onBack) return onBack();
    if (nav.canGoBack()) nav.goBack();
  };

  const handleSearch = () => {
    if (onSearchPress) return onSearchPress();
    nav.navigate('Categories', { screen: 'Products', params: { q: '' } });
  };

  const goTab = (name) => {
    if (name === 'Categories') {
      nav.navigate('Categories', { screen: 'CategoryList' });
      return;
    }
    if (name === 'Processing') {
      nav.navigate('Processing', { screen: 'ProcessHome' });
      return;
    }
    nav.navigate(name);
  };

  return (
    <View style={[styles.outer, { paddingTop: Math.max(insets.top, 6) }]}>
      <View
        style={[
          styles.inner,
          {
            maxWidth: isDesktop ? containerMaxWidth : '100%',
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Left: Back or Hamburger + Brand/Title */}
        <View style={styles.leftGroup}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              accessibilityLabel="Back"
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => drawer?.setOpen(true)}
              accessibilityLabel="Menu"
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="menu-outline" size={24} color={COLORS.textDark} />
            </Pressable>
          )}

          {isDashboard ? (
            <Pressable onPress={() => goTab('Home')} style={styles.brandRow}>
              <Image
                source={require('../../assets/applogo.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
              <View style={styles.titleBlock}>
                <Text style={styles.brandTitle}>RCD Group</Text>
                <Text style={styles.brandSub}>Image Processing</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.titleBlock}>
              <Text style={styles.screenTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.screenSub} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Right: Search, Bell, Avatar */}
        <View style={styles.rightGroup}>
          {(showSearch && (!isDashboard || isDesktop)) ? (
            <Pressable
              onPress={handleSearch}
              accessibilityLabel="Search"
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="search-outline" size={21} color={COLORS.textDark} />
            </Pressable>
          ) : null}
          <View style={styles.iconBtn} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={21} color={COLORS.textDark} />
          </View>
          {(isDashboard || isDesktop) ? (
            <Pressable
              onPress={() => goTab('Profile')}
              accessibilityLabel="Profile"
              style={{ marginLeft: 4 }}
            >
              <AvatarCircle initials={initials} size={36} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  titleBlock: {
    flexShrink: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  brandSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
    lineHeight: 15,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  screenSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
