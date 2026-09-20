import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';

export default function SubCategoriesScreen({ route, navigation }) {
  const { category } = route.params;
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    navigation.setOptions({ title: category.name });
    api.subCategories(token, category.id).then((r) => setItems(r.data || [])).catch(() => {});
  }, [category, token, navigation]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {items.map((sub) => (
        <Pressable
          key={sub.id}
          onPress={() => navigation.navigate('Products', { category, sub })}
          style={{ backgroundColor: 'white', padding: 18, borderRadius: 14, marginBottom: 8 }}
        >
          <Text>{sub.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
