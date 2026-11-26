import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { useFocusEffect } from '@react-navigation/native';
import { api, fetchAllProducts, resolveMediaUrl } from '../api';
import { useAuth } from '../auth';
import {
  loadLocalRecentProcessed,
  mergeRecentProcessingRows,
  removeLocalRecentProcessed,
  updateLocalRecentProduct,
} from '../recentStorage';
import {
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
import { COLORS, FONT_FAMILY, RADII, SHADOWS, useResponsive } from '../theme';
import {
  Card,
  EmptyState,
  PageContainer,
  StatusPill,
} from '../components/ui';

function formatProcessedDate(raw) {
  if (!raw) return '';
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return String(raw);
  try {
    return dt.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(raw);
  }
}

export default function ProcessHomeScreen({ navigation }) {
  const { token } = useAuth();
  const [recent, setRecent] = useState([]);
  const [imgErrors, setImgErrors] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [productModalTarget, setProductModalTarget] = useState(null);
  const [fullScreenItem, setFullScreenItem] = useState(null);
  const [actionBusy, setActionBusy] = useState(null); // 'share' | 'download' | null
  const [toast, setToast] = useState(null);
  const [shareCardItems, setShareCardItems] = useState(null);
  const shareCardRef = useRef(null);
  const imagesReadyRef = useRef(null);
  const { isDesktop } = useResponsive();

  const showToast = (message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [recentRes, localRes, prodRes] = await Promise.allSettled([
          api.recentProcess(token),
          loadLocalRecentProcessed(),
          fetchAllProducts(token),
        ]);
        if (!active) return;
        const backendRows =
          recentRes.status === 'fulfilled' ? recentRes.value?.data || [] : [];
        const localRows = localRes.status === 'fulfilled' ? localRes.value || [] : [];
        const products = prodRes.status === 'fulfilled' ? prodRes.value || [] : [];
        setImgErrors({});
        setRecent(mergeRecentProcessingRows(backendRows, localRows, products));
      })();
      return () => {
        active = false;
      };
    }, [token])
  );

  const pickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      mediaTypes: ['images'],
    });
    if (result.canceled) return;
    navigation.navigate('ProcessWizard', {
      assets: result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      })),
      step: 1,
    });
  };

  const captureComposedCard = async (cardItems) => {
    if (Platform.OS === 'web') {
      return await renderCatalogCardToDataUrl(cardItems);
    }
    const localItems = await Promise.all(
      cardItems.map(async (it) => ({
        ...it,
        uri: await persistLocalImage(it.uri),
      }))
    );
    const readyPromise = new Promise((resolve) => {
      const timer = setTimeout(resolve, 2500);
      imagesReadyRef.current = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    setShareCardItems(localItems);
    try {
      await readyPromise;
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
      if (!shareCardRef.current) {
        throw new Error('Could not render product card.');
      }
      return await captureRef(shareCardRef, { format: 'png', quality: 1 });
    } finally {
      imagesReadyRef.current = null;
      setShareCardItems(null);
    }
  };

  const handleShareWhatsApp = async (item) => {
    const rawUris = (
      Array.isArray(item?.images) && item.images.length
        ? item.images
        : [item?.thumbnail_url]
    )
      .map((u) => resolveMediaUrl(u))
      .filter(Boolean);
    if (!rawUris.length) {
      showToast('No processed image available to share.', 'error');
      return;
    }
    setActionBusy('share');
    try {
      const cardItems = rawUris.map((u, i) => ({
        uri: u,
        product: item.product || null,
        designNumber:
          item.product?.design_number ||
          (rawUris.length === 1 ? 'Design 1' : `Design ${i + 1}`),
      }));
      const cardUri = await captureComposedCard(cardItems);
      const caption = buildCatalogCaption(
        item.product ? [item.product] : cardItems,
        cardItems.length || item.image_count || 1
      );
      const shareRes = await shareCaptionAndImages(caption, [cardUri]);
      if (item.product?.id) {
        api.logShare(token, [item.product.id]).catch(() => {});
      }
      setSelectedItem(null);
      showToast(
        shareRes?.captionCopied
          ? 'Caption copied – paste if missing'
          : 'Opened WhatsApp share.'
      );
    } catch (e) {
      showToast(e?.message || 'Could not share image on WhatsApp.', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const handleDownloadGallery = async (item) => {
    const uri = resolveMediaUrl(item?.thumbnail_url || item?.images?.[0]);
    if (!uri) {
      showToast('No processed image available to download.', 'error');
      return;
    }
    setActionBusy('download');
    try {
      await saveImagesToGallery([uri]);
      setSelectedItem(null);
      showToast('Processed image saved to gallery.');
    } catch (e) {
      showToast(
        e?.message || 'Could not save image to gallery.',
        'error'
      );
    } finally {
      setActionBusy(null);
    }
  };

  const handleViewFullScreen = (item) => {
    const uri = resolveMediaUrl(item?.thumbnail_url || item?.images?.[0]);
    if (!uri) {
      showToast('No processed image preview available.', 'error');
      return;
    }
    setSelectedItem(null);
    setFullScreenItem({
      uri,
      title:
        item.product?.design_number ||
        item.product?.name ||
        'Processed Product Image',
    });
  };

  const executeDeleteRecent = async (item) => {
    if (!item) return;
    setActionBusy('delete');
    try {
      const hasBackendId =
        item.id !== undefined &&
        item.id !== null &&
        !String(item.id).startsWith('local-') &&
        /^\d+$/.test(String(item.id));
      if (hasBackendId && token) {
        try {
          await api.deleteRecentProcess(token, item.id);
        } catch (err) {
          if (err?.status !== 404) {
            throw err;
          }
        }
      }
      await removeLocalRecentProcessed(item);
      setRecent((prev) =>
        prev.filter((row) => {
          if (
            item.id !== undefined &&
            item.id !== null &&
            row.id !== undefined &&
            row.id !== null
          ) {
            return String(row.id) !== String(item.id);
          }
          return row !== item;
        })
      );
      setSelectedItem(null);
      showToast('Processed image deleted.');
    } catch (e) {
      showToast(e?.message || 'Could not delete processed image.', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const confirmDeleteRecent = (item) => {
    if (!item || actionBusy) return;
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm('Do you want to delete this image?')
      ) {
        executeDeleteRecent(item);
      }
      return;
    }
    Alert.alert(
      'Delete Image',
      'Do you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => executeDeleteRecent(item),
        },
      ],
      { cancelable: true }
    );
  };

  const webHeroGrad =
    Platform.OS === 'web'
      ? {
          backgroundImage:
            'linear-gradient(125deg, #E4F4E7 0%, #EEF6EE 60%, #F7EFE2 100%)',
        }
      : null;

  const handleOpenAddToProductMaster = (item) => {
    if (!item) return;
    const rawUris = (
      Array.isArray(item?.images) && item.images.length
        ? item.images
        : [item?.thumbnail_url]
    )
      .map((u) => resolveMediaUrl(u))
      .filter(Boolean);
    if (!rawUris.length) {
      showToast('No processed image available to add.', 'error');
      return;
    }
    setSelectedItem(null);
    setProductModalTarget({ item, rawUris });
  };

  const handleProductAdded = async (createdProduct) => {
    const targetItem = productModalTarget?.item;
    if (createdProduct && typeof createdProduct === 'object' && targetItem) {
      await updateLocalRecentProduct(targetItem, createdProduct);
      setRecent((prev) =>
        prev.map((row) => {
          if (row === targetItem) {
            return { ...row, product: createdProduct };
          }
          if (
            targetItem.id !== undefined &&
            targetItem.id !== null &&
            row.id !== undefined &&
            row.id !== null &&
            String(row.id) === String(targetItem.id)
          ) {
            return { ...row, product: createdProduct };
          }
          return row;
        })
      );
    }
    showToast('Product added to Product Master.');
  };

  const modalThumbUri = resolveMediaUrl(
    selectedItem?.thumbnail_url || selectedItem?.images?.[0]
  );
  const isAddedToProductMaster = Boolean(selectedItem?.product?.id);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ToastBanner toast={toast} onHide={() => setToast(null)} />

      <PageContainer>
        {/* Hero Banner */}
        <View style={[styles.hero, webHeroGrad]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              Process Product Images with Perfect Background
            </Text>
            <Text style={styles.heroSub}>
              Select gallery photos or search catalog products, then composite onto Background Master.
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="color-wand-outline" size={32} color={COLORS.primary} />
          </View>
        </View>

        {/* Source Cards */}
        <View style={[styles.cardsRow, isDesktop && { flexDirection: 'row' }]}>
          <Pressable
            onPress={pickGallery}
            style={({ pressed }) => [
              styles.sourceCard,
              isDesktop && { flex: 1 },
              pressed && { opacity: 0.88 },
            ]}
          >
            <View style={[styles.sourceIcon, { backgroundColor: COLORS.tileGreen }]}>
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sourceTitle}>Select Images From Gallery</Text>
              <Text style={styles.sourceSub}>
                Browse gallery or camera in the next step
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('SearchImages')}
            style={({ pressed }) => [
              styles.sourceCard,
              isDesktop && { flex: 1 },
              pressed && { opacity: 0.88 },
            ]}
          >
            <View style={[styles.sourceIcon, { backgroundColor: COLORS.tileBlue }]}>
              <Ionicons name="cube-outline" size={24} color="#1D6FA5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sourceTitle}>Select Images From Product Master</Text>
              <Text style={styles.sourceSub}>
                By category, sub-category, product
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Recent Processing</Text>
        {recent.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No recent processing"
            subtitle="Your recently processed batches will show up here."
          />
        ) : (
          <View style={styles.recentList}>
            {recent.map((row, index) => {
              const rowKey = `${row.id ?? 'recent'}-${index}`;
              const thumbUri = resolveMediaUrl(
                row.thumbnail_url || row.images?.[0]
              );
              const showThumb = Boolean(thumbUri) && !imgErrors[rowKey];
              const titleLabel = row.product?.design_number
                ? `${row.product.design_number} · ${row.image_count} ${Number(row.image_count) === 1 ? 'image' : 'images'}`
                : `${row.image_count} ${Number(row.image_count) === 1 ? 'image' : 'images'}`;

              return (
                <Pressable
                  key={rowKey}
                  onPress={() => setSelectedItem(row)}
                  style={({ pressed }) => [pressed && { opacity: 0.88 }]}
                >
                  <Card style={styles.recentCard}>
                    <View style={styles.recentThumbWrap}>
                      {showThumb ? (
                        <Image
                          source={{ uri: thumbUri }}
                          style={styles.recentThumbImg}
                          resizeMode="cover"
                          onError={() =>
                            setImgErrors((prev) => ({ ...prev, [rowKey]: true }))
                          }
                        />
                      ) : (
                        <Ionicons
                          name="checkmark-done-outline"
                          size={20}
                          color={COLORS.primary}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentCount} numberOfLines={1}>
                        {titleLabel}
                      </Text>
                      <Text style={styles.recentDate} numberOfLines={1}>
                        {formatProcessedDate(row.processed_at)}
                      </Text>
                    </View>
                    <StatusPill label="Processed" />
                    <Pressable
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        setSelectedItem(row);
                      }}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="More options"
                      style={({ pressed }) => [
                        styles.recentActionBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={16}
                        color={COLORS.textMuted}
                      />
                    </Pressable>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </PageContainer>

      {/* Image Action Menu Modal */}
      <Modal
        visible={Boolean(selectedItem)}
        transparent
        animationType="fade"
        onRequestClose={() => !actionBusy && setSelectedItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !actionBusy && setSelectedItem(null)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalPreviewWrap}>
                {modalThumbUri ? (
                  <Image
                    source={{ uri: modalThumbUri }}
                    style={styles.modalPreviewImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={26}
                    color={COLORS.primary}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedItem?.product?.design_number ||
                    selectedItem?.product?.name ||
                    'Processed Product Image'}
                </Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {formatProcessedDate(selectedItem?.processed_at) ||
                    `${selectedItem?.image_count || 1} image`}
                </Text>
              </View>
              <Pressable
                onPress={() => !actionBusy && setSelectedItem(null)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </Pressable>
            </View>

            <View style={styles.modalActionsList}>
              <Pressable
                disabled={Boolean(actionBusy)}
                onPress={() => handleShareWhatsApp(selectedItem)}
                style={({ pressed }) => [
                  styles.modalActionRow,
                  pressed && styles.modalActionRowPressed,
                ]}
              >
                <View style={[styles.modalActionIcon, { backgroundColor: '#DCFCE7' }]}>
                  {actionBusy === 'share' ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons
                      name="logo-whatsapp"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalActionTitle}>Share on WhatsApp</Text>
                  <Text style={styles.modalActionSub}>
                    Send processed image with product caption
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textLight}
                />
              </Pressable>

              <Pressable
                disabled={Boolean(actionBusy)}
                onPress={() => handleDownloadGallery(selectedItem)}
                style={({ pressed }) => [
                  styles.modalActionRow,
                  pressed && styles.modalActionRowPressed,
                ]}
              >
                <View style={[styles.modalActionIcon, { backgroundColor: COLORS.tileBlue }]}>
                  {actionBusy === 'download' ? (
                    <ActivityIndicator size="small" color="#1D6FA5" />
                  ) : (
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="#1D6FA5"
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalActionTitle}>Download to Gallery</Text>
                  <Text style={styles.modalActionSub}>
                    Save processed image to device gallery
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textLight}
                />
              </Pressable>

              <Pressable
                disabled={Boolean(actionBusy)}
                onPress={() => handleViewFullScreen(selectedItem)}
                style={({ pressed }) => [
                  styles.modalActionRow,
                  pressed && styles.modalActionRowPressed,
                ]}
              >
                <View style={[styles.modalActionIcon, { backgroundColor: COLORS.tilePeach }]}>
                  <Ionicons
                    name="expand-outline"
                    size={20}
                    color="#B45309"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalActionTitle}>View in Full Screen</Text>
                  <Text style={styles.modalActionSub}>
                    Open zoomable full-screen image preview
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textLight}
                />
              </Pressable>

              {isAddedToProductMaster ? (
                <View style={styles.modalAddedRow}>
                  <View style={[styles.modalActionIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#16A34A"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalAddedTitle}>
                      Added to Product Master
                    </Text>
                    <Text style={styles.modalAddedSub} numberOfLines={1}>
                      {selectedItem?.product?.name ||
                        selectedItem?.product?.design_number ||
                        'Saved in Product Master'}
                    </Text>
                  </View>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#16A34A"
                  />
                </View>
              ) : (
                <Pressable
                  disabled={Boolean(actionBusy)}
                  onPress={() => handleOpenAddToProductMaster(selectedItem)}
                  style={({ pressed }) => [
                    styles.modalActionRow,
                    pressed && styles.modalActionRowPressed,
                  ]}
                >
                  <View style={[styles.modalActionIcon, { backgroundColor: COLORS.tileGreen }]}>
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalActionTitle}>
                      Add to Product Master
                    </Text>
                    <Text style={styles.modalActionSub}>
                      Save processed image as a catalog product
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.textLight}
                  />
                </Pressable>
              )}

              <Pressable
                disabled={Boolean(actionBusy)}
                onPress={() => confirmDeleteRecent(selectedItem)}
                style={({ pressed }) => [
                  styles.modalActionRow,
                  pressed && styles.modalActionRowPressed,
                ]}
              >
                <View style={[styles.modalActionIcon, { backgroundColor: COLORS.dangerSoft }]}>
                  {actionBusy === 'delete' ? (
                    <ActivityIndicator size="small" color={COLORS.danger} />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.danger}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalActionTitle, { color: COLORS.danger }]}>
                    Delete Image
                  </Text>
                  <Text style={styles.modalActionSub}>
                    Remove from recent processing history
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textLight}
                />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add to Product Master Modal */}
      <AddToProductModal
        visible={Boolean(productModalTarget)}
        onClose={() => setProductModalTarget(null)}
        token={token}
        images={(productModalTarget?.rawUris || []).map((uri, idx) => ({
          key: String(idx),
          uri,
        }))}
        initialProduct={productModalTarget?.item?.product || null}
        onSuccess={handleProductAdded}
      />

      {/* Full-Screen Zoomable Image Preview */}
      <ImagePreviewModal
        visible={Boolean(fullScreenItem)}
        uri={fullScreenItem?.uri}
        title={fullScreenItem?.title}
        onClose={() => setFullScreenItem(null)}
      />

      {/* Hidden off-screen composed card for WhatsApp capture */}
      {shareCardItems?.length ? (
        <View
          ref={shareCardRef}
          collapsable={false}
          pointerEvents="none"
          style={styles.offscreenCard}
        >
          <ProductSheet
            items={shareCardItems}
            onImagesReady={() => imagesReadyRef.current?.()}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.tileGreen,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: '#D5EAD8',
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...SHADOWS.soft,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 26,
    fontFamily: FONT_FAMILY,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 19,
    fontFamily: FONT_FAMILY,
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsRow: {
    gap: 12,
    marginBottom: 20,
  },
  sourceCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
    ...SHADOWS.soft,
  },
  sourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  sourceSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
    fontFamily: FONT_FAMILY,
  },
  recentList: {
    gap: 10,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  recentThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recentThumbImg: {
    width: '100%',
    height: '100%',
  },
  recentCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  recentDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  recentActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 29, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    ...SHADOWS.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  modalPreviewWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalPreviewImg: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionsList: {
    gap: 8,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  modalActionRowPressed: {
    backgroundColor: COLORS.surfaceMuted,
  },
  modalActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  modalActionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  modalAddedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  modalAddedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
    fontFamily: FONT_FAMILY,
  },
  modalAddedSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  offscreenCard: {
    position: 'absolute',
    left: -9999,
    top: 0,
    backgroundColor: '#FFFFFF',
  },
});
