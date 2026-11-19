import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuth } from '../auth';
import { COLORS, FONT_FAMILY, RADII, SHADOWS, useResponsive } from '../theme';
import {
  EmptyState,
  PageContainer,
  StatTile,
  StatusPill,
} from '../components/ui';

export default function SubCategoriesScreen({ route, navigation }) {
  const { category } = route.params;
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const { isDesktop, contentWidth } = useResponsive();

  useEffect(() => {
    navigation.setOptions({ title: category.name });
    api.subCategories(token, category.id).then((r) => setItems(r.data || [])).catch(() => {});
  }, [category, token, navigation]);

  const activeCount = items.filter((s) => s.status !== false).length;
  const productCount =
    category?.products_count ??
    category?.product_count ??
    (items.some((s) => s.products_count != null)
      ? items.reduce((acc, s) => acc + (Number(s.products_count) || 0), 0)
      : null);

  const webBannerGrad =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(125deg, #F3F8F3 0%, #E7F3E9 55%, #F5EEE3 100%)',
        }
      : null;

  const rowGap = 10;
  const rowWidth = isDesktop ? Math.floor((contentWidth - rowGap) / 2) : '100%';

  return (
    <PageContainer>
      {/* Hero Banner */}
      <View style={[styles.banner, webBannerGrad]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{category.name}</Text>
          <Text style={styles.bannerSub}>
            Manage sub-categories and related products
          </Text>
        </View>
        <View style={styles.bannerIcon}>
          <Ionicons name="layers-outline" size={32} color={COLORS.primary} />
        </View>
      </View>

      {/* Tinted Stat Tiles (real values only) */}
      <View style={styles.statsRow}>
        {productCount !== null ? (
          <StatTile
            label="Products"
            value={productCount}
            icon="cube-outline"
            tint={COLORS.tileGreen}
            iconColor={COLORS.primary}
          />
        ) : null}
        <StatTile
          label="Active"
          value={activeCount}
          icon="checkmark-circle-outline"
          tint={COLORS.tileBlue}
          iconColor="#1D6FA5"
        />
        <StatTile
          label="Sub-Categories"
          value={items.length}
          icon="layers-outline"
          tint={COLORS.tilePeach}
          iconColor="#B45309"
        />
      </View>

      <Text style={styles.sectionTitle}>Sub-Categories</Text>

      {items.length === 0 ? (
        <EmptyState
          icon="layers-outline"
          title="No sub-categories yet"
          subtitle={`No sub-categories found under ${category.name}.`}
        />
      ) : (
        <View style={[styles.list, { gap: rowGap }]}>
          {items.map((sub) => {
            const thumb = sub.thumbnail_url || sub.image_url;
            const subCount = sub.products_count ?? sub.product_count;
            const isActive = sub.status !== false;
            return (
              <Pressable
                key={sub.id}
                onPress={() => navigation.navigate('Products', { category, sub })}
                style={({ pressed }) => [
                  styles.rowCard,
                  { width: rowWidth },
                  pressed && { opacity: 0.88 },
                ]}
              >
                <View style={styles.thumbBox}>
                  {thumb ? (
                    <Image
                      source={{ uri: thumb }}
                      style={styles.thumbImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="shirt-outline" size={24} color={COLORS.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {sub.name}
                  </Text>
                  {subCount !== undefined && subCount !== null ? (
                    <Text style={styles.rowSub}>{subCount} Products</Text>
                  ) : null}
                </View>
                {isActive ? <StatusPill label="Active" /> : null}
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.tileGreen,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...SHADOWS.soft,
  },
  bannerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  bannerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
    fontFamily: FONT_FAMILY,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rowCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    ...SHADOWS.soft,
  },
  thumbBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  rowSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
});
