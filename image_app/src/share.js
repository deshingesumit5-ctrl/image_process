import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Share } from 'react-native';

export async function shareCaptionAndImages(caption, imageUrls = []) {
  const files = [];
  for (let i = 0; i < imageUrls.length; i += 1) {
    const dest = `${FileSystem.cacheDirectory}share-${Date.now()}-${i}.jpg`;
    try {
      const downloaded = await FileSystem.downloadAsync(imageUrls[i], dest);
      files.push(downloaded.uri);
    } catch {
      // skip broken URLs
    }
  }

  if (Platform.OS === 'android' && files.length) {
    try {
      const streams = [];
      for (const file of files) {
        streams.push(await FileSystem.getContentUriAsync(file));
      }
      await IntentLauncher.startActivityAsync('android.intent.action.SEND_MULTIPLE', {
        type: 'image/*',
        extra: {
          'android.intent.extra.TEXT': caption,
          'android.intent.extra.STREAM': streams,
        },
      });
      return;
    } catch {
      // fall through to generic share
    }
  }

  await Share.share({ message: caption, title: 'Share products' });
  if (files[0] && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(files[0], { mimeType: 'image/jpeg', dialogTitle: 'Share image' });
  }
}
