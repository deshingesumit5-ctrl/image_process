import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, SERIF_FONT } from '../theme';

const COMPANY_NAME = 'Ramchandra Dresses';
const BROWN = COLORS.sheetBrown;
const GOLD = COLORS.sheetGold;
const LINE = COLORS.sheetBorder;

const uniq = (list) => [...new Set(list.filter(Boolean))];

function buildDetails(products) {
  const sizes = uniq(products.flatMap((p) => (p.sizes || []).map((s) => s.size)));
  const rates = products
    .flatMap((p) => (p.sizes || []).map((s) => Number(s.rate)))
    .filter((n) => !Number.isNaN(n) && n > 0);
  let rate = '';
  if (rates.length) {
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    rate = min === max ? `₹ ${min}` : `₹ ${min} - ₹ ${max}`;
  }
  const groups = uniq(
    products.map((p) =>
      [p.category?.name, p.sub_category?.name].filter(Boolean).join(' / ')
    )
  );
  const designs = uniq(products.map((p) => p.design_number)).join(' / ');
  const colours = uniq(products.map((p) => p.colour || p.color)).join(' / ');

  const rows = [
    { key: 'Colour', icon: 'color-palette-outline', value: colours },
    { key: 'Size', icon: 'layers-outline', value: sizes.join(' | ') },
    { key: 'Rate', icon: 'pricetag-outline', value: rate },
    { key: 'Group', icon: 'people-outline', value: groups.join(', ') },
  ].filter((r) => r.value);

  return { designs, rows };
}

function CornerFlourish({ position }) {
  const isTop = position.includes('t');
  const isLeft = position.includes('l');
  return (
    <View
      pointerEvents="none"
      style={[
        styles.corner,
        isTop ? { top: 8 } : { bottom: 8 },
        isLeft ? { left: 8 } : { right: 8 },
        {
          borderTopWidth: isTop ? 2 : 0,
          borderBottomWidth: !isTop ? 2 : 0,
          borderLeftWidth: isLeft ? 2 : 0,
          borderRightWidth: !isLeft ? 2 : 0,
          borderTopLeftRadius: isTop && isLeft ? 10 : 0,
          borderTopRightRadius: isTop && !isLeft ? 10 : 0,
          borderBottomLeftRadius: !isTop && isLeft ? 10 : 0,
          borderBottomRightRadius: !isTop && !isLeft ? 10 : 0,
        },
      ]}
    >
      <View
        style={[
          styles.cornerDot,
          isTop ? { top: 3 } : { bottom: 3 },
          isLeft ? { left: 3 } : { right: 3 },
        ]}
      />
    </View>
  );
}

export default function ProductSheet({ items = [] }) {
  const { width: winW } = useWindowDimensions();
  const [heroIdx, setHeroIdx] = useState(0);
  const list = items.filter((it) => it.uri);
  if (!list.length) return null;

  const sheetW = Math.min(winW - 32, 520);
  const inner = sheetW - 36;
  const cols = list.length === 1 ? 1 : 2;
  const gap = 12;
  const cardW = cols === 1 ? inner : Math.floor((inner - gap) / 2);
  const cardH = cols === 1 ? Math.round(inner * 0.92) : Math.round(cardW * 1.18);
  const activeIdx = Math.min(heroIdx, list.length - 1);

  const seen = new Set();
  const products = [];
  list.forEach((it) => {
    const p = it.product;
    if (!p) return;
    const key = p.id ?? p.design_number;
    if (seen.has(key)) return;
    seen.add(key);
    products.push(p);
  });
  const { designs, rows } = buildDetails(products);

  return (
    <View style={[styles.sheet, { width: sheetW }]}>
      <View style={styles.innerFrame}>
        <CornerFlourish position="tl" />
        <CornerFlourish position="tr" />
        <CornerFlourish position="bl" />
        <CornerFlourish position="br" />

        {/* Crown + Serif Title */}
        <View style={styles.crownHeader}>
          <MaterialCommunityIcons name="crown" size={24} color={GOLD} />
          <View style={styles.titleRow}>
            <View style={styles.titleLine} />
            <Text style={styles.companyTitle}>{COMPANY_NAME}</Text>
            <View style={styles.titleLine} />
          </View>
        </View>

        {/* 2x2 Rounded Product Grid */}
        <View style={[styles.grid, { gap }]}>
          {list.map((it, i) => {
            const active = i === activeIdx;
            const design = it.product?.design_number;
            return (
              <Pressable
                key={i}
                onPress={() => setHeroIdx(i)}
                style={[styles.itemWrap, { width: cardW }]}
              >
                <View
                  style={[
                    styles.imgBox,
                    {
                      width: cardW,
                      height: cardH,
                      borderColor: active && list.length > 1 ? BROWN : LINE,
                      borderWidth: active && list.length > 1 ? 1.5 : 1,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: it.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
                {design ? (
                  <View style={styles.designPill}>
                    <Text style={styles.designPillText} numberOfLines={1}>
                      {design}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Info Card */}
        <View style={styles.infoBox}>
          <View style={styles.infoTopRow}>
            <View style={styles.companyPill}>
              <Text style={styles.companyPillText}>{COMPANY_NAME}</Text>
            </View>
            {designs ? (
              <Text style={styles.designHeaderText} numberOfLines={2}>
                <Text style={{ fontWeight: '700' }}>Design No.: </Text>
                {designs}
              </Text>
            ) : null}
          </View>

          {rows.map((row, idx) => (
            <View
              key={row.key}
              style={[styles.detailRow, idx > 0 && styles.detailRowBorder]}
            >
              <View style={styles.detailLabelWrap}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name={row.icon} size={13} color={BROWN} />
                </View>
                <Text style={styles.detailLabel}>{row.key}:</Text>
              </View>
              <Text style={styles.detailValue}>{String(row.value)}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Flourish */}
        <View style={styles.bottomFlourish}>
          <View style={styles.titleLine} />
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={18}
            color={GOLD}
          />
          <View style={styles.titleLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    alignSelf: 'center',
    backgroundColor: COLORS.sheetBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    padding: 8,
  },
  innerFrame: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 10,
    paddingVertical: 14,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: GOLD,
    opacity: 0.7,
  },
  cornerDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  crownHeader: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    width: '100%',
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: LINE,
  },
  companyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: BROWN,
    fontFamily: SERIF_FONT,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  itemWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  imgBox: {
    borderRadius: 16,
    backgroundColor: COLORS.sheetImageBg,
    overflow: 'hidden',
  },
  designPill: {
    marginTop: -11,
    backgroundColor: BROWN,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.sheetBg,
    maxWidth: '90%',
  },
  designPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  infoBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    backgroundColor: COLORS.sheetInner,
    padding: 12,
  },
  infoTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  companyPill: {
    backgroundColor: BROWN,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  companyPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  designHeaderText: {
    fontSize: 11,
    color: BROWN,
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 8,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#EFE6D5',
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 92,
    gap: 6,
  },
  detailIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3E9D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BROWN,
    fontFamily: FONT_FAMILY,
  },
  detailValue: {
    flex: 1,
    fontSize: 11,
    color: '#2B2118',
    fontFamily: FONT_FAMILY,
  },
  bottomFlourish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 20,
  },
});
