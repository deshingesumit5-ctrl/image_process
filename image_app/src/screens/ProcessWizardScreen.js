import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { api, fetchAllProducts } from '../api';
import { useAuth } from '../auth';
import {
  saveLocalRecentProcessed,
  updateLocalRecentProduct,
} from '../recentStorage';
import {
  appendImageFile,
  buildCatalogCaption,
  persistLocalImage,
  renderCatalogCardToDataUrl,
  saveImagesToGallery,
  shareCaptionAndImages,
} from '../share';
import AddToProductModal from '../components/AddToProductModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ProductSheet from '../components/ProductSheet';
import ToastBanner from '../components/ToastBanner';
import {
  ActionBar,
  Card,
  Chip as UIChip,
  EmptyState,
  InfoCard,
  PageContainer,
  PillButton,
  Stepper,
} from '../components/ui';
import { COLORS, FONT_FAMILY, RADII, SHADOWS, useResponsive } from '../theme';

const CHIPS = ['All', 'White', 'Studio', 'Wood', 'Gradient', 'Wall', 'Custom'];
const STEPS = [
  { title: 'Original Images', subtitle: '(As Uploaded)' },
  { title: 'Crop Product', subtitle: '(Background Removed)' },
  { title: 'Select Background', subtitle: '(From Background Master)' },
  { title: 'Final Output', subtitle: '(Ready to Use)' },
];

// Laravel serves /storage/* without CORS headers. api/media/* goes through
// Laravel, so the browser is allowed to read it.
const corsSafe = (uri) =>
  String(uri).replace(/^(https?:\/\/[^/]+)\/storage\//, '$1/api/media/');

export default function ProcessWizardScreen({ route, navigation }) {
  const { token } = useAuth();
  const { isDesktop, isMobile, isTablet, processMaxWidth, contentWidth, outputCols } =
    useResponsive();
  const [step, setStep] = useState(route.params?.step || 1);
  const [assets, setAssets] = useState(() =>
    (route.params?.assets || []).map((a) => ({
      ...a,
      selected: a.selected !== false,
    }))
  );
  const [originals, setOriginals] = useState(
    (route.params?.assets || []).map((a) => a.uri)
  );
  const [orientation, setOrientation] = useState(
    route.params?.orientation || 'vertical'
  );
  const [chip, setChip] = useState('All');
  const [backgrounds, setBackgrounds] = useState([]);
  const [customBackgrounds, setCustomBackgrounds] = useState([]);
  const [background, setBackground] = useState(null);
  const [applyAll, setApplyAll] = useState(true);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState([]);
  const [busy, setBusy] = useState(false);
  const [scale] = useState(0.92);
  const [cropOpen, setCropOpen] = useState(false);
  const productImageIds = route.params?.productImageIds || [];
  const [productList, setProductList] = useState([]);
  const [productQuery] = useState('');
  const [outputFilter, setOutputFilter] = useState('all'); // 'all' | 'shortlisted'
  const [outputViewMode, setOutputViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedOutputs, setSelectedOutputs] = useState({});
  const [shortlistedOutputs, setShortlistedOutputs] = useState({});
  const [deletedOutputs, setDeletedOutputs] = useState({});
  const [fullScreenPreview, setFullScreenPreview] = useState(null);
  const [toast, setToast] = useState(null);
  const sheetRef = useRef(null);

  // Add to Product Master modal state (Step 4)
  const [addProductOpen, setAddProductOpen] = useState(false);

  useEffect(() => {
    if (assets.length === 0) {
      if (current !== 0) setCurrent(0);
    } else if (current >= assets.length) {
      setCurrent(assets.length - 1);
    }
  }, [assets.length, current]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  };

  useEffect(() => {
    if (route.params?.step) {
      setStep(route.params.step);
    }
  }, [route.params?.step]);

  useEffect(() => {
    navigation.setOptions({
      title: step === 4 ? 'Final Output' : 'Process Images',
      onBack: () => {
        if (step > 1) {
          setStep((s) => Math.max(1, s - 1));
          return;
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      },
    });
  }, [step, navigation]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (cropOpen || fullScreenPreview || addProductOpen) {
        return false;
      }
      if (step > 1) {
        setStep((s) => Math.max(1, s - 1));
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step, cropOpen, fullScreenPreview, addProductOpen]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const actionType = e.data?.action?.type;
      if (step <= 1 || (actionType !== 'GO_BACK' && actionType !== 'POP')) {
        return;
      }
      e.preventDefault();
      setStep((s) => Math.max(1, s - 1));
    });
    return unsubscribe;
  }, [navigation, step]);

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
    fetchAllProducts(token, productQuery ? { q: productQuery } : {})
      .then((list) => setProductList(list))
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
        local.push({ ...asset, uri, selected: asset.selected !== false });
      }
      if (!cancelled && local.length) {
        setAssets(local);
        setOriginals(local.map((a) => a.uri));
        setCurrent(0);
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
      local.push({ ...asset, uri, composited: false, selected: true });
    }
    setAssets((a) => [...a, ...local]);
    setOriginals((o) => [...o, ...local.map((item) => item.uri)]);
  };

  const toggleStep1Asset = (idx) => {
    const target = assets[idx];
    if (!target) return;
    const currentlySelected = target.selected !== false;
    if (currentlySelected) {
      const nextAssets = assets.filter((_, i) => i !== idx);
      const nextOriginals = originals.filter((_, i) => i !== idx);
      setAssets(nextAssets);
      setOriginals(nextOriginals);
      setResult([]);
      setCurrent((prev) => {
        if (nextAssets.length === 0) return 0;
        if (idx < prev) return prev - 1;
        return Math.min(prev, nextAssets.length - 1);
      });
      return;
    }
    setAssets((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, selected: true } : item))
    );
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
      mediaTypes: ['images'],
    });
    await addPicked(picked);
  };

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const shot = await ImagePicker.launchCameraAsync({
      quality: 1,
      mediaTypes: ['images'],
    });
    await addPicked(shot);
  };

  const addCustomBackground = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access to select a background image.'
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      mediaTypes: ['images'],
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
      'Background added',
      'Custom background has been set and applied to current editing images.'
    );
  };

  const editCustomBackground = async (bgToEdit) => {
    if (!bgToEdit?.isCustom) {
      Alert.alert(
        'Preset Background',
        'You can only edit custom user-added backgrounds.'
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      mediaTypes: ['images'],
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    const localUri = await persistLocalImage(picked.assets[0].uri);
    const updatedBg = { ...bgToEdit, url: localUri };
    setCustomBackgrounds((prev) =>
      prev.map((item) => (item.id === bgToEdit.id ? updatedBg : item))
    );
    if (background?.id === bgToEdit.id) {
      setBackground(updatedBg);
    }
    Alert.alert('Background updated', 'Custom background has been updated.');
  };

  const openCrop = () => {
    if (!assets[current]) {
      Alert.alert('Select an image', 'Add an image before cropping.');
      return;
    }
    setCropOpen(true);
  };

  const saveCrop = (out) => {
    setAssets((list) =>
      list.map((item, i) => {
        if (i !== current) return item;
        return {
          ...item,
          uri: out.uri,
          width: out.width,
          height: out.height,
          cropped: true,
          composited: false,
          backgroundRemoved: false,
          cutoutUri: null,
        };
      })
    );
    setResult([]);
    setCropOpen(false);
  };

  const removeCurrentBackground = async () => {
    const asset = assets[current];
    if (!asset) {
      Alert.alert(
        'Select an image',
        'Add an image before removing the background.'
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
            : item
        )
      );
      Alert.alert(
        'Background removed',
        'Clean cropped image is ready as a PNG with a transparent background.'
      );
    } catch (e) {
      console.log('[BG] error', e);
      if (Platform.OS === 'web') {
        window.alert(
          e.message || 'Could not remove the background of this image.'
        );
      } else {
        Alert.alert(
          'Remove background failed',
          e.message || 'Could not remove the background of this image.'
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
            remoteUrl: rows[i]?.url || next[targetIndex].remoteUrl,
            composited: true,
          };
        }
      }
      return next;
    });
  };

  const proceedToCropStep = () => {
    const selectedIndices = [];
    assets.forEach((a, idx) => {
      if (a.selected !== false) selectedIndices.push(idx);
    });
    if (!selectedIndices.length) {
      Alert.alert('Select an image', 'Add at least one image first.');
      return;
    }
    if (selectedIndices.length !== assets.length) {
      setAssets(selectedIndices.map((idx) => assets[idx]));
      setOriginals(
        selectedIndices.map((idx) => originals[idx] || assets[idx].uri)
      );
    }
    setCurrent(0);
    setStep(2);
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
    for (let i = 0; i < assets.length; i += 1) {
      const asset = assets[i];
      const src = asset.cutoutUri || asset.uri;
      if (
        asset.productImageId &&
        !asset.cutoutUri &&
        !asset.cropped &&
        asset.uri === originals[i]
      ) {
        form.append('product_image_ids[]', String(asset.productImageId));
        continue;
      }
      form.append('is_cutout[]', asset.cutoutUri ? '1' : '0');
      await appendImageFile(form, src, i);
    }
    try {
      const res = await api.process(token, form);
      const rows = res.data || [];
      setResult(rows);
      await applyResultsToAssets(rows, assets);
      if (rows.length) {
        const rp = route.params?.products || [];
        saveLocalRecentProcessed(
          rows.map((r, i) => ({
            url: r.url,
            image_count: rows.length,
            product:
              assets[i]?.product ||
              rp[i] ||
              (rp.length === 1 ? rp[0] : null),
          }))
        );
      }
      setDeletedOutputs({});
      setStep(4);
    } catch (e) {
      setDeletedOutputs({});
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
      form.append('is_cutout[0]', asset.cutoutUri ? '1' : '0');
      await appendImageFile(form, asset.cutoutUri || asset.uri, current);
      const res = await api.process(token, form);
      const rows = res.data || [];
      if (rows[0]?.url) {
        await applyResultsToAssets(rows, [asset]);
        saveLocalRecentProcessed([
          {
            url: rows[0].url,
            image_count: 1,
            product: asset?.product || null,
          },
        ]);
      } else {
        setAssets((prev) =>
          prev.map((item, idx) =>
            idx === current ? { ...item, composited: true } : item
          )
        );
      }
      Alert.alert(
        'Background applied',
        'Background applied successfully to current image.'
      );
    } catch (e) {
      setAssets((prev) =>
        prev.map((item, idx) =>
          idx === current ? { ...item, composited: true } : item
        )
      );
      Alert.alert('Background applied', 'Applied background preview to image.');
    } finally {
      setBusy(false);
    }
  };

  const applyBgToAll = async () => {
    if (!background) {
      Alert.alert('Choose a background');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const updated = [...assets];
      const remoteEntries = [];
      for (let i = 0; i < updated.length; i += 1) {
        const item = updated[i];
        const form = new FormData();
        if (!background.isCustom) {
          form.append('background_id', String(background.id));
        }
        form.append('orientation', orientation);
        form.append('apply_to_all', '0');
        form.append('is_cutout[0]', item.cutoutUri ? '1' : '0');
        await appendImageFile(form, item.cutoutUri || item.uri, i);
        const res = await api.process(token, form);
        const url = res.data?.[0]?.url;
        if (url) {
          const rp = route.params?.products || [];
          remoteEntries.push({
            url,
            image_count: updated.length,
            product:
              item?.product ||
              rp[i] ||
              (rp.length === 1 ? rp[0] : null),
          });
        }
        updated[i] = url
          ? {
              ...item,
              uri: await persistLocalImage(url),
              remoteUrl: url,
              composited: true,
            }
          : { ...item, composited: true };
        setAssets([...updated]);
      }
      if (remoteEntries.length) {
        saveLocalRecentProcessed(remoteEntries);
      }
      setResult(updated.map((a) => ({ url: a.uri })));
      Alert.alert('Done', 'Background applied to all images.');
    } catch (e) {
      Alert.alert('Apply failed', e.message || 'Could not apply background.');
    } finally {
      setBusy(false);
    }
  };

  const linkProduct = async (p) => {
    const targetIdx = assets.length ? Math.min(current, assets.length - 1) : 0;
    const nextIdx = assets.findIndex((a, i) => i !== targetIdx && !a.product);
    setAssets((list) =>
      list.map((item, i) =>
        i === targetIdx ? { ...item, product: p } : item
      )
    );
    if (nextIdx >= 0) setCurrent(nextIdx);
    try {
      const r = await api.product(token, p.id);
      const fetched = r?.data || r?.product || r;
      if (fetched && typeof fetched === 'object') {
        const full = { ...p, ...fetched };
        setAssets((list) =>
          list.map((item, i) =>
            i === targetIdx ? { ...item, product: full } : item
          )
        );
      }
    } catch (e) {}
  };

  const routeProducts = route.params?.products || [];
  const rawSheetItems = (result.length ? result : assets).map((item, i) => {
    const baseProd =
      assets[i]?.product ||
      routeProducts[i] ||
      (routeProducts.length === 1 ? routeProducts[0] : undefined);
    const matchedProd = baseProd?.id
      ? productList.find((p) => String(p.id) === String(baseProd.id))
      : undefined;
    const linkedProd = baseProd
      ? { ...(matchedProd || {}), ...baseProd }
      : undefined;
    return {
      key: String(i),
      index: i,
      uri: item.url || item.uri,
      product: linkedProd,
      designNumber:
        linkedProd?.design_number ||
        linkedProd?.name ||
        `Design ${i + 1}`,
    };
  });

  const visibleOutputItems = rawSheetItems.filter(
    (it) => it.uri && !deletedOutputs[it.key]
  );
  const shortlistedOutputItems = visibleOutputItems.filter(
    (it) => Boolean(shortlistedOutputs[it.key])
  );
  const displayedOutputItems =
    outputFilter === 'shortlisted' ? shortlistedOutputItems : visibleOutputItems;
  const selectedOutputItems = visibleOutputItems.filter(
    (it) => Boolean(selectedOutputs[it.key])
  );
  const sheetShareItems = selectedOutputItems.length
    ? selectedOutputItems
    : visibleOutputItems;

  useEffect(() => {
    if (step !== 4) return;
    setSelectedOutputs((prev) => {
      const next = { ...prev };
      let changed = false;
      rawSheetItems.forEach((it) => {
        if (next[it.key] === undefined && !deletedOutputs[it.key]) {
          next[it.key] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [step, rawSheetItems.length]);

  const toggleOutputSelected = (key) => {
    setSelectedOutputs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOutputShortlisted = async (item) => {
    const nextState = !shortlistedOutputs[item.key];
    setShortlistedOutputs((prev) => ({ ...prev, [item.key]: nextState }));
    if (nextState && item.product?.id) {
      api
        .addShortlist(token, [
          {
            product_id: item.product.id,
            product_image_id: item.product.images?.[0]?.id,
          },
        ])
        .catch(() => {});
    }
    showToast(
      nextState ? 'Added to Shortlist.' : 'Removed from Shortlist.'
    );
  };

  const bulkShortlistSelected = () => {
    if (!selectedOutputItems.length) {
      showToast('Select at least one image first.', 'error');
      return;
    }
    const allShortlisted = selectedOutputItems.every(
      (it) => shortlistedOutputs[it.key]
    );
    const nextVal = !allShortlisted;
    setShortlistedOutputs((prev) => {
      const next = { ...prev };
      selectedOutputItems.forEach((it) => {
        next[it.key] = nextVal;
      });
      return next;
    });
    if (nextVal) {
      const linkedItems = selectedOutputItems
        .filter((it) => it.product?.id)
        .map((it) => ({
          product_id: it.product.id,
          product_image_id: it.product.images?.[0]?.id,
        }));
      if (linkedItems.length) {
        api.addShortlist(token, linkedItems).catch(() => {});
      }
    }
    showToast(
      nextVal
        ? `Shortlisted ${selectedOutputItems.length} image(s).`
        : `Removed ${selectedOutputItems.length} image(s) from shortlist.`
    );
  };

  const bulkDeleteSelected = () => {
    if (!selectedOutputItems.length) {
      showToast('Select at least one image to remove.', 'error');
      return;
    }
    const count = selectedOutputItems.length;
    setDeletedOutputs((prev) => {
      const next = { ...prev };
      selectedOutputItems.forEach((it) => {
        next[it.key] = true;
      });
      return next;
    });
    setSelectedOutputs((prev) => {
      const next = { ...prev };
      selectedOutputItems.forEach((it) => {
        next[it.key] = false;
      });
      return next;
    });
    showToast(`Removed ${count} image(s) from Final Output.`);
  };

  const captureSheet = async (itemsToCapture = sheetShareItems) => {
    if (Platform.OS === 'web') {
      return await renderCatalogCardToDataUrl(itemsToCapture);
    }
    if (!sheetRef.current) throw new Error('Catalogue card is not ready yet.');
    return await captureRef(sheetRef, { format: 'png', quality: 1 });
  };

  const downloadSelectedToGallery = async () => {
    if (!selectedOutputItems.length) {
      showToast('Select at least one image to download.', 'error');
      return;
    }
    try {
      const count = await saveImagesToGallery(
        selectedOutputItems.map((it) => it.uri)
      );
      showToast(`Saved ${count} image(s) to gallery.`);
    } catch (e) {
      showToast(e.message || 'Save failed.', 'error');
    }
  };

  const saveResultsToGallery = async () => {
    if (!sheetShareItems.length) {
      showToast('No images available to save.', 'error');
      return;
    }
    try {
      const uri = await captureSheet(sheetShareItems);
      await saveImagesToGallery([uri]);
      showToast('Catalogue card saved to gallery.');
    } catch (e) {
      showToast(e.message || 'Save failed.', 'error');
    }
  };

  const shareOnWhatsApp = async () => {
    if (!selectedOutputItems.length) {
      showToast('Please select at least one image to share.', 'error');
      return;
    }
    try {
      const uri = await captureSheet(selectedOutputItems);
      const linkedProducts = selectedOutputItems
        .map((it) => it.product)
        .filter(Boolean);
      const source = linkedProducts.length ? linkedProducts : products;
      const caption = buildCatalogCaption(
        source.length ? source : selectedOutputItems,
        selectedOutputItems.length
      );
      const shareRes = await shareCaptionAndImages(caption, [uri]);
      const productIds = [
        ...new Set(linkedProducts.map((p) => p?.id).filter(Boolean)),
      ];
      if (productIds.length) {
        api.logShare(token, productIds).catch(() => {});
      }
      if (shareRes?.captionCopied) {
        showToast('Caption copied – paste if missing');
      }
    } catch (e) {
      showToast(e.message || 'Share failed.', 'error');
    }
  };

  const openAddToProductModal = () => {
    if (!selectedOutputItems.length) {
      showToast('Select at least one processed image first.', 'error');
      return;
    }
    setAddProductOpen(true);
  };

  const handleProductAdded = async (createdProduct) => {
    if (createdProduct && typeof createdProduct === 'object') {
      const selectedIdxSet = new Set(selectedOutputItems.map((it) => it.index));
      setAssets((list) =>
        list.map((item, idx) =>
          selectedIdxSet.has(idx) ? { ...item, product: createdProduct } : item
        )
      );
      await updateLocalRecentProduct(
        {
          extraUrls: [
            ...selectedOutputItems.map((it) => it.uri),
            ...selectedOutputItems.map((it) => assets[it.index]?.remoteUrl),
          ],
        },
        createdProduct
      );
    }

    try {
      const refreshed = await fetchAllProducts(
        token,
        productQuery ? { q: productQuery } : {}
      );
      setProductList(refreshed);
    } catch (e) {}

    showToast('Product added to Product Master.');
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

  const safeCurrent = assets.length ? Math.min(current, assets.length - 1) : 0;
  const preview = assets[safeCurrent];
  const selectedStep1Assets = assets.filter((a) => a.selected !== false);

  const stepInfo = {
    1: {
      icon: 'image-outline',
      title: 'Step 1: Original Images',
      subtitle: 'Review selected images. You can add more images if required.',
    },
    2: {
      icon: 'crop-outline',
      title: 'Step 2: Crop Product',
      subtitle: 'Crop the image, remove the background and refine the product.',
    },
    3: {
      icon: 'images-outline',
      title: 'Step 3: Select Background',
      subtitle:
        'Choose a background, set orientation and apply to selected or all images.',
    },
    4: {
      icon: 'checkmark-done-outline',
      title: 'Step 4: Final Output',
      subtitle: 'Select designs, shortlist favorites & share catalogue on WhatsApp.',
    },
  }[step];

  const effectiveWidth = Math.min(contentWidth, processMaxWidth);
  const step1Cols = isDesktop ? 4 : 2;
  const step1Gap = 12;
  const step1CardW = Math.floor(
    (effectiveWidth - step1Gap * (step1Cols - 1)) / step1Cols
  );

  const step4Cols = isDesktop ? 4 : isTablet ? 3 : 2;
  const outGap = 12;
  const outCardW = Math.floor(
    (effectiveWidth - outGap * (step4Cols - 1)) / step4Cols
  );

  const showOverlay = Boolean(
    background?.url && preview?.uri && !preview.composited
  );

  const renderCompositePreview = (uri, height = 240) => (
    <View
      style={[
        styles.previewFrame,
        {
          height,
          aspectRatio: orientation === 'horizontal' ? 1.25 : undefined,
        },
      ]}
    >
      {showOverlay ? (
        <>
          <Image
            source={{ uri: background.url }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%', transform: [{ scale }] }}
            resizeMode="contain"
          />
        </>
      ) : uri ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      ) : null}
    </View>
  );

  const step4PageStyle =
    step === 4
      ? {
          backgroundColor: '#FFFFFF',
          ...(Platform.OS === 'web' ? { backgroundImage: 'none' } : null),
        }
      : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: step === 4 ? '#FFFFFF' : COLORS.bg }}>
      <ToastBanner toast={toast} onHide={() => setToast(null)} />

      <PageContainer
        maxWidth={processMaxWidth}
        style={step4PageStyle}
        bottomPad={step === 4 ? 220 : undefined}
      >
        <Stepper
          steps={STEPS}
          currentStep={step}
          onStepPress={(n) => setStep(n)}
        />

        {step !== 4 ? (
          <InfoCard
            icon={stepInfo.icon}
            title={stepInfo.title}
            subtitle={stepInfo.subtitle}
          />
        ) : null}

        {/* STEP 1 */}
        {step === 1 && (
          <View style={{ gap: 14 }}>
            <View style={styles.rowBetween}>
              <View style={styles.rowInline}>
                <Ionicons name="layers-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionHeading}>
                  {selectedStep1Assets.length} Images Selected
                </Text>
              </View>
              <View style={styles.rowInline}>
                <PillButton
                  label="Camera"
                  icon="camera-outline"
                  variant="outline"
                  compact
                  onPress={camera}
                />
                <PillButton
                  label="+ Add More"
                  variant="outline"
                  compact
                  onPress={addMore}
                />
              </View>
            </View>

            {assets.length === 0 ? (
              <EmptyState
                icon="images-outline"
                title="No images selected yet"
                subtitle="Use + Add More or Camera to select product photos."
                actionLabel="+ Add More"
                onAction={addMore}
              />
            ) : (
              <View style={[styles.grid, { gap: step1Gap }]}>
                {assets.map((a, idx) => {
                  const isFocused = safeCurrent === idx;
                  const isSelected = a.selected !== false;
                  return (
                    <View
                      key={`${a.uri}-${idx}`}
                      style={[
                        styles.step1Card,
                        { width: step1CardW },
                        isFocused && styles.step1CardActive,
                      ]}
                    >
                      <Pressable
                        onPress={() => setCurrent(idx)}
                        style={{ flex: 1 }}
                      >
                        <Image
                          source={{ uri: a.uri }}
                          style={styles.step1Img}
                          resizeMode="cover"
                        />
                        {(a.product?.design_number || a.product?.name) ? (
                          <View style={styles.designTag}>
                            <Text style={styles.designTagText} numberOfLines={1}>
                              {a.product.design_number || a.product.name}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                      <Pressable
                        onPress={() => toggleStep1Asset(idx)}
                        hitSlop={8}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={
                          isSelected
                            ? `Deselect image ${idx + 1}`
                            : `Select image ${idx + 1}`
                        }
                        style={[
                          styles.topRightCheck,
                          { zIndex: 2 },
                          isSelected
                            ? styles.topRightCheckOn
                            : styles.topRightCheckOff,
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={isSelected ? '#FFFFFF' : COLORS.textLight}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {assets.length > 0 && (
              <Card>
                <Text style={styles.subTitle}>
                  Link product to image {safeCurrent + 1} of {assets.length}
                </Text>
                <Text style={styles.caption}>
                  Linked:{' '}
                  {[
                    assets[safeCurrent]?.product?.name,
                    assets[safeCurrent]?.product?.design_number,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'none'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, marginTop: 10 }}
                >
                  {productList.map((p) => {
                    const active = assets[safeCurrent]?.product?.id === p.id;
                    return (
                      <UIChip
                        key={p.id}
                        label={p.design_number || p.name}
                        active={active}
                        onPress={() => linkProduct(p)}
                      />
                    );
                  })}
                </ScrollView>
              </Card>
            )}

            <InfoCard
              icon="information-circle-outline"
              subtitle="Next: Crop the selected images and refine the product area."
              style={{ marginBottom: 4 }}
            />

            <View style={styles.bottomBtnRow}>
              <PillButton
                label="Clear All"
                icon="trash-outline"
                variant="outline"
                onPress={() => {
                  setAssets([]);
                  setOriginals([]);
                  setCurrent(0);
                  setResult([]);
                }}
                style={{ flex: 0.8 }}
              />
              <PillButton
                label="Crop Images"
                icon="crop-outline"
                iconRight="arrow-forward"
                disabled={busy || !selectedStep1Assets.length}
                onPress={proceedToCropStep}
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={{ gap: 14 }}>
            {preview?.uri ? (
              <View style={styles.panelsWrap}>
                {/* Left Panel: Crop & Adjust */}
                <Card style={styles.panelCard} padded={false}>
                  <View style={styles.panelTag}>
                    <Text style={styles.panelTagText}>Crop & Adjust</Text>
                  </View>
                  <View
                    style={[
                      styles.panelBody,
                      { height: isDesktop ? 340 : 250 },
                    ]}
                  >
                    <Image
                      source={{ uri: preview.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  </View>
                </Card>

                <View style={styles.panelArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>

                {/* Right Panel: Background Removed */}
                <Card style={styles.panelCard} padded={false}>
                  <View style={styles.panelTag}>
                    <Text style={styles.panelTagText}>Background Removed</Text>
                  </View>
                  <View
                    style={[
                      styles.panelBody,
                      { height: isDesktop ? 340 : 250 },
                    ]}
                  >
                    <Checkerboard>
                      {preview.backgroundRemoved || preview.cutoutUri ? (
                        <Image
                          source={{ uri: preview.cutoutUri || preview.uri }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.checkerPlaceholder}>
                          <Ionicons
                            name="layers-outline"
                            size={28}
                            color={COLORS.primaryText}
                          />
                          <Text style={styles.checkerPlaceholderText}>
                            Tap Remove Background
                          </Text>
                        </View>
                      )}
                    </Checkerboard>
                  </View>
                </Card>
              </View>
            ) : (
              <EmptyState
                icon="image-outline"
                title="No image to edit"
                subtitle="Go back to Step 1 and add at least one image."
                actionLabel="Back to Step 1"
                onAction={() => setStep(1)}
              />
            )}

            {/* Thumbnail Strip + Pager */}
            <View style={styles.thumbStripRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, alignItems: 'center' }}
                style={{ flex: 1 }}
              >
                {assets.map((a, idx) => (
                  <Pressable
                    key={`${a.uri}-${idx}`}
                    onPress={() => setCurrent(idx)}
                    style={[
                      styles.miniThumb,
                      current === idx && styles.miniThumbActive,
                    ]}
                  >
                    <Image
                      source={{ uri: a.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
                <Pressable onPress={addMore} style={styles.miniAddTile}>
                  <Ionicons name="add" size={20} color={COLORS.textDark} />
                  <Text style={styles.miniAddText}>Add More</Text>
                </Pressable>
              </ScrollView>

              <View style={styles.pagerRow}>
                <Pressable
                  onPress={() => setCurrent((c) => Math.max(0, c - 1))}
                  style={styles.pagerCircle}
                >
                  <Ionicons name="chevron-back" size={16} color={COLORS.textDark} />
                </Pressable>
                <Text style={styles.pagerText}>
                  {assets.length ? current + 1 : 0} of {assets.length}
                </Text>
                <Pressable
                  onPress={() =>
                    setCurrent((c) => Math.min(assets.length - 1, c + 1))
                  }
                  style={styles.pagerCircle}
                >
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>

            {/* Tool Buttons Row */}
            <View style={styles.toolsRow}>
              <Pressable onPress={openCrop} style={[styles.toolBtn, styles.toolBtnActive]}>
                <Ionicons name="crop-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.toolText, { color: COLORS.primaryText }]}>
                  Crop
                </Text>
              </Pressable>

              <Pressable
                onPress={removeCurrentBackground}
                disabled={busy}
                style={styles.toolBtn}
              >
                <Ionicons name="layers-outline" size={20} color={COLORS.textDark} />
                <Text style={styles.toolText} numberOfLines={2}>
                  {busy ? 'Removing…' : 'Remove Background'}
                </Text>
              </Pressable>

              <Pressable
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
                        : item
                    )
                  )
                }
                style={styles.toolBtn}
              >
                <Ionicons name="refresh-outline" size={20} color={COLORS.textDark} />
                <Text style={styles.toolText}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.bottomBtnRow}>
              <PillButton
                label="Previous"
                icon="arrow-back"
                variant="outline"
                onPress={() => setStep(1)}
                style={{ flex: 0.8 }}
              />
              <PillButton
                label="Next: Select Background"
                iconRight="arrow-forward"
                onPress={() => setStep(3)}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View style={{ gap: 14 }}>
            <View style={[isDesktop && styles.step3DesktopGrid]}>
              {/* Left Column Controls */}
              <View style={[{ gap: 14 }, isDesktop && { flex: 1.15 }]}>
                {/* Image Selector */}
                <Card>
                  <View style={[styles.rowBetween, { marginBottom: 10 }]}>
                    <View style={styles.rowInline}>
                      <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.subTitle}>Select Image to Set Background</Text>
                    </View>
                    <View style={styles.greenCountBadge}>
                      <Text style={styles.greenCountBadgeText}>
                        Image {assets.length ? current + 1 : 0} of {assets.length}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.carouselRow}>
                    <Pressable
                      onPress={() => setCurrent((c) => Math.max(0, c - 1))}
                      style={styles.pagerCircle}
                    >
                      <Ionicons name="chevron-back" size={16} color={COLORS.textDark} />
                    </Pressable>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 10 }}
                      style={{ flex: 1 }}
                    >
                      {assets.map((a, i) => {
                        const active = current === i;
                        const overlay =
                          background?.url &&
                          !a.composited &&
                          (applyAll || i === current);
                        return (
                          <Pressable
                            key={`${a.uri}-${i}`}
                            onPress={() => setCurrent(i)}
                            style={[
                              styles.step3Thumb,
                              active && styles.step3ThumbActive,
                            ]}
                          >
                            {overlay ? (
                              <Image
                                source={{ uri: background.url }}
                                style={{ position: 'absolute', width: '100%', height: '100%' }}
                                resizeMode="cover"
                              />
                            ) : null}
                            <Image
                              source={{ uri: a.uri }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="contain"
                            />
                            {active ? (
                              <View style={styles.miniGreenCheck}>
                                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    <Pressable
                      onPress={() =>
                        setCurrent((c) => Math.min(assets.length - 1, c + 1))
                      }
                      style={styles.pagerCircle}
                    >
                      <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                    </Pressable>
                  </View>
                </Card>

                {/* Apply Background To */}
                <View>
                  <View style={[styles.rowInline, { marginBottom: 8 }]}>
                    <Ionicons name="layers-outline" size={17} color={COLORS.primary} />
                    <Text style={styles.subTitle}>Apply Background To</Text>
                  </View>
                  <View style={styles.segmentRow}>
                    <Pressable
                      onPress={() => setApplyAll(false)}
                      style={[
                        styles.segmentCard,
                        !applyAll && styles.segmentCardActive,
                      ]}
                    >
                      <Ionicons
                        name="image-outline"
                        size={18}
                        color={!applyAll ? COLORS.primary : COLORS.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.segmentTitle,
                            !applyAll && { color: COLORS.primaryText },
                          ]}
                        >
                          Selected Image Only
                        </Text>
                        <Text style={styles.segmentSub}>(1 Image)</Text>
                      </View>
                      {!applyAll ? (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                      ) : null}
                    </Pressable>

                    <Pressable
                      onPress={() => setApplyAll(true)}
                      style={[
                        styles.segmentCard,
                        applyAll && styles.segmentCardActive,
                      ]}
                    >
                      <Ionicons
                        name="layers-outline"
                        size={18}
                        color={applyAll ? COLORS.primary : COLORS.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.segmentTitle,
                            applyAll && { color: COLORS.primaryText },
                          ]}
                        >
                          All Images
                        </Text>
                        <Text style={styles.segmentSub}>({assets.length} Images)</Text>
                      </View>
                      {applyAll ? (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                      ) : null}
                    </Pressable>
                  </View>
                </View>

                {/* Background Orientation */}
                <View>
                  <View style={[styles.rowInline, { marginBottom: 8 }]}>
                    <Ionicons name="crop-outline" size={17} color={COLORS.primary} />
                    <Text style={styles.subTitle}>
                      Background Orientation{' '}
                      <Text style={{ fontWeight: '500', color: COLORS.textMuted }}>
                        (Image Size)
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.segmentRow}>
                    <Pressable
                      onPress={() => setOrientation('vertical')}
                      style={[
                        styles.segmentCard,
                        orientation === 'vertical' && styles.segmentCardActive,
                      ]}
                    >
                      <Ionicons
                        name="phone-portrait-outline"
                        size={18}
                        color={
                          orientation === 'vertical' ? COLORS.primary : COLORS.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.segmentTitle,
                          orientation === 'vertical' && { color: COLORS.primaryText },
                          { flex: 1 },
                        ]}
                      >
                        Vertical (Portrait)
                      </Text>
                      {orientation === 'vertical' ? (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                      ) : null}
                    </Pressable>

                    <Pressable
                      onPress={() => setOrientation('horizontal')}
                      style={[
                        styles.segmentCard,
                        orientation === 'horizontal' && styles.segmentCardActive,
                      ]}
                    >
                      <Ionicons
                        name="phone-landscape-outline"
                        size={18}
                        color={
                          orientation === 'horizontal' ? COLORS.primary : COLORS.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.segmentTitle,
                          orientation === 'horizontal' && { color: COLORS.primaryText },
                          { flex: 1 },
                        ]}
                      >
                        Horizontal (Landscape)
                      </Text>
                      {orientation === 'horizontal' ? (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                      ) : null}
                    </Pressable>
                  </View>
                </View>

                {/* Choose Background */}
                <Card>
                  <View style={[styles.rowBetween, { marginBottom: 10 }]}>
                    <View style={styles.rowInline}>
                      <Ionicons name="layers-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.subTitle}>
                        Choose Background{background?.name ? `: ${background.name}` : ''}
                      </Text>
                    </View>
                    <PillButton
                      label="Upload from Gallery"
                      icon="cloud-upload-outline"
                      variant="outline"
                      compact
                      onPress={addCustomBackground}
                    />
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, marginBottom: 12 }}
                  >
                    {CHIPS.map((c) => (
                      <UIChip
                        key={c}
                        label={c}
                        active={chip === c}
                        onPress={() => setChip(c)}
                      />
                    ))}
                  </ScrollView>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10 }}
                  >
                    {backgrounds.map((bg) => {
                      const active = background?.id === bg.id;
                      return (
                        <View key={bg.id} style={{ alignItems: 'center', width: 92 }}>
                          <Pressable
                            onPress={() => {
                              setBackground(bg);
                              setAssets((list) =>
                                list.map((x) =>
                                  x.cutoutUri
                                    ? { ...x, uri: x.cutoutUri, composited: false }
                                    : x
                                )
                              );
                            }}
                            style={[
                              styles.bgSwatch,
                              active && styles.bgSwatchActive,
                            ]}
                          >
                            <Image
                              source={{ uri: bg.url }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                            {active ? (
                              <View style={styles.miniGreenCheck}>
                                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                              </View>
                            ) : null}
                          </Pressable>
                          <Text style={styles.bgName} numberOfLines={1}>
                            {bg.name}
                          </Text>
                          {bg.isCustom ? (
                            <Pressable onPress={() => editCustomBackground(bg)}>
                              <Text style={styles.editBgLink}>Edit BG</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })}
                  </ScrollView>
                </Card>
              </View>

              {/* Right Column Preview + Apply */}
              <View style={[{ gap: 12 }, isDesktop && { flex: 0.95 }]}>
                <Card>
                  <View style={[styles.rowInline, { marginBottom: 12 }]}>
                    <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.subTitle}>
                      Preview – Selected Image ({assets.length ? current + 1 : 0})
                    </Text>
                  </View>

                  <View style={styles.previewPairRow}>
                    <View style={styles.previewCol}>
                      <View style={styles.previewBadgeMuted}>
                        <Text style={styles.previewBadgeMutedText}>
                          Cropped Product
                        </Text>
                      </View>
                      <View style={styles.previewFrame}>
                        <Checkerboard>
                          {preview?.cutoutUri || preview?.uri ? (
                            <Image
                              source={{ uri: preview.cutoutUri || preview.uri }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="contain"
                            />
                          ) : null}
                        </Checkerboard>
                      </View>
                    </View>

                    <View style={styles.panelArrow}>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.previewCol}>
                      <View style={styles.previewBadgeGreen}>
                        <Text style={styles.previewBadgeGreenText}>
                          With Selected Background
                        </Text>
                      </View>
                      {renderCompositePreview(preview?.uri, 210)}
                    </View>
                  </View>

                  <View style={[styles.bottomBtnRow, { marginTop: 14 }]}>
                    <PillButton
                      label="Apply to Selected"
                      variant="soft"
                      compact
                      disabled={busy}
                      onPress={removeBackground}
                      style={{ flex: 1 }}
                    />
                    <PillButton
                      label={busy ? 'Processing…' : 'Apply to All'}
                      variant="soft"
                      compact
                      disabled={busy}
                      onPress={applyBgToAll}
                      style={{ flex: 1 }}
                    />
                  </View>
                </Card>
              </View>
            </View>

            <View style={styles.bottomBtnRow}>
              <PillButton
                label="Previous"
                icon="arrow-back"
                variant="outline"
                onPress={() => setStep(2)}
                style={{ flex: 0.8 }}
              />
              <PillButton
                label={busy ? 'Processing…' : 'Next: Final Output'}
                iconRight="arrow-forward"
                disabled={busy}
                onPress={runProcess}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        )}

        {/* STEP 4: Final Output */}
        {step === 4 && (
          <View style={{ gap: 16 }}>
            {/* Filter Pills & Grid/List View Toggle */}
            <View style={styles.finalToolbar}>
              <View style={styles.finalTabsRow}>
                <Pressable
                  onPress={() => setOutputFilter('all')}
                  style={[
                    styles.finalPillTab,
                    outputFilter === 'all' && styles.finalPillTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.finalPillTabText,
                      outputFilter === 'all' && styles.finalPillTabTextActive,
                    ]}
                  >
                    All Images ({visibleOutputItems.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setOutputFilter('shortlisted')}
                  style={[
                    styles.finalPillTab,
                    outputFilter === 'shortlisted' && styles.finalPillTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.finalPillTabText,
                      outputFilter === 'shortlisted' &&
                        styles.finalPillTabTextActive,
                    ]}
                  >
                    Shortlisted ({shortlistedOutputItems.length})
                  </Text>
                </Pressable>
              </View>

              <View style={styles.viewToggleGroup}>
                <Pressable
                  onPress={() => setOutputViewMode('grid')}
                  accessibilityLabel="Grid view"
                  style={[
                    styles.viewToggleBtn,
                    outputViewMode === 'grid' && styles.viewToggleBtnActive,
                  ]}
                >
                  <Ionicons
                    name="grid"
                    size={16}
                    color={outputViewMode === 'grid' ? '#FFFFFF' : '#111827'}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setOutputViewMode('list')}
                  accessibilityLabel="List view"
                  style={[
                    styles.viewToggleBtn,
                    outputViewMode === 'list' && styles.viewToggleBtnActive,
                  ]}
                >
                  <Ionicons
                    name="list"
                    size={18}
                    color={outputViewMode === 'list' ? '#FFFFFF' : '#111827'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Processed Images Grid / List */}
            {displayedOutputItems.length === 0 ? (
              <EmptyState
                icon={outputFilter === 'shortlisted' ? 'star-outline' : 'images-outline'}
                title={
                  outputFilter === 'shortlisted'
                    ? 'No shortlisted images yet'
                    : 'No processed images'
                }
                subtitle={
                  outputFilter === 'shortlisted'
                    ? 'Tap the star icon on any product image to shortlist it.'
                    : 'Process images in previous steps to view your final output.'
                }
              />
            ) : outputViewMode === 'grid' ? (
              <View style={[styles.grid, { gap: outGap }]}>
                {displayedOutputItems.map((it) => {
                  const isSelected = Boolean(selectedOutputs[it.key]);
                  const isShortlisted = Boolean(shortlistedOutputs[it.key]);
                  return (
                    <Pressable
                      key={it.key}
                      onPress={() => toggleOutputSelected(it.key)}
                      onLongPress={() =>
                        setFullScreenPreview({
                          uri: it.uri,
                          title: it.designNumber,
                        })
                      }
                      style={[
                        styles.finalCard,
                        { width: outCardW },
                        isSelected && styles.finalCardSelected,
                      ]}
                    >
                      <View style={styles.finalImgWrap}>
                        <Image
                          source={{ uri: it.uri }}
                          style={styles.finalImg}
                          resizeMode="cover"
                        />

                        {/* Top-left selection checkbox */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            toggleOutputSelected(it.key);
                          }}
                          hitSlop={8}
                          style={[
                            styles.finalCheckbox,
                            isSelected
                              ? styles.finalCheckboxOn
                              : styles.finalCheckboxOff,
                          ]}
                        >
                          {isSelected ? (
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          ) : null}
                        </Pressable>

                        {/* Top-right shortlist star */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            toggleOutputShortlisted(it);
                          }}
                          hitSlop={8}
                          style={styles.finalStarBtn}
                        >
                          <Ionicons
                            name={isShortlisted ? 'star' : 'star-outline'}
                            size={16}
                            color={isShortlisted ? '#2E7D32' : '#374151'}
                          />
                        </Pressable>
                      </View>

                      <View style={styles.finalLabelRow}>
                        <Text style={styles.finalDesignLabel} numberOfLines={1}>
                          {it.designNumber}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {displayedOutputItems.map((it) => {
                  const isSelected = Boolean(selectedOutputs[it.key]);
                  const isShortlisted = Boolean(shortlistedOutputs[it.key]);
                  const colourText = it.product?.colour || it.product?.color;
                  const sizeText = (it.product?.sizes || [])
                    .map((s) => s.size)
                    .filter(Boolean)
                    .join(' | ');
                  return (
                    <Pressable
                      key={it.key}
                      onPress={() => toggleOutputSelected(it.key)}
                      style={[
                        styles.finalListCard,
                        isSelected && styles.finalCardSelected,
                      ]}
                    >
                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          toggleOutputSelected(it.key);
                        }}
                        style={[
                          styles.finalCheckboxStatic,
                          isSelected
                            ? styles.finalCheckboxOn
                            : styles.finalCheckboxOff,
                        ]}
                      >
                        {isSelected ? (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        ) : null}
                      </Pressable>

                      <Image
                        source={{ uri: it.uri }}
                        style={styles.finalListThumb}
                        resizeMode="cover"
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={styles.finalListTitle} numberOfLines={1}>
                          {it.designNumber}
                        </Text>
                        {it.product?.name ? (
                          <Text style={styles.finalListSub} numberOfLines={1}>
                            {it.product.name}
                          </Text>
                        ) : null}
                        {(colourText || sizeText) ? (
                          <Text style={styles.finalListMeta} numberOfLines={1}>
                            {[colourText, sizeText].filter(Boolean).join(' · ')}
                          </Text>
                        ) : null}
                      </View>

                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          toggleOutputShortlisted(it);
                        }}
                        style={styles.finalListIconBtn}
                      >
                        <Ionicons
                          name={isShortlisted ? 'star' : 'star-outline'}
                          size={18}
                          color={isShortlisted ? '#2E7D32' : '#4B5563'}
                        />
                      </Pressable>

                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setFullScreenPreview({
                            uri: it.uri,
                            title: it.designNumber,
                          });
                        }}
                        style={styles.finalListIconBtn}
                      >
                        <Ionicons
                          name="expand-outline"
                          size={18}
                          color={COLORS.textDark}
                        />
                      </Pressable>

                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setCurrent(it.index);
                          setStep(2);
                        }}
                        style={styles.finalListIconBtn}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={COLORS.textDark}
                        />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Combined Richboy Collection Catalogue Share Card */}
            {sheetShareItems.length > 0 ? (
              <View style={styles.catalogueSection}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionHeading}>
                    WhatsApp Catalogue Card Preview
                  </Text>
                  <View style={styles.rowInline}>
                    <PillButton
                      label="Save Card"
                      icon="download-outline"
                      variant="outline"
                      compact
                      onPress={saveResultsToGallery}
                    />
                    <PillButton
                      label="Print Preview"
                      icon="print-outline"
                      variant="soft"
                      compact
                      onPress={() =>
                        navigation.navigate('PrintPreview', {
                          images: sheetShareItems.map((it) => ({
                            url: it.uri,
                            product: it.product,
                            designNumber: it.designNumber,
                          })),
                          products,
                        })
                      }
                    />
                  </View>
                </View>

                <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', marginTop: 10 }}>
                  <ViewShot
                    ref={sheetRef}
                    collapsable={false}
                    options={{ format: 'png', quality: 1 }}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      paddingVertical: 4,
                    }}
                  >
                    <ProductSheet items={sheetShareItems} />
                  </ViewShot>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </PageContainer>

      {/* Bottom Action Bar for Step 4 (Final Output) */}
      {step === 4 ? (
        <ActionBar style={styles.finalActionBar}>
          <View style={{ width: '100%', gap: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.finalSelectedText}>
                {selectedOutputItems.length}{' '}
                {selectedOutputItems.length === 1 ? 'Image' : 'Images'} Selected
              </Text>
              <PillButton
                label="Add to Product Master"
                icon="add-circle-outline"
                variant="soft"
                compact
                onPress={openAddToProductModal}
              />
            </View>
            <View style={styles.finalBottomRow}>
              <View style={styles.finalQuickIcons}>
                <Pressable
                  onPress={downloadSelectedToGallery}
                  accessibilityLabel="Download selected images"
                  style={styles.finalQuickBtn}
                >
                  <Ionicons name="download-outline" size={20} color="#111827" />
                </Pressable>
                <Pressable
                  onPress={shareOnWhatsApp}
                  accessibilityLabel="Quick WhatsApp share"
                  style={[styles.finalQuickBtn, styles.finalQuickWaBtn]}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#2E7D32" />
                </Pressable>
                <Pressable
                  onPress={bulkShortlistSelected}
                  accessibilityLabel="Shortlist selected images"
                  style={styles.finalQuickBtn}
                >
                  <Ionicons
                    name={
                      selectedOutputItems.length > 0 &&
                      selectedOutputItems.every((it) => shortlistedOutputs[it.key])
                        ? 'star'
                        : 'star-outline'
                    }
                    size={20}
                    color="#111827"
                  />
                </Pressable>
                <Pressable
                  onPress={bulkDeleteSelected}
                  accessibilityLabel="Remove selected images"
                  style={styles.finalQuickBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#111827" />
                </Pressable>
              </View>

              <Pressable
                onPress={shareOnWhatsApp}
                style={({ pressed }) => [
                  styles.finalSharePill,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.finalSharePillText}>Share on WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        </ActionBar>
      ) : null}

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

      <AddToProductModal
        visible={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        token={token}
        images={selectedOutputItems}
        initialOrientation={orientation}
        initialProduct={
          selectedOutputItems.find((it) => it.product)?.product || null
        }
        onSuccess={handleProductAdded}
      />

      <ImagePreviewModal
        visible={Boolean(fullScreenPreview)}
        uri={fullScreenPreview?.uri}
        title={fullScreenPreview?.title}
        onClose={() => setFullScreenPreview(null)}
      />
    </View>
  );
}

async function cutOutBackground(uri, token) {
  const form = new FormData();
  await appendImageFile(form, uri, 0);

  const res = await api.removeBackground(token, form);
  console.log('[BG] response', JSON.stringify(res));
  const url = res.url || res.data?.url || res.data?.[0]?.url;
  if (!url) throw new Error('No image returned from server.');
  return url;
}

function Checkerboard({ children, style }) {
  const CELL = 16;
  const cols = 16;
  const rows = 18;
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((r + c) % 2 === 0) {
        cells.push(
          <View
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left: `${(c / cols) * 100}%`,
              top: `${(r / rows) * 100}%`,
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              backgroundColor: '#E2E8E2',
            }}
          />
        );
      }
    }
  }
  return (
    <View
      style={[
        { flex: 1, width: '100%', height: '100%', backgroundColor: '#F5F7F5', overflow: 'hidden' },
        style,
      ]}
    >
      {cells}
      {children}
    </View>
  );
}

const CROP_RATIOS = [
  { id: 'custom', label: 'Custom' },
  { id: 'original', label: 'Original' },
  { id: 'full', label: 'Full screen' },
  { id: '4:3', label: '4:3' },
  { id: '1:1', label: '1:1' },
];

const MAX_CROP_SOURCE_DIM = 1800;

function clampCrop(rect, min = 0.08) {
  let { x, y, w, h } = rect || {};
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(w) ||
    !Number.isFinite(h)
  ) {
    return { x: 0.08, y: 0.08, w: 0.84, h: 0.84 };
  }
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

async function ensureLocalCropUri(sourceUri) {
  if (!sourceUri) return sourceUri;
  if (Platform.OS === 'web') return sourceUri;
  if (/^file:\/\//i.test(String(sourceUri))) return sourceUri;
  const local = await persistLocalImage(sourceUri);
  if (/^file:\/\//i.test(String(local))) return local;
  return local || sourceUri;
}

function getImageSizeAsync(targetUri) {
  return new Promise((resolve) => {
    Image.getSize(
      targetUri,
      (w, h) => resolve({ w, h }),
      () => resolve({ w: 0, h: 0 })
    );
  });
}

async function normalizeImageForCrop(sourceUri, fallbackW = 0, fallbackH = 0) {
  const localUri = await ensureLocalCropUri(sourceUri);
  const measured = await getImageSizeAsync(localUri);
  const rawW = measured.w || fallbackW || 0;
  const rawH = measured.h || fallbackH || 0;

  if (Platform.OS === 'web') {
    return { uri: localUri, w: rawW, h: rawH };
  }

  const actions = [];
  if (rawW > 0 && rawH > 0 && Math.max(rawW, rawH) > MAX_CROP_SOURCE_DIM) {
    actions.push(
      rawW >= rawH
        ? { resize: { width: MAX_CROP_SOURCE_DIM } }
        : { resize: { height: MAX_CROP_SOURCE_DIM } }
    );
  }

  let out = await ImageManipulator.manipulateAsync(localUri, actions, {
    compress: 1,
    format: ImageManipulator.SaveFormat.PNG,
  });

  if (
    out.width &&
    out.height &&
    Math.max(out.width, out.height) > MAX_CROP_SOURCE_DIM
  ) {
    out = await ImageManipulator.manipulateAsync(
      out.uri,
      [
        out.width >= out.height
          ? { resize: { width: MAX_CROP_SOURCE_DIM } }
          : { resize: { height: MAX_CROP_SOURCE_DIM } },
      ],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
  }

  return {
    uri: out.uri,
    w: Math.max(1, Math.round(out.width || rawW || 1)),
    h: Math.max(1, Math.round(out.height || rawH || 1)),
  };
}

function CropEditor({ uri, imageWidth, imageHeight, onCancel, onDone }) {
  const stageRef = useRef(null);
  const stagePage = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const panStartRef = useRef(null);
  const prepPromiseRef = useRef(null);
  const [stage, setStage] = useState({
    w: Math.max(1, Dimensions.get('window').width),
    h: Math.max(1, Math.round(Dimensions.get('window').height * 0.5)),
  });
  const [natural, setNatural] = useState({
    w: imageWidth || 0,
    h: imageHeight || 0,
    uri,
  });
  const [rect, setRect] = useState({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 });
  const [aspect, setAspect] = useState('custom');
  const [tool, setTool] = useState('crop');
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
    const task = (async () => {
      try {
        const normalized = await normalizeImageForCrop(
          uri,
          imageWidth,
          imageHeight
        );
        if (alive && normalized.w && normalized.h) {
          setNatural(normalized);
        }
      } catch (e) {
        const size = await getImageSizeAsync(uri);
        if (alive) {
          const w = size.w || imageWidth || 0;
          const h = size.h || imageHeight || 0;
          if (w && h) setNatural({ w, h, uri });
        }
      }
    })();
    prepPromiseRef.current = task;
    return () => {
      alive = false;
    };
  }, [uri, imageWidth, imageHeight]);

  const frame = useMemo(() => {
    const stageW = Number.isFinite(stage.w) && stage.w > 0 ? stage.w : 1;
    const stageH = Number.isFinite(stage.h) && stage.h > 0 ? stage.h : 1;
    const natW = Number.isFinite(natural.w) && natural.w > 0 ? natural.w : 1;
    const natH = Number.isFinite(natural.h) && natural.h > 0 ? natural.h : 1;
    const s = Math.min(stageW / natW, stageH / natH);
    const w = Math.max(1, natW * s);
    const h = Math.max(1, natH * s);
    return { x: (stageW - w) / 2, y: (stageH - h) / 2, w, h };
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
    if (id === 'custom') return;
    if (id === 'full' || id === 'original') {
      remember(
        id === 'full'
          ? { x: 0, y: 0, w: 1, h: 1 }
          : maxRectForPixelAspect(nat.w / nat.h, nat.w, nat.h)
      );
      return;
    }
    const pixelAspect = id === '1:1' ? 1 : 4 / 3;
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
    if (busy) return;
    setBusy(true);
    try {
      if (prepPromiseRef.current) {
        await prepPromiseRef.current.catch(() => {});
      }
      const nat = naturalRef.current;
      const srcUri = await ensureLocalCropUri(nat.uri);
      const actions = [];
      if (
        Platform.OS !== 'web' &&
        nat.w > 0 &&
        nat.h > 0 &&
        Math.max(nat.w, nat.h) > MAX_CROP_SOURCE_DIM
      ) {
        actions.push(
          nat.w >= nat.h
            ? { resize: { width: MAX_CROP_SOURCE_DIM } }
            : { resize: { height: MAX_CROP_SOURCE_DIM } }
        );
      }
      actions.push({ rotate: 90 });
      const out = await ImageManipulator.manipulateAsync(srcUri, actions, {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      });
      remember(
        { x: 0, y: 0, w: 1, h: 1 },
        {
          w: Math.max(1, Math.round(out.width || nat.h || 1)),
          h: Math.max(1, Math.round(out.height || nat.w || 1)),
          uri: out.uri,
        }
      );
    } catch (e) {
      Alert.alert('Rotate failed', e.message || 'Could not rotate this image.');
    } finally {
      setBusy(false);
    }
  };

  const measureStage = (layoutEvent) => {
    const layout = layoutEvent?.nativeEvent?.layout;
    if (
      layout &&
      Number.isFinite(layout.width) &&
      Number.isFinite(layout.height) &&
      layout.width > 0 &&
      layout.height > 0
    ) {
      setStage((prev) =>
        prev.w === layout.width && prev.h === layout.height
          ? prev
          : { w: layout.width, h: layout.height }
      );
    }
    stageRef.current?.measureInWindow?.((x, y, w, h) => {
      if (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(w) &&
        Number.isFinite(h) &&
        w > 0 &&
        h > 0
      ) {
        stagePage.current = { x, y, w, h };
        setStage((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    });
  };

  useEffect(() => {
    const t1 = setTimeout(() => measureStage(), 80);
    const t2 = setTimeout(() => measureStage(), 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => aspectRef.current !== 'full',
        onMoveShouldSetPanResponder: () => aspectRef.current !== 'full',
        onPanResponderGrant: (e) => {
          const frameNow = frameRef.current;
          if (
            !frameNow ||
            !Number.isFinite(frameNow.w) ||
            !Number.isFinite(frameNow.h) ||
            frameNow.w <= 0 ||
            frameNow.h <= 0
          ) {
            return;
          }
          const sp = stagePage.current;
          const hasPage =
            Number.isFinite(sp.x) &&
            Number.isFinite(sp.y) &&
            Number.isFinite(sp.w) &&
            Number.isFinite(sp.h) &&
            sp.w > 0 &&
            sp.h > 0;
          if (!hasPage) {
            measureStage();
          }
          const px = hasPage
            ? e.nativeEvent.pageX - sp.x
            : e.nativeEvent.locationX;
          const py = hasPage
            ? e.nativeEvent.pageY - sp.y
            : e.nativeEvent.locationY;
          if (!Number.isFinite(px) || !Number.isFinite(py)) return;

          const start = rectRef.current;
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
          let type = 'move';
          Object.entries(handles).some(([name, point]) => {
            if (Math.abs(px - point.x) < 26 && Math.abs(py - point.y) < 26) {
              type = name;
              return true;
            }
            return false;
          });
          panStartRef.current = { type, rect: start, px, py, usedPage: hasPage };
        },
        onPanResponderMove: (e) => {
          const start = panStartRef.current;
          const frameNow = frameRef.current;
          if (
            !start ||
            !frameNow ||
            !Number.isFinite(frameNow.w) ||
            !Number.isFinite(frameNow.h) ||
            frameNow.w <= 0 ||
            frameNow.h <= 0
          ) {
            return;
          }
          const sp = stagePage.current;
          const hasPage =
            start.usedPage &&
            Number.isFinite(sp.x) &&
            Number.isFinite(sp.y) &&
            sp.w > 0 &&
            sp.h > 0;
          const px = hasPage
            ? e.nativeEvent.pageX - sp.x
            : e.nativeEvent.locationX;
          const py = hasPage
            ? e.nativeEvent.pageY - sp.y
            : e.nativeEvent.locationY;
          if (!Number.isFinite(px) || !Number.isFinite(py)) return;

          const dx = (px - start.px) / frameNow.w;
          const dy = (py - start.py) / frameNow.h;
          if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;

          const base = { ...start.rect };
          if (start.type === 'move') {
            setRect(clampCrop({ ...base, x: base.x + dx, y: base.y + dy }));
            return;
          }
          let { x, y, w, h } = base;
          if (start.type.includes('l')) {
            x += dx;
            w -= dx;
          }
          if (start.type.includes('r') || start.type === 'r') {
            w += dx;
          }
          if (start.type.includes('t')) {
            y += dy;
            h -= dy;
          }
          if (start.type.includes('b') || start.type === 'b') {
            h += dy;
          }
          const mode = aspectRef.current;
          const nat = naturalRef.current;
          if (
            mode !== 'custom' &&
            mode !== 'full' &&
            nat.w &&
            nat.h &&
            w > 0.08
          ) {
            const pixelAspect =
              mode === '1:1' ? 1 : mode === '4:3' ? 4 / 3 : nat.w / nat.h;
            const rel = pixelAspect * (nat.h / nat.w);
            h = w / Math.max(rel, 0.01);
          }
          setRect(clampCrop({ x, y, w, h }));
        },
        onPanResponderRelease: () => {
          const start = panStartRef.current;
          if (!start) return;
          const changed =
            JSON.stringify(start.rect) !== JSON.stringify(rectRef.current);
          if (changed) {
            setUndoStack((stack) => [
              ...stack.slice(-24),
              { rect: start.rect, natural: naturalRef.current },
            ]);
            setRedoStack([]);
          }
          panStartRef.current = null;
        },
        onPanResponderTerminate: () => {
          panStartRef.current = null;
        },
      }),
    []
  );

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (prepPromiseRef.current) {
        await prepPromiseRef.current.catch(() => {});
      }
      let nat = naturalRef.current;
      let srcUri = await ensureLocalCropUri(nat.uri);

      if (!nat.w || !nat.h) {
        const normalized = await normalizeImageForCrop(
          srcUri,
          imageWidth,
          imageHeight
        );
        nat = normalized;
        srcUri = normalized.uri;
      } else if (
        Platform.OS !== 'web' &&
        Math.max(nat.w, nat.h) > MAX_CROP_SOURCE_DIM
      ) {
        const downsized = await ImageManipulator.manipulateAsync(
          srcUri,
          [
            nat.w >= nat.h
              ? { resize: { width: MAX_CROP_SOURCE_DIM } }
              : { resize: { height: MAX_CROP_SOURCE_DIM } },
          ],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        srcUri = downsized.uri;
        nat = {
          uri: downsized.uri,
          w: Math.max(1, Math.round(downsized.width || nat.w)),
          h: Math.max(1, Math.round(downsized.height || nat.h)),
        };
      }

      if (!nat.w || !nat.h) {
        Alert.alert('Crop failed', 'Image size is not ready yet.');
        return;
      }

      const natW = Math.max(1, Math.floor(nat.w));
      const natH = Math.max(1, Math.floor(nat.h));
      const crop = clampCrop(rectRef.current, 0.01);
      const originX = Math.max(
        0,
        Math.min(natW - 1, Math.round(crop.x * natW))
      );
      const originY = Math.max(
        0,
        Math.min(natH - 1, Math.round(crop.y * natH))
      );
      const width = Math.max(
        1,
        Math.min(natW - originX, Math.round(crop.w * natW))
      );
      const height = Math.max(
        1,
        Math.min(natH - originY, Math.round(crop.h * natH))
      );

      const out = await ImageManipulator.manipulateAsync(
        srcUri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      onDone(out);
    } catch (e) {
      Alert.alert('Crop failed', e.message || 'Could not save this crop.');
    } finally {
      setBusy(false);
    }
  };

  const box = {
    left: frame.x + rect.x * frame.w,
    top: frame.y + rect.y * frame.h,
    width: Math.max(0, rect.w * frame.w),
    height: Math.max(0, rect.h * frame.h),
  };

  return (
    <View
      style={{
        height: Dimensions.get('window').height,
        backgroundColor: '#0B1610',
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          color: 'white',
          textAlign: 'center',
          fontSize: 18,
          fontWeight: '700',
          paddingTop: 14,
          paddingBottom: 6,
          fontFamily: FONT_FAMILY,
        }}
      >
        Crop Image
      </Text>
      <View
        ref={stageRef}
        onLayout={measureStage}
        style={{ flex: 1, minHeight: 0, marginHorizontal: 8 }}
        {...pan.panHandlers}
      >
        <Image
          source={{ uri: natural.uri }}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: frame.x,
            top: frame.y,
            width: frame.w,
            height: frame.h,
          }}
          resizeMode="contain"
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            height: Math.max(0, box.top),
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: box.top + box.height,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: box.top,
            width: Math.max(0, box.left),
            height: box.height,
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: box.left + box.width,
            top: box.top,
            right: 0,
            height: box.height,
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            borderWidth: 1.5,
            borderColor: COLORS.primaryBorder,
            pointerEvents: 'none',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: '33%',
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'rgba(255,255,255,0.45)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: '66%',
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'rgba(255,255,255,0.45)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: '33%',
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.45)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: '66%',
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.45)',
            }}
          />
          {['tl', 'tr', 'bl', 'br'].map((corner) => (
            <View
              key={corner}
              style={{
                position: 'absolute',
                width: 22,
                height: 22,
                borderColor: '#FFFFFF',
                ...(corner.includes('t')
                  ? { top: -2, borderTopWidth: 4 }
                  : { bottom: -2, borderBottomWidth: 4 }),
                ...(corner.includes('l')
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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
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
            onPress={() => applyAspect('original')}
            style={{
              backgroundColor: '#1E2D24',
              borderRadius: 18,
              paddingHorizontal: 18,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Auto</Text>
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
                  width: 76,
                  height: 58,
                  borderRadius: 14,
                  backgroundColor: active ? COLORS.primary : '#1E2D24',
                  borderWidth: 1,
                  borderColor: active ? COLORS.primaryBorder : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <Ionicons
                  name="crop-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 11,
                    marginTop: 4,
                    fontWeight: '600',
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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            marginTop: 16,
          }}
        >
          <Pressable onPress={onCancel} style={{ padding: 8 }}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <Pressable onPress={() => setTool('crop')}>
              <Text
                style={{
                  color: tool === 'crop' ? COLORS.primaryBorder : '#9ca3af',
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
                Crop
              </Text>
            </Pressable>
            <Pressable onPress={() => setTool('perspective')}>
              <Text
                style={{
                  color: tool === 'perspective' ? COLORS.primaryBorder : '#9ca3af',
                  fontWeight: '700',
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
              color={busy ? '#6b7280' : COLORS.primaryBorder}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  step1Card: {
    aspectRatio: 0.88,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  step1CardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  step1Img: {
    width: '100%',
    height: '100%',
  },
  topRightCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightCheckOn: {
    backgroundColor: COLORS.primary,
  },
  topRightCheckOff: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  designTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.sheetBrown,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  designTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  bottomBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  panelsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelCard: {
    flex: 1,
    overflow: 'hidden',
  },
  panelTag: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  panelTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  panelBody: {
    width: '100%',
    backgroundColor: COLORS.surfaceMuted,
  },
  panelArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  checkerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  checkerPlaceholderText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryText,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: FONT_FAMILY,
  },
  thumbStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  miniThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
  },
  miniThumbActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  miniAddTile: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAddText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pagerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 68,
    ...SHADOWS.soft,
  },
  toolBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  toolText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  step3DesktopGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  greenCountBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  greenCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  step3Thumb: {
    width: 72,
    height: 82,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  step3ThumbActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  miniGreenCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  segmentCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  segmentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  segmentSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  bgSwatch: {
    width: 88,
    height: 106,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  bgSwatchActive: {
    borderColor: COLORS.primary,
    borderWidth: 2.5,
  },
  bgName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: 5,
    textAlign: 'center',
    width: 88,
    fontFamily: FONT_FAMILY,
  },
  editBgLink: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryText,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  previewPairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewCol: {
    flex: 1,
    gap: 6,
  },
  previewBadgeMuted: {
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewBadgeMutedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  previewBadgeGreen: {
    alignSelf: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewBadgeGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryText,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  previewFrame: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outputCard: {
    overflow: 'hidden',
  },
  outputImg: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: COLORS.surfaceMuted,
  },
  outputActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  outputIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step4BtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  finalToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  finalTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  finalPillTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  finalPillTabActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  finalPillTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: FONT_FAMILY,
  },
  finalPillTabTextActive: {
    color: '#FFFFFF',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  finalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  finalCardSelected: {
    borderColor: '#1B5E20',
  },
  finalImgWrap: {
    width: '100%',
    aspectRatio: 0.88,
    backgroundColor: '#FBF7F0',
    position: 'relative',
  },
  finalImg: {
    width: '100%',
    height: '100%',
  },
  finalCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalCheckboxStatic: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalCheckboxOn: {
    backgroundColor: '#1B5E20',
    borderWidth: 1.5,
    borderColor: '#1B5E20',
  },
  finalCheckboxOff: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  finalStarBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalLabelRow: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  finalDesignLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: FONT_FAMILY,
  },
  finalListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 10,
    ...SHADOWS.soft,
  },
  finalListThumb: {
    width: 56,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#FBF7F0',
  },
  finalListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: FONT_FAMILY,
  },
  finalListSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  finalListMeta: {
    fontSize: 11,
    color: '#2E7D32',
    marginTop: 2,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  finalListIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogueSection: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  finalActionBar: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  finalSelectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
    fontFamily: FONT_FAMILY,
  },
  finalBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  finalQuickIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  finalQuickBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalQuickWaBtn: {
    borderColor: '#A5D6A7',
    backgroundColor: '#F0FDF4',
  },
  finalSharePill: {
    flex: 1,
    minWidth: 165,
    minHeight: 44,
    borderRadius: RADII.pill,
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  finalSharePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
});
