import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../auth';
import { shareCaptionAndImages } from '../share';
import {
  ActionBar,
  Chip,
  EmptyState,
  PageContainer,
  PillButton,
  ProductCard,
} from '../components/ui';
import { COLORS, FONT_FAMILY, useResponsive } from '../theme';

export default function ShortlistScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [data, setData] = useState({ items: [], count: 0 });
  const [selected, setSelected] = useState({});
  const { productCols, contentWidth } = useResponsive();

  const refresh = async () => {
    const s = await api.shortlist(token);
    setData(s);
    setSelected({});
  };

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
    }, [token])
  );

  const ids = data.items.filter((i) => selected[i.id]);
  const toggleAll = (on) => {
    const next = {};
    if (on) {
      data.items.forEach((i) => {
        next[i.id] = true;
      });
    }
    setSelected(next);
  };

  const shareSelected = async () => {
    const chosen = ids.length ? ids : data.items;
    if (!chosen.length) {
      Alert.alert('Shortlist is empty');
      return;
    }
    const productIds = chosen.map((i) => i.product_id);
    const payload = await api.captions(token, productIds);
    await shareCaptionAndImages(
      payload.caption,
      payload.images?.length
        ? payload.images
        : chosen.map((i) => i.thumbnail).filter(Boolean)
    );
    await api.logShare(token, productIds);
  };

  const gap = 12;
  const cardWidth = Math.floor((contentWidth - gap * (productCols - 1)) / productCols);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <PageContainer bottomPad={data.items.length ? 170 : 110}>
        {/* Top Action Chips */}
        <View style={styles.chipRow}>
          <Chip
            label="Select All"
            icon="checkbox-outline"
            active={data.items.length > 0 && ids.length === data.items.length}
            onPress={() => toggleAll(true)}
          />
          <Chip
            label="Unselect"
            icon="square-outline"
            onPress={() => toggleAll(false)}
          />
          <Chip
            label="Remove Selected"
            icon="close-circle-outline"
            onPress={async () => {
              await api.removeShortlist(
                token,
                ids.map((i) => i.id)
              );
              await refresh();
            }}
          />
          <Chip
            label="Empty Shortlist"
            icon="trash-outline"
            onPress={async () => {
              await api.emptyShortlist(token);
              await refresh();
            }}
          />
          <Chip
            label="Quick Share"
            icon="logo-whatsapp"
            active
            onPress={async () => {
              toggleAll(true);
              await shareSelected();
            }}
          />
        </View>

        {data.items.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            iconColor={COLORS.heart}
            iconBg={COLORS.tilePink}
            title="Your shortlist is empty"
            subtitle="Select products from Categories or Search to shortlist and share them."
            actionLabel="Browse Categories"
            onAction={() => navigation.navigate('Categories')}
          />
        ) : (
          <View style={[styles.grid, { gap }]}>
            {data.items.map((item) => (
              <ProductCard
                key={item.id}
                name={item.name}
                designNumber={item.design_number}
                imageUrl={item.thumbnail}
                selected={Boolean(selected[item.id])}
                width={cardWidth}
                onPress={() =>
                  setSelected((s) => ({ ...s, [item.id]: !s[item.id] }))
                }
              />
            ))}
          </View>
        )}
      </PageContainer>

      {data.items.length > 0 ? (
        <ActionBar>
          <Text style={styles.selectedText}>
            {ids.length ? `${ids.length} Selected` : `${data.items.length} Items`}
          </Text>
          <PillButton
            label="Share Selected"
            icon="logo-whatsapp"
            onPress={shareSelected}
            compact
            style={{ flex: 1, maxWidth: 250 }}
          />
        </ActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
    paddingLeft: 6,
    fontFamily: FONT_FAMILY,
  },
});
