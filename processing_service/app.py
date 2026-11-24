from io import BytesIO

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import Response
import os
import numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

app = FastAPI(title="Image Process Service")

_session = None
_model_name = None
try:
    from rembg import remove as rembg_remove, new_session
    _preferred = os.getenv("REMBG_MODEL", "birefnet-general-lite")
    for _candidate in dict.fromkeys([_preferred, "birefnet-general-lite", "isnet-general-use", "u2net"]):
        try:
            _session = new_session(_candidate)
            _model_name = _candidate
            break
        except Exception as e:
            print(f"rembg model {_candidate} failed to load:", e)
except Exception as e:
    print("rembg failed to load:", e)
    rembg_remove = None
    _session = None


def _open(data: bytes) -> Image.Image:
    img = Image.open(BytesIO(data))
    img = ImageOps.exif_transpose(img)
    return img.convert("RGBA")


def _png(image: Image.Image) -> bytes:
    buf = BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _limit(image: Image.Image, max_side: int = 2000) -> Image.Image:
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image


def _studio_knockout(image: Image.Image) -> Image.Image:
    image = _limit(image.convert("RGBA"))
    w, h = image.size
    pix = image.load()
    corners = [pix[2, 2], pix[w - 3, 2], pix[2, h - 3], pix[w - 3, h - 3]]
    avg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    thresh = 42
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            dist = abs(r - avg[0]) + abs(g - avg[1]) + abs(b - avg[2])
            if dist < thresh * 3:
                pix[x, y] = (r, g, b, 0)
    return image


def _autocrop(image: Image.Image, pad: int = 12) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return image
    l, t, r, b = bbox
    return image.crop((max(0, l - pad), max(0, t - pad),
                       min(image.width, r + pad), min(image.height, b + pad)))


def _clean_alpha(mask: Image.Image) -> Image.Image:
    a = np.asarray(mask.convert("L"), dtype=np.float32) / 255.0

    # Suppress only negligible background haze while preserving light garment edges.
    a = np.where(a < 0.04, 0.0, a)

    # Solidify confident interior garment pixels without eroding or clipping mid-alphas.
    a = np.where(a >= 0.85, 1.0, a)

    # Heal small interior pinholes inside light garments without filling legitimate background loops.
    fg_mask = a >= 0.15
    if np.any(fg_mask):
        filled = ndimage.binary_fill_holes(fg_mask)
        holes = filled & (~fg_mask)
        if np.any(holes):
            hole_labels, n_holes = ndimage.label(holes)
            hole_sizes = ndimage.sum(holes, hole_labels, range(1, n_holes + 1))
            fg_area = max(int(fg_mask.sum()), 1)
            small_hole_ids = [i + 1 for i, s in enumerate(hole_sizes) if s < fg_area * 0.01]
            if small_hole_ids:
                a[np.isin(hole_labels, small_hole_ids)] = 1.0

    # Remove only tiny isolated noise speckles; never drop garment sleeves, cuffs, or accessories.
    fg_region = a >= 0.08
    labels, n = ndimage.label(fg_region)
    if n > 1:
        sizes = ndimage.sum(fg_region, labels, range(1, n + 1))
        min_keep = min(64.0, float(sizes.max()) * 0.002)
        keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= min_keep]
        if keep_ids:
            a[~np.isin(labels, keep_ids)] = 0.0

    return Image.fromarray(np.clip(a * 255.0, 0, 255).astype("uint8"), "L")


@app.get("/health")
def health():
    return {"ok": True, "rembg": rembg_remove is not None and _session is not None, "model": _model_name}


@app.post("/remove")
@app.post("/api/remove")
async def remove_bg(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
):
    upload = image or file
    if upload is None:
        return Response(content=b"", status_code=400)
    raw = await upload.read()

    if rembg_remove is None or _session is None:
        return Response(content=b"rembg not available", status_code=503)

    orig = _open(raw)
    # Composite pre-existing transparency on white before segmentation to avoid dark edge halos.
    rgb_for_seg = Image.new("RGBA", orig.size, (255, 255, 255, 255))
    rgb_for_seg.alpha_composite(orig)
    mask = rembg_remove(rgb_for_seg.convert("RGB"), session=_session, only_mask=True)
    if not isinstance(mask, Image.Image):
        mask = Image.open(BytesIO(mask))
    mask = mask.convert("L")
    if mask.size != orig.size:
        mask = mask.resize(orig.size, Image.Resampling.LANCZOS)

    cleaned_alpha = _clean_alpha(mask)
    orig_alpha = np.asarray(orig.getchannel("A"), dtype=np.float32) / 255.0
    new_alpha = np.asarray(cleaned_alpha, dtype=np.float32) / 255.0
    combined_alpha = Image.fromarray(
        np.clip(np.minimum(orig_alpha, new_alpha) * 255.0, 0, 255).astype("uint8"),
        "L",
    )
    orig.putalpha(combined_alpha)

    return Response(content=_png(orig), media_type="image/png")
@app.post("/api/fit-background")
async def fit_background(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    width: int = Form(1200),
    height: int = Form(1600),
):
    upload = image or file
    if upload is None:
        return Response(content=b"", status_code=400)
    img = _cover(_open(await upload.read()), width, height)
    return Response(content=_png(img), media_type="image/png")


@app.post("/composite")
@app.post("/api/composite")
async def composite(
    cutout: UploadFile = File(...),
    background: UploadFile = File(...),
    width: int = Form(1200),
    height: int = Form(1600),
):
    bg = _cover(_open(await background.read()), width, height)
    fg = _open(await cutout.read())
    scale = min((width * 0.92) / max(fg.width, 1), (height * 0.92) / max(fg.height, 1))
    fg = fg.resize(
        (max(1, int(round(fg.width * scale))), max(1, int(round(fg.height * scale)))),
        Image.Resampling.LANCZOS,
    )
    x = (width - fg.width) // 2
    y = (height - fg.height) // 2
    composed = bg.copy()
    composed.alpha_composite(fg, (x, y))

    return Response(content=_png(composed), media_type="image/png")


@app.post("/adjust")
@app.post("/api/adjust")
async def adjust(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    brightness: float = Form(1.0),
    contrast: float = Form(1.0),
):
    upload = image or file
    if upload is None:
        return Response(content=b"", status_code=400)
    img = _open(await upload.read())
    img = ImageEnhance.Brightness(img).enhance(brightness)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    return Response(content=_png(img), media_type="image/png")


def _cover(img: Image.Image, width: int, height: int) -> Image.Image:
    img = img.convert("RGBA")
    scale = max(width / max(img.width, 1), height / max(img.height, 1))
    resized = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - width) // 2)
    top = max(0, (resized.height - height) // 2)
    return resized.crop((left, top, left + width, top + height))
