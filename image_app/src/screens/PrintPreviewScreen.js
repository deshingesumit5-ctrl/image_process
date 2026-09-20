import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { PRIMARY } from '../config';
import { shareCaptionAndImages } from '../share';

export default function PrintPreviewScreen({ route }) {
  const images = route.params?.images || [];
  const urls = images.map((item) => item.url).filter(Boolean);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#f8fafc' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {images.map((item, i) => (
          <Image key={i} source={{ uri: item.url }} style={{ width: '47%', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: 'white' }} />
        ))}
      </View>
      <Pressable
        onPress={() => shareCaptionAndImages('Processed catalog images', urls)}
        style={{ marginTop: 16, backgroundColor: PRIMARY, borderRadius: 12, padding: 14, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Share / Export</Text>
      </Pressable>
    </ScrollView>
  );
}
