from io import BytesIO

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import Response
import os
import numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter, ImageEnhance

app = FastAPI(title="Image Process Service")

try:
    from rembg import remove as rembg_remove, new_session
    _session = new_session(os.getenv("REMBG_MODEL", "isnet-general-use"))
except Exception as e:
    print("rembg failed to load:", e)
    rembg_remove = None
    _session = None


def _open(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data)).convert("RGBA")


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

    a = np.clip((a - 0.2) / 0.6, 0, 1)
    a = a * a * (3 - 2 * a)

    solid = a > 0.5
    labels, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, labels, range(1, n + 1))
        keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * 0.1]
        solid = np.isin(labels, keep_ids)
        solid = ndimage.binary_fill_holes(solid)

    inner = ndimage.binary_erosion(solid, iterations=2)
    outer = ndimage.binary_dilation(solid, iterations=1)
    a[inner] = 1.0
    a[~outer] = 0.0

    out = Image.fromarray((a * 255).astype("uint8"), "L")
    return out.filter(ImageFilter.GaussianBlur(0.5))

@app.get("/health")
def health():
    return {"ok": True, "rembg": rembg_remove is not None}
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

    if rembg_remove is None:
        return Response(content=b"rembg not available", status_code=503)

    mask_bytes = rembg_remove(raw, session=_session, only_mask=True)
    mask = Image.open(BytesIO(mask_bytes)).convert("L")

    orig = _open(raw)
    if mask.size != orig.size:
        mask = mask.resize(orig.size, Image.Resampling.LANCZOS)
    orig.putalpha(_clean_alpha(mask))

    return Response(content=_png(_autocrop(orig)), media_type="image/png")
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
    fg = _autocrop(_open(await cutout.read()))
    scale = min(width * 0.80 / fg.width, height * 0.72 / fg.height)
    fg = fg.resize(
        (max(1, int(fg.width * scale)), max(1, int(fg.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (width - fg.width) // 2
    y = int((height - fg.height) * 0.45)
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
