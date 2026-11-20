import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveMediaUrl } from '../api';
import {
  COLORS,
  FONT_FAMILY,
  RADII,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  useResponsive,
} from '../theme';

export function PageContainer({
  children,
  scroll = true,
  maxWidth,
  contentStyle,
  style,
  bottomPad,
}) {
  const { containerMaxWidth, horizontalPadding } = useResponsive();
  const insets = useSafeAreaInsets();
  const targetMax = maxWidth || containerMaxWidth;
  const padBottom =
    bottomPad !== undefined ? bottomPad : Math.max(insets.bottom, 12) + 96;

  const webBg =
    Platform.OS === 'web'
      ? {
          backgroundImage: `linear-gradient(180deg, #FFFFFF 0%, ${COLORS.bg} 32%, ${COLORS.bgGradientEnd} 100%)`,
        }
      : null;

  const inner = (
    <View
      style={[
        styles.pageInner,
        {
          maxWidth: targetMax,
          paddingHorizontal: horizontalPadding,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.pageRoot, webBg, style]}>
        <View style={[styles.pageNonScrollWrap, { paddingBottom: padBottom }]}>
          {inner}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.pageRoot, webBg, style]}
      contentContainerStyle={{
        paddingTop: 12,
        paddingBottom: padBottom,
        alignItems: 'center',
        minHeight: '100%',
      }}
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  );
}

export function Card({ children, style, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.cardPadded, style]}>
      {children}
    </View>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  icon,
  style,
  textStyle,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={active ? '#FFFFFF' : COLORS.primaryText}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          active ? styles.chipTextActive : styles.chipTextInactive,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PillButton({
  label,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'soft' | 'danger'
  icon,
  iconRight,
  disabled = false,
  style,
  textStyle,
  compact = false,
}) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isSoft = variant === 'soft';
  const isDanger = variant === 'danger';

  const bg = isPrimary
    ? COLORS.primary
    : isSoft
      ? COLORS.primaryLight
      : isDanger
        ? COLORS.dangerSoft
        : COLORS.card;

  const borderColor = isOutline
    ? COLORS.borderStrong
    : isDanger
      ? '#FECACA'
      : isSoft
        ? COLORS.primaryBorder
        : 'transparent';

  const fg = isPrimary
    ? '#FFFFFF'
    : isDanger
      ? COLORS.danger
      : isSoft
        ? COLORS.primaryText
        : COLORS.textDark;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pillBtn,
        compact && styles.pillBtnCompact,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: isOutline || isSoft || isDanger ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={[styles.pillBtnText, { color: fg }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
      {iconRight ? (
        <Ionicons name={iconRight} size={18} color={fg} style={{ marginLeft: 8 }} />
      ) : null}
    </Pressable>
  );
}

export function StatusPill({
  label = 'Active',
  bg = COLORS.statusBg,
  color = COLORS.statusText,
  dotColor = COLORS.statusText,
  style,
}) {
  return (
    <View style={[styles.statusPill, { backgroundColor: bg }, style]}>
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export function StatTile({
  label,
  value,
  icon,
  tint = COLORS.tileGreen,
  iconColor = COLORS.primary,
  borderColor,
  onPress,
  style,
  labelStyle,
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={[
        styles.statTile,
        {
          backgroundColor: tint,
          borderColor: borderColor || 'transparent',
          borderWidth: borderColor ? 1.5 : 0,
        },
        style,
      ]}
    >
      <View style={styles.statTileIconWrap}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      {value !== undefined && value !== null ? (
        <Text style={styles.statTileValue}>{value}</Text>
      ) : null}
      <Text style={[styles.statTileLabel, labelStyle]} numberOfLines={2}>
        {label}
      </Text>
    </Wrapper>
  );
}

export function CategoryCard({
  name,
  imageUrl,
  count,
  onPress,
  width,
  horizontal = false,
  icon = 'shirt-outline',
  style,
}) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveMediaUrl(imageUrl);

  useEffect(() => {
    setImgError(false);
  }, [resolvedUrl]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.catCard,
        width ? { width } : null,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.catImageBox, horizontal && { height: 108 }]}>
        {resolvedUrl && !imgError ? (
          <Image
            source={{ uri: resolvedUrl }}
            style={styles.catImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.catPlaceholder}>
            <View style={styles.catPlaceholderCircle}>
              <Ionicons name={icon} size={28} color={COLORS.primary} />
            </View>
          </View>
        )}
      </View>
      <View style={styles.catBody}>
        {!horizontal ? (
          <View style={styles.catIconBadge}>
            <Ionicons name={icon} size={16} color={COLORS.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.catName} numberOfLines={1}>
            {name}
          </Text>
          {count !== undefined && count !== null ? (
            <Text style={styles.catCount} numberOfLines={1}>
              {count} Products
            </Text>
          ) : null}
        </View>
        {!horizontal ? (
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}

export function ProductCard({
  name,
  designNumber,
  imageUrl,
  selected = false,
  onPress,
  onLongPress,
  onDetailPress,
  width,
  style,
}) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveMediaUrl(imageUrl);

  useEffect(() => {
    setImgError(false);
  }, [resolvedUrl]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.prodCard,
        selected && styles.prodCardSelected,
        width ? { width } : null,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.prodImageWrap}>
        {resolvedUrl && !imgError ? (
          <Image
            source={{ uri: resolvedUrl }}
            style={styles.prodImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.prodPlaceholder}>
            <Ionicons name="shirt-outline" size={30} color={COLORS.primaryText} />
          </View>
        )}
        <View
          style={[
            styles.checkbox,
            selected ? styles.checkboxChecked : styles.checkboxUnchecked,
          ]}
        >
          {selected ? (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          ) : null}
        </View>
      </View>
      <View style={styles.prodFooter}>
        <Text style={styles.prodName} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.prodMetaRow}>
          {designNumber ? (
            <Text style={styles.prodDesign} numberOfLines={1}>
              {designNumber}
            </Text>
          ) : (
            <View />
          )}
          {onDetailPress ? (
            <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                onDetailPress();
              }}
              hitSlop={8}
            >
              <Text style={styles.prodDetailLink}>Details</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function Stepper({ steps, currentStep, onStepPress }) {
  return (
    <View style={styles.stepperWrap}>
      {steps.map((item, idx) => {
        const n = idx + 1;
        const done = currentStep > n;
        const active = currentStep === n;
        const isLast = idx === steps.length - 1;
        return (
          <View key={item.title} style={styles.stepItem}>
            <View style={styles.stepTopRow}>
              <View
                style={[
                  styles.stepLine,
                  idx === 0
                    ? { backgroundColor: 'transparent' }
                    : {
                        backgroundColor:
                          currentStep >= n ? COLORS.primary : COLORS.borderStrong,
                      },
                ]}
              />
              <Pressable
                onPress={() => onStepPress?.(n)}
                style={[
                  styles.stepCircle,
                  done || active ? styles.stepCircleActive : styles.stepCircleNext,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumber}>{n}</Text>
                )}
              </Pressable>
              <View
                style={[
                  styles.stepLine,
                  isLast
                    ? { backgroundColor: 'transparent' }
                    : {
                        backgroundColor:
                          currentStep > n ? COLORS.primary : COLORS.borderStrong,
                      },
                ]}
              />
            </View>
            <Pressable
              onPress={() => onStepPress?.(n)}
              style={{ alignItems: 'center', paddingHorizontal: 2 }}
            >
              <Text
                style={[
                  styles.stepTitle,
                  (active || done) && { color: COLORS.textDark },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text style={styles.stepSub} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export function InfoCard({ icon = 'information-circle-outline', title, subtitle, style }) {
  return (
    <View style={[styles.infoCard, style]}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        {title ? <Text style={styles.infoTitle}>{title}</Text> : null}
        {subtitle ? <Text style={styles.infoSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function ActionBar({ children, style }) {
  const { actionBarMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const bottomPos = Math.max(insets.bottom, 10) + 74;
  return (
    <View
      style={[styles.actionBarOuter, { bottom: bottomPos }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.actionBarInner,
          { maxWidth: actionBarMaxWidth },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function EmptyState({
  icon = 'images-outline',
  title = 'Nothing here yet',
  subtitle,
  actionLabel,
  onAction,
  iconColor = COLORS.primary,
  iconBg = COLORS.primaryLight,
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={[styles.emptyIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <PillButton
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: 16, paddingHorizontal: 28 }}
        />
      ) : null}
    </View>
  );
}

export function AvatarCircle({ initials = 'SS', size = 38, style }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: Math.round(size * 0.36) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  pageNonScrollWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
  },
  pageInner: {
    width: '100%',
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardPadded: {
    padding: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipInactive: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: COLORS.textDark,
  },
  pillBtn: {
    minHeight: 48,
    borderRadius: RADII.pill,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnCompact: {
    minHeight: 42,
    paddingHorizontal: 16,
  },
  pillBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  statTile: {
    flex: 1,
    borderRadius: RADII.lg,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
  },
  statTileIconWrap: {
    marginBottom: 6,
  },
  statTileValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  statTileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  catCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  catImageBox: {
    width: '100%',
    height: 126,
    backgroundColor: COLORS.surfaceMuted,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.tileGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catPlaceholderCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    backgroundColor: COLORS.card,
  },
  catIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  catCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  prodCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  prodCardSelected: {
    borderColor: COLORS.primary,
  },
  prodImageWrap: {
    width: '100%',
    aspectRatio: 0.92,
    backgroundColor: COLORS.surfaceMuted,
  },
  prodImage: {
    width: '100%',
    height: '100%',
  },
  prodPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  prodFooter: {
    padding: 10,
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  prodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    gap: 6,
  },
  prodDesign: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  prodDetailLink: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleNext: {
    backgroundColor: '#CBD5E1',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  stepSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  infoSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  actionBarOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionBarInner: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADII.nav,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...SHADOWS.floating,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
    fontFamily: FONT_FAMILY,
  },
  avatar: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pressed: {
    opacity: 0.85,
  },
});
