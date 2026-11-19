import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth';
import { useDrawer } from '../drawer';
import { COLORS, FONT_FAMILY, RADII, getInitials, useResponsive } from '../theme';
import { AvatarCircle } from './ui';

export const NAV_ITEMS = [
  { name: 'Home', label: 'Dashboard', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Categories', label: 'Categories', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'Processing', label: 'Processing', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { name: 'Shortlist', label: 'Shortlist', icon: 'heart-outline', activeIcon: 'heart' },
  { name: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

function useActiveTabName(fallbackName) {
  return useNavigationState((state) => {
    if (!state) return fallbackName;
    let cur = state;
    // Walk up or check root tab routes
    if (cur.routes && cur.routes[cur.index]) {
      const top = cur.routes[cur.index].name;
      if (NAV_ITEMS.some((it) => it.name === top)) return top;
    }
    return fallbackName;
  });
}

export default function AppHeader({
  title,
  subtitle,
  isDashboard = false,
  showBack = false,
  onBack,
  showSearch = true,
  onSearchPress,
  activeTab: activeTabProp,
}) {
  const { user } = useAuth();
  const drawer = useDrawer();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDesktop, containerMaxWidth, horizontalPadding } = useResponsive();
  const detectedTab = useActiveTabName(activeTabProp);
  const activeTab = activeTabProp || detectedTab;
  const initials = getInitials(user?.name);
  const perms = user?.permissions || {};

  const visibleNavItems = NAV_ITEMS.filter((it) => {
    if (it.name === 'Categories') {
      return !!perms.category?.view || !!perms.product?.view || true;
    }
    return true;
  });

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
          ) : !isDesktop ? (
            <Pressable
              onPress={() => drawer?.setOpen(true)}
              accessibilityLabel="Menu"
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="menu-outline" size={24} color={COLORS.textDark} />
            </Pressable>
          ) : (
            <Pressable onPress={() => goTab('Home')} style={styles.brandRow}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImg}
              />
              <View>
                <Text style={styles.brandTitle}>RCD Group</Text>
                <Text style={styles.brandSub}>Image Processing</Text>
              </View>
            </Pressable>
          )}

          {!isDesktop ? (
            isDashboard ? (
              <View style={styles.titleBlock}>
                <Text style={styles.brandTitle}>RCD Group</Text>
                <Text style={styles.brandSub}>Image Processing</Text>
              </View>
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
            )
          ) : showBack && title ? (
            <View style={[styles.titleBlock, { marginLeft: 8 }]}>
              <Text style={styles.screenTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.screenSub} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Desktop Center: Horizontal Nav Pills */}
        {isDesktop ? (
          <View style={styles.desktopNav}>
            {visibleNavItems.map((item) => {
              const active = activeTab === item.name;
              return (
                <Pressable
                  key={item.name}
                  onPress={() => goTab(item.name)}
                  style={({ pressed }) => [
                    styles.navPill,
                    active && styles.navPillActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={16}
                    color={active ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.navPillText,
                      active && styles.navPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Right: Search, Bell, Avatar */}
        <View style={styles.rightGroup}>
          {showSearch && !isDashboard ? (
            <Pressable
              onPress={handleSearch}
              accessibilityLabel="Search"
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="search-outline" size={21} color={COLORS.textDark} />
            </Pressable>
          ) : null}
          {isDesktop && isDashboard ? (
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
    width: 36,
    height: 36,
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
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceMuted,
    padding: 4,
    borderRadius: RADII.pill,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.pill,
  },
  navPillActive: {
    backgroundColor: COLORS.primaryLight,
  },
  navPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  navPillTextActive: {
    color: COLORS.primaryText,
    fontWeight: '700',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
