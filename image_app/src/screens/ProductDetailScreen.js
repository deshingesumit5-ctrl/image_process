import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';

export default function ProductDetailScreen({ route, navigation }) {
  const { token } = useAuth();
  const id = route.params?.id;
  const [product, setProduct] = useState(route.params?.product || null);

  useEffect(() => {
    api.product(token, id).then((r) => setProduct(r.data)).catch(() => {});
  }, [id, token]);

  if (!product) return null;

  const add = async () => {
    await api.addShortlist(token, [{ product_id: product.id, product_image_id: product.images?.[0]?.id }]);
    navigation.navigate('Shortlist');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {product.images?.[0]?.url ? (
        <Image source={{ uri: product.images[0].url }} style={{ width: '100%', height: 320, borderRadius: 16, backgroundColor: 'white' }} />
      ) : null}
      <Text style={{ fontSize: 22, fontWeight: '700', marginTop: 12 }}>{product.name}</Text>
      <Text style={{ color: '#64748b' }}>Design {product.design_number} · {product.barcode}</Text>
      <Text style={{ marginTop: 8 }}>{product.category?.name} / {product.sub_category?.name}</Text>
      {(product.sizes || []).map((s) => (
        <Text key={s.id}>{s.size} — ₹{s.rate}</Text>
      ))}
      <Pressable onPress={add} style={{ marginTop: 16, backgroundColor: PRIMARY, borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Add to shortlist</Text>
      </Pressable>
    </ScrollView>
  );
}
