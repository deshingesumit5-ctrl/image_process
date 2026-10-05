import React from 'react';
import { Text, View } from 'react-native';

const COMPANY_NAME = 'Ramchandra Dresses';

function buildRows(p) {
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];
  const sizeNames = sizes.map((s) => s.size ?? s.name).filter(Boolean);
  const rates = sizes.map((s) => Number(s.rate ?? s.price)).filter((n) => !Number.isNaN(n));

  let rate = '';
  if (rates.length) {
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    rate = min === max ? `₹ ${min}` : `₹ ${min} - ₹ ${max}`;
  }

  const category = p.category?.name ?? p.category_name ?? p.category;
  const sub = p.sub_category?.name ?? p.sub_category_name ?? p.sub_category;
  const group = [category, sub].filter((v) => typeof v === 'string' && v).join(' / ');

  return [
    ['Company Name', COMPANY_NAME],
    ['Design Number', p.design_number],
    ['Colour', p.colour ?? p.color],
    ['Size', sizeNames.join(' | ')],
    ['Rate', rate],
    ['Group', group],
  ].filter(([, v]) => v);
}

export default function ProductDetailsTable({ product }) {
  if (!product) return null;
  const rows = buildRows(product);
  return (
    <View style={{ marginTop: 12, borderWidth: 1, borderColor: '#e2d6c4', borderRadius: 14, backgroundColor: '#fffaf2', overflow: 'hidden' }}>
      {rows.map(([label, value], i) => (
        <View
          key={label}
          style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: i ? 1 : 0, borderColor: '#e2d6c4' }}
        >
          <Text style={{ width: 120, fontWeight: '700', color: '#5b3a1e', fontSize: 13 }}>{label}</Text>
          <Text style={{ flex: 1, color: '#1e293b', fontSize: 13 }}>{String(value)}</Text>
        </View>
      ))}
    </View>
  );
}