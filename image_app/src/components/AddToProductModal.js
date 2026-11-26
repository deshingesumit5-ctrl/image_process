import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchAllCategories,
  fetchAllSubCategories,
  resolveMediaUrl,
  api,
} from '../api';
import { appendImageFile, persistLocalImage } from '../share';
import { PillButton } from './ui';
import { COLORS, FONT_FAMILY, RADII, SHADOWS } from '../theme';

export default function AddToProductModal({
  visible,
  onClose,
  token,
  images = [],
  initialOrientation = 'vertical',
  initialProduct = null,
  onSuccess,
}) {
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef(null);
  const sizesSectionYRef = useRef(0);
  const sizeRowOffsetsRef = useRef({});
  const fieldOffsetsRef = useRef({});
  const maxBackdropHeightRef = useRef(0);

  const [backdropHeight, setBackdropHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [pmCategories, setPmCategories] = useState([]);
  const [pmSubCategories, setPmSubCategories] = useState([]);
  const [pmLoadingCats, setPmLoadingCats] = useState(false);
  const [pmLoadingSubs, setPmLoadingSubs] = useState(false);
  const [pmCategoryOpen, setPmCategoryOpen] = useState(false);
  const [pmSubCategoryOpen, setPmSubCategoryOpen] = useState(false);
  const [pmCategoryId, setPmCategoryId] = useState(null);
  const [pmSubCategoryId, setPmSubCategoryId] = useState(null);
  const [pmName, setPmName] = useState('');
  const [pmDesignNumber, setPmDesignNumber] = useState('');
  const [pmColour, setPmColour] = useState('');
  const [pmBarcode, setPmBarcode] = useState('');
  const [pmDisplayOrder, setPmDisplayOrder] = useState('1');
  const [pmKeepOriginal, setPmKeepOriginal] = useState(false);
  const [pmOrientation, setPmOrientation] = useState('vertical');
  const [pmStatus, setPmStatus] = useState(true);
  const [pmSizes, setPmSizes] = useState([{ size: '', rate: '' }]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return undefined;
    }

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    const didHideSub =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0))
        : null;

    return () => {
      showSub.remove();
      hideSub.remove();
      didHideSub?.remove();
    };
  }, [visible]);

  const loadSubCategoriesForModal = async (categoryId, preferredSubId = null) => {
    if (!categoryId) {
      setPmSubCategories([]);
      setPmSubCategoryId(null);
      return;
    }
    setPmLoadingSubs(true);
    try {
      const subs = await fetchAllSubCategories(token, categoryId);
      setPmSubCategories(subs);
      const nextSubId =
        preferredSubId && subs.some((s) => s.id === preferredSubId)
          ? preferredSubId
          : subs[0]?.id || null;
      setPmSubCategoryId(nextSubId);
    } catch {
      setPmSubCategories([]);
      setPmSubCategoryId(null);
    } finally {
      setPmLoadingSubs(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    let active = true;

    setProductError('');
    setPmCategoryOpen(false);
    setPmSubCategoryOpen(false);
    setPmName('');
    setPmDesignNumber(initialProduct?.design_number || '');
    setPmColour('');
    setPmBarcode('');
    setPmDisplayOrder('1');
    setPmKeepOriginal(false);
    setPmOrientation(initialOrientation === 'horizontal' ? 'horizontal' : 'vertical');
    setPmStatus(true);
    setPmSizes([{ size: '', rate: '' }]);
    sizeRowOffsetsRef.current = {};

    (async () => {
      setPmLoadingCats(true);
      try {
        const cats = await fetchAllCategories(token);
        if (!active) return;
        setPmCategories(cats);
        const linkedCatId =
          initialProduct?.category?.id || initialProduct?.category_id;
        const initialCatId =
          linkedCatId && cats.some((c) => c.id === linkedCatId)
            ? linkedCatId
            : cats[0]?.id || null;
        setPmCategoryId(initialCatId);
        const linkedSubId =
          initialProduct?.sub_category?.id || initialProduct?.sub_category_id;
        await loadSubCategoriesForModal(initialCatId, linkedSubId);
      } catch {
        if (!active) return;
        setPmCategories([]);
        setPmCategoryId(null);
        setPmSubCategories([]);
        setPmSubCategoryId(null);
        setProductError('Could not load categories. Please try again.');
      } finally {
        if (active) setPmLoadingCats(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [visible, token]);

  const scrollToY = (yPos) => {
    if (typeof yPos !== 'number') return;
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, yPos - 24),
        animated: true,
      });
    }, 150);
  };

  const handleSelectPmCategory = (catId) => {
    setPmCategoryId(catId);
    setPmCategoryOpen(false);
    setPmSubCategoryOpen(false);
    setPmSubCategoryId(null);
    loadSubCategoriesForModal(catId);
  };

  const addPmSizeRow = () => {
    setPmSizes((prev) => [...prev, { size: '', rate: '' }]);
    setTimeout(() => {
      scrollToY(sizesSectionYRef.current + 40);
    }, 120);
  };

  const updatePmSizeRow = (idx, field, value) => {
    setPmSizes((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const removePmSizeRow = (idx) => {
    setPmSizes((prev) => {
      if (prev.length <= 1) return [{ size: '', rate: '' }];
      return prev.filter((_, i) => i !== idx);
    });
  };

  const submitAddToProduct = async () => {
    if (savingProduct) return;
    setProductError('');

    if (!pmCategoryId) {
      setProductError('Please select a category.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!pmSubCategoryId) {
      setProductError('Please select a sub-category.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!pmName.trim()) {
      setProductError('Product Name is required.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!images.length) {
      setProductError('Select at least one processed image first.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const parsedOrder = pmDisplayOrder.trim()
      ? parseInt(pmDisplayOrder.trim(), 10)
      : 1;
    if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
      setProductError('Display Order must be 1 or greater.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSavingProduct(true);
    try {
      const form = new FormData();
      form.append('category_id', String(pmCategoryId));
      form.append('sub_category_id', String(pmSubCategoryId));
      form.append('name', pmName.trim());
      if (pmDesignNumber.trim()) {
        form.append('design_number', pmDesignNumber.trim());
      }
      if (pmColour.trim()) {
        form.append('colour', pmColour.trim());
      }
      if (pmBarcode.trim()) {
        form.append('barcode', pmBarcode.trim());
      }
      form.append('display_order', String(parsedOrder));
      form.append('keep_original', pmKeepOriginal ? '1' : '0');
      form.append('orientation', pmOrientation);
      form.append('status', pmStatus ? '1' : '0');

      let sizeIdx = 0;
      pmSizes.forEach((row) => {
        const sz = String(row.size || '').trim();
        if (!sz) return;
        const rt = String(row.rate || '').trim();
        form.append(`sizes[${sizeIdx}][size]`, sz);
        form.append(`sizes[${sizeIdx}][rate]`, rt || '0');
        sizeIdx += 1;
      });

      for (let i = 0; i < images.length; i += 1) {
        const item = images[i];
        const rawUri = item?.uri || item;
        const uploadUri =
          Platform.OS === 'web'
            ? resolveMediaUrl(rawUri, { corsSafe: true })
            : await persistLocalImage(rawUri);
        await appendImageFile(form, uploadUri, i);
      }

      const createdRes = await api.createProduct(token, form);
      const createdProduct = createdRes?.data || createdRes?.product || null;
      onSuccess?.(createdProduct);
      onClose?.();
    } catch (e) {
      setProductError(e?.message || 'Could not save product to Product Master.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSavingProduct(false);
    }
  };

  const keyboardOpen = keyboardHeight > 0;
  const alreadyShrunk =
    keyboardOpen && maxBackdropHeightRef.current > 0 && backdropHeight > 0
      ? Math.max(0, maxBackdropHeightRef.current - backdropHeight)
      : 0;
  const androidBottomPad =
    Platform.OS === 'android' && keyboardOpen
      ? Math.max(0, keyboardHeight - alreadyShrunk)
      : 0;

  const dynamicMaxCardHeight =
    keyboardOpen && Platform.OS !== 'web'
      ? Math.max(260, windowHeight - keyboardHeight - (Platform.OS === 'ios' ? 40 : 28))
      : undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!savingProduct) onClose?.();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setBackdropHeight(h);
          if (!keyboardOpen && h > maxBackdropHeightRef.current) {
            maxBackdropHeightRef.current = h;
          }
        }}
        style={[
          styles.pmBackdrop,
          keyboardOpen && {
            justifyContent: 'flex-start',
            paddingTop: Platform.OS === 'ios' ? 28 : 12,
            paddingBottom: Math.max(12, androidBottomPad + 8),
          },
        ]}
      >
        <View
          style={[
            styles.pmModalCard,
            dynamicMaxCardHeight ? { maxHeight: dynamicMaxCardHeight } : null,
          ]}
        >
          <View style={styles.pmHeader}>
            <View>
              <Text style={styles.pmEyebrow}>CATALOG MASTER</Text>
              <Text style={styles.pmTitle}>Add to Product Master</Text>
            </View>
            <Pressable
              onPress={() => {
                if (!savingProduct) onClose?.();
              }}
              hitSlop={8}
              style={styles.pmCloseBtn}
            >
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.pmScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.pmScrollBody,
              keyboardOpen && { paddingBottom: 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {productError ? (
              <View style={styles.pmErrorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.pmErrorText}>{productError}</Text>
              </View>
            ) : null}

            {/* Category* */}
            <Text style={styles.pmLabel}>
              CATEGORY <Text style={styles.pmReq}>*</Text>
            </Text>
            <Pressable
              onPress={() => {
                setPmCategoryOpen((v) => !v);
                setPmSubCategoryOpen(false);
              }}
              style={styles.pmSelectBtn}
            >
              <Text style={styles.pmSelectText} numberOfLines={1}>
                {pmLoadingCats
                  ? 'Loading categories…'
                  : pmCategories.find((c) => c.id === pmCategoryId)?.name ||
                    'Select Category'}
              </Text>
              <Ionicons
                name={pmCategoryOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.textMuted}
              />
            </Pressable>
            {pmCategoryOpen ? (
              <View style={styles.pmDropdownList}>
                {pmCategories.length === 0 ? (
                  <Text style={styles.pmDropdownEmpty}>
                    No active categories found.
                  </Text>
                ) : (
                  pmCategories.map((cat) => {
                    const active = cat.id === pmCategoryId;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => handleSelectPmCategory(cat.id)}
                        style={[
                          styles.pmDropdownItem,
                          active && styles.pmDropdownItemActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pmDropdownItemText,
                            active && { color: COLORS.primaryText, fontWeight: '700' },
                          ]}
                        >
                          {cat.name}
                        </Text>
                        {active ? (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={COLORS.primary}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </View>
            ) : null}

            {/* Sub-Category* */}
            <Text style={styles.pmLabel}>
              SUB-CATEGORY <Text style={styles.pmReq}>*</Text>
            </Text>
            <Pressable
              onPress={() => {
                setPmSubCategoryOpen((v) => !v);
                setPmCategoryOpen(false);
              }}
              style={styles.pmSelectBtn}
            >
              <Text style={styles.pmSelectText} numberOfLines={1}>
                {pmLoadingSubs
                  ? 'Loading sub-categories…'
                  : pmSubCategories.find((s) => s.id === pmSubCategoryId)?.name ||
                    'Select Sub-Category'}
              </Text>
              <Ionicons
                name={pmSubCategoryOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.textMuted}
              />
            </Pressable>
            {pmSubCategoryOpen ? (
              <View style={styles.pmDropdownList}>
                {pmSubCategories.length === 0 ? (
                  <Text style={styles.pmDropdownEmpty}>
                    No sub-categories for selected category.
                  </Text>
                ) : (
                  pmSubCategories.map((sub) => {
                    const active = sub.id === pmSubCategoryId;
                    return (
                      <Pressable
                        key={sub.id}
                        onPress={() => {
                          setPmSubCategoryId(sub.id);
                          setPmSubCategoryOpen(false);
                        }}
                        style={[
                          styles.pmDropdownItem,
                          active && styles.pmDropdownItemActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pmDropdownItemText,
                            active && { color: COLORS.primaryText, fontWeight: '700' },
                          ]}
                        >
                          {sub.name}
                        </Text>
                        {active ? (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={COLORS.primary}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </View>
            ) : null}

            {/* Product Name* */}
            <View
              onLayout={(e) => {
                fieldOffsetsRef.current.name = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.pmLabel}>
                PRODUCT NAME <Text style={styles.pmReq}>*</Text>
              </Text>
              <TextInput
                value={pmName}
                onChangeText={setPmName}
                onFocus={() => scrollToY(fieldOffsetsRef.current.name)}
                placeholder="e.g. Traffic Shorts"
                placeholderTextColor={COLORS.textLight}
                style={styles.pmInput}
              />
            </View>

            {/* Design Number, Colour */}
            <View
              onLayout={(e) => {
                fieldOffsetsRef.current.designColor = e.nativeEvent.layout.y;
              }}
              style={styles.pmTwoCol}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.pmLabel}>DESIGN NUMBER</Text>
                <TextInput
                  value={pmDesignNumber}
                  onChangeText={setPmDesignNumber}
                  onFocus={() => scrollToY(fieldOffsetsRef.current.designColor)}
                  placeholder="e.g. 92093"
                  placeholderTextColor={COLORS.textLight}
                  style={styles.pmInput}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pmLabel}>COLOUR</Text>
                <TextInput
                  value={pmColour}
                  onChangeText={setPmColour}
                  onFocus={() => scrollToY(fieldOffsetsRef.current.designColor)}
                  placeholder="e.g. Mint Green"
                  placeholderTextColor={COLORS.textLight}
                  style={styles.pmInput}
                />
              </View>
            </View>

            {/* Barcode, Display Order */}
            <View
              onLayout={(e) => {
                fieldOffsetsRef.current.barcodeOrder = e.nativeEvent.layout.y;
              }}
              style={styles.pmTwoCol}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.pmLabel}>BARCODE</Text>
                <TextInput
                  value={pmBarcode}
                  onChangeText={setPmBarcode}
                  onFocus={() => scrollToY(fieldOffsetsRef.current.barcodeOrder)}
                  placeholder="e.g. 890123456"
                  placeholderTextColor={COLORS.textLight}
                  style={styles.pmInput}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pmLabel}>DISPLAY ORDER</Text>
                <TextInput
                  value={pmDisplayOrder}
                  onChangeText={setPmDisplayOrder}
                  onFocus={() => scrollToY(fieldOffsetsRef.current.barcodeOrder)}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={COLORS.textLight}
                  style={styles.pmInput}
                />
              </View>
            </View>

            {/* Keep As Original */}
            <Text style={styles.pmLabel}>KEEP AS ORIGINAL</Text>
            <View style={styles.pmSegRow}>
              <Pressable
                onPress={() => setPmKeepOriginal(false)}
                style={[
                  styles.pmSegBtn,
                  !pmKeepOriginal && styles.pmSegBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.pmSegText,
                    !pmKeepOriginal && styles.pmSegTextActive,
                  ]}
                  numberOfLines={1}
                >
                  No (Process Background)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPmKeepOriginal(true)}
                style={[
                  styles.pmSegBtn,
                  pmKeepOriginal && styles.pmSegBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.pmSegText,
                    pmKeepOriginal && styles.pmSegTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Yes
                </Text>
              </Pressable>
            </View>

            {/* Orientation & Status */}
            <Text style={styles.pmLabel}>ORIENTATION</Text>
            <View style={styles.pmSegRow}>
              <Pressable
                onPress={() => setPmOrientation('vertical')}
                style={[
                  styles.pmSegBtn,
                  pmOrientation === 'vertical' && styles.pmSegBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.pmSegText,
                    pmOrientation === 'vertical' && styles.pmSegTextActive,
                  ]}
                >
                  Vertical
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPmOrientation('horizontal')}
                style={[
                  styles.pmSegBtn,
                  pmOrientation === 'horizontal' && styles.pmSegBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.pmSegText,
                    pmOrientation === 'horizontal' && styles.pmSegTextActive,
                  ]}
                >
                  Horizontal
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setPmStatus((s) => !s)}
              style={styles.pmStatusRow}
            >
              <View
                style={[
                  styles.pmStatusCheck,
                  pmStatus ? styles.pmStatusCheckOn : styles.pmStatusCheckOff,
                ]}
              >
                {pmStatus ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <Text style={styles.pmStatusLabel}>Status: Active</Text>
            </Pressable>

            {/* Sizes & Rates */}
            <View
              onLayout={(e) => {
                sizesSectionYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={[styles.rowBetween, { marginTop: 10, marginBottom: 6 }]}>
                <Text style={[styles.pmLabel, { marginTop: 0, marginBottom: 0 }]}>
                  SIZES & RATES
                </Text>
                <Pressable onPress={addPmSizeRow}>
                  <Text style={styles.pmAddSizeText}>+ Add More Size</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8 }}>
                {pmSizes.map((row, idx) => (
                  <View
                    key={idx}
                    onLayout={(e) => {
                      sizeRowOffsetsRef.current[idx] = e.nativeEvent.layout.y;
                    }}
                    style={styles.pmSizeRow}
                  >
                    <TextInput
                      value={row.size}
                      onChangeText={(val) => updatePmSizeRow(idx, 'size', val)}
                      onFocus={() =>
                        scrollToY(
                          sizesSectionYRef.current +
                            (sizeRowOffsetsRef.current[idx] || 0)
                        )
                      }
                      placeholder="Size (e.g. M, L)"
                      placeholderTextColor={COLORS.textLight}
                      style={[styles.pmInput, { flex: 1, marginBottom: 0 }]}
                    />
                    <TextInput
                      value={row.rate}
                      onChangeText={(val) => updatePmSizeRow(idx, 'rate', val)}
                      onFocus={() =>
                        scrollToY(
                          sizesSectionYRef.current +
                            (sizeRowOffsetsRef.current[idx] || 0)
                        )
                      }
                      placeholder="Rate (₹)"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="decimal-pad"
                      style={[styles.pmInput, { flex: 1, marginBottom: 0 }]}
                    />
                    <Pressable
                      onPress={() => removePmSizeRow(idx)}
                      hitSlop={6}
                      accessibilityLabel="Remove size row"
                      style={styles.pmRemoveSizeBtn}
                    >
                      <Ionicons name="close" size={16} color={COLORS.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            {/* Selected Processed Images Preview */}
            <Text style={styles.pmLabel}>
              SELECTED PRODUCT IMAGES ({images.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
            >
              {images.map((it, idx) => {
                const uri = resolveMediaUrl(it?.uri || it);
                return (
                  <View key={it?.key || String(idx)} style={styles.pmImgPreviewBox}>
                    <Image
                      source={{ uri }}
                      style={styles.pmImgPreview}
                      resizeMode="cover"
                    />
                  </View>
                );
              })}
            </ScrollView>
          </ScrollView>

          <View style={styles.pmFooter}>
            <PillButton
              label="Cancel"
              variant="outline"
              disabled={savingProduct}
              onPress={onClose}
              style={{ flex: 0.9 }}
            />
            <PillButton
              label={savingProduct ? 'Saving…' : 'Save Product'}
              icon="checkmark-circle-outline"
              disabled={savingProduct}
              onPress={submitAddToProduct}
              style={{ flex: 1.4 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 29, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pmModalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    flexShrink: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  pmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  pmEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryText,
    letterSpacing: 0.8,
    fontFamily: FONT_FAMILY,
  },
  pmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  pmCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmScroll: {
    flexShrink: 1,
  },
  pmScrollBody: {
    padding: 18,
    paddingBottom: 22,
  },
  pmErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADII.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  pmErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
    fontFamily: FONT_FAMILY,
  },
  pmLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    marginTop: 10,
    marginBottom: 5,
    fontFamily: FONT_FAMILY,
  },
  pmReq: {
    color: COLORS.danger,
  },
  pmInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  pmTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  pmSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  pmSelectText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  pmDropdownList: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.sm,
    overflow: 'hidden',
  },
  pmDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pmDropdownItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  pmDropdownItemText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  pmDropdownEmpty: {
    padding: 12,
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  pmSegRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pmSegBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmSegBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pmSegText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
  pmSegTextActive: {
    color: COLORS.primaryText,
    fontWeight: '700',
  },
  pmStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 4,
  },
  pmStatusCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmStatusCheckOn: {
    backgroundColor: COLORS.primary,
  },
  pmStatusCheckOff: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  pmStatusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  pmAddSizeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
  pmSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pmRemoveSizeBtn: {
    width: 34,
    height: 38,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmImgPreviewBox: {
    width: 68,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surfaceMuted,
  },
  pmImgPreview: {
    width: '100%',
    height: '100%',
  },
  pmFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
});
