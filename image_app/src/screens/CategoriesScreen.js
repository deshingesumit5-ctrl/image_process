import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  enrichCategoriesWithProducts,
  fetchAllCategories,
  fetchAllProducts,
} from '../api';
import { useAuth } from '../auth';
import { COLORS, FONT_FAMILY, RADII, SHADOWS, useResponsive } from '../theme';
import {
  CategoryCard,
  EmptyState,
  PageContainer,
  PillButton,
} from '../components/ui';

export default function CategoriesScreen({ navigation }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const { categoryCols, contentWidth } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [catRes, prodRes] = await Promise.allSettled([
          fetchAllCategories(token),
          fetchAllProducts(token),
        ]);
        if (!active) return;
        const rawCats = catRes.status === 'fulfilled' ? catRes.value : [];
        const rawProds = prodRes.status === 'fulfilled' ? prodRes.value : [];
        setItems(enrichCategoriesWithProducts(rawCats, rawProds));
      })();
      return () => {
        active = false;
      };
    }, [token])
  );

  const gap = 12;
  const cardWidth = Math.floor((contentWidth - gap * (categoryCols - 1)) / categoryCols);

  const webBannerGrad =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(125deg, #F4F8F4 0%, #E6F2EA 55%, #F4ECE0 100%)',
        }
      : null;

  return (
    <PageContainer>
      {/* Hero Banner */}
      <View style={[styles.banner, webBannerGrad]}>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>Premium{'\n'}Apparel Collection</Text>
          <Text style={styles.bannerSub}>
            Explore & manage product categories
          </Text>
          <PillButton
            label="Explore Now"
            iconRight="arrow-forward"
            compact
            onPress={() => navigation.navigate('Products', { q: '' })}
            style={styles.bannerBtn}
          />
        </View>
        <View style={styles.bannerVisual}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="shirt-outline" size={42} color={COLORS.primary} />
          </View>
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="grid-outline"
          title="No categories found"
          subtitle="Categories added to your catalog will appear here."
        />
      ) : (
        <View style={[styles.grid, { gap }]}>
          {items.map((cat) => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              imageUrl={
                cat.resolved_thumbnail ||
                cat.thumbnail_url ||
                cat.image_url ||
                cat.image_path
              }
              count={cat.products_count ?? cat.product_count}
              width={cardWidth}
              onPress={() => navigation.navigate('SubCategories', { category: cat })}
            />
          ))}
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
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...SHADOWS.soft,
  },
  bannerTextCol: {
    flex: 1.4,
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 27,
    fontFamily: FONT_FAMILY,
  },
  bannerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 14,
    fontFamily: FONT_FAMILY,
  },
  bannerBtn: {
    minHeight: 42,
    paddingHorizontal: 18,
  },
  bannerVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
