import React, { useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import { Alert, StyleSheet, View } from 'react-native';
import {
  saveImagesToGallery,
  shareCaptionAndImages,
  buildProductCaption,
} from '../share';
import ProductSheet from '../components/ProductSheet';
import { PageContainer, PillButton } from '../components/ui';
import { useResponsive } from '../theme';

export default function PrintPreviewScreen({ route }) {
  const images = route.params?.images || [];
  const products = route.params?.products || [];
  const sheetRef = useRef(null);
  const { processMaxWidth } = useResponsive();

  const capture = async () => {
    const uri = await sheetRef.current?.capture?.();
    if (!uri) throw new Error('Could not capture the page.');
    return uri;
  };

  const linked = images.map((it) => it.product).filter(Boolean);
  const caption = buildProductCaption(linked.length ? linked : products);

  return (
    <PageContainer maxWidth={processMaxWidth}>
      <ViewShot
        ref={sheetRef}
        options={{ format: 'png', quality: 1 }}
        style={{ alignSelf: 'center' }}
      >
        <ProductSheet
          items={images.map((it) => ({
            uri: it.url || it.uri,
            product: it.product,
          }))}
        />
      </ViewShot>

      <View style={styles.actions}>
        <PillButton
          label="Save to Gallery"
          icon="download-outline"
          variant="outline"
          style={{ flex: 1 }}
          onPress={async () => {
            try {
              const uri = await capture();
              await saveImagesToGallery([uri]);
              Alert.alert('Saved', 'Full page saved to gallery.');
            } catch (e) {
              Alert.alert('Save failed', e.message);
            }
          }}
        />
        <PillButton
          label="WhatsApp Share"
          icon="logo-whatsapp"
          style={{ flex: 1 }}
          onPress={async () => {
            try {
              const uri = await capture();
              await shareCaptionAndImages(caption, [uri]);
            } catch (e) {
              Alert.alert('Share failed', e.message);
            }
          }}
        />
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
});
