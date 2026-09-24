import React from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { PRIMARY } from '../config';
import { saveImagesToGallery, shareCaptionAndImages } from '../share';

export default function PrintPreviewScreen({ route }) {
  const images = route.params?.images || [];
  const urls = images.map((item) => item.url || item.uri).filter(Boolean);

  const mainImage = urls[0] || null;
  const gridImages = urls.slice(0, 4);

  const labels = ['Baby Pink', 'Sky Blue', 'Mint Green', 'Yellow'];
  const bgColors = ['#fbcfe8', '#bae6fd', '#a7f3d0', '#fef08a'];

  return (
    <ScrollView contentContainerStyle={{ padding: 12, backgroundColor: '#f5f3ef' }}>
      {/* Print Sheet Container matching Image 4 */}
      <View style={{ backgroundColor: '#fffdf9', borderRadius: 16, borderWidth: 2, borderColor: '#e2d9cc', padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
        {/* Main Top Product Banner */}
        {mainImage && (
          <View style={{ width: '100%', height: 260, borderRadius: 12, backgroundColor: '#f4ede2', overflow: 'hidden', marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={{ uri: mainImage }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
        )}

        {/* 4 Variant Grid Layout matching Image 4 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3].map((idx) => {
            const imgUri = gridImages[idx] || mainImage;
            return (
              <View key={idx} style={{ width: '48.5%', height: 140, borderRadius: 10, backgroundColor: '#f4ede2', marginBottom: 10, overflow: 'hidden', position: 'relative', borderHeight: 1, borderColor: '#e8dfd1' }}>
                {imgUri && <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
                <View style={{ position: 'absolute', bottom: 6, alignSelf: 'center', backgroundColor: bgColors[idx % bgColors.length], paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#1e293b' }}>{labels[idx % labels.length]}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Product Specs Footer matching Image 4 */}
        <View style={{ backgroundColor: '#fff9ee', borderRadius: 10, borderWidth: 1, borderColor: '#ebdcc5', padding: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f3e6d3', paddingBottom: 6, marginBottom: 6 }}>
            <View>
              <Text style={{ fontSize: 10, color: '#78716c', fontWeight: '600' }}>Company Name</Text>
              <Text style={{ fontSize: 12, color: '#1c1917', fontWeight: '800' }}>RCD GROUP</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, color: '#78716c', fontWeight: '600' }}>Design Number</Text>
              <Text style={{ fontSize: 12, color: '#1c1917', fontWeight: '800' }}>1218 / 1/12 / 321</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, color: '#78716c', fontWeight: '600' }}>Rate</Text>
              <Text style={{ fontSize: 12, color: '#047857', fontWeight: '800' }}>₹ 1000</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 10, color: '#78716c', fontWeight: '600' }}>Size</Text>
              <Text style={{ fontSize: 11, color: '#292524', fontWeight: '700' }}>S | M | L | XL | XXL</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, color: '#78716c', fontWeight: '600' }}>Group</Text>
              <Text style={{ fontSize: 11, color: '#292524', fontWeight: '700' }}>Men's Ethnic Wear</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable
          onPress={async () => {
            try {
              const count = await saveImagesToGallery(urls);
              Alert.alert('Saved', `${count} catalog image(s) saved to gallery.`);
            } catch (e) {
              Alert.alert('Save failed', e.message);
            }
          }}
          style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Save to Gallery</Text>
        </Pressable>

        <Pressable
          onPress={() => shareCaptionAndImages('RCD GROUP Catalog Sheet', urls)}
          style={{ flex: 1, backgroundColor: '#00A86B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>WhatsApp Share</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
