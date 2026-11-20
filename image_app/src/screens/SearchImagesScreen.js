import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllProducts } from '../api';
import { useAuth } from '../auth';
import ProductDetailsTable from '../components/ProductDetailsTable';
import {
  ActionBar,
  Card,
  EmptyState,
  PageContainer,
  PillButton,
} from '../components/ui';
import { COLORS, FONT_FAMILY, RADII, useResponsive } from '../theme';

export default function SearchImagesScreen({ navigation }) {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});
  const { isDesktop, contentWidth } = useResponsive();

  useEffect(() => {
    fetchAllProducts(token, { q: '' })
      .then((list) => setProducts(list))
      .catch(() => {});
  }, [token]);

  const chosen = products.flatMap((p) =>
    (p.images || [])
      .filter((img) => selected[img.id])
      .map((img) => ({
        ...img,
        product_id: p.id,
        orientation: p.orientation,
        product: p,
      }))
  );

  const next = () => {
    navigation.navigate('ProcessWizard', {
      step: 1,
      productImageIds: chosen.map((c) => c.id),
      assets: chosen.map((c) => ({
        uri: c.url,
        productImageId: c.id,
        product: c.product,
      })),
      products: [
        ...new Map(chosen.map((c) => [c.product.id, c.product])).values(),
      ],
      orientation: chosen[0]?.orientation || 'vertical',
    });
  };

  const gap = 12;
  const cardWidth = isDesktop ? Math.floor((contentWidth - gap) / 2) : '100%';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <PageContainer bottomPad={170}>
        {products.length === 0 ? (
          <EmptyState
            icon="images-outline"
            title="No product images found"
            subtitle="Catalog product images will appear here for selection."
          />
        ) : (
          <View style={[styles.grid, { gap }]}>
            {products.map((p) => (
              <Card key={p.id} style={[styles.card, { width: cardWidth }]}>
                <Text style={styles.prodName}>{p.name}</Text>
                <Text style={styles.prodMeta}>
                  {[p.category?.name, p.sub_category?.name].filter(Boolean).join(' / ')}
                  {p.design_number ? ` · ${p.design_number}` : ''}
                </Text>

                <View style={styles.thumbRow}>
                  {(p.images || []).map((img) => {
                    const active = Boolean(selected[img.id]);
                    return (
                      <Pressable
                        key={img.id}
                        onPress={() =>
                          setSelected((s) => ({ ...s, [img.id]: !s[img.id] }))
                        }
                        style={[styles.thumbWrap, active && styles.thumbWrapActive]}
                      >
                        <Image
                          source={{ uri: img.url }}
                          style={styles.thumbImg}
                          resizeMode="cover"
                        />
                        <View
                          style={[
                            styles.check,
                            active ? styles.checkOn : styles.checkOff,
                          ]}
                        >
                          {active ? (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <ProductDetailsTable product={p} />
              </Card>
            ))}
          </View>
        )}
      </PageContainer>

      <ActionBar>
        <Text style={styles.selectedText}>{chosen.length} Selected</Text>
        <PillButton
          label={`Process Images (${chosen.length})`}
          icon="color-wand-outline"
          disabled={!chosen.length}
          onPress={next}
          compact
          style={{ flex: 1, maxWidth: 260 }}
        />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    padding: 14,
  },
  prodName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  prodMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 10,
    fontFamily: FONT_FAMILY,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbWrap: {
    width: 82,
    height: 82,
    borderRadius: RADII.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
  },
  thumbWrapActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  check: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  checkOn: {
    backgroundColor: COLORS.primary,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
    paddingLeft: 6,
    fontFamily: FONT_FAMILY,
  },
});
