import React, { useRef } from "react";
import ViewShot from "react-native-view-shot";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import {
  saveImagesToGallery,
  shareCaptionAndImages,
  buildProductCaption,
} from "../share";
import ProductSheet from "../components/ProductSheet";

const BADGE_COLORS = ["#fbcfe8", "#bae6fd", "#a7f3d0", "#fef08a"];

export default function PrintPreviewScreen({ route }) {
  const images = route.params?.images || [];
  const products = route.params?.products || [];
  const sheetRef = useRef(null);
  const capture = async () => {
    const uri = await sheetRef.current?.capture?.();
    if (!uri) throw new Error("Could not capture the page.");
    return uri;
  };

  // Label under each image: design number (or colour) from the product master
  const labelFor = (item) => {
    const p = item.product;
    if (!p) return "";
    return p.design_number || p.colour || p.color || "";
  };

  const linked = images.map((it) => it.product).filter(Boolean);
  const caption = buildProductCaption(linked.length ? linked : products);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 12, backgroundColor: "#f5f3ef" }}
    >
      <ViewShot
        ref={sheetRef}
        options={{ format: "png", quality: 1 }}
        style={{ alignSelf: "center" }}
      >
        <ProductSheet
          items={images.map((it) => ({
            uri: it.url || it.uri,
            product: it.product,
          }))}
        />
      </ViewShot>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Pressable
          onPress={async () => {
            try {
              const uri = await capture();
              await saveImagesToGallery([uri]);
              Alert.alert("Saved", "Full page saved to gallery.");
            } catch (e) {
              Alert.alert("Save failed", e.message);
            }
          }}
          style={{
            flex: 1,
            backgroundColor: "#0f172a",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
            Save to Gallery
          </Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const uri = await capture();
              await shareCaptionAndImages(caption, [uri]);
            } catch (e) {
              Alert.alert("Share failed", e.message);
            }
          }}
          style={{
            flex: 1,
            backgroundColor: "#00A86B",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
            WhatsApp Share
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
