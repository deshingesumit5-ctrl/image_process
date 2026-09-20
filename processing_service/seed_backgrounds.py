"""Create studio background PNGs for local seed data."""
import os
import sys
from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)

SPECS = [
    ("white-vertical.png", (1200, 1600), (255, 255, 255), None),
    ("studio-vertical.png", (1200, 1600), (248, 248, 252), (226, 232, 240)),
    ("wood-vertical.png", (1200, 1600), (193, 154, 107), (139, 90, 43)),
    ("gradient-vertical.png", (1200, 1600), (238, 242, 255), (79, 70, 229)),
    ("wall-vertical.png", (1200, 1600), (241, 245, 249), (203, 213, 225)),
    ("white-horizontal.png", (1600, 1200), (255, 255, 255), None),
    ("studio-horizontal.png", (1600, 1200), (248, 248, 252), (226, 232, 240)),
]


def paint(size, top, bottom):
    img = Image.new("RGB", size, top)
    if bottom:
        draw = ImageDraw.Draw(img)
        w, h = size
        for y in range(h):
            t = y / max(h - 1, 1)
            color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
            draw.line([(0, y), (w, y)], fill=color)
    return img


for name, size, top, bottom in SPECS:
    paint(size, top, bottom).save(os.path.join(OUT, name), "PNG")
    print(name)
