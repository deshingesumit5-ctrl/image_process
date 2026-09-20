import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';

export default function HomeScreen() {
  const { token, user, logout } = useAuth();
  const nav = useNavigation();
  const [q, setQ] = useState('');
  const [shortCount, setShortCount] = useState(0);
  const [categories, setCategories] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [s, c] = await Promise.all([api.shortlist(token), api.categories(token)]);
        setShortCount(s.count || 0);
        setCategories(c.data || []);
      })().catch(() => {});
    }, [token])
  );

  const search = () => nav.navigate('Categories', { screen: 'Products', params: { q } });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Hi, {user?.name}</Text>
        <Pressable onPress={logout}><Text style={{ color: PRIMARY }}>Logout</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TextInput value={q} onChangeText={setQ} placeholder="Name, design no, barcode, size" style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12 }} />
        <Pressable onPress={search} style={{ backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' }}>
          <Text style={{ color: 'white' }}>Search</Text>
        </Pressable>
      </View>
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <Pressable onPress={() => nav.navigate('Shortlist')}>
          <Text style={{ fontWeight: '600' }}>Shortlisted Images</Text>
          <Text style={{ color: '#64748b' }}>{shortCount} items</Text>
        </Pressable>
        <Pressable onPress={async () => { await api.emptyShortlist(token); setShortCount(0); }} style={{ marginTop: 8 }}>
          <Text style={{ color: PRIMARY }}>Empty Shortlist</Text>
        </Pressable>
      </View>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>Categories</Text>
      {categories.map((cat) => (
        <Pressable
          key={cat.id}
          onPress={() => nav.navigate('Categories', { screen: 'SubCategories', params: { category: cat } })}
          style={{ backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 8 }}
        >
          <Text>{cat.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
