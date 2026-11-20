import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  api,
  enrichCategoriesWithProducts,
  fetchAllCategories,
  fetchAllProductsWithMeta,
} from '../api';
import { useAuth } from '../auth';
import { COLORS, FONT_FAMILY, RADII, SHADOWS, useResponsive } from '../theme';
import {
  Card,
  CategoryCard,
  EmptyState,
  PageContainer,
  PillButton,
  StatTile,
} from '../components/ui';

function formatStatCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return '0';
  return num.toLocaleString();
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const nav = useNavigation();
  const { isDesktop, isMobile, categoryCols, contentWidth } = useResponsive();
  const [q, setQ] = useState('');
  const [shortCount, setShortCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [processedImages, setProcessedImages] = useState(0);
  const [categories, setCategories] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [shortRes, catRes, prodRes, recentRes] = await Promise.allSettled([
          api.shortlist(token),
          fetchAllCategories(token),
          fetchAllProductsWithMeta(token),
          api.recentProcess(token),
        ]);
        if (!active) return;

        const nextShortCount =
          shortRes.status === 'fulfilled'
            ? Number(shortRes.value?.count ?? shortRes.value?.items?.length ?? 0)
            : 0;
        setShortCount(Number.isFinite(nextShortCount) ? nextShortCount : 0);

        const rawCats = catRes.status === 'fulfilled' ? catRes.value : [];
        const prodPayload =
          prodRes.status === 'fulfilled'
            ? prodRes.value
            : { items: [], total: 0 };
        const rawProds = prodPayload.items || [];
        const nextTotalProducts = Number(prodPayload.total ?? rawProds.length ?? 0);
        setTotalProducts(Number.isFinite(nextTotalProducts) ? nextTotalProducts : 0);

        const processedProductImages = rawProds.reduce(
          (sum, p) =>
            sum +
            (p?.images || []).filter((img) => Boolean(img?.is_processed)).length,
          0
        );
        const recentLogs =
          recentRes.status === 'fulfilled' ? recentRes.value?.data || [] : [];
        const recentLogsImageSum = recentLogs.reduce(
          (sum, row) => sum + (Number(row?.image_count) || 0),
          0
        );
        const recentTotal =
          recentRes.status === 'fulfilled' && recentRes.value?.total != null
            ? Number(recentRes.value.total)
            : recentLogsImageSum;
        const nextProcessedImages = Math.max(
          processedProductImages,
          Number.isFinite(recentTotal) ? recentTotal : 0
        );
        setProcessedImages(nextProcessedImages);

        setCategories(enrichCategoriesWithProducts(rawCats, rawProds));
      })();
      return () => {
        active = false;
      };
    }, [token])
  );

  const search = () => nav.navigate('Categories', { screen: 'Products', params: { q } });

  const webHeroGrad =
    Platform.OS === 'web'
      ? {
        backgroundImage: 'linear-gradient(125deg, #E4F4E7 0%, #F2F7F1 55%, #F8EFE2 100%)',
      }
      : null;

  const gridGap = 12;
  const desktopCardW = Math.floor((contentWidth - gridGap * (categoryCols - 1)) / categoryCols);

  return (
    <PageContainer>
      {/* Greeting row */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingTitle}>Hi, {user?.name || 'Sales Staff'} 👋</Text>
          <Text style={styles.greetingSub}>
            Manage products, process images & backgrounds
          </Text>
        </View>
    
      </View>

      {/* Desktop 2-column top section: Hero Banner + Quick Tiles & Stats */}
      <View style={[isDesktop && styles.desktopTopGrid]}>
        {/* Hero Banner Card */}
        <View style={[styles.heroCard, webHeroGrad, isDesktop && { flex: 1.35 }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>
              Image{'\n'}Processing
            </Text>
            <Text style={styles.heroDesc}>
              Crop, Remove Background & Apply New Backgrounds
            </Text>
            <PillButton
              label="Process Now"
              iconRight="arrow-forward"
              onPress={() => nav.navigate('Processing')}
              compact
              style={styles.heroBtn}
            />
          </View>
          <View style={styles.heroVisual}>
            <View style={styles.heroCutoutBox}>
              <Ionicons name="shirt-outline" size={36} color={COLORS.primary} />
            </View>
            <View style={styles.heroArrowBadge}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </View>
            <View style={styles.heroAfterBox}>
              <Ionicons name="shirt" size={40} color={COLORS.primary} />
            </View>
          </View>
        </View>

        {/* Right column on Desktop (or stacked on Mobile/Tablet) */}
        <View style={[isDesktop ? { flex: 1, gap: 12 } : { gap: 14 }]}>
          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchPill}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                value={q}
                onChangeText={setQ}
                onSubmitEditing={search}
                returnKeyType="search"
                placeholder="Search products, categories or design number..."
                placeholderTextColor={COLORS.textLight}
                style={styles.searchInput}
              />
            </View>
            <Pressable
              onPress={search}
              accessibilityLabel="Search"
              style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="options-outline" size={20} color={COLORS.textDark} />
            </Pressable>
          </View>

          {/* 4 Quick Tiles: Image Processing, Background Master, Product Master, Shortlist */}
          <View style={[styles.tilesRow, isMobile && { gap: 8 }]}>
            <StatTile
              label="Image Processing"
              icon="color-wand-outline"
              tint={COLORS.tileGreen}
              iconColor={COLORS.primary}
              borderColor={COLORS.primary}
              style={isMobile ? styles.quickTileMobile : undefined}
              labelStyle={isMobile ? styles.quickTileLabelMobile : undefined}
              onPress={() => nav.navigate('Processing', { screen: 'ProcessHome' })}
            />
            <StatTile
              label="Background Master"
              icon="image-outline"
              tint={COLORS.tilePeach}
              iconColor="#6B4F28"
              style={isMobile ? styles.quickTileMobile : undefined}
              labelStyle={isMobile ? styles.quickTileLabelMobile : undefined}
              onPress={() =>
                nav.navigate('Processing', {
                  screen: 'ProcessWizard',
                  params: { step: 3 },
                })
              }
            />
            <StatTile
              label="Product Master"
              icon="cube-outline"
              tint={COLORS.tileBlue}
              iconColor="#1D6FA5"
              style={isMobile ? styles.quickTileMobile : undefined}
              labelStyle={isMobile ? styles.quickTileLabelMobile : undefined}
              onPress={() => nav.navigate('Categories', { screen: 'Products' })}
            />
            <StatTile
              label="Shortlist"
              icon="heart-outline"
              tint={COLORS.tilePink}
              iconColor={COLORS.heart}
              style={isMobile ? styles.quickTileMobile : undefined}
              labelStyle={isMobile ? styles.quickTileLabelMobile : undefined}
              onPress={() => nav.navigate('Shortlist')}
            />
          </View>

          {/* Real Data Summary Card: Total Products, Processed Images, Shortlisted */}
          <Card style={styles.statsCard}>
            <Pressable
              onPress={() => nav.navigate('Categories', { screen: 'Products' })}
              style={[styles.statColumn, isMobile && styles.statColumnMobile]}
            >
              <View style={styles.statIconWrap}>
                <Ionicons name="cube-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={[styles.statTextWrap, isMobile && { alignItems: 'center' }]}>
                <Text style={styles.statLabel} numberOfLines={2}>
                  Total Products
                </Text>
                <Text style={styles.statNumber}>{formatStatCount(totalProducts)}</Text>
              </View>
            </Pressable>

            <View style={styles.statDivider} />

            <Pressable
              onPress={() => nav.navigate('Processing', { screen: 'ProcessHome' })}
              style={[styles.statColumn, isMobile && styles.statColumnMobile]}
            >
              <View style={styles.statIconWrap}>
                <Ionicons name="image-outline" size={22} color="#1D6FA5" />
              </View>
              <View style={[styles.statTextWrap, isMobile && { alignItems: 'center' }]}>
                <Text style={styles.statLabel} numberOfLines={2}>
                  Processed Images
                </Text>
                <Text style={styles.statNumber}>{formatStatCount(processedImages)}</Text>
              </View>
            </Pressable>

            <View style={styles.statDivider} />

            <Pressable
              onPress={() => nav.navigate('Shortlist')}
              style={[styles.statColumn, isMobile && styles.statColumnMobile]}
            >
              <View style={styles.statIconWrap}>
                <Ionicons name="heart-outline" size={22} color={COLORS.heart} />
              </View>
              <View style={[styles.statTextWrap, isMobile && { alignItems: 'center' }]}>
                <Text style={styles.statLabel} numberOfLines={2}>
                  Shortlisted
                </Text>
                <Text style={styles.statNumber}>{formatStatCount(shortCount)}</Text>
              </View>
            </Pressable>
          </Card>
        </View>
      </View>

      {/* Categories Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Pressable
          onPress={() => nav.navigate('Categories')}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primaryText} />
        </Pressable>
      </View>

      {categories.length === 0 ? (
        <EmptyState
          icon="grid-outline"
          title="No categories available"
          subtitle="Categories from your catalog will appear here."
        />
      ) : isMobile ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
        >
          {categories.map((cat) => (
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
              horizontal
              width={138}
              onPress={() =>
                nav.navigate('Categories', {
                  screen: 'SubCategories',
                  params: { category: cat },
                })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.catGrid, { gap: gridGap }]}>
          {categories.map((cat) => (
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
              width={desktopCardW}
              onPress={() =>
                nav.navigate('Categories', {
                  screen: 'SubCategories',
                  params: { category: cat },
                })
              }
            />
          ))}
        </View>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  greetingSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  logoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 40,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  desktopTopGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: COLORS.tileGreen,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: '#D5EAD8',
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  heroLeft: {
    flex: 1.3,
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    color: COLORS.textDark,
    lineHeight: 26,
    fontFamily: FONT_FAMILY,
  },
  heroDesc: {
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 17,
    fontFamily: FONT_FAMILY,
  },
  heroBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
  },
  heroVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroCutoutBox: {
    width: 48,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArrowBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  heroAfterBox: {
    width: 56,
    height: 74,
    borderRadius: 14,
    backgroundColor: '#FAF3E8',
    borderWidth: 1,
    borderColor: '#EADBC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    ...SHADOWS.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textBody,
    fontFamily: FONT_FAMILY,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickTileMobile: {
    paddingHorizontal: 5,
    paddingVertical: 12,
    minHeight: 86,
  },
  quickTileLabelMobile: {
    fontSize: 11,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  statColumnMobile: {
    flexDirection: 'column',
    gap: 4,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: {
    flexShrink: 1,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  statNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
