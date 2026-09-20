import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

async function request(path, { method = 'GET', token, body, isMultipart } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(`Cannot reach API at ${API_URL}. Start Laravel on port 8000. (${error.message})`);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json;
}

export const api = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/me', { token }),
  categories: (token, q = '') => request(`/categories?q=${encodeURIComponent(q)}`, { token }),
  subCategories: (token, categoryId) => request(`/categories/${categoryId}/sub-categories`, { token }),
  products: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products?${qs}`, { token });
  },
  product: (token, id) => request(`/products/${id}`, { token }),
  backgrounds: (token, orientation, category_type) =>
    request(
      `/backgrounds?orientation=${orientation || ''}&category_type=${encodeURIComponent(category_type || 'All')}`,
      { token }
    ),
  shortlist: (token) => request('/shortlist', { token }),
  addShortlist: (token, items) => request('/shortlist', { method: 'POST', token, body: { items } }),
  removeShortlist: (token, item_ids) => request('/shortlist/remove', { method: 'POST', token, body: { item_ids } }),
  emptyShortlist: (token) => request('/shortlist/empty', { method: 'POST', token }),
  captions: (token, product_ids) => request('/share/captions', { method: 'POST', token, body: { product_ids } }),
  logShare: (token, product_ids) => request('/share', { method: 'POST', token, body: { product_ids, shared_via: 'whatsapp' } }),
  recentProcess: (token) => request('/process/recent', { token }),
  process: (token, formData) => request('/process', { method: 'POST', token, body: formData, isMultipart: true }),
  updateProfile: (token, body) => request('/profile', { method: 'PUT', token, body }),
};

export async function loadToken() {
  return AsyncStorage.getItem('token');
}

export async function saveSession(token, user) {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['token', 'user']);
}
