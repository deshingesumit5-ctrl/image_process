import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';

export default function CategoriesScreen({ navigation }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.categories(token).then((r) => setItems(r.data || [])).catch(() => {});
  }, [token]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {items.map((cat) => (
        <Pressable
          key={cat.id}
          onPress={() => navigation.navigate('SubCategories', { category: cat })}
          style={{ backgroundColor: 'white', padding: 18, borderRadius: 14, marginBottom: 8 }}
        >
          <Text style={{ fontSize: 16 }}>{cat.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
