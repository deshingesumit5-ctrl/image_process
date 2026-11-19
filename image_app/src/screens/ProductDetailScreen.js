import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuth } from '../auth';
import { COLORS, FONT_FAMILY, RADII, useResponsive } from '../theme';
import { Card, PageContainer, PillButton } from '../components/ui';

export default function ProductDetailScreen({ route, navigation }) {
  const { token } = useAuth();
  const id = route.params?.id;
  const [product, setProduct] = useState(route.params?.product || null);
  const { isDesktop } = useResponsive();

  useEffect(() => {
    api.product(token, id).then((r) => setProduct(r.data)).catch(() => {});
  }, [id, token]);

  if (!product) return null;

  const add = async () => {
    await api.addShortlist(token, [
      { product_id: product.id, product_image_id: product.images?.[0]?.id },
    ]);
    navigation.navigate('Shortlist');
  };

  return (
    <PageContainer>
      <View style={[isDesktop && styles.desktopLayout]}>
        <Card style={[styles.imageCard, isDesktop && { flex: 1 }]} padded={false}>
          {product.images?.[0]?.url ? (
            <Image
              source={{ uri: product.images[0].url }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="shirt-outline" size={56} color={COLORS.primary} />
            </View>
          )}
        </Card>

        <Card style={[styles.infoCard, isDesktop && { flex: 1.1 }]}>
          {(product.category?.name || product.sub_category?.name) ? (
            <View style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>
                {[product.category?.name, product.sub_category?.name]
                  .filter(Boolean)
                  .join(' / ')}
              </Text>
            </View>
          ) : null}

          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.meta}>
            Design {product.design_number}
            {product.barcode ? ` · ${product.barcode}` : ''}
          </Text>

          {(product.sizes || []).length > 0 ? (
            <View style={styles.sizesBox}>
              <Text style={styles.sizesHeading}>Available Sizes & Rates</Text>
              {(product.sizes || []).map((s, idx) => (
                <View
                  key={s.id || idx}
                  style={[styles.sizeRow, idx > 0 && styles.sizeRowBorder]}
                >
                  <Text style={styles.sizeLabel}>{s.size}</Text>
                  <Text style={styles.sizeRate}>₹{s.rate}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <PillButton
            label="Add to Shortlist"
            icon="heart-outline"
            onPress={add}
            style={{ marginTop: 18 }}
          />
        </Card>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  imageCard: {
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.surfaceMuted,
  },
  heroImage: {
    width: '100%',
    height: 360,
  },
  placeholder: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.tileGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    padding: 20,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  sizesBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  sizesHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceMuted,
    fontFamily: FONT_FAMILY,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sizeRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  sizeRate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
});
