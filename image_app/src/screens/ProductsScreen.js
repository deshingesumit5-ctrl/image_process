import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';

export default function ProductsScreen({ route, navigation }) {
  const { token } = useAuth();
  const category = route.params?.category;
  const sub = route.params?.sub;
  const q = route.params?.q;
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    const params = { q: q || '' };
    if (category) params.category_id = category.id;
    if (sub) params.sub_category_id = sub.id;
    api.products(token, params).then((r) => setItems(r.data || [])).catch(() => {});
  }, [token, category, sub, q]);

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

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
        <Pressable onPress={selectAll}><Text style={{ color: PRIMARY }}>Select all</Text></Pressable>
        <Pressable onPress={add}><Text style={{ color: PRIMARY, fontWeight: '700' }}>Add to shortlist</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {items.map((p) => (
          <Pressable key={p.id} onLongPress={() => navigation.navigate('ProductDetail', { id: p.id })} onPress={() => toggle(p.id)} style={{ flexDirection: 'row', backgroundColor: 'white', borderRadius: 14, marginBottom: 8, padding: 10, alignItems: 'center' }}>
            {p.images?.[0]?.url ? (
              <Image source={{ uri: p.images[0].url }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 10 }} />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 8, marginRight: 10, backgroundColor: '#e2e8f0' }} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{p.name}</Text>
              <Text style={{ color: '#64748b' }}>{p.design_number}</Text>
              <Pressable onPress={() => navigation.navigate('ProductDetail', { id: p.id })}>
                <Text style={{ color: PRIMARY, marginTop: 4 }}>View details</Text>
              </Pressable>
            </View>
            <Text>{selected[p.id] ? '☑' : '☐'}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
