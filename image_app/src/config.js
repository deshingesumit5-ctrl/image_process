import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

function hostFrom(value) {
  if (!value) return '';
  const ip = String(value).match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  if (ip) return ip[1];
  const cleaned = String(value).replace(/^[a-zA-Z]+:\/\//, '');
  return cleaned.split('/')[0].split(':')[0] || '';
}

function detectHost() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname;
    }
    return '127.0.0.1';
  }

  const expoHost =
    hostFrom(Constants.expoConfig?.hostUri) ||
    hostFrom(Constants.expoGoConfig?.debuggerHost) ||
    hostFrom(Constants.linkingUri) ||
    hostFrom(Constants.debuggerHost);

  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return expoHost;
  }

  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    const match = scriptURL && scriptURL.match(/:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return match[1];
    }
  } catch (e) {}

  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
}

// NOTE: Backend API runs on port 8000. Port 8080 is the Expo web dev
// server itself and must never be the default/first candidate here.
export function getCandidateApiUrls() {
  const host = detectHost();
  const list = [
    process.env.EXPO_PUBLIC_API_URL,
    `http://${host}:8000/api`,
    `http://${host}:8080/api`,
  ];
  if (Platform.OS === 'android') {
    list.push('http://10.0.2.2:8000/api', 'http://10.0.2.2:8080/api');
  }
  if (Platform.OS === 'web') {
    list.push(
      'http://127.0.0.1:8000/api',
      'http://localhost:8000/api',
      'http://127.0.0.1:8080/api',
      'http://localhost:8080/api'
    );
  }
  return [...new Set(list.filter(Boolean))];
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${detectHost()}:8000/api`;

export const PRIMARY = '#4F46E5';