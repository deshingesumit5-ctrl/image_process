import { NativeModules, Platform, Share, TurboModuleRegistry } from "react-native";
import { resolveMediaUrl, rewriteMediaUrl } from "./api";

let FileSystem = null;
let Sharing = null;
let IntentLauncher = null;
let MediaLibrary = null;
let RNShare = null;
let NativeRNShare = null;
let Clipboard = null;

const toFileUri = (p) =>
  !p ? p : /^(file|content|https?|data|blob):/i.test(String(p)) ? p : `file://${p}`;

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
    NativeRNShare =
      (TurboModuleRegistry && TurboModuleRegistry.get("RNShare")) ||
      NativeModules?.RNShare ||
      null;
  } catch (e) {
    console.log("[SHARE] react-native-share load failed:", e && e.message);
  }
  try {
    Clipboard = require("expo-clipboard");
  } catch (e) {
    console.log("[CLIP] load failed:", e && e.message);
  }
}

export async function persistLocalImage(uri) {
  if (!uri) return uri;
  const source = resolveMediaUrl(uri, { corsSafe: true });
  if (Platform.OS === "web" || !FileSystem) {
    return source;
  }
  if (/^data:image\//i.test(source)) {
    const extMatch = source.match(/^data:image\/(\w+);base64,/i);
    const safeExt = extMatch?.[1] === "jpeg" ? "jpg" : extMatch?.[1] || "png";
    const base64 = source.replace(/^data:image\/\w+;base64,/, "");
    const cacheDir =
      FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
    const dest = `${cacheDir}img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    await FileSystem.writeAsStringAsync(dest, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return dest;
  }
  const ext = (source.split("?")[0].split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const cacheDir =
    FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
  const dest = `${cacheDir}img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  try {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      const downloaded = await FileSystem.downloadAsync(source, dest);
      if (downloaded.status && downloaded.status >= 400) {
        throw new Error(`Download failed (${downloaded.status})`);
      }
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
          : resolveMediaUrl(raw, { corsSafe: true });
      const filename = `richboy-product-${Date.now()}-${i + 1}.png`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        saved += 1;
      } catch (e) {
        try {
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          saved += 1;
        } catch {
          window.open(url, "_blank");
          saved += 1;
        }
      }
    }
    return saved;
  }

  let permissionDenied = false;
  if (MediaLibrary) {
    try {
      let perm = await MediaLibrary.getPermissionsAsync(true);
      if (!perm.granted) {
        perm = await MediaLibrary.requestPermissionsAsync(true);
      }
      if (perm.granted) {
        let savedCount = 0;
        for (let i = 0; i < cleanUris.length; i += 1) {
          const local = toFileUri(
            await persistLocalImage(toFileUri(cleanUris[i])),
          );
          if (!local || /^https?:/i.test(local)) continue;
          await MediaLibrary.saveToLibraryAsync(local);
          savedCount += 1;
        }
        if (savedCount) return savedCount;
      } else {
        permissionDenied = true;
      }
    } catch (e) {
      console.log("[MEDIA] save failed, trying SAF fallback:", e && e.message);
    }
  }

  // Fallback: let the user pick a folder (e.g. Pictures) via Android SAF
  const SAF = FileSystem && FileSystem.StorageAccessFramework;
  if (Platform.OS !== "android" || !SAF) {
    throw new Error(
      permissionDenied
        ? "Gallery permission denied. Please allow photo access in app settings."
        : "Could not save to the gallery on this device.",
    );
  }
  const dir = await SAF.requestDirectoryPermissionsAsync();
  if (!dir.granted) {
    throw new Error(
      permissionDenied
        ? "Gallery permission is required, or choose a folder (e.g. Pictures) to save."
        : "Choose a folder (for example Pictures) to save the image.",
    );
  }
  let n = 0;
  for (let i = 0; i < cleanUris.length; i += 1) {
    const local = toFileUri(await persistLocalImage(toFileUri(cleanUris[i])));
    const b64 = await FileSystem.readAsStringAsync(local, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const dest = await SAF.createFileAsync(
      dir.directoryUri,
      `product-page-${Date.now()}-${i + 1}`,
      "image/png",
    );
    await FileSystem.writeAsStringAsync(dest, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    n += 1;
  }
  return n;
}

export async function shareCaptionAndImages(caption, imageUrls = []) {
  const text = caption || "Richboy Collection";
  const cleanUrls = imageUrls
    .filter(Boolean)
    .map((u) => resolveMediaUrl(u, { corsSafe: true }));

  if (Platform.OS === "web") {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    let blob = null;
    try {
      const raw = imageUrls.filter(Boolean)[0];
      if (raw) {
        const src =
          raw.startsWith("data:") || raw.startsWith("blob:")
            ? raw
            : resolveMediaUrl(raw, { corsSafe: true });
        blob = await (await fetch(src)).blob();
        const file = new File([blob], "richboy-catalogue.png", {
          type: blob.type || "image/png",
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.clipboard.writeText(text);
          } catch (e) {
            console.log("[SHARE] caption copy failed:", e && e.message);
          }
          await navigator.share({ files: [file], text });
          return { captionCopied: true, sharedToWhatsApp: true };
        }
      }
    } catch (e) {
      console.log("[SHARE] web share failed:", e && e.name, e && e.message);
      if (e && e.name === "AbortError") return { captionCopied: false, sharedToWhatsApp: false };
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
      a.download = "richboy-catalogue.png";
      a.click();
    }
    window.open(waUrl, "_blank");
    setTimeout(() => {
      window.alert(
        copied
          ? "Catalogue image copied. In WhatsApp, press Ctrl+V to paste the image."
          : "Catalogue image downloaded. In WhatsApp, attach it from your Downloads folder.",
      );
    }, 300);
    return { captionCopied: false, sharedToWhatsApp: true };
  }

  const files = [];
  const cacheDir = FileSystem
    ? FileSystem.cacheDirectory || FileSystem.documentDirectory || ""
    : "";
  for (let i = 0; i < cleanUrls.length; i += 1) {
    const dest = `${cacheDir}share-${Date.now()}-${i}-${Math.random()
      .toString(36)
      .slice(2, 6)}.png`;
    try {
      const target = cleanUrls[i];
      if (FileSystem && /^data:image\//i.test(target)) {
        const base64 = target.replace(/^data:image\/\w+;base64,/, "");
        await FileSystem.writeAsStringAsync(dest, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        files.push(toFileUri(dest));
      } else if (
        FileSystem &&
        (target.startsWith("http://") || target.startsWith("https://"))
      ) {
        const downloaded = await FileSystem.downloadAsync(target, dest);
        const uri = toFileUri(downloaded.uri);
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists && info.size > 0) {
            files.push(uri);
          } else {
            console.log("[SHARE] downloaded file not ready:", uri, info);
          }
        } catch {
          files.push(uri);
        }
      } else {
        const localUri = toFileUri(target);
        if (FileSystem && cacheDir && !localUri.startsWith(cacheDir)) {
          try {
            await FileSystem.copyAsync({ from: localUri, to: dest });
            files.push(toFileUri(dest));
          } catch {
            files.push(localUri);
          }
        } else {
          files.push(localUri);
        }
      }
    } catch (e) {
      console.log("[SHARE] download failed:", e && e.message);
    }
  }

  let captionCopied = false;
  try {
    if (Clipboard) {
      await Clipboard.setStringAsync(text);
      captionCopied = true;
    }
  } catch (e) {}

  console.log("[SHARE] files:", files.length, "RNShare:", !!RNShare, "native:", !!NativeRNShare);
  if (RNShare && NativeRNShare?.shareSingle && Platform.OS === "android" && files.length > 1) {
    // WhatsApp drops caption on multi-image share, so send one by one with caption
    for (const f of files) {
      try {
        await NativeRNShare.shareSingle({
          url: f,
          social: RNShare.Social.WHATSAPP,
          message: text,
          type: "image/png",
          failOnCancel: false,
        });
      } catch (e) {
        console.log("[SHARE] multi single failed:", e && e.message);
      }
    }
    return { captionCopied, sharedToWhatsApp: true };
  }

  if (RNShare && files.length) {
    if (Platform.OS === "android" && files.length === 1) {
      let waInstalled = false;
      let waBusinessInstalled = false;
      try {
        waInstalled = Boolean(
          (await RNShare.isPackageInstalled("com.whatsapp"))?.isInstalled,
        );
      } catch {}
      if (!waInstalled) {
        try {
          waBusinessInstalled = Boolean(
            (await RNShare.isPackageInstalled("com.whatsapp.w4b"))?.isInstalled,
          );
        } catch {}
      }

          console.log("[SHARE] wa:", waInstalled, "w4b:", waBusinessInstalled, "shareSingle:", !!RNShare?.shareSingle);
      if (waInstalled || waBusinessInstalled) {
        try {
          // Pass `url` without `urls` so Android ShareIntent uses ACTION_SEND
          // (ACTION_SEND_MULTIPLE drops EXTRA_TEXT caption in WhatsApp).
                 await RNShare.shareSingle({
            url: files[0],
            social: waInstalled
              ? RNShare.Social.WHATSAPP
              : RNShare.Social.WHATSAPPBUSINESS,
            message: text,
            type: "image/png",
            failOnCancel: false,
          });
          return { captionCopied, sharedToWhatsApp: true };
        } catch (e) {
          console.log("[SHARE] whatsapp single failed:", e && e.message);
        }
      }

      try {
        // RNShare.open on Android keeps ACTION_SEND + EXTRA_STREAM + EXTRA_TEXT together
        await RNShare.open({
          url: files[0],
          message: text,
          type: "image/png",
          failOnCancel: false,
        });
        return { captionCopied, sharedToWhatsApp: true };
      } catch (e) {
        console.log("[SHARE] rnshare open failed:", e && e.message);
      }
    } else {
      const media = files.length === 1 ? { url: files[0] } : { urls: files };
      try {
        await RNShare.shareSingle({
          ...media,
          social: RNShare.Social.WHATSAPP,
          message: text,
          type: "image/png",
          failOnCancel: false,
        });
        return { captionCopied, sharedToWhatsApp: true };
      } catch (e) {
        console.log("[SHARE] whatsapp direct failed:", e && e.message);
      }
    }
  }

  await Share.share({ message: text, title: "Share Products" });
  if (files[0] && Sharing && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(files[0], {
      mimeType: "image/png",
      dialogTitle: "Share product image",
    });
  }
  return { captionCopied, sharedToWhatsApp: false };
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

const uniq = (list) => [...new Set(list.map((s) => String(s || "").trim()).filter(Boolean))];

const toList = (v) =>
  (Array.isArray(v) ? v : String(v ?? "").split(/[,|]/))
    .map(txt)
    .filter(Boolean);

export function deriveCollectionName(products = []) {
  const valid = (products || []).filter(Boolean);
  for (const p of valid) {
    const explicit = txt(p.collection_name ?? p.collection);
    if (explicit) return explicit;
  }
  const subNames = uniq(valid.map((p) => txt(p.sub_category?.name ?? p.sub_category)));
  if (subNames.length === 1) {
    const sub = subNames[0];
    return /collection$/i.test(sub) ? sub : `${sub} Collection`;
  }
  const catNames = uniq(valid.map((p) => txt(p.category?.name ?? p.category)));
  if (catNames.length === 1) {
    const cat = catNames[0];
    return /collection$/i.test(cat) ? cat : `${cat} Collection`;
  }
  if (subNames.length > 1) return subNames.join(" & ");
  if (catNames.length > 1) return catNames.join(" & ");
  return "Richboy Collection";
}

export function extractCatalogMetadata(itemsOrProducts = []) {
  const normalized = (itemsOrProducts || []).filter(Boolean).map((entry) => {
    if (entry.product) {
      return {
        product: entry.product,
        designNumber: entry.designNumber || entry.product?.design_number,
      };
    }
    return {
      product: entry,
      designNumber: entry.designNumber || entry.design_number,
    };
  });

  const products = normalized.map((n) => n.product).filter(Boolean);
  const collectionName = deriveCollectionName(products);

  const productNames = uniq(
    products.map((p) => txt(p.name ?? p.product_name ?? p.title)),
  );
  const designNos = uniq(
    normalized.map((n) => n.designNumber || n.product?.design_number),
  );
  const colours = uniq(
    products.flatMap((p) =>
      String(p.colour ?? p.color ?? "")
        .split(/[/,]/)
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  );
  const sizes = uniq(
    products.flatMap((p) =>
      (Array.isArray(p.sizes) ? p.sizes : toList(p.sizes ?? p.size)).map((s) =>
        typeof s === "object" ? txt(s.size ?? s.name) : txt(s),
      ),
    ),
  );
  const explicitGroups = uniq(
    products.map((p) => txt(p.group ?? p.group_name)),
  );
  const categories = uniq(
    products.map((p) => txt(p.category?.name ?? p.category_name ?? p.category)),
  );
  const subCategories = uniq(
    products.map((p) =>
      txt(p.sub_category?.name ?? p.sub_category_name ?? p.sub_category),
    ),
  );
  const groups = uniq(
    products.map((p) =>
      txt(p.group ?? p.group_name ?? p.category?.name ?? p.category),
    ),
  );
  const rates = products.flatMap((p) => {
    const sizeRates = (Array.isArray(p.sizes) ? p.sizes : [])
      .map((s) => Number(s?.rate ?? s?.price))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (sizeRates.length) return sizeRates;
    const direct = Number(p.rate ?? p.price);
    return !Number.isNaN(direct) && direct > 0 ? [direct] : [];
  });
  let price = "";
  if (rates.length) {
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    price = min === max ? `₹ ${min}` : `₹ ${min} - ₹ ${max}`;
  }

  return {
    collectionName,
    productNames,
    designNos,
    colours,
    sizes,
    explicitGroups,
    categories,
    subCategories,
    groups,
    price,
    products,
  };
}

export function buildCatalogCaption(itemsOrProducts = [], countOverride) {
  const {
    collectionName,
    productNames,
    designNos,
    colours,
    sizes,
    explicitGroups,
    categories,
    subCategories,
    groups,
    price,
  } = extractCatalogMetadata(itemsOrProducts);
  const count =
    countOverride !== undefined && countOverride !== null
      ? countOverride
      : Math.max(itemsOrProducts.length, designNos.length, 1);

  const lines = [
    "Hi,",
    `Please find the ${count} processed product ${count === 1 ? "design" : "designs"} from our ${collectionName}.`,
  ];

  const metaLines = [];
  if (productNames.length) {
    metaLines.push(`Product Name: ${productNames.join(", ")}`);
  }
  if (designNos.length) {
    metaLines.push(`Design Nos.: ${designNos.join(", ")}`);
  }
  if (explicitGroups.length) {
    metaLines.push(`Group: ${explicitGroups.join(", ")}`);
  }
  if (categories.length) {
    metaLines.push(`Category: ${categories.join(", ")}`);
  } else if (!explicitGroups.length && groups.length) {
    metaLines.push(`Group: ${groups.join(", ")}`);
  }
  if (subCategories.length) {
    metaLines.push(`Sub-Category: ${subCategories.join(", ")}`);
  }
  if (colours.length) {
    metaLines.push(`Colours: ${colours.join(", ")}`);
  }
  if (sizes.length) {
    metaLines.push(`Sizes: ${sizes.join(" | ")}`);
  }
  if (price) {
    metaLines.push(`Price: ${price}`);
  }

  if (metaLines.length) {
    lines.push("", ...metaLines);
  }
  lines.push("", "Please review and let us know your selection.");
  return lines.join("\n");
}

// Kept for backward compatibility; delegates to the new catalog caption format
export function buildProductCaption(products = [], _fallbackContact = "") {
  return buildCatalogCaption(products);
}

function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Web-only HTML5 Canvas generator for the Richboy Collection composite catalogue card.
 * Used because react-native-view-shot on web requires optional html2canvas-pro.
 */
export async function renderCatalogCardToDataUrl(items = []) {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    throw new Error("Canvas rendering is only available on web.");
  }
  const list = (items || []).filter((it) => it && (it.uri || it.url));
  if (!list.length) {
    throw new Error("Select at least one image to generate the catalogue card.");
  }

  const meta = extractCatalogMetadata(list);
  const cols = list.length === 1 ? 1 : 2;
  const rowsCount = Math.ceil(list.length / cols);

  const width = 920;
  const pad = 42;
  const innerPad = 24;
  const headerH = 112;
  const gridGap = 20;
  const innerW = width - pad * 2 - innerPad * 2;
  const cardW = cols === 1 ? innerW : Math.floor((innerW - gridGap) / 2);
  const cardH = cols === 1 ? Math.round(cardW * 0.92) : Math.round(cardW * 1.18);
  const gridH = rowsCount * cardH + Math.max(0, rowsCount - 1) * gridGap;

  const metaRows = [
    meta.colours.length ? { label: "Colours:", value: meta.colours.join(" / ") } : null,
    meta.sizes.length ? { label: "Sizes:", value: meta.sizes.join(" | ") } : null,
    meta.price ? { label: "Price:", value: meta.price } : null,
    meta.groups.length ? { label: "Group:", value: meta.groups.join(", ") } : null,
  ].filter(Boolean);

  const infoBoxH = 74 + metaRows.length * 46;
  const footerH = 44;
  const height = pad * 2 + headerH + gridH + 26 + infoBoxH + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Outer warm cream background
  ctx.fillStyle = "#FCF7EC";
  ctx.fillRect(0, 0, width, height);

  // Outer & inner ornate borders
  drawRoundedRect(ctx, 16, 16, width - 32, height - 32, 26);
  ctx.strokeStyle = "#DFCFB5";
  ctx.lineWidth = 3;
  ctx.stroke();

  drawRoundedRect(ctx, 28, 28, width - 56, height - 56, 20);
  ctx.strokeStyle = "#C9A86A";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Corner flourishes
  const corners = [
    [42, 42, 1, 1],
    [width - 42, 42, -1, 1],
    [42, height - 42, 1, -1],
    [width - 42, height - 42, -1, -1],
  ];
  ctx.strokeStyle = "#8C6D3F";
  ctx.lineWidth = 2.5;
  corners.forEach(([cx, cy, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * 22);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * 22, cy);
    ctx.stroke();
  });

  // Crown emblem
  const crownX = width / 2;
  const crownY = 76;
  ctx.fillStyle = "#8C6D3F";
  ctx.beginPath();
  ctx.moveTo(crownX - 20, crownY);
  ctx.lineTo(crownX - 24, crownY - 18);
  ctx.lineTo(crownX - 10, crownY - 9);
  ctx.lineTo(crownX, crownY - 24);
  ctx.lineTo(crownX + 10, crownY - 9);
  ctx.lineTo(crownX + 24, crownY - 18);
  ctx.lineTo(crownX + 20, crownY);
  ctx.closePath();
  ctx.fill();

  // Header title + divider lines
  ctx.fillStyle = "#5B3A1E";
  ctx.font = 'bold 34px Georgia, "Times New Roman", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const brandTitle = "Richboy Collection";
  const titleMetrics = ctx.measureText(brandTitle);
  const titleHalf = titleMetrics.width / 2 + 20;
  ctx.fillText(brandTitle, width / 2, 112);

  ctx.strokeStyle = "#DFCFB5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad + innerPad, 112);
  ctx.lineTo(width / 2 - titleHalf, 112);
  ctx.moveTo(width / 2 + titleHalf, 112);
  ctx.lineTo(width - pad - innerPad, 112);
  ctx.stroke();

  // Load and draw product images
  const startY = pad + headerH;
  const loadedImages = await Promise.all(
    list.map(async (it) => {
      const raw = it.uri || it.url;
      const corsSrc =
        raw.startsWith("data:") || raw.startsWith("blob:")
          ? raw
          : resolveMediaUrl(raw, { corsSafe: true });
      try {
        return await loadHtmlImage(corsSrc);
      } catch {
        return null;
      }
    }),
  );

  list.forEach((it, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = pad + innerPad + col * (cardW + gridGap);
    const y = startY + row * (cardH + gridGap);

    drawRoundedRect(ctx, x, y, cardW, cardH, 20);
    ctx.fillStyle = "#F6EFE2";
    ctx.fill();
    ctx.strokeStyle = "#DFCFB5";
    ctx.lineWidth = 2;
    ctx.stroke();

    const img = loadedImages[idx];
    if (img) {
      ctx.save();
      drawRoundedRect(ctx, x + 2, y + 2, cardW - 4, cardH - 4, 18);
      ctx.clip();
      const scale = Math.min((cardW - 12) / img.width, (cardH - 12) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, x + (cardW - dw) / 2, y + (cardH - dh) / 2, dw, dh);
      ctx.restore();
    }

    const designLabel =
      it.designNumber || it.product?.design_number || `Design ${idx + 1}`;
    ctx.font = "bold 17px sans-serif";
    const pillW = Math.min(cardW - 36, Math.max(96, ctx.measureText(designLabel).width + 36));
    const pillH = 30;
    const pillX = x + (cardW - pillW) / 2;
    const pillY = y + cardH - pillH / 2 - 2;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 15);
    ctx.fillStyle = "#5B3A1E";
    ctx.fill();
    ctx.strokeStyle = "#C9A86A";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(designLabel, x + cardW / 2, pillY + pillH / 2 + 1);
  });

  // Footer Info Card
  const infoY = startY + gridH + 28;
  const infoX = pad + innerPad;
  const infoW = innerW;
  drawRoundedRect(ctx, infoX, infoY, infoW, infoBoxH, 18);
  ctx.fillStyle = "#FFFBF2";
  ctx.fill();
  ctx.strokeStyle = "#DFCFB5";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Collection pill + Design No.
  ctx.font = "bold 17px sans-serif";
  const colPillW = Math.min(infoW * 0.48, ctx.measureText(meta.collectionName).width + 38);
  drawRoundedRect(ctx, infoX + 18, infoY + 16, colPillW, 36, 18);
  ctx.fillStyle = "#5B3A1E";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(meta.collectionName, infoX + 18 + colPillW / 2, infoY + 34);

  const designLabelList = meta.designNos.length
    ? meta.designNos
    : list.map((it, idx) => it.designNumber || it.product?.design_number || `Design ${idx + 1}`);
  if (designLabelList.length) {
    ctx.fillStyle = "#5B3A1E";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "right";
    const prefix = "Design No.: ";
    const valText = designLabelList.join(" / ");
    ctx.font = "16px sans-serif";
    const valW = ctx.measureText(valText).width;
    ctx.fillText(valText, infoX + infoW - 18, infoY + 34);
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(prefix, infoX + infoW - 18 - valW, infoY + 34);
  }

  ctx.strokeStyle = "#EFE6D5";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(infoX + 18, infoY + 64);
  ctx.lineTo(infoX + infoW - 18, infoY + 64);
  ctx.stroke();

  metaRows.forEach((row, i) => {
    const ry = infoY + 68 + i * 46;
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(infoX + 18, ry);
      ctx.lineTo(infoX + infoW - 18, ry);
      ctx.stroke();
    }
    ctx.fillStyle = "#5B3A1E";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(row.label, infoX + 22, ry + 24);

    ctx.fillStyle = "#2B2118";
    ctx.font = "17px sans-serif";
    ctx.fillText(row.value, infoX + 145, ry + 24);
  });

  // Footer dotted divider
  const footerY = infoY + infoBoxH + 22;
  ctx.strokeStyle = "#DFCFB5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad + innerPad + 24, footerY);
  ctx.lineTo(width / 2 - 28, footerY);
  ctx.moveTo(width / 2 + 28, footerY);
  ctx.lineTo(width - pad - innerPad - 24, footerY);
  ctx.stroke();

  ctx.fillStyle = "#8C6D3F";
  [-10, 0, 10].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(width / 2 + dx, footerY, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL("image/png", 1);
}

export async function appendImageFile(form, uri, index = 0) {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) throw new Error("Could not read this image for upload.");
    const blob = await response.blob();
    if (!blob.type || !blob.type.startsWith("image/")) {
      throw new Error("Selected file is not a valid image.");
    }
    const type = blob.type;
    const ext = type.includes("png")
      ? "png"
      : type.includes("webp")
        ? "webp"
        : "jpg";
    form.append(
      "images[]",
      new File([blob], `image-${index}.${ext}`, { type }),
    );
    return;
  }

  const cleanUri = String(uri || "");
  const png = cleanUri.toLowerCase().includes(".png");
  if (/^file:\/\//i.test(cleanUri)) {
    try {
      const { File: FsFile } = require("expo-file-system");
      form.append("images[]", new FsFile(cleanUri));
      return;
    } catch (e) {
      console.log("[UPLOAD] File class failed, using legacy part:", e?.message);
    }
  }
  form.append("images[]", {
    uri: cleanUri,
    name: png ? `image-${index}.png` : `image-${index}.jpg`,
    type: png ? "image/png" : "image/jpeg",
  });
}
