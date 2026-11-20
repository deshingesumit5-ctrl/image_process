import React, { useRef, useState } from 'react';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import {
  buildCatalogCaption,
  renderCatalogCardToDataUrl,
  saveImagesToGallery,
  shareCaptionAndImages,
} from '../share';
import ProductSheet from '../components/ProductSheet';
import ToastBanner from '../components/ToastBanner';
import { PageContainer, PillButton } from '../components/ui';
import { useResponsive } from '../theme';

export default function PrintPreviewScreen({ route }) {
  const images = route.params?.images || [];
  const products = route.params?.products || [];
  const sheetRef = useRef(null);
  const [toast, setToast] = useState(null);
  const { processMaxWidth } = useResponsive();

  const sheetItems = images.map((it) => ({
    uri: it.url || it.uri,
    product: it.product,
    designNumber: it.designNumber || it.product?.design_number,
  }));

  const capture = async () => {
    if (Platform.OS === 'web') {
      return await renderCatalogCardToDataUrl(sheetItems);
    }
    if (!sheetRef.current) throw new Error('Could not capture the page.');
    const uri = await captureRef(sheetRef, { format: 'png', quality: 1 });
    if (!uri) throw new Error('Could not capture the page.');
    return uri;
  };

  const linked = images.map((it) => it.product).filter(Boolean);
  const caption = buildCatalogCaption(
    linked.length ? linked : products,
    sheetItems.length || 1
  );

  return (
    <View style={{ flex: 1 }}>
      <ToastBanner toast={toast} onHide={() => setToast(null)} />
      <PageContainer maxWidth={processMaxWidth}>
      <ViewShot
        ref={sheetRef}
        collapsable={false}
        options={{ format: 'png', quality: 1 }}
        style={{ alignSelf: 'center' }}
      >
        <ProductSheet items={sheetItems} />
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
              const shareRes = await shareCaptionAndImages(caption, [uri]);
              if (shareRes?.captionCopied) {
                setToast({
                  message: 'Caption copied – paste if missing',
                  type: 'success',
                  key: Date.now(),
                });
              }
            } catch (e) {
              Alert.alert('Share failed', e.message);
            }
          }}
        />
      </View>
      </PageContainer>
    </View>
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
