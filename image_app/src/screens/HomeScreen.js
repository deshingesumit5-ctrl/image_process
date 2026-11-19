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
import { api } from '../api';
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

export default function HomeScreen() {
  const { token, user, logout } = useAuth();
  const nav = useNavigation();
  const { isDesktop, isMobile, categoryCols, contentWidth } = useResponsive();
  const [q, setQ] = useState('');
  const [shortCount, setShortCount] = useState(0);
  const [categories, setCategories] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [s, c] = await Promise.all([api.shortlist(token), api.categories(token)]);
        setShortCount(s.count || 0);
        setCategories(c.data || []);
      })().catch(() => {});
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
        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.logoutPill, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="log-out-outline" size={16} color={COLORS.primaryText} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
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
                placeholder="Name, design no, barcode, size"
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

          {/* Quick Tiles (only screens that exist) */}
          <View style={styles.tilesRow}>
            <StatTile
              label="Image Processing"
              icon="color-wand-outline"
              tint={COLORS.tileGreen}
              iconColor={COLORS.primary}
              borderColor={COLORS.primary}
              onPress={() => nav.navigate('Processing')}
            />
            <StatTile
              label="Product Master"
              icon="cube-outline"
              tint={COLORS.tileBlue}
              iconColor="#1D6FA5"
              onPress={() => nav.navigate('Categories', { screen: 'Products' })}
            />
            <StatTile
              label="Shortlist"
              icon="heart-outline"
              tint={COLORS.tilePink}
              iconColor={COLORS.heart}
              onPress={() => nav.navigate('Shortlist')}
            />
          </View>

          {/* Real Shortlisted Stats Card + Empty Shortlist */}
          <Card style={styles.statsCard}>
            <Pressable
              onPress={() => nav.navigate('Shortlist')}
              style={styles.statMain}
            >
              <View style={styles.statHeartCircle}>
                <Ionicons name="heart-outline" size={20} color={COLORS.heart} />
              </View>
              <View>
                <Text style={styles.statLabel}>Shortlisted</Text>
                <Text style={styles.statNumber}>{shortCount}</Text>
              </View>
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable
              onPress={async () => {
                await api.emptyShortlist(token);
                setShortCount(0);
              }}
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.primaryText} />
              <Text style={styles.emptyBtnText}>Empty Shortlist</Text>
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
              imageUrl={cat.thumbnail_url || cat.image_url}
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
              imageUrl={cat.thumbnail_url || cat.image_url}
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
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statHeartCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.tilePink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
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
