import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';

export default function SearchImagesScreen({ navigation }) {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    api.products(token, { q: '' }).then((r) => setProducts(r.data || [])).catch(() => {});
  }, [token]);

  const chosen = products.flatMap((p) => (p.images || []).filter((img) => selected[img.id]).map((img) => ({
    ...img,
    product_id: p.id,
    orientation: p.orientation,
  })));

  const next = () => {
    navigation.navigate('ProcessWizard', {
      step: 1,
      productImageIds: chosen.map((c) => c.id),
      assets: chosen.map((c) => ({ uri: c.url, productImageId: c.id })),
      orientation: chosen[0]?.orientation || 'vertical',
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {products.map((p) => (
          <View key={p.id} style={{ backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 10 }}>
            <Text style={{ fontWeight: '700' }}>{p.name}</Text>
            <Text style={{ color: '#64748b', marginBottom: 8 }}>{p.category?.name} / {p.sub_category?.name} · {p.design_number}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(p.images || []).map((img) => (
                <Pressable key={img.id} onPress={() => setSelected((s) => ({ ...s, [img.id]: !s[img.id] }))}>
                  <Image source={{ uri: img.url }} style={{ width: 72, height: 72, borderRadius: 8, borderWidth: selected[img.id] ? 3 : 0, borderColor: PRIMARY }} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <Pressable onPress={next} disabled={!chosen.length} style={{ backgroundColor: PRIMARY, margin: 12, borderRadius: 12, padding: 14, alignItems: 'center', opacity: chosen.length ? 1 : 0.5 }}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Use {chosen.length} images</Text>
      </Pressable>
    </View>
  );
}
