import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_FAMILY, RADII } from '../theme';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function ImagePreviewModal({
  visible,
  uri,
  title = 'Processed Image',
  onClose,
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const gestureRef = useRef(null);

  scaleRef.current = scale;
  offsetRef.current = offset;

  useEffect(() => {
    if (visible) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [visible, uri]);

  const clampScale = (val) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, val));

  const applyZoom = (nextScale) => {
    const clamped = clampScale(nextScale);
    setScale(clamped);
    if (clamped <= 1.01) {
      setOffset({ x: 0, y: 0 });
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2 || g.numberActiveTouches >= 2,
        onPanResponderGrant: (e) => {
          const touches = e.nativeEvent.touches || [];
          if (touches.length >= 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            gestureRef.current = {
              mode: 'pinch',
              startDist: Math.hypot(dx, dy) || 1,
              startScale: scaleRef.current,
            };
          } else {
            gestureRef.current = {
              mode: 'pan',
              startOffset: { ...offsetRef.current },
            };
          }
        },
        onPanResponderMove: (e, g) => {
          const touches = e.nativeEvent.touches || [];
          if (touches.length >= 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const dist = Math.hypot(dx, dy) || 1;
            if (!gestureRef.current || gestureRef.current.mode !== 'pinch') {
              gestureRef.current = {
                mode: 'pinch',
                startDist: dist,
                startScale: scaleRef.current,
              };
            }
            const next = clampScale(
              gestureRef.current.startScale * (dist / gestureRef.current.startDist)
            );
            setScale(next);
            if (next <= 1.01) setOffset({ x: 0, y: 0 });
            return;
          }
          if (scaleRef.current > 1.02 && gestureRef.current?.mode === 'pan') {
            setOffset({
              x: gestureRef.current.startOffset.x + g.dx,
              y: gestureRef.current.startOffset.y + g.dy,
            });
          }
        },
        onPanResponderRelease: (_, g) => {
          if (
            gestureRef.current?.mode === 'pan' &&
            Math.abs(g.dx) < 5 &&
            Math.abs(g.dy) < 5
          ) {
            const now = Date.now();
            if (now - lastTapRef.current < 280) {
              applyZoom(scaleRef.current > 1.2 ? 1 : 2.4);
              lastTapRef.current = 0;
            } else {
              lastTapRef.current = now;
            }
          }
          gestureRef.current = null;
        },
      }),
    []
  );

  const webWheelHandler =
    Platform.OS === 'web'
      ? {
          onWheel: (e) => {
            e.preventDefault?.();
            const delta = e.nativeEvent?.deltaY ?? e.deltaY ?? 0;
            applyZoom(scaleRef.current + (delta < 0 ? 0.25 : -0.25));
          },
        }
      : {};

  if (!visible || !uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Top Bar */}
        <View
          style={[
            styles.topBar,
            { paddingTop: Math.max(insets.top, 12) + 4 },
          ]}
        >
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.controlsRow}>
            <Pressable
              onPress={() => applyZoom(scale - 0.5)}
              style={styles.ctrlBtn}
              accessibilityLabel="Zoom out"
            >
              <Ionicons name="remove" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => applyZoom(1)}
              style={styles.zoomBadge}
              accessibilityLabel="Reset zoom"
            >
              <Text style={styles.zoomBadgeText}>{Math.round(scale * 100)}%</Text>
            </Pressable>
            <Pressable
              onPress={() => applyZoom(scale + 0.5)}
              style={styles.ctrlBtn}
              accessibilityLabel="Zoom in"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close preview"
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Zoomable Stage */}
        <View
          style={styles.stage}
          {...panResponder.panHandlers}
          {...webWheelHandler}
        >
          <Image
            source={{ uri }}
            style={{
              width: Math.min(width - 24, 920),
              height: Math.min(height - 170, 760),
              transform: [
                { translateX: offset.x },
                { translateY: offset.y },
                { scale },
              ],
            }}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Hint */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <Text style={styles.hintText}>
            {Platform.OS === 'web'
              ? 'Double-tap, scroll, or use +/- to zoom'
              : 'Pinch, double-tap, or use +/- to zoom'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 15, 11, 0.96)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctrlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBadge: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bottomBar: {
    alignItems: 'center',
    paddingTop: 8,
  },
  hintText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
});
