import { Platform, Share } from "react-native";
import { rewriteMediaUrl } from "./api";

let FileSystem = null;
let Sharing = null;
let IntentLauncher = null;
let MediaLibrary = null;
let RNShare = null;

if (Platform.OS !== "web") {
  try {
    FileSystem = require("expo-file-system/legacy");
  } catch (e) {}
  try {
    Sharing = require("expo-sharing");
  } catch (e) {}
  try {
    IntentLauncher = require("expo-intent-launcher");
  } catch (e) {}
  try {
    MediaLibrary = require("expo-media-library");
  } catch (e) {
    console.log("[MEDIA] load failed:", e && e.message);
  }
  try {
    RNShare = require("react-native-share").default;
  } catch (e) {
    console.log("[SHARE] react-native-share load failed:", e && e.message);
  }
}

export async function persistLocalImage(uri) {
  if (!uri) return uri;
  const source = rewriteMediaUrl(uri);
  if (Platform.OS === "web" || !FileSystem) {
    return source;
  }
  const ext = (source.split("?")[0].split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const cacheDir =
    FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
  const dest = `${cacheDir}img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  try {
    if (source.startsWith("http://") || source.startsWith("https://")) {
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
    throw new Error("No image available to save.");
  }

  if (Platform.OS === "web") {
    let saved = 0;
    for (let i = 0; i < cleanUris.length; i += 1) {
      const raw = cleanUris[i];
      const url =
        raw.startsWith("data:") || raw.startsWith("blob:")
          ? raw
          : rewriteMediaUrl(raw);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = `product-page-${Date.now()}-${i + 1}.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        saved += 1;
      } catch (e) {
        window.open(url, "_blank");
        saved += 1;
      }
    }
    return saved;
  }

  if (!MediaLibrary) {
    throw new Error("Media library plugin is not available on this device.");
  }

  const perm = await MediaLibrary.requestPermissionsAsync(true);
  if (!perm.granted) {
    throw new Error("Gallery permission is required to save images to device.");
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
  const text = caption || "Ramchandra Dresses Products";
  const cleanUrls = imageUrls.filter(Boolean).map(rewriteMediaUrl);
  if (Platform.OS === "web") {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    let blob = null;
    try {
      const raw = imageUrls.filter(Boolean)[0];
      if (raw) {
        const src =
          raw.startsWith("data:") || raw.startsWith("blob:")
            ? raw
            : rewriteMediaUrl(raw);
        blob = await (await fetch(src)).blob();
        const file = new File([blob], "product-page.png", {
          type: "image/png",
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          // WhatsApp Desktop drops text sent with files, so copy the caption
          // and paste it (Ctrl+V) into the "Add a message" box.
          try {
            await navigator.clipboard.writeText(text);
          } catch (e) {
            console.log("[SHARE] caption copy failed:", e && e.message);
          }
          await navigator.share({ files: [file], text });
          return;
        }
      }
    } catch (e) {
      console.log("[SHARE] web share failed:", e && e.name, e && e.message);
      if (e && e.name === "AbortError") return;
    }

    // Fallback: copy the image so it can be pasted into WhatsApp
    let copied = false;
    if (blob && navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        copied = true;
      } catch (e) {
        console.log("[SHARE] clipboard failed:", e && e.name, e && e.message);
      }
    }
    if (blob && !copied) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "product-page.png";
      a.click();
    }
    window.open(waUrl, "_blank");
    setTimeout(() => {
      window.alert(
        copied
          ? "Image copied. In WhatsApp, press Ctrl+V to paste the image."
          : "Image downloaded. In WhatsApp, attach it from your Downloads folder.",
      );
    }, 300);
    return;
  }

  const files = [];
  if (FileSystem) {
    const cacheDir =
      FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
    for (let i = 0; i < cleanUrls.length; i += 1) {
      const dest = `${cacheDir}share-${Date.now()}-${i}.png`;
      try {
        if (
          cleanUrls[i].startsWith("http://") ||
          cleanUrls[i].startsWith("https://")
        ) {
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
  if (RNShare && files.length) {
    try {
      const opts =
        files.length === 1
          ? { url: files[0] }
          : { urls: files };
      await RNShare.open({
        ...opts,
        message: text,
        type: "image/png",
        failOnCancel: false,
      });
      return;
    } catch (e) {
      console.log("[SHARE] native share failed:", e && e.message);
    }
  }

  await Share.share({ message: text, title: "Share Products" });
  if (files[0] && Sharing && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(files[0], {
      mimeType: "image/png",
      dialogTitle: "Share product image",
    });
  }
}

const txt = (v) => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(txt).filter(Boolean).join(", ");
  if (typeof v === "object")
    return txt(
      v.name ?? v.label ?? v.size ?? v.title ?? v.value ?? v.code ?? "",
    );
  return String(v).trim();
};
const toList = (v) =>
  (Array.isArray(v) ? v : String(v ?? "").split(/[,|]/))
    .map(txt)
    .filter(Boolean);

// One caption block per product, using that product's own master data
export function buildProductCaption(products = [], fallbackContact = "") {
  return products
    .map((p) => {
      const contact =
        txt(
          p.contact ??
            p.contact_number ??
            p.phone ??
            p.mobile ??
            p.company?.phone ??
            p.company?.contact,
        ) || txt(fallbackContact);
      const sizes = toList(p.sizes ?? p.size ?? p.available_sizes);
      const sizeRates = (Array.isArray(p.sizes) ? p.sizes : [])
        .map((s) => Number(s && s.rate))
        .filter((n) => n > 0);
      const rate = sizeRates.length
        ? Math.min(...sizeRates)
        : Number(p.rate ?? p.price ?? p.min_rate ?? p.rate_from);
      const group = txt(p.group ?? p.category ?? p.group_name);
      return [
        "Ramchandra Dresses",
        p.design_number ? `Design No.: ${p.design_number}` : "",
        txt(p.name ?? p.title) ? `Product: ${txt(p.name ?? p.title)}` : "",
        sizes.length ? `Available Sizes: ${sizes.join(", ")}` : "",
        group ? `Group: ${group}` : "",
        rate > 0 ? `Rate: ₹${rate} onwards` : "",
        contact ? `Contact: ${contact}` : "",
        "Thank you for your enquiry. Please contact us for bulk orders and the latest collection.",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}
