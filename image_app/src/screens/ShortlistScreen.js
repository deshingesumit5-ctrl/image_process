import React, { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';
import { shareCaptionAndImages } from '../share';

export default function ShortlistScreen() {
  const { token } = useAuth();
  const [data, setData] = useState({ items: [], count: 0 });
  const [selected, setSelected] = useState({});

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
    if (on) data.items.forEach((i) => { next[i.id] = true; });
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
    await shareCaptionAndImages(payload.caption, payload.images?.length ? payload.images : chosen.map((i) => i.thumbnail).filter(Boolean));
    await api.logShare(token, productIds);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}>
        <Btn label="Select all" onPress={() => toggleAll(true)} />
        <Btn label="Unselect" onPress={() => toggleAll(false)} />
        <Btn label="Remove selected" onPress={async () => { await api.removeShortlist(token, ids.map((i) => i.id)); await refresh(); }} />
        <Btn label="Empty shortlist" onPress={async () => { await api.emptyShortlist(token); await refresh(); }} />
        <Btn label="Share selected" onPress={shareSelected} />
        <Btn label="Quick share" onPress={async () => { toggleAll(true); await shareSelected(); }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {data.items.map((item) => (
          <Pressable key={item.id} onPress={() => setSelected((s) => ({ ...s, [item.id]: !s[item.id] }))} style={{ flexDirection: 'row', backgroundColor: 'white', borderRadius: 14, padding: 10, marginBottom: 8, alignItems: 'center' }}>
            {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 10 }} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: '#64748b' }}>{item.design_number}</Text>
            </View>
            <Text>{selected[item.id] ? '☑' : '☐'}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Btn({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ color: 'white', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
