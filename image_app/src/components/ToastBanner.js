import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, RADII, SHADOWS } from '../theme';

export default function ToastBanner({ toast, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => onHide?.());
    }, toast.duration || 2800);

    return () => clearTimeout(timer);
  }, [toast, opacity, onHide]);

  if (!toast?.message) return null;

  const isError = toast.type === 'error';
  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="box-none">
      <Pressable
        onPress={onHide}
        style={[
          styles.pill,
          isError ? styles.pillError : styles.pillSuccess,
        ]}
      >
        <Ionicons
          name={isError ? 'alert-circle' : 'checkmark-circle'}
          size={18}
          color="#FFFFFF"
        />
        <Text style={styles.text} numberOfLines={2}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: RADII.pill,
    maxWidth: 460,
    ...SHADOWS.floating,
  },
  pillSuccess: {
    backgroundColor: COLORS.primary,
  },
  pillError: {
    backgroundColor: COLORS.danger,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    flexShrink: 1,
  },
});
