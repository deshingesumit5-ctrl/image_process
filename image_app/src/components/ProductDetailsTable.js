import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_FAMILY } from '../theme';

const COMPANY_NAME = 'Ramchandra Dresses';
const uniq = (arr) => [...new Set(arr.filter(Boolean))];

function rateText(sizes) {
  const rates = sizes
    .map((s) => Number(s.rate ?? s.price))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (!rates.length) return '';
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  return min === max ? `₹ ${min}` : `₹ ${min} - ₹ ${max}`;
}

function groupText(p) {
  const category = p.category?.name ?? p.category_name ?? p.category;
  const sub = p.sub_category?.name ?? p.sub_category_name ?? p.sub_category;
  return [category, sub].filter((v) => typeof v === 'string' && v).join(' / ');
}

function buildRows(p) {
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];
  const sizeNames = sizes.map((s) => s.size ?? s.name).filter(Boolean);
  return [
    ['Company Name', COMPANY_NAME],
    ['Design Number', p.design_number],
    ['Colour', p.colour ?? p.color],
    ['Size', sizeNames.join(' | ')],
    ['Rate', rateText(sizes)],
    ['Group', groupText(p)],
  ].filter(([, v]) => v);
}

function buildCombinedRows(products) {
  const list = (products || []).filter(Boolean);
  const allSizes = list.flatMap((p) => (Array.isArray(p.sizes) ? p.sizes : []));
  return [
    ['Company Name', COMPANY_NAME],
    ['Design Number', uniq(list.map((p) => p.design_number)).join(' / ')],
    ['Colour', uniq(list.map((p) => p.colour ?? p.color)).join(' / ')],
    ['Size', uniq(allSizes.map((s) => s.size ?? s.name)).join(' | ')],
    ['Rate', rateText(allSizes)],
    ['Group', uniq(list.map(groupText)).join(', ')],
  ].filter(([, v]) => v);
}

function TableBox({ rows }) {
  return (
    <View style={styles.tableBox}>
      {rows.map(([label, value], i) => (
        <View
          key={label}
          style={[styles.row, i > 0 && styles.rowBorder]}
        >
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{String(value)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ProductDetailsTable({ product }) {
  if (!product) return null;
  return <TableBox rows={buildRows(product)} />;
}

export function CombinedProductDetailsTable({ products }) {
  const rows = buildCombinedRows(products);
  if (!rows.length) {
    return (
      <Text style={styles.emptyText}>
        No product data linked. Start from a product in the catalog to fill this table.
      </Text>
    );
  }
  return <TableBox rows={rows} />;
}

const styles = StyleSheet.create({
  tableBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.sheetBorder,
    borderRadius: 14,
    backgroundColor: COLORS.sheetInner,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.sheetBorder,
  },
  label: {
    width: 120,
    fontWeight: '700',
    color: COLORS.sheetBrown,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  value: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
});
