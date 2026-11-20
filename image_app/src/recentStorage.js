import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveMediaUrl } from './api';

const RECENT_PROCESSED_KEY = '@rcd_recent_processed_items_v1';
const MAX_RECENT_ITEMS = 40;

export async function loadLocalRecentProcessed() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_PROCESSED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveLocalRecentProcessed(entries = []) {
  try {
    const valid = entries
      .filter((item) => item && (item.url || item.uri))
      .map((item) => ({
        id: item.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: resolveMediaUrl(item.url || item.uri),
        image_count: item.image_count || 1,
        processed_at: item.processed_at || new Date().toISOString(),
        product: item.product || null,
      }));
    if (!valid.length) return;
    const existing = await loadLocalRecentProcessed();
    const merged = [...valid, ...existing].slice(0, MAX_RECENT_ITEMS);
    await AsyncStorage.setItem(RECENT_PROCESSED_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Enrich backend ProcessingLog rows with actual processed image URLs and product metadata
 * from backend fields, local AsyncStorage history, or processed Product Master images.
 */
export function mergeRecentProcessingRows(backendRows = [], localRows = [], products = []) {
  const processedProductImages = [];
  for (const prod of products || []) {
    for (const img of prod?.images || []) {
      const candidateUrl = img?.url || img?.processed_url || img?.original_url;
      if (!candidateUrl) continue;
      if (img.is_processed || (img.url && img.original_url && img.url !== img.original_url)) {
        processedProductImages.push({
          url: resolveMediaUrl(candidateUrl),
          product: prod,
        });
      }
    }
  }
  // Fallback pool if no images explicitly marked is_processed
  const anyProductImages = [];
  if (!processedProductImages.length) {
    for (const prod of products || []) {
      for (const img of prod?.images || []) {
        const candidateUrl = img?.url || img?.original_url;
        if (candidateUrl) {
          anyProductImages.push({
            url: resolveMediaUrl(candidateUrl),
            product: prod,
          });
        }
      }
    }
  }
  const fallbackPool = processedProductImages.length ? processedProductImages : anyProductImages;
  const usedLocalIndices = new Set();

  if (!backendRows.length && localRows.length) {
    return localRows.map((entry, idx) => ({
      id: entry.id || `local-${idx}`,
      image_count: entry.image_count || 1,
      processed_at: entry.processed_at,
      thumbnail_url: resolveMediaUrl(entry.url),
      images: [resolveMediaUrl(entry.url)].filter(Boolean),
      product: entry.product || null,
    }));
  }

  let poolCursor = 0;
  return backendRows.map((row) => {
    const directCandidates = [
      row.thumbnail_url,
      row.processed_url,
      row.image_url,
      row.url,
      row.thumbnail,
      row.processed_path,
      row.image_path,
      Array.isArray(row.images) ? (row.images[0]?.url || row.images[0]) : null,
    ].filter(Boolean);

    let resolvedUrl = directCandidates.length ? resolveMediaUrl(directCandidates[0]) : null;
    let product = row.product || null;

    if (!resolvedUrl && localRows.length) {
      const rowTime = row.processed_at ? new Date(row.processed_at).getTime() : NaN;
      let bestIdx = -1;
      let bestDiff = Infinity;
      localRows.forEach((loc, idx) => {
        if (usedLocalIndices.has(idx)) return;
        const locTime = loc.processed_at ? new Date(loc.processed_at).getTime() : NaN;
        if (!Number.isNaN(rowTime) && !Number.isNaN(locTime)) {
          const diff = Math.abs(rowTime - locTime);
          if (diff < 180000 && diff < bestDiff) {
            bestDiff = diff;
            bestIdx = idx;
          }
        }
      });
      if (bestIdx === -1) {
        bestIdx = localRows.findIndex((_, idx) => !usedLocalIndices.has(idx));
      }
      if (bestIdx >= 0) {
        usedLocalIndices.add(bestIdx);
        resolvedUrl = resolveMediaUrl(localRows[bestIdx].url);
        product = product || localRows[bestIdx].product || null;
      }
    }

    if (!resolvedUrl && fallbackPool.length) {
      const pick = fallbackPool[poolCursor % fallbackPool.length];
      poolCursor += 1;
      resolvedUrl = pick.url;
      product = product || pick.product || null;
    }

    const imagesList = Array.isArray(row.images) && row.images.length
      ? row.images.map((im) => resolveMediaUrl(im?.url || im)).filter(Boolean)
      : resolvedUrl
        ? [resolvedUrl]
        : [];

    return {
      ...row,
      thumbnail_url: resolvedUrl,
      images: imagesList,
      product,
    };
  });
}
