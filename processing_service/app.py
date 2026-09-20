from io import BytesIO

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import Response
from PIL import Image, ImageFilter, ImageEnhance

app = FastAPI(title="Image Process Service")

try:
    from rembg import remove as rembg_remove
except Exception:
    rembg_remove = None


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
    bbox = image.getbbox()
    if not bbox:
        return image
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(image.width, r + pad)
    b = min(image.height, b + pad)
    return image.crop((l, t, r, b))


@app.get("/health")
def health():
    return {"ok": True, "rembg": rembg_remove is not None}


@app.post("/remove")
async def remove_bg(image: UploadFile = File(...)):
    raw = await image.read()
    if rembg_remove is not None:
        cutout = rembg_remove(raw)
        img = _open(cutout)
    else:
        img = _studio_knockout(_open(raw))
    img = _autocrop(img)
    return Response(content=_png(img), media_type="image/png")


@app.post("/fit-background")
async def fit_background(
    image: UploadFile = File(...),
    width: int = Form(1200),
    height: int = Form(1600),
):
    img = _cover(_open(await image.read()), width, height)
    return Response(content=_png(img), media_type="image/png")


@app.post("/composite")
async def composite(
    cutout: UploadFile = File(...),
    background: UploadFile = File(...),
    width: int = Form(1200),
    height: int = Form(1600),
):
    bg = _cover(_open(await background.read()), width, height)
    fg = _autocrop(_open(await cutout.read()))
    fg.thumbnail((int(width * 0.78), int(height * 0.86)), Image.Resampling.LANCZOS)
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    shade = Image.new("RGBA", (fg.width, 18), (0, 0, 0, 50))
    shade = shade.filter(ImageFilter.GaussianBlur(8))
    x = (width - fg.width) // 2
    y = height - fg.height - int(height * 0.06)
    shadow.paste(shade, (x, y + fg.height - 10), shade)
    composed = Image.alpha_composite(bg, shadow)
    composed.alpha_composite(fg, (x, y))
    return Response(content=_png(composed), media_type="image/png")


@app.post("/adjust")
async def adjust(
    image: UploadFile = File(...),
    brightness: float = Form(1.0),
    contrast: float = Form(1.0),
):
    img = _open(await image.read())
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
