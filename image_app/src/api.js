import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, MEDIA_BASE_URL, getCandidateApiUrls } from "./config";

const API_URL_KEY = "api_url";
const TIMEOUT_MS = 3000;
// Always end with /api, whether or not the saved address has it
const withApi = (u) =>
  `${String(u || "").trim().replace(/\/+$/, "").replace(/\/api$/, "")}/api`;
let activeApiUrl = withApi(API_URL);

const IMAGE_KEYS = new Set([
  "image_path",
  "processed_path",
  "original_path",
  "cutout_path",
  "thumbnail_url",
  "thumbnail",
  "image_url",
  "original_url",
  "processed_url",
  "url",
  "image",
]);

export async function restoreApiUrl() {
  try {
    const saved = await AsyncStorage.getItem(API_URL_KEY);
    if (saved) {
      const isOldLocal = /192\.168\.|localhost|127\.0\.0\.1|10\.0\.2\.2/.test(saved);
      const isTargetRemote = API_URL.includes("sslip.io");
      if (!isOldLocal || !isTargetRemote) {
        activeApiUrl = withApi(saved);
      }
    }
  } catch (e) {}
}

function rememberApiUrl(url) {
  activeApiUrl = withApi(url);
  AsyncStorage.setItem(API_URL_KEY, activeApiUrl).catch(() => {});
}

export function getApiBaseUrl() {
  return activeApiUrl;
}

export function getServerBaseUrl() {
  return activeApiUrl.replace(/\/api\/?$/, "") || MEDIA_BASE_URL;
}

export function resolveMediaUrl(url, { corsSafe = false } = {}) {
  if (!url || typeof url !== "string") {
    return url || null;
  }
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (/^(data|blob|file|content):/i.test(trimmed)) {
    return trimmed;
  }

  const origin = getServerBaseUrl();
  let resolved = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const api = new URL(origin);
      const shouldRewriteHost =
        ["127.0.0.1", "localhost", "10.0.2.2", "13.233.117.126"].includes(
          parsed.hostname,
        ) || parsed.hostname.startsWith("192.168.");
      if (shouldRewriteHost) {
        parsed.protocol = api.protocol;
        parsed.hostname = api.hostname;
        parsed.port = api.port;
      } else if (parsed.hostname === api.hostname && parsed.protocol !== api.protocol) {
        parsed.protocol = api.protocol;
      }
      resolved = parsed.toString();
    } catch {
      resolved = trimmed;
    }
  } else {
    const cleaned = trimmed.replace(/^\.\//, "");
    if (/^\/?(storage|api\/media)\//i.test(cleaned)) {
      resolved = `${origin}/${cleaned.replace(/^\/+/, "")}`;
    } else if (cleaned.startsWith("/")) {
      resolved = `${origin}${cleaned}`;
    } else {
      resolved = `${origin}/storage/${cleaned}`;
    }
  }

  if (corsSafe) {
    resolved = resolved.replace(/^(https?:\/\/[^/]+)\/storage\//i, "$1/api/media/");
  }

  return resolved;
}

export function rewriteMediaUrl(url) {
  return resolveMediaUrl(url, { corsSafe: false });
}

function rewriteMediaDeep(value, key = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return value;
    const isUrlOrStorage =
      /^https?:\/\//i.test(trimmed) || /^\/?(storage|api\/media)\//i.test(trimmed);
    if (isUrlOrStorage || IMAGE_KEYS.has(key)) {
      return resolveMediaUrl(trimmed);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteMediaDeep(item, key));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nested]) => [
        nestedKey,
        rewriteMediaDeep(nested, nestedKey),
      ]),
    );
  }
  return value;
}

async function requestOnce(
  baseUrl,
  path,
  { method = "GET", token, body, isMultipart, timeout = TIMEOUT_MS } = {},
) {
  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const raw = await res.text();
    let json = {};
    try {
      json = JSON.parse(raw);
    } catch {
      const start = raw.indexOf("{");
      try {
        json = start >= 0 ? JSON.parse(raw.slice(start)) : {};
      } catch {
        json = {};
      }
    }
    if (!res.ok) {
      const details = json.errors
        ? Object.values(json.errors).flat().join(" ")
        : "";
      const error = new Error(
        details || json.message || `Request failed (${res.status})`,
      );
      error.status = res.status;
      throw error;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

async function request(path, options = {}) {
  const urls = [
    activeApiUrl,
    ...getCandidateApiUrls()
      .map(withApi)
      .filter((url) => url !== activeApiUrl),
  ];
  let lastError;

  for (const baseUrl of urls) {
    try {
      const json = rewriteMediaDeep(await requestOnce(baseUrl, path, options));
      if (baseUrl !== activeApiUrl) {
        rememberApiUrl(baseUrl);
      }
      return json;
    } catch (error) {
      lastError = error;
      if (error?.status) {
        throw error;
      }
    }
  }

  throw new Error(
    `Cannot reach API at ${activeApiUrl}. Make sure Laravel server is running (e.g. php artisan serve --port=8080). (${lastError?.message || "timeout"})`,
  );
}

export const api = {
  login: (email, password) =>
    request("/login", { method: "POST", body: { email, password } }),
  me: (token) => request("/me", { token }),
  categories: (token, q = "", page = 1) =>
    request(`/categories?q=${encodeURIComponent(q)}&page=${page}`, { token }),
  subCategories: (token, categoryId, page = 1) =>
    request(`/categories/${categoryId}/sub-categories?page=${page}`, { token }),
  products: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products?${qs}`, { token });
  },
  product: (token, id) => request(`/products/${id}`, { token }),
  backgrounds: (token, orientation, category_type) =>
    request(
      `/backgrounds?orientation=${orientation || ""}&category_type=${encodeURIComponent(category_type || "All")}`,
      { token },
    ),
  shortlist: (token) => request("/shortlist", { token }),
  addShortlist: (token, items) =>
    request("/shortlist", { method: "POST", token, body: { items } }),
  removeShortlist: (token, item_ids) =>
    request("/shortlist/remove", { method: "POST", token, body: { item_ids } }),
  emptyShortlist: (token) =>
    request("/shortlist/empty", { method: "POST", token }),
  captions: (token, product_ids) =>
    request("/share/captions", {
      method: "POST",
      token,
      body: { product_ids },
    }),
  logShare: (token, product_ids) =>
    request("/share", {
      method: "POST",
      token,
      body: { product_ids, shared_via: "whatsapp" },
    }),
  recentProcess: (token) => request("/process/recent", { token }),
  process: (token, formData) =>
    request("/process", {
      method: "POST",
      token,
      body: formData,
      isMultipart: true,
      timeout: 180000,
    }),
  removeBackground: (token, formData) =>
    request("/process/remove-background", {
      method: "POST",
      token,
      body: formData,
      isMultipart: true,
      timeout: 180000,
    }),
  updateProfile: (token, body) =>
    request("/profile", { method: "PUT", token, body }),
};

async function fetchAllPagesWithMeta(fetchPage, maxPages = 5) {
  const first = await fetchPage(1);
  const items = [...(first?.data || [])];
  const lastPage = Math.min(Number(first?.last_page || 1), maxPages);
  for (let p = 2; p <= lastPage; p += 1) {
    const next = await fetchPage(p);
    if (Array.isArray(next?.data)) {
      items.push(...next.data);
    }
  }
  const total =
    first?.total !== undefined && first?.total !== null
      ? Number(first.total)
      : items.length;
  return { items, total };
}

async function fetchAllPages(fetchPage, maxPages = 5) {
  const { items } = await fetchAllPagesWithMeta(fetchPage, maxPages);
  return items;
}

export function fetchAllCategories(token, q = "") {
  return fetchAllPages((page) => api.categories(token, q, page));
}

export function fetchAllSubCategories(token, categoryId) {
  return fetchAllPages((page) => api.subCategories(token, categoryId, page));
}

export function fetchAllProducts(token, params = {}) {
  return fetchAllPages((page) => api.products(token, { ...params, page }));
}

export function fetchAllProductsWithMeta(token, params = {}) {
  return fetchAllPagesWithMeta((page) => api.products(token, { ...params, page }));
}

function sortByDisplayOrder(list) {
  return [...list].sort((a, b) => {
    const orderA = Number(a?.display_order ?? 9999);
    const orderB = Number(b?.display_order ?? 9999);
    if (orderA !== orderB) return orderA - orderB;
    return Number(a?.id ?? 0) - Number(b?.id ?? 0);
  });
}

export function enrichCategoriesWithProducts(categories = [], products = []) {
  const byCategory = new Map();
  for (const prod of products) {
    const catId = prod?.category?.id ?? prod?.category_id;
    if (!catId) continue;
    if (!byCategory.has(catId)) byCategory.set(catId, []);
    byCategory.get(catId).push(prod);
  }

  return sortByDisplayOrder(categories).map((cat) => {
    const catProducts = byCategory.get(cat.id) || [];
    const fallbackProductImg = catProducts.find((p) => p?.images?.[0]?.url)?.images?.[0]?.url;
    const rawThumb =
      cat.thumbnail_url ||
      cat.image_url ||
      cat.thumbnail ||
      cat.image ||
      cat.image_path ||
      fallbackProductImg ||
      null;
    const resolvedThumb = resolveMediaUrl(rawThumb);
    const count =
      cat.products_count ??
      cat.product_count ??
      (products.length > 0 ? catProducts.length : undefined);

    return {
      ...cat,
      resolved_thumbnail: resolvedThumb,
      products_count: count,
    };
  });
}

export function enrichSubCategoriesWithProducts(subCategories = [], products = []) {
  const bySub = new Map();
  for (const prod of products) {
    const subId = prod?.sub_category?.id ?? prod?.sub_category_id;
    if (!subId) continue;
    if (!bySub.has(subId)) bySub.set(subId, []);
    bySub.get(subId).push(prod);
  }

  return sortByDisplayOrder(subCategories).map((sub) => {
    const subProducts = bySub.get(sub.id) || [];
    const fallbackProductImg = subProducts.find((p) => p?.images?.[0]?.url)?.images?.[0]?.url;
    const rawThumb =
      sub.thumbnail_url ||
      sub.image_url ||
      sub.thumbnail ||
      sub.image ||
      sub.image_path ||
      fallbackProductImg ||
      null;
    const resolvedThumb = resolveMediaUrl(rawThumb);
    const count =
      sub.products_count ??
      sub.product_count ??
      (products.length > 0 ? subProducts.length : undefined);

    return {
      ...sub,
      resolved_thumbnail: resolvedThumb,
      products_count: count,
    };
  });
}

export async function loadToken() {
  return AsyncStorage.getItem("token");
}

export async function loadUser() {
  try {
    const raw = await AsyncStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSession(token, user) {
  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user", JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.multiRemove(["token", "user"]);
}
