import { Platform, Share } from 'react-native';
import { rewriteMediaUrl } from './api';

let FileSystem = null;
let Sharing = null;
let IntentLauncher = null;
let MediaLibrary = null;

if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system/legacy');
  } catch (e) {}
  try {
    Sharing = require('expo-sharing');
  } catch (e) {}
  try {
    IntentLauncher = require('expo-intent-launcher');
  } catch (e) {}
  try {
    MediaLibrary = require('expo-media-library');
  } catch (e) {}
}

export async function persistLocalImage(uri) {
  if (!uri) return uri;
  const source = rewriteMediaUrl(uri);
  if (Platform.OS === 'web' || !FileSystem) {
    return source;
  }
  const ext = (source.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const dest = `${cacheDir}img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  try {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const downloaded = await FileSystem.downloadAsync(source, dest);
      return downloaded.uri;
    }
    await FileSystem.copyAsync({ from: source, to: dest });
    return dest;
  } catch {
    return source;
  }
}

export async function saveImagesToGallery(uris = []) {
  const cleanUris = uris.filter(Boolean);
  if (!cleanUris.length) {
    throw new Error('No image available to save.');
  }

  if (Platform.OS === 'web') {
    let saved = 0;
    for (let i = 0; i < cleanUris.length; i += 1) {
      const url = rewriteMediaUrl(cleanUris[i]);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-image-${Date.now()}-${i + 1}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        saved += 1;
      } catch (e) {
        window.open(url, '_blank');
        saved += 1;
      }
    }
    return saved;
  }

  if (!MediaLibrary) {
    throw new Error('Media library plugin is not available on this device.');
  }

  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Gallery permission is required to save images to device.');
  }

  let saved = 0;
  for (let i = 0; i < cleanUris.length; i += 1) {
    const local = await persistLocalImage(cleanUris[i]);
    if (!local) continue;
    await MediaLibrary.saveToLibraryAsync(local);
    saved += 1;
  }
  return saved;
}

export async function shareCaptionAndImages(caption, imageUrls = []) {
  const text = caption || 'Ramchandra Dresses Products';
  const cleanUrls = imageUrls.filter(Boolean).map(rewriteMediaUrl);

  if (Platform.OS === 'web') {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
    return;
  }

  const files = [];
  if (FileSystem) {
    const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    for (let i = 0; i < cleanUrls.length; i += 1) {
      const dest = `${cacheDir}share-${Date.now()}-${i}.jpg`;
      try {
        if (cleanUrls[i].startsWith('http://') || cleanUrls[i].startsWith('https://')) {
          const downloaded = await FileSystem.downloadAsync(cleanUrls[i], dest);
          files.push(downloaded.uri);
        } else {
          files.push(cleanUrls[i]);
        }
      } catch {
        // skip failed
      }
    }
  }

  if (Platform.OS === 'android' && IntentLauncher && files.length) {
    try {
      const streams = [];
      for (const file of files) {
        streams.push(await FileSystem.getContentUriAsync(file));
      }
      await IntentLauncher.startActivityAsync('android.intent.action.SEND_MULTIPLE', {
        type: 'image/*',
        extra: {
          'android.intent.extra.TEXT': text,
          'android.intent.extra.STREAM': streams,
        },
      });
      return;
    } catch {
      // Fallback
    }
  }

  await Share.share({ message: text, title: 'Share Products' });
  if (files[0] && Sharing && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(files[0], { mimeType: 'image/jpeg', dialogTitle: 'Share product image' });
  }
}
