import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, getCandidateApiUrls } from "./config";

const API_URL_KEY = "api_url";
const TIMEOUT_MS = 3000;
// Always end with /api, whether or not the saved address has it
const withApi = (u) =>
  `${String(u || "").trim().replace(/\/+$/, "").replace(/\/api$/, "")}/api`;
let activeApiUrl = withApi(API_URL);

export async function restoreApiUrl() {
  try {
    const saved = await AsyncStorage.getItem(API_URL_KEY);
      if (saved) {
      activeApiUrl = withApi(saved);
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

export function rewriteMediaUrl(url) {
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (!["127.0.0.1", "localhost", "10.0.2.2"].includes(parsed.hostname)) {
      return url;
    }
    const apiBase = activeApiUrl.replace(/\/api\/?$/, "");
    const api = new URL(apiBase);
    parsed.protocol = api.protocol;
    parsed.hostname = api.hostname;
    parsed.port = api.port;
    return parsed.toString();
  } catch {
    return url;
  }
}

function rewriteMediaDeep(value) {
  if (typeof value === "string") {
    return rewriteMediaUrl(value);
  }
  if (Array.isArray(value)) {
    return value.map(rewriteMediaDeep);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        rewriteMediaDeep(nested),
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
  categories: (token, q = "") =>
    request(`/categories?q=${encodeURIComponent(q)}`, { token }),
  subCategories: (token, categoryId) =>
    request(`/categories/${categoryId}/sub-categories`, { token }),
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

export async function loadToken() {
  return AsyncStorage.getItem("token");
}

export async function saveSession(token, user) {
  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user", JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.multiRemove(["token", "user"]);
}
