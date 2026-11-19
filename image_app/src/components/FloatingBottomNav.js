import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_FAMILY, RADII, SHADOWS, useResponsive } from '../theme';
import { NAV_ITEMS } from './AppHeader';

export default function FloatingBottomNav({ state, navigation }) {
  const { isDesktop, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outer,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, (isTablet || isDesktop) && { maxWidth: 640 }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = NAV_ITEMS.find((it) => it.name === route.name) || {
            label: route.name,
            icon: 'ellipse-outline',
            activeIcon: 'ellipse',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              style={({ pressed }) => [
                styles.item,
                focused && styles.itemActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons
                name={focused ? meta.activeIcon : meta.icon}
                size={20}
                color={focused ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  bar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.nav,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 6,
    ...SHADOWS.floating,
  },
  item: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADII.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
    gap: 2,
  },
  itemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  labelActive: {
    color: COLORS.primaryText,
    fontWeight: '700',
  },
});
