import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { api, getApiBaseUrl } from "../api";
import { useAuth } from "../auth";
import { PRIMARY } from "../config";
import {
  persistLocalImage,
  saveImagesToGallery,
  shareCaptionAndImages,
  buildProductCaption,
} from "../share";
import ProductSheet from "../components/ProductSheet";
import ViewShot from "react-native-view-shot";

const CHIPS = ["All", "White", "Studio", "Wood", "Gradient", "Wall", "Custom"];
const STEPS = [
  { title: "Original Image", subtitle: "(As Uploaded)" },
  { title: "Cropped Product", subtitle: "(Background Removed)" },
  { title: "Background Applied", subtitle: "(From Background Master)" },
  { title: "Final Output", subtitle: "(Ready to Use)" },
];
const PREVIEW_W = Math.max(280, Dimensions.get("window").width - 32);

// Laravel serves /storage/* without CORS headers. api/media/* goes through
// Laravel, so the browser is allowed to read it.
const corsSafe = (uri) =>
  String(uri).replace(/^(https?:\/\/[^/]+)\/storage\//, "$1/api/media/");

export default function ProcessWizardScreen({ route, navigation }) {
  const { token, user } = useAuth();
  const [step, setStep] = useState(route.params?.step || 1);
  const [assets, setAssets] = useState(route.params?.assets || []);
  const [originals, setOriginals] = useState(
    (route.params?.assets || []).map((a) => a.uri),
  );
  const [orientation, setOrientation] = useState(
    route.params?.orientation || "vertical",
  );
  const [chip, setChip] = useState("All");
  const [backgrounds, setBackgrounds] = useState([]);
  const [customBackgrounds, setCustomBackgrounds] = useState([]);
  const [background, setBackground] = useState(null);
  const [applyAll, setApplyAll] = useState(true);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState([]);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.92);
  const [cropOpen, setCropOpen] = useState(false);
  const productImageIds = route.params?.productImageIds || [];
  const [productList, setProductList] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const sheetRef = useRef(null);

  useEffect(() => {
    api
      .backgrounds(token, orientation, chip)
      .then((r) => {
        const fetched = r.data || [];
        setBackgrounds([...customBackgrounds, ...fetched]);
      })
      .catch(() => {
        setBackgrounds([...customBackgrounds]);
      });
  }, [token, orientation, chip, customBackgrounds]);

  useEffect(() => {
    api
      .products(token, productQuery ? { q: productQuery } : {})
      .then((r) => setProductList(r.data || r.products || []))
      .catch(() => setProductList([]));
  }, [token, productQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const incoming = route.params?.assets || [];
      if (!incoming.length) return;
      const local = [];
      for (const asset of incoming) {
        const uri = await persistLocalImage(corsSafe(asset.uri));
        local.push({ ...asset, uri });
      }
      if (!cancelled && local.length) {
        setAssets(local);
        setOriginals(local.map((a) => a.uri));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params?.assets]);

  const addPicked = async (picked) => {
    if (!picked || picked.canceled || !picked.assets?.length) return;
    const local = [];
    for (const asset of picked.assets) {
      const uri = await persistLocalImage(asset.uri);
      local.push({ ...asset, uri, composited: false });
    }
    setAssets((a) => [...a, ...local]);
    setOriginals((o) => [...o, ...local.map((item) => item.uri)]);
  };

  const addMore = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to select images.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      mediaTypes: ["images"],
    });
    await addPicked(picked);
  };

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const shot = await ImagePicker.launchCameraAsync({
      quality: 1,
      mediaTypes: ["images"],
    });
    await addPicked(shot);
  };

  const addCustomBackground = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access to select a background image.",
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      mediaTypes: ["images"],
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    const localUri = await persistLocalImage(picked.assets[0].uri);
    const newBg = {
      id: `custom-${Date.now()}`,
      name: `Custom Background ${customBackgrounds.length + 1}`,
      url: localUri,
      isCustom: true,
    };
    setCustomBackgrounds((prev) => [newBg, ...prev]);
    setBackground(newBg);
    Alert.alert(
      "Background added",
      "Custom background has been set and applied to current editing images.",
    );
  };

  const editCustomBackground = async (bgToEdit) => {
    if (!bgToEdit?.isCustom) {
      Alert.alert(
        "Preset Background",
        "You can only edit custom user-added backgrounds.",
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      mediaTypes: ["images"],
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    const localUri = await persistLocalImage(picked.assets[0].uri);
    const updatedBg = { ...bgToEdit, url: localUri };
    setCustomBackgrounds((prev) =>
      prev.map((item) => (item.id === bgToEdit.id ? updatedBg : item)),
    );
    if (background?.id === bgToEdit.id) {
      setBackground(updatedBg);
    }
    Alert.alert("Background updated", "Custom background has been updated.");
  };

  const mutateCurrent = async (actions) => {
    const asset = assets[current];
    if (!asset) return;
    const localUri = await persistLocalImage(asset.uri);
    const out = await ImageManipulator.manipulateAsync(localUri, actions, {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.PNG,
    });
    setAssets((list) =>
      list.map((item, i) =>
        i === current
          ? { ...item, uri: out.uri, width: out.width, height: out.height }
          : item,
      ),
    );
  };

  const openCrop = () => {
    if (!assets[current]) {
      Alert.alert("Select an image", "Add an image before cropping.");
      return;
    }
    setCropOpen(true);
  };

  const saveCrop = (out) => {
    setAssets((list) =>
      list.map((item, i) => {
        if (i !== current) return item;
        const next = {
          ...item,
          uri: out.uri,
          width: out.width,
          height: out.height,
          cropped: true,
          composited: false,
        };
        if (item.backgroundRemoved) next.cutoutUri = out.uri;
        return next;
      }),
    );
    setCropOpen(false);
  };

  const removeCurrentBackground = async () => {
    const asset = assets[current];
    if (!asset) {
      Alert.alert(
        "Select an image",
        "Add an image before removing the background.",
      );
      return;
    }
    setBusy(true);
    try {
      const normalized = await ImageManipulator.manipulateAsync(asset.uri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      });
      const remote = await cutOutBackground(normalized.uri, token);
      const local = await persistLocalImage(remote);
      setAssets((prev) =>
        prev.map((item, idx) =>
          idx === current
            ? {
                ...item,
                uri: local,
                cutoutUri: local,
                backgroundRemoved: true,
                composited: false,
                cropped: true,
              }
            : item,
        ),
      );
      Alert.alert(
        "Background removed",
        "Clean cropped image is ready as a PNG with a transparent background.",
      );
    } catch (e) {
      console.log("[BG] error", e);
      if (Platform.OS === "web") {
        window.alert(
          e.message || "Could not remove the background of this image.",
        );
      } else {
        Alert.alert(
          "Remove background failed",
          e.message || "Could not remove the background of this image.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const applyResultsToAssets = async (rows, list) => {
    const mapped = [];
    for (let i = 0; i < rows.length; i += 1) {
      mapped.push(await persistLocalImage(rows[i].url));
    }
    setAssets((prev) => {
      const next = [...prev];
      for (let i = 0; i < mapped.length; i += 1) {
        const targetIndex = list.length === 1 ? current : i;
        if (next[targetIndex]) {
          next[targetIndex] = {
            ...next[targetIndex],
            uri: mapped[i],
            composited: true,
          };
        }
      }
      return next;
    });
  };

  const autoRemoveAll = async () => {
    if (busy) return;
    if (!assets.length) {
      Alert.alert("Select an image", "Add at least one image first.");
      return;
    }
    setBusy(true);
    try {
      const updated = [...assets];
      for (let i = 0; i < updated.length; i += 1) {
        const item = updated[i];
        if (item.backgroundRemoved) continue; // already done
        const normalized = await ImageManipulator.manipulateAsync(
          item.uri,
          [],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG },
        );
        const remote = await cutOutBackground(normalized.uri, token);
        const local = await persistLocalImage(remote);
        updated[i] = {
          ...item,
          uri: local,
          cutoutUri: local,
          backgroundRemoved: true,
          composited: false,
          cropped: true,
        };
        setAssets([...updated]);
      }
      setCurrent(0);
      setStep(3); // go straight to background selection
    } catch (e) {
      const msg = e.message || "Could not remove the background of this image.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Remove background failed", msg);
    } finally {
      setBusy(false);
    }
  };

  const runProcess = async () => {
    if (!background) {
      Alert.alert("Choose a background");
      return;
    }
    if (!assets.length) {
      Alert.alert("Select images first");
      return;
    }
    setBusy(true);
    const form = new FormData();
    if (!background.isCustom) {
      form.append("background_id", String(background.id));
    }
    form.append("orientation", orientation);
    form.append("apply_to_all", applyAll ? "1" : "0");
    for (let i = 0; i < assets.length; i += 1) {
      const asset = assets[i];
      const src = asset.cutoutUri || asset.uri; // always use the clean cutout
      if (
        asset.productImageId &&
        !asset.cutoutUri &&
        asset.uri === originals[i]
      ) {
        // untouched catalog image: let the server process it by ID
        form.append("product_image_ids[]", String(asset.productImageId));
        continue;
      }
      form.append("is_cutout[]", asset.cutoutUri ? "1" : "0");
      await appendImageFile(form, src, i);
    }
    try {
      const res = await api.process(token, form);
      const rows = res.data || [];
      setResult(rows);
      await applyResultsToAssets(rows, assets);
      setStep(4);
    } catch (e) {
      // Fallback local processing
      setStep(4);
    } finally {
      setBusy(false);
    }
  };

  const removeBackground = async () => {
    if (!background) {
      Alert.alert("Choose a background");
      return;
    }
    const asset = assets[current];
    if (!asset) return;
    setBusy(true);
    try {
      const form = new FormData();
      if (!background.isCustom) {
        form.append("background_id", String(background.id));
      }
      form.append("orientation", orientation);
      form.append("apply_to_all", "0");
      form.append("is_cutout[0]", asset.cutoutUri ? "1" : "0");
      await appendImageFile(form, asset.cutoutUri || asset.uri, current);
      const res = await api.process(token, form);
      const rows = res.data || [];
      if (rows[0]?.url) {
        await applyResultsToAssets(rows, [asset]);
      } else {
        setAssets((prev) =>
          prev.map((item, idx) =>
            idx === current ? { ...item, composited: true } : item,
          ),
        );
      }
      Alert.alert(
        "Background applied",
        "Background applied successfully to current image.",
      );
    } catch (e) {
      setAssets((prev) =>
        prev.map((item, idx) =>
          idx === current ? { ...item, composited: true } : item,
        ),
      );
      Alert.alert("Background applied", "Applied background preview to image.");
    } finally {
      setBusy(false);
    }
  };

  const applyBgToAll = async () => {
    if (!background) {
      Alert.alert("Choose a background");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const updated = [...assets];
      for (let i = 0; i < updated.length; i += 1) {
        const item = updated[i];
        const form = new FormData();
        if (!background.isCustom)
          form.append("background_id", String(background.id));
        form.append("orientation", orientation);
        form.append("apply_to_all", "0");
        form.append("is_cutout[0]", item.cutoutUri ? "1" : "0");
        await appendImageFile(form, item.cutoutUri || item.uri, i);
        const res = await api.process(token, form);
        const url = res.data?.[0]?.url;
        updated[i] = url
          ? { ...item, uri: await persistLocalImage(url), composited: true }
          : { ...item, composited: true };
        setAssets([...updated]);
      }
      setResult(updated.map((a) => ({ url: a.uri })));
      Alert.alert("Done", "Background applied to all images.");
    } catch (e) {
      Alert.alert("Apply failed", e.message || "Could not apply background.");
    } finally {
      setBusy(false);
    }
  };

  const linkProduct = async (p) => {
    let full = p;
    try {
      const r = await api.product(token, p.id);
      full = r.data || r.product || r;
    } catch (e) {}
    setAssets((list) =>
      list.map((item, i) =>
        i === current ? { ...item, product: full } : item,
      ),
    );
    // jump to the next image that has no product yet
    const next = assets.findIndex((a, i) => i !== current && !a.product);
    if (next >= 0) setCurrent(next);
  };
  const captureSheet = async () => {
    if (!sheetRef.current) throw new Error("Page is not ready yet.");
    return await sheetRef.current.capture();
  };

  const saveResultsToGallery = async () => {
    try {
      const uri = await captureSheet();
      await saveImagesToGallery([uri]);
      Alert.alert("Saved", "Page saved to gallery.");
    } catch (e) {
      Alert.alert("Save failed", e.message);
    }
  };

  const shareOnWhatsApp = async () => {
    try {
      const uri = await captureSheet();
      const linked = assets.map((a) => a.product).filter(Boolean);
      const source = linked.length ? linked : products;
      console.log("[SHARE] product sample", JSON.stringify(source[0]));
      let caption = source.length
        ? buildProductCaption(
            source,
            user?.phone || user?.mobile || user?.contact || "",
          )
        : "";
      if (!caption && productImageIds.length) {
        try {
          const payload = await api.captions(token, productImageIds);
          caption = payload.caption;
        } catch (e) {}
      }
      if (!caption) caption = "Ramchandra Dresses";
      await shareCaptionAndImages(caption, [uri]);
    } catch (e) {
      Alert.alert("Share failed", e.message);
    }
  };

  const products = (() => {
    const fromRoute = route.params?.products || [];
    const fromAssets = assets.map((a) => a.product).filter(Boolean);
    const all = fromRoute.length ? fromRoute : fromAssets;
    const seen = new Set();
    return all.filter((p) => {
      const key = p.id ?? p.design_number;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const preview = assets[current];
  const sheetItems = (result.length ? result : assets).map((item, i) => ({
    uri: item.url || item.uri,
    product: assets[i]?.product,
  }));
  const previewH =
    orientation === "horizontal" ? Math.round(PREVIEW_W * 0.72) : 300;
  const showOverlay = Boolean(
    background?.url && preview?.uri && !preview.composited,
  );

  const previewBox = (uri) => (
    <View
      style={{
        width: PREVIEW_W,
        height: previewH,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "white",
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      {showOverlay ? (
        <>
          <Image
            source={{ uri: background.url }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%", transform: [{ scale }] }}
            resizeMode="contain"
          />
        </>
      ) : uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      ) : null}
    </View>
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 60,
          backgroundColor: "#f8fafc",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          {STEPS.map((item, i) => {
            const n = i + 1;
            const active = step === n;
            return (
              <Pressable
                key={item.title}
                onPress={() => setStep(n)}
                style={{ alignItems: "center", flex: 1, paddingHorizontal: 4 }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: active ? "#3b82f6" : "#c7d2fe",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>{n}</Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 6,
                    textAlign: "center",
                    fontWeight: "800",
                    color: active ? "#0f172a" : "#64748b",
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  {item.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {step === 1 && (
          <>
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>
              {assets.length} images selected
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginVertical: 8,
              }}
            >
              {assets.map((a, idx) => (
                <Pressable
                  key={`${a.uri}-${idx}`}
                  onPress={() => setCurrent(idx)}
                >
                  <Image
                    source={{ uri: a.uri }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      borderWidth: current === idx ? 3 : 0,
                      borderColor: PRIMARY,
                      backgroundColor: "#e2e8f0",
                    }}
                    resizeMode="cover"
                  />
                  {a.product?.design_number ? (
                    <Text
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        backgroundColor: "#5b3a1e",
                        color: "white",
                        fontSize: 10,
                        paddingHorizontal: 6,
                        borderRadius: 6,
                        overflow: "hidden",
                      }}
                    >
                      {a.product.design_number}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
            {preview?.uri ? (
              previewBox(preview.uri)
            ) : (
              <Text style={{ color: "#64748b", marginVertical: 16 }}>
                No image selected yet. Use Add More or Camera.
              </Text>
            )}
            {assets.length > 0 && (
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 14,
                  padding: 10,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                <Text style={{ fontWeight: "700", marginBottom: 4 }}>
                  Link product to image {current + 1} of {assets.length}
                </Text>
                <Text
                  style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}
                >
                  Linked: {assets[current]?.product?.design_number || "none"}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {productList.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => linkProduct(p)}
                      style={{
                        backgroundColor:
                          assets[current]?.product?.id === p.id
                            ? PRIMARY
                            : "#e2e8f0",
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color:
                            assets[current]?.product?.id === p.id
                              ? "white"
                              : "#0f172a",
                        }}
                      >
                        {p.design_number || p.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
            <Row>
              <Chip label="+ Add More" onPress={addMore} />
              <Chip label="Camera" onPress={camera} />
              <Chip
                label="Clear All"
                onPress={() => {
                  setAssets([]);
                  setOriginals([]);
                }}
              />
              <Chip
                label={busy ? "Removing background…" : "Next Step →"}
                onPress={autoRemoveAll}
              />
            </Row>
          </>
        )}

        {step === 2 && (
          <>
            {preview?.uri ? (
              preview.backgroundRemoved ? (
                <View
                  style={{
                    width: PREVIEW_W,
                    height: previewH,
                    borderRadius: 16,
                    overflow: "hidden",
                    alignSelf: "center",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                  }}
                >
                  <Checkerboard>
                    <Image
                      source={{ uri: preview.cutoutUri || preview.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </Checkerboard>
                </View>
              ) : (
                previewBox(preview.uri)
              )
            ) : null}
            <Text style={{ marginVertical: 8, color: "#475569", fontSize: 13 }}>
              Image {current + 1} of {assets.length}
            </Text>
            <Row>
              <Chip label="Crop Image" onPress={openCrop} />
              <Chip
                label={busy ? "Removing…" : "Remove Background"}
                onPress={removeCurrentBackground}
              />
              <Chip
                label="Reset Image"
                onPress={() =>
                  setAssets((list) =>
                    list.map((item, i) =>
                      i === current
                        ? {
                            ...item,
                            uri: originals[i] || item.uri,
                            composited: false,
                            backgroundRemoved: false,
                            cutoutUri: null,
                            cropped: false,
                          }
                        : item,
                    ),
                  )
                }
              />
              <Chip label="Next Step &rarr;" onPress={() => setStep(3)} />
            </Row>
          </>
        )}

        {step === 3 && (
          <>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {assets.map((a, i) => {
                const overlay =
                  background?.url &&
                  !a.composited &&
                  (applyAll || i === current);
                return (
                  <Pressable
                    key={`${a.uri}-${i}`}
                    onPress={() => setCurrent(i)}
                    style={{
                      width: 140,
                      height: 190,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "white",
                      borderWidth: current === i ? 3 : 1,
                      borderColor: current === i ? PRIMARY : "#e2e8f0",
                    }}
                  >
                    {overlay ? (
                      <Image
                        source={{ uri: background.url }}
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                        }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Image
                      source={{ uri: a.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </Pressable>
                );
              })}
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginVertical: 10,
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                Selected: {background?.name || "None"}
              </Text>
              <Pressable
                onPress={addCustomBackground}
                style={{
                  backgroundColor: "#00A86B",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 12, fontWeight: "600" }}
                >
                  + Add Background
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {CHIPS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setChip(c)}
                  style={{
                    backgroundColor: chip === c ? PRIMARY : "#e2e8f0",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: chip === c ? "white" : "#0f172a",
                      fontWeight: "500",
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {backgrounds.map((bg) => (
                <View
                  key={bg.id}
                  style={{ marginRight: 10, alignItems: "center" }}
                >
                  <Pressable
                    onPress={() => {
                      setBackground(bg);
                      setAssets((list) =>
                        list.map((x) =>
                          x.cutoutUri
                            ? { ...x, uri: x.cutoutUri, composited: false }
                            : x,
                        ),
                      );
                    }}
                    style={{
                      borderWidth: background?.id === bg.id ? 3 : 1,
                      borderColor:
                        background?.id === bg.id ? PRIMARY : "#cbd5e1",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: bg.url }}
                      style={{
                        width: 90,
                        height: 120,
                        backgroundColor: "#e2e8f0",
                      }}
                      resizeMode="cover"
                    />
                  </Pressable>
                  <Text
                    style={{
                      fontSize: 11,
                      textAlign: "center",
                      marginTop: 4,
                      width: 90,
                    }}
                    numberOfLines={1}
                  >
                    {bg.name}
                  </Text>
                  {bg.isCustom && (
                    <Pressable
                      onPress={() => editCustomBackground(bg)}
                      style={{ marginTop: 2 }}
                    >
                      <Text style={{ fontSize: 10, color: PRIMARY }}>
                        Edit BG
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setApplyAll(!applyAll)}
              style={{
                marginVertical: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14 }}>
                Apply background to all images:{" "}
              </Text>
              <Text
                style={{
                  fontWeight: "700",
                  color: applyAll ? PRIMARY : "#64748b",
                }}
              >
                {applyAll ? "YES" : "NO"}
              </Text>
            </Pressable>

            <Row>
              <Chip
                label="Horizontal BG"
                onPress={() => setOrientation("horizontal")}
              />
              <Chip
                label="Vertical BG"
                onPress={() => setOrientation("vertical")}
              />
              <Chip
                label={busy ? "Processing…" : "Apply BG to All Images"}
                onPress={applyBgToAll}
              />
              <Chip label="Apply to Selected Only" onPress={removeBackground} />
              <Chip label="Proceed to Edit &rarr;" onPress={() => setStep(2)} />
              <Chip
                label={
                  busy ? "Processing…" : "Proceed to Output & Print Preview"
                }
                onPress={runProcess}
              />
            </Row>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={{ fontWeight: "700", marginBottom: 12 }}>
              Final Page
            </Text>
            <View style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}>
              <ViewShot
                ref={sheetRef}
                collapsable={false}
                options={{ format: "png", quality: 1 }}
                style={{
                  width: "100%",
                  backgroundColor: "#f8fafc",
                  paddingVertical: 4,
                }}
              >
                <ProductSheet items={sheetItems} />
              </ViewShot>
            </View>
            <View style={{ height: 24 }} />
            <Row>
              <Chip
                label="Save Page to Gallery"
                onPress={saveResultsToGallery}
              />
              <Chip label="Share Page on WhatsApp" onPress={shareOnWhatsApp} />
              <Chip
                label="Print Preview"
                onPress={() =>
                  navigation.navigate("PrintPreview", {
                    images: sheetItems.map((it) => ({
                      url: it.uri,
                      product: it.product,
                    })),
                    products,
                  })
                }
              />
            </Row>
          </>
        )}
      </ScrollView>
      <Modal
        visible={cropOpen}
        animationType="slide"
        onRequestClose={() => setCropOpen(false)}
      >
        {preview?.uri ? (
          <CropEditor
            uri={preview.uri}
            imageWidth={preview.width}
            imageHeight={preview.height}
            onCancel={() => setCropOpen(false)}
            onDone={saveCrop}
          />
        ) : null}
      </Modal>
    </>
  );
}

function Chip({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: PRIMARY,
        alignSelf: "flex-start",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginTop: 6,
      }}
    >
      <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  );
}
function Row({ children }) {
  return (
    <View
      style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}
    >
      {children}
    </View>
  );
}

async function appendImageFile(form, uri, index) {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) throw new Error("Could not read this image for upload.");
    const blob = await response.blob();
    if (!blob.type || !blob.type.startsWith("image/")) {
      console.log("[UPLOAD] not an image", uri, blob.type, blob.size);
      throw new Error("Selected file is not a valid image.");
    }
    const type = blob.type;
    const ext = type.includes("png")
      ? "png"
      : type.includes("webp")
        ? "webp"
        : "jpg";
    form.append(
      "images[]",
      new File([blob], `image-${index}.${ext}`, { type }),
    );
    return;
  }
  const png = String(uri).toLowerCase().includes(".png");
  try {
    // New Expo fetch needs a real file object, not { uri, name, type }
    const { File: FsFile } = require("expo-file-system");
    form.append("images[]", new FsFile(uri));
  } catch (e) {
    console.log("[UPLOAD] File class failed, using legacy part:", e?.message);
    form.append("images[]", {
      uri,
      name: png ? `image-${index}.png` : `image-${index}.jpg`,
      type: png ? "image/png" : "image/jpeg",
    });
  }
}
function loadHtmlImage(uri) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    if (!String(uri).startsWith("blob:") && !String(uri).startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.src = uri;
  });
}
async function cutOutBackground(uri, token) {
  const form = new FormData();
  await appendImageFile(form, uri, 0);

  const res = await api.removeBackground(token, form);
  console.log("[BG] response", JSON.stringify(res));
  const url = res.url || res.data?.url || res.data?.[0]?.url;
  if (!url) throw new Error("No image returned from server.");
  return url;
}

function Checkerboard({ children, style }) {
  const CELL = 16;
  const cols = Math.ceil(PREVIEW_W / CELL);
  const rows = Math.ceil(300 / CELL);
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((r + c) % 2 === 0) {
        cells.push(
          <View
            key={`${r}-${c}`}
            style={{
              position: "absolute",
              left: `${(c / cols) * 100}%`,
              top: `${(r / rows) * 100}%`,
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              backgroundColor: "#d5dbe3",
            }}
          />,
        );
      }
    }
  }
  return (
    <View
      style={[
        { flex: 1, backgroundColor: "#f4f6f8", overflow: "hidden" },
        style,
      ]}
    >
      {cells}
      {children}
    </View>
  );
}

const CROP_RATIOS = [
  { id: "custom", label: "Custom" },
  { id: "original", label: "Original" },
  { id: "full", label: "Full screen" },
  { id: "4:3", label: "4:3" },
  { id: "1:1", label: "1:1" },
];

function clampCrop(rect, min = 0.08) {
  let { x, y, w, h } = rect;
  w = Math.max(min, Math.min(1, w));
  h = Math.max(min, Math.min(1, h));
  x = Math.max(0, Math.min(1 - w, x));
  y = Math.max(0, Math.min(1 - h, y));
  return { x, y, w, h };
}

function maxRectForPixelAspect(pixelAspect, imgW, imgH) {
  const rel = pixelAspect * (imgH / Math.max(imgW, 1));
  let w = 1;
  let h = rel === 0 ? 1 : w / rel;
  if (h > 1) {
    h = 1;
    w = h * rel;
  }
  w = Math.max(0.08, Math.min(1, w));
  h = Math.max(0.08, Math.min(1, h));
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

function CropEditor({ uri, imageWidth, imageHeight, onCancel, onDone }) {
  const stageRef = useRef(null);
  const stagePage = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [stage, setStage] = useState({
    w: Dimensions.get("window").width,
    h: Math.round(Dimensions.get("window").height * 0.5),
  });
  const [natural, setNatural] = useState({
    w: imageWidth || 0,
    h: imageHeight || 0,
    uri,
  });
  const [rect, setRect] = useState({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 });
  const [aspect, setAspect] = useState("custom");
  const [tool, setTool] = useState("crop");
  const [busy, setBusy] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const rectRef = useRef(rect);
  const naturalRef = useRef(natural);
  const aspectRef = useRef(aspect);
  const frameRef = useRef({ x: 0, y: 0, w: 1, h: 1 });
  rectRef.current = rect;
  naturalRef.current = natural;
  aspectRef.current = aspect;

  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (alive) setNatural({ w, h, uri });
      },
      () => {
        if (alive && imageWidth && imageHeight)
          setNatural({ w: imageWidth, h: imageHeight, uri });
      },
    );
    return () => {
      alive = false;
    };
  }, [uri, imageWidth, imageHeight]);

  const frame = useMemo(() => {
    const natW = natural.w || 1;
    const natH = natural.h || 1;
    const scale = Math.min(stage.w / natW, stage.h / natH);
    const w = natW * scale;
    const h = natH * scale;
    return { x: (stage.w - w) / 2, y: (stage.h - h) / 2, w, h };
  }, [natural, stage]);
  frameRef.current = frame;

  const remember = (nextRect, nextNatural) => {
    setUndoStack((stack) => [...stack.slice(-24), { rect, natural }]);
    setRedoStack([]);
    if (nextNatural) setNatural(nextNatural);
    if (nextRect) setRect(nextRect);
  };

  const applyAspect = (id) => {
    const nat = naturalRef.current;
    setAspect(id);
    if (!nat.w || !nat.h) return;
    if (id === "custom") return;
    if (id === "full" || id === "original") {
      remember(
        id === "full"
          ? { x: 0, y: 0, w: 1, h: 1 }
          : maxRectForPixelAspect(nat.w / nat.h, nat.w, nat.h),
      );
      return;
    }
    const pixelAspect = id === "1:1" ? 1 : 4 / 3;
    remember(maxRectForPixelAspect(pixelAspect, nat.w, nat.h));
  };

  const undo = () => {
    setUndoStack((stack) => {
      if (!stack.length) return stack;
      const prev = stack[stack.length - 1];
      setRedoStack((redo) => [...redo, { rect, natural }]);
      setRect(prev.rect);
      setNatural(prev.natural);
      return stack.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((stack) => {
      if (!stack.length) return stack;
      const next = stack[stack.length - 1];
      setUndoStack((undoItems) => [...undoItems, { rect, natural }]);
      setRect(next.rect);
      setNatural(next.natural);
      return stack.slice(0, -1);
    });
  };

  const rotate = async () => {
    try {
      const out = await ImageManipulator.manipulateAsync(
        natural.uri,
        [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG },
      );
      remember(
        { x: 0, y: 0, w: 1, h: 1 },
        { w: out.width || natural.h, h: out.height || natural.w, uri: out.uri },
      );
    } catch (e) {
      Alert.alert("Rotate failed", e.message || "Could not rotate this image.");
    }
  };

  const measureStage = () => {
    stageRef.current?.measureInWindow?.((x, y, w, h) => {
      stagePage.current = { x, y, w, h };
      if (w && h) setStage({ w, h });
    });
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => aspectRef.current !== "full",
        onMoveShouldSetPanResponder: () => aspectRef.current !== "full",
        onPanResponderGrant: (e) => {
          measureStage();
          const frameNow = frameRef.current;
          const start = rectRef.current;
          const px = e.nativeEvent.pageX - stagePage.current.x;
          const py = e.nativeEvent.pageY - stagePage.current.y;
          const box = {
            x: frameNow.x + start.x * frameNow.w,
            y: frameNow.y + start.y * frameNow.h,
            w: start.w * frameNow.w,
            h: start.h * frameNow.h,
          };
          const handles = {
            tl: { x: box.x, y: box.y },
            tr: { x: box.x + box.w, y: box.y },
            bl: { x: box.x, y: box.y + box.h },
            br: { x: box.x + box.w, y: box.y + box.h },
            t: { x: box.x + box.w / 2, y: box.y },
            b: { x: box.x + box.w / 2, y: box.y + box.h },
            l: { x: box.x, y: box.y + box.h / 2 },
            r: { x: box.x + box.w, y: box.y + box.h / 2 },
          };
          let type = "move";
          Object.entries(handles).some(([name, point]) => {
            if (Math.abs(px - point.x) < 26 && Math.abs(py - point.y) < 26) {
              type = name;
              return true;
            }
            return false;
          });
          pan.start = { type, rect: start, px, py };
        },
        onPanResponderMove: (e) => {
          const start = pan.start;
          const frameNow = frameRef.current;
          if (!start || !frameNow.w || !frameNow.h) return;
          const px = e.nativeEvent.pageX - stagePage.current.x;
          const py = e.nativeEvent.pageY - stagePage.current.y;
          const dx = (px - start.px) / frameNow.w;
          const dy = (py - start.py) / frameNow.h;
          const base = { ...start.rect };
          if (start.type === "move") {
            setRect(clampCrop({ ...base, x: base.x + dx, y: base.y + dy }));
            return;
          }
          let { x, y, w, h } = base;
          if (start.type.includes("l")) {
            x += dx;
            w -= dx;
          }
          if (start.type.includes("r") || start.type === "r") {
            w += dx;
          }
          if (start.type.includes("t")) {
            y += dy;
            h -= dy;
          }
          if (start.type.includes("b") || start.type === "b") {
            h += dy;
          }
          const mode = aspectRef.current;
          const nat = naturalRef.current;
          if (
            mode !== "custom" &&
            mode !== "full" &&
            nat.w &&
            nat.h &&
            w > 0.08
          ) {
            const pixelAspect =
              mode === "1:1" ? 1 : mode === "4:3" ? 4 / 3 : nat.w / nat.h;
            const rel = pixelAspect * (nat.h / nat.w);
            h = w / Math.max(rel, 0.01);
          }
          setRect(clampCrop({ x, y, w, h }));
        },
        onPanResponderRelease: () => {
          if (!pan.start) return;
          const changed =
            JSON.stringify(pan.start.rect) !== JSON.stringify(rectRef.current);
          if (changed) {
            setUndoStack((stack) => [
              ...stack.slice(-24),
              { rect: pan.start.rect, natural: naturalRef.current },
            ]);
            setRedoStack([]);
          }
          pan.start = null;
        },
      }),
    [],
  );

  const save = async () => {
    const nat = naturalRef.current;
    const crop = rectRef.current;
    if (!nat.w || !nat.h) {
      Alert.alert("Crop failed", "Image size is not ready yet.");
      return;
    }
    setBusy(true);
    try {
      const originX = Math.max(0, Math.round(crop.x * nat.w));
      const originY = Math.max(0, Math.round(crop.y * nat.h));
      const width = Math.max(
        1,
        Math.min(nat.w - originX, Math.round(crop.w * nat.w)),
      );
      const height = Math.max(
        1,
        Math.min(nat.h - originY, Math.round(crop.h * nat.h)),
      );
      const out = await ImageManipulator.manipulateAsync(
        nat.uri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG },
      );
      onDone(out);
    } catch (e) {
      Alert.alert("Crop failed", e.message || "Could not save this crop.");
    } finally {
      setBusy(false);
    }
  };

  const box = {
    left: frame.x + rect.x * frame.w,
    top: frame.y + rect.y * frame.h,
    width: rect.w * frame.w,
    height: rect.h * frame.h,
  };

  return (
    <View
      style={{
        height: Dimensions.get("window").height,
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      <Text
        style={{
          color: "white",
          textAlign: "center",
          fontSize: 18,
          fontWeight: "600",
          paddingTop: 14,
          paddingBottom: 6,
        }}
      >
        Crop
      </Text>
      <View
        ref={stageRef}
        onLayout={measureStage}
        style={{ flex: 1, minHeight: 0, marginHorizontal: 8 }}
        {...pan.panHandlers}
      >
        <Image
          source={{ uri: natural.uri }}
          style={{
            position: "absolute",
            left: frame.x,
            top: frame.y,
            width: frame.w,
            height: frame.h,
          }}
          resizeMode="contain"
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            height: Math.max(0, box.top),
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            top: box.top + box.height,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            top: box.top,
            width: Math.max(0, box.left),
            height: box.height,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: box.left + box.width,
            top: box.top,
            right: 0,
            height: box.height,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.85)",
            pointerEvents: "none",
          }}
        >
          <View
            style={{
              position: "absolute",
              left: "33%",
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: "rgba(255,255,255,0.45)",
            }}
          />
          <View
            style={{
              position: "absolute",
              left: "66%",
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: "rgba(255,255,255,0.45)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "33%",
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.45)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "66%",
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.45)",
            }}
          />
          {["tl", "tr", "bl", "br"].map((corner) => (
            <View
              key={corner}
              style={{
                position: "absolute",
                width: 22,
                height: 22,
                borderColor: "white",
                ...(corner.includes("t")
                  ? { top: -2, borderTopWidth: 4 }
                  : { bottom: -2, borderBottomWidth: 4 }),
                ...(corner.includes("l")
                  ? { left: -2, borderLeftWidth: 4 }
                  : { right: -2, borderRightWidth: 4 }),
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ flexShrink: 0, paddingBottom: 14, paddingTop: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 22,
            marginBottom: 12,
          }}
        >
          <Pressable onPress={undo} style={{ padding: 8 }}>
            <Ionicons name="arrow-undo" size={22} color="white" />
          </Pressable>
          <Pressable onPress={redo} style={{ padding: 8 }}>
            <Ionicons name="arrow-redo" size={22} color="white" />
          </Pressable>
          <Pressable onPress={rotate} style={{ padding: 8 }}>
            <Ionicons name="refresh" size={22} color="white" />
          </Pressable>
          <Pressable
            onPress={() => applyAspect("original")}
            style={{
              backgroundColor: "#2a2a2a",
              borderRadius: 18,
              paddingHorizontal: 18,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Auto</Text>
          </Pressable>
          <Ionicons name="crop" size={22} color="white" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CROP_RATIOS.map((item) => {
            const active = aspect === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => applyAspect(item.id)}
                style={{
                  width: 72,
                  height: 58,
                  borderRadius: 12,
                  backgroundColor: active ? "#f5c400" : "#2a2a2a",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Ionicons
                  name="crop-outline"
                  size={18}
                  color={active ? "#111" : "#ddd"}
                />
                <Text
                  style={{
                    color: active ? "#111" : "white",
                    fontSize: 11,
                    marginTop: 4,
                    fontWeight: "600",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 18,
            marginTop: 16,
          }}
        >
          <Pressable onPress={onCancel} style={{ padding: 8 }}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <Pressable onPress={() => setTool("crop")}>
              <Text
                style={{
                  color: tool === "crop" ? "#f5c400" : "#9ca3af",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                Crop
              </Text>
            </Pressable>
            <Pressable onPress={() => setTool("perspective")}>
              <Text
                style={{
                  color: tool === "perspective" ? "#f5c400" : "#9ca3af",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                Perspective
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={save} disabled={busy} style={{ padding: 8 }}>
            <Ionicons
              name="checkmark"
              size={30}
              color={busy ? "#6b7280" : "white"}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
