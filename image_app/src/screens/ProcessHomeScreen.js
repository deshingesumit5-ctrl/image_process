import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';

export default function ProcessHomeScreen({ navigation }) {
  const { token } = useAuth();
  const [recent, setRecent] = useState([]);

  useFocusEffect(
    useCallback(() => {
      api.recentProcess(token).then((r) => setRecent(r.data || [])).catch(() => {});
    }, [token])
  );

  const pickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.9 });
    if (result.canceled) return;
    navigation.navigate('ProcessWizard', { assets: result.assets, step: 1 });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: PRIMARY, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '700' }}>Process Product Images with Perfect Background</Text>
        <Text style={{ color: '#c7d2fe', marginTop: 8 }}>Select gallery photos or search catalog products, then composite onto Background Master.</Text>
      </View>
      <Pressable onPress={pickGallery} style={card}><Text style={title}>Select Images</Text><Text>Browse gallery or camera in the next step</Text></Pressable>
      <Pressable onPress={() => navigation.navigate('SearchImages')} style={card}>
        <Text style={title}>Search Images</Text><Text>By category / sub-category / product</Text>
      </Pressable>
      <Text style={{ fontWeight: '700', marginVertical: 12 }}>Recent Processing</Text>
      {recent.map((row) => (
        <View key={row.id} style={card}>
          <Text>{row.processed_at}</Text>
          <Text style={{ color: PRIMARY }}>{row.image_count} images · Processed</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const card = { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 10 };
const title = { fontWeight: '700', fontSize: 16, marginBottom: 4 };
