import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api, fetchAllProducts } from '../api';
import { useAuth } from '../auth';
import { COLORS, FONT_FAMILY, useResponsive } from '../theme';
import {
  ActionBar,
  EmptyState,
  PageContainer,
  PillButton,
  ProductCard,
} from '../components/ui';

export default function ProductsScreen({ route, navigation }) {
  const { token } = useAuth();
  const category = route.params?.category;
  const sub = route.params?.sub;
  const q = route.params?.q;
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({});
  const { productCols, contentWidth } = useResponsive();

  React.useEffect(() => {
    const title = sub?.name || category?.name || (q ? `Search: ${q}` : 'Products');
    navigation.setOptions({
      title,
      headerSubtitle: `${items.length} Products`,
    });
  }, [navigation, sub, category, q, items.length]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const params = { q: q || '' };
      if (category) params.category_id = category.id;
      if (sub) params.sub_category_id = sub.id;
      fetchAllProducts(token, params)
        .then((list) => {
          if (active) setItems(list);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [token, category, sub, q])
  );

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const selectAll = () => {
    const next = {};
    items.forEach((p) => {
      next[p.id] = true;
    });
    setSelected(next);
  };

  const add = async () => {
    const chosen = items.filter((p) => selected[p.id]);
    if (!chosen.length) {
      Alert.alert('Select products first');
      return;
    }
    await api.addShortlist(
      token,
      chosen.map((p) => ({ product_id: p.id, product_image_id: p.images?.[0]?.id }))
    );
    Alert.alert('Added to shortlist', 'Selections accumulate across categories.');
  };

  const selectedCount = items.filter((p) => selected[p.id]).length;
  const allSelected = items.length > 0 && selectedCount === items.length;
  const gap = 12;
  const cardWidth = Math.floor((contentWidth - gap * (productCols - 1)) / productCols);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <PageContainer bottomPad={170}>
        {/* Select All bar */}
        <View style={styles.toolbar}>
          <Pressable onPress={selectAll} style={styles.selectAllBtn}>
            <View
              style={[
                styles.checkBox,
                allSelected ? styles.checkBoxOn : styles.checkBoxOff,
              ]}
            >
              {allSelected ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <Text style={styles.selectAllText}>Select All</Text>
          </Pressable>
          <Text style={styles.countText}>{items.length} Products</Text>
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon="shirt-outline"
            title="No products found"
            subtitle="Try another category or search term."
          />
        ) : (
          <View style={[styles.grid, { gap }]}>
            {items.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                designNumber={p.design_number}
                imageUrl={p.images?.[0]?.url}
                selected={Boolean(selected[p.id])}
                width={cardWidth}
                onPress={() => toggle(p.id)}
                onLongPress={() => navigation.navigate('ProductDetail', { id: p.id })}
                onDetailPress={() => navigation.navigate('ProductDetail', { id: p.id })}
              />
            ))}
          </View>
        )}
      </PageContainer>

      <ActionBar>
        <Text style={styles.selectedCountText}>{selectedCount} Selected</Text>
        <PillButton
          label="Add to Shortlist"
          icon="heart-outline"
          onPress={add}
          compact
          style={{ flex: 1, maxWidth: 260 }}
        />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingRight: 10,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOff: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  checkBoxOn: {
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionBar: {
    bottom: 76,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
    paddingLeft: 6,
  },
});
