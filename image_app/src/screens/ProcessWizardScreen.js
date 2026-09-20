import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';

const CHIPS = ['All', 'White', 'Studio', 'Wood', 'Gradient', 'Wall', 'Custom'];
const STEPS = ['Select Images', 'Choose Background', 'Preview & Edit', 'Print Preview'];

export default function ProcessWizardScreen({ route, navigation }) {
  const { token } = useAuth();
  const [step, setStep] = useState(route.params?.step || 1);
  const [assets, setAssets] = useState(route.params?.assets || []);
  const originals = useMemo(() => (route.params?.assets || []).map((a) => a.uri), [route.params?.assets]);
  const [orientation, setOrientation] = useState(route.params?.orientation || 'vertical');
  const [chip, setChip] = useState('All');
  const [backgrounds, setBackgrounds] = useState([]);
  const [background, setBackground] = useState(null);
  const [applyAll, setApplyAll] = useState(true);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState([]);
  const [busy, setBusy] = useState(false);
  const productImageIds = route.params?.productImageIds || [];

  useEffect(() => {
    api.backgrounds(token, orientation, chip).then((r) => setBackgrounds(r.data || [])).catch(() => {});
  }, [token, orientation, chip]);

  const addMore = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.9 });
    if (!picked.canceled) setAssets((a) => [...a, ...picked.assets]);
  };

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const shot = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!shot.canceled) setAssets((a) => [...a, ...shot.assets]);
  };

  const mutateCurrent = async (actions) => {
    const asset = assets[current];
    if (!asset) return;
    const out = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.9, format: ImageManipulator.SaveFormat.PNG });
    setAssets((list) => list.map((item, i) => (i === current ? { ...item, uri: out.uri } : item)));
  };

  const crop = async () => {
    const asset = assets[current];
    if (!asset) return;
    Image.getSize(asset.uri, async (w, h) => {
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
    });
  };

  const runProcess = async () => {
    if (!background) {
      Alert.alert('Choose a background');
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.append('background_id', String(background.id));
    form.append('orientation', orientation);
    form.append('apply_to_all', applyAll ? '1' : '0');
    if (productImageIds.length) {
      productImageIds.forEach((id) => form.append('product_image_ids[]', String(id)));
    }
    assets.forEach((asset, i) => {
      if (asset.productImageId) return;
      form.append('images[]', { uri: asset.uri, name: `image-${i}.jpg`, type: 'image/jpeg' });
    });
    try {
      const res = await api.process(token, form);
      setResult(res.data || []);
      setStep(4);
    } catch (e) {
      Alert.alert('Processing failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const preview = assets[current];

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
          <Text style={{ fontWeight: '700' }}>{assets.length} selected</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
            {assets.map((a, idx) => (
              <Pressable key={`${a.uri}-${idx}`} onPress={() => setCurrent(idx)}>
                <Image source={{ uri: a.uri }} style={{ width: 90, height: 90, borderRadius: 12, borderWidth: current === idx ? 3 : 0, borderColor: PRIMARY }} />
              </Pressable>
            ))}
          </View>
          <Row>
            <Chip label="Add More" onPress={addMore} />
            <Chip label="Camera" onPress={camera} />
            <Chip label="Clear All" onPress={() => setAssets([])} />
            <Chip label="Next" onPress={() => setStep(2)} />
          </Row>
        </>
      )}

      {step === 2 && (
        <>
          {preview ? <Image source={{ uri: preview.uri }} style={{ width: '100%', height: 280, borderRadius: 16, backgroundColor: 'white' }} /> : null}
          <Text style={{ marginVertical: 8 }}>{background?.name || 'No background yet'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CHIPS.map((c) => (
              <Pressable key={c} onPress={() => setChip(c)} style={{ backgroundColor: chip === c ? PRIMARY : '#e2e8f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}>
                <Text style={{ color: chip === c ? 'white' : '#0f172a' }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView horizontal>
            {backgrounds.map((bg) => (
              <Pressable key={bg.id} onPress={() => setBackground(bg)} style={{ marginRight: 8, borderWidth: background?.id === bg.id ? 3 : 0, borderColor: PRIMARY, borderRadius: 12 }}>
                <Image source={{ uri: bg.url }} style={{ width: 90, height: 120, borderRadius: 10 }} />
                <Text style={{ fontSize: 11, textAlign: 'center' }}>{bg.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={() => setApplyAll(!applyAll)} style={{ marginVertical: 12 }}>
            <Text>Apply to all: {applyAll ? 'ON' : 'OFF'}</Text>
          </Pressable>
          <Row>
            <Chip label="Horizontal" onPress={() => setOrientation('horizontal')} />
            <Chip label="Vertical" onPress={() => setOrientation('vertical')} />
            <Chip label="Next" onPress={() => setStep(3)} />
          </Row>
        </>
      )}

      {step === 3 && (
        <>
          {preview ? <Image source={{ uri: preview.uri }} style={{ width: '100%', height: 300, borderRadius: 16, backgroundColor: 'white' }} /> : null}
          <Text style={{ marginVertical: 8 }}>{assets.length} images · {background?.name || 'No background'} · Auto Crop ON</Text>
          <Row>
            <Chip label="Crop Image" onPress={crop} />
            <Chip label="Adjust Image" onPress={() => mutateCurrent([{ rotate: 90 }])} />
            <Chip label="Reset" onPress={() => setAssets((list) => list.map((item, i) => (i === current ? { ...item, uri: originals[i] || item.uri } : item)))} />
            <Chip label="Remove Background" onPress={() => Alert.alert('Remove background', 'Background is removed on the server when you save.')} />
          </Row>
          <Chip label={busy ? 'Processing…' : 'Proceed to Print Preview'} onPress={runProcess} />
        </>
      )}

      {step === 4 && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {result.map((item, i) => (
              <Image key={i} source={{ uri: item.url }} style={{ width: 150, height: 200, borderRadius: 12, backgroundColor: 'white' }} />
            ))}
          </View>
          <Chip label="Open Print Preview" onPress={() => navigation.navigate('PrintPreview', { images: result })} />
        </>
      )}
    </ScrollView>
  );
}

function Chip({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: PRIMARY, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginTop: 8 }}>
      <Text style={{ color: 'white' }}>{label}</Text>
    </Pressable>
  );
}
function Row({ children }) {
  return <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{children}</View>;
}
