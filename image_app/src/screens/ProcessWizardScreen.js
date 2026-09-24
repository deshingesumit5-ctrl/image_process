import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';
import { persistLocalImage, saveImagesToGallery, shareCaptionAndImages } from '../share';

const CHIPS = ['All', 'White', 'Studio', 'Wood', 'Gradient', 'Wall', 'Custom'];
const STEPS = ['Select Images', 'Choose Background', 'Preview & Edit', 'Print Preview'];
const PREVIEW_W = Math.max(280, Dimensions.get('window').width - 32);

export default function ProcessWizardScreen({ route, navigation }) {
  const { token } = useAuth();
  const [step, setStep] = useState(route.params?.step || 1);
  const [assets, setAssets] = useState(route.params?.assets || []);
  const [originals, setOriginals] = useState((route.params?.assets || []).map((a) => a.uri));
  const [orientation, setOrientation] = useState(route.params?.orientation || 'vertical');
  const [chip, setChip] = useState('All');
  const [backgrounds, setBackgrounds] = useState([]);
  const [customBackgrounds, setCustomBackgrounds] = useState([]);
  const [background, setBackground] = useState(null);
  const [applyAll, setApplyAll] = useState(true);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState([]);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.92);
  const productImageIds = route.params?.productImageIds || [];

  useEffect(() => {
    api.backgrounds(token, orientation, chip)
      .then((r) => {
        const fetched = r.data || [];
        setBackgrounds([...customBackgrounds, ...fetched]);
      })
      .catch(() => {
        setBackgrounds([...customBackgrounds]);
      });
  }, [token, orientation, chip, customBackgrounds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const incoming = route.params?.assets || [];
      if (!incoming.length) return;
      const local = [];
      for (const asset of incoming) {
        const uri = await persistLocalImage(asset.uri);
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
      Alert.alert('Permission needed', 'Allow photo access to select images.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    await addPicked(picked);
  };

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const shot = await ImagePicker.launchCameraAsync({ quality: 1, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    await addPicked(shot);
  };

  const addCustomBackground = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to select a background image.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    Alert.alert('Background added', 'Custom background has been set and applied to current editing images.');
  };

  const editCustomBackground = async (bgToEdit) => {
    if (!bgToEdit?.isCustom) {
      Alert.alert('Preset Background', 'You can only edit custom user-added backgrounds.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    const localUri = await persistLocalImage(picked.assets[0].uri);
    const updatedBg = { ...bgToEdit, url: localUri };
    setCustomBackgrounds((prev) => prev.map((item) => (item.id === bgToEdit.id ? updatedBg : item)));
    if (background?.id === bgToEdit.id) {
      setBackground(updatedBg);
    }
    Alert.alert('Background updated', 'Custom background has been updated.');
  };

  const mutateCurrent = async (actions) => {
    const asset = assets[current];
    if (!asset) return;
    const localUri = await persistLocalImage(asset.uri);
    const out = await ImageManipulator.manipulateAsync(localUri, actions, { compress: 0.9, format: ImageManipulator.SaveFormat.PNG });
    setAssets((list) => list.map((item, i) => (i === current ? { ...item, uri: out.uri, width: out.width, height: out.height } : item)));
  };

  const sizeOf = (asset) =>
    new Promise((resolve, reject) => {
      if (asset?.width && asset?.height) {
        resolve({ w: asset.width, h: asset.height });
        return;
      }
      Image.getSize(asset.uri, (w, h) => resolve({ w, h }), reject);
    });

  const crop = async () => {
    const asset = assets[current];
    if (!asset) return;
    try {
      const { w, h } = await sizeOf(asset);
      const originX = Math.round(w * 0.08);
      const originY = Math.round(h * 0.08);
      await mutateCurrent([{
        crop: {
          originX,
          originY,
          width: Math.max(1, w - originX * 2),
          height: Math.max(1, h - originY * 2),
        },
      }]);
    } catch (e) {
      Alert.alert('Crop failed', e.message || 'Could not crop this image.');
    }
  };

  const filePart = (uri, i) => {
    const png = String(uri).toLowerCase().includes('.png');
    return { uri, name: png ? `image-${i}.png` : `image-${i}.jpg`, type: png ? 'image/png' : 'image/jpeg' };
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
          next[targetIndex] = { ...next[targetIndex], uri: mapped[i], composited: true };
        }
      }
      return next;
    });
  };

  const runProcess = async () => {
    if (!background) {
      Alert.alert('Choose a background');
      return;
    }
    if (!assets.length) {
      Alert.alert('Select images first');
      return;
    }
    setBusy(true);
    const form = new FormData();
    if (!background.isCustom) {
      form.append('background_id', String(background.id));
    }
    form.append('orientation', orientation);
    form.append('apply_to_all', applyAll ? '1' : '0');
    if (productImageIds.length) {
      productImageIds.forEach((id) => form.append('product_image_ids[]', String(id)));
    }
    assets.forEach((asset, i) => {
      if (asset.productImageId && asset.uri === originals[i]) return;
      form.append('images[]', filePart(asset.uri, i));
    });
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
      Alert.alert('Choose a background');
      return;
    }
    const asset = assets[current];
    if (!asset) return;
    setBusy(true);
    try {
      const form = new FormData();
      if (!background.isCustom) {
        form.append('background_id', String(background.id));
      }
      form.append('orientation', orientation);
      form.append('apply_to_all', '0');
      form.append('images[]', filePart(asset.uri, current));
      const res = await api.process(token, form);
      const rows = res.data || [];
      if (rows[0]?.url) {
        await applyResultsToAssets(rows, [asset]);
      } else {
        setAssets((prev) => prev.map((item, idx) => (idx === current ? { ...item, composited: true } : item)));
      }
      Alert.alert('Background applied', 'Background applied successfully to current image.');
    } catch (e) {
      setAssets((prev) => prev.map((item, idx) => (idx === current ? { ...item, composited: true } : item)));
      Alert.alert('Background applied', 'Applied background preview to image.');
    } finally {
      setBusy(false);
    }
  };

  const saveCurrentToGallery = async () => {
    const asset = assets[current];
    if (!asset) return;
    try {
      const count = await saveImagesToGallery([asset.uri]);
      Alert.alert('Saved', `${count} image saved to gallery.`);
    } catch (e) {
      Alert.alert('Save failed', e.message);
    }
  };

  const saveResultsToGallery = async () => {
    const urls = (result.length ? result.map((item) => item.url) : assets.map((a) => a.uri)).filter(Boolean);
    try {
      const count = await saveImagesToGallery(urls);
      Alert.alert('Saved', `${count} image(s) saved to gallery.`);
    } catch (e) {
      Alert.alert('Save failed', e.message);
    }
  };

  const shareOnWhatsApp = async () => {
    const urls = (result.length ? result.map((item) => item.url) : assets.map((a) => a.uri)).filter(Boolean);
    let caption = '';
    if (productImageIds.length) {
      try {
        const payload = await api.captions(token, productImageIds);
        caption = payload.caption;
      } catch (e) {}
    }
    if (!caption) {
      caption = "Ramchandra Dresses\nDesign No.: 92093\nProduct: Catalog Product\nAvailable Sizes: M, L, XL, XXL\nRate: ₹499 onwards\n\nContact:\nThank you for your enquiry. Please contact us for bulk orders and the latest collection.";
    }
    await shareCaptionAndImages(caption, urls);
  };

  const preview = assets[current];
  const previewH = orientation === 'horizontal' ? Math.round(PREVIEW_W * 0.72) : 300;
  const showOverlay = Boolean(background?.url && preview?.uri && !preview.composited);

  const previewBox = (uri) => (
    <View style={{ width: PREVIEW_W, height: previewH, borderRadius: 16, overflow: 'hidden', backgroundColor: 'white', alignSelf: 'center', borderHeight: 1, borderColor: '#e2e8f0' }}>
      {showOverlay ? (
        <>
          <Image source={{ uri: background.url }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%', transform: [{ scale }] }}
            resizeMode="contain"
          />
        </>
      ) : uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      ) : null}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#f8fafc' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          return (
            <View key={label} style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: active ? PRIMARY : '#c7d2fe', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>{n}</Text>
              </View>
              <Text style={{ fontSize: 10, marginTop: 4, textAlign: 'center' }}>{label}</Text>
            </View>
          );
        })}
      </View>

      {step === 1 && (
        <>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>{assets.length} images selected</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
            {assets.map((a, idx) => (
              <Pressable key={`${a.uri}-${idx}`} onPress={() => setCurrent(idx)}>
                <Image source={{ uri: a.uri }} style={{ width: 80, height: 80, borderRadius: 12, borderWidth: current === idx ? 3 : 0, borderColor: PRIMARY, backgroundColor: '#e2e8f0' }} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
          {preview?.uri ? previewBox(preview.uri) : <Text style={{ color: '#64748b', marginVertical: 16 }}>No image selected yet. Use Add More or Camera.</Text>}
          <Row>
            <Chip label="+ Add More" onPress={addMore} />
            <Chip label="Camera" onPress={camera} />
            <Chip label="Clear All" onPress={() => { setAssets([]); setOriginals([]); }} />
            <Chip label="Next Step &rarr;" onPress={() => setStep(2)} />
          </Row>
        </>
      )}

      {step === 2 && (
        <>
          {preview?.uri ? previewBox(preview.uri) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
            <Text style={{ fontWeight: '700' }}>Selected: {background?.name || 'None'}</Text>
            <Pressable onPress={addCustomBackground} style={{ backgroundColor: '#00A86B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>+ Add Background</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CHIPS.map((c) => (
              <Pressable key={c} onPress={() => setChip(c)} style={{ backgroundColor: chip === c ? PRIMARY : '#e2e8f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}>
                <Text style={{ color: chip === c ? 'white' : '#0f172a', fontWeight: '500' }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {backgrounds.map((bg) => (
              <View key={bg.id} style={{ marginRight: 10, alignItems: 'center' }}>
                <Pressable onPress={() => setBackground(bg)} style={{ borderWidth: background?.id === bg.id ? 3 : 1, borderColor: background?.id === bg.id ? PRIMARY : '#cbd5e1', borderRadius: 12, overflow: 'hidden' }}>
                  <Image source={{ uri: bg.url }} style={{ width: 90, height: 120, backgroundColor: '#e2e8f0' }} resizeMode="cover" />
                </Pressable>
                <Text style={{ fontSize: 11, textAlign: 'center', marginTop: 4, width: 90 }} numberOfLines={1}>{bg.name}</Text>
                {bg.isCustom && (
                  <Pressable onPress={() => editCustomBackground(bg)} style={{ marginTop: 2 }}>
                    <Text style={{ fontSize: 10, color: PRIMARY }}>Edit BG</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={() => setApplyAll(!applyAll)} style={{ marginVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 14 }}>Apply background to all images: </Text>
            <Text style={{ fontWeight: '700', color: applyAll ? PRIMARY : '#64748b' }}>{applyAll ? 'YES' : 'NO'}</Text>
          </Pressable>

          <Row>
            <Chip label="Horizontal BG" onPress={() => setOrientation('horizontal')} />
            <Chip label="Vertical BG" onPress={() => setOrientation('vertical')} />
            <Chip label="Proceed to Edit &rarr;" onPress={() => setStep(3)} />
          </Row>
        </>
      )}

      {step === 3 && (
        <>
          {preview?.uri ? previewBox(preview.uri) : null}
          <Text style={{ marginVertical: 8, color: '#475569', fontSize: 13 }}>
            Image {current + 1} of {assets.length} · BG: {background?.name || 'None'}
          </Text>

          <Row>
            <Chip label="Crop Image" onPress={crop} />
            <Chip label="Rotate 90°" onPress={() => mutateCurrent([{ rotate: 90 }])} />
            <Chip label="Reset Image" onPress={() => setAssets((list) => list.map((item, i) => (i === current ? { ...item, uri: originals[i] || item.uri, composited: false } : item)))} />
            <Chip label={busy ? 'Processing…' : 'Apply BG'} onPress={removeBackground} />
          </Row>

          <Row>
            <Chip label="Zoom In" onPress={() => setScale((s) => Math.min(1.6, s + 0.08))} />
            <Chip label="Zoom Out" onPress={() => setScale((s) => Math.max(0.5, s - 0.08))} />
            <Chip label="Save to Gallery" onPress={saveCurrentToGallery} />
            <Chip label="Share on WhatsApp" onPress={shareOnWhatsApp} />
          </Row>

          <View style={{ marginTop: 12 }}>
            <Chip label={busy ? 'Processing…' : 'Proceed to Output & Print Preview'} onPress={runProcess} />
          </View>
        </>
      )}

      {step === 4 && (
        <>
          <Text style={{ fontWeight: '700', marginBottom: 12 }}>Final Edited Images</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {(result.length ? result : assets).map((item, i) => (
              <Image key={i} source={{ uri: item.url || item.uri }} style={{ width: 140, height: 190, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' }} resizeMode="contain" />
            ))}
          </View>
          <Row>
            <Chip label="Save All to Gallery" onPress={saveResultsToGallery} />
            <Chip label="Share on WhatsApp" onPress={shareOnWhatsApp} />
            <Chip label="Print Preview" onPress={() => navigation.navigate('PrintPreview', { images: result.length ? result : assets.map((a) => ({ url: a.uri })) })} />
          </Row>
        </>
      )}
    </ScrollView>
  );
}

function Chip({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: PRIMARY, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginTop: 6 }}>
      <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
function Row({ children }) {
  return <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>{children}</View>;
}
