import { Platform } from 'react-native';

function defaultApiUrl() {
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    return `http://${host}:8000/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://127.0.0.1:8000/api';
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl();

export const PRIMARY = '#4F46E5';
