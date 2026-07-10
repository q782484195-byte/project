"""Generate app launch icons for 项目管理系统."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "src" / "unpackage" / "res" / "icons"
STATIC = ROOT / "src" / "static" / "icons"
RES.mkdir(parents=True, exist_ok=True)
STATIC.mkdir(parents=True, exist_ok=True)

# Brand
BLUE_TOP = (59, 130, 246, 255)      # #3B82F6
BLUE_BOT = (29, 78, 216, 255)       # #1D4ED8
BLUE_MID = (37, 99, 235, 255)       # #2563EB
WHITE = (255, 255, 255, 255)
SOFT = (219, 234, 254, 255)         # #DBEAFE


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def gradient_bg(size):
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        # slight diagonal feel
        color = lerp(BLUE_TOP, BLUE_BOT, t)
        for x in range(size):
            # subtle left-right warmth
            tx = x / max(size - 1, 1)
            c = lerp(color, lerp(BLUE_MID, BLUE_BOT, t), tx * 0.15)
            px[x, y] = c
    return img


def draw_check(draw, box, bx0, by0, color, stroke):
    """Thick check mark that stays readable when downscaled."""
    p1 = (bx0 + int(box * 0.18), by0 + int(box * 0.50))
    p2 = (bx0 + int(box * 0.40), by0 + int(box * 0.72))
    p3 = (bx0 + int(box * 0.82), by0 + int(box * 0.26))
    # draw twice slightly offset for weight
    draw.line([p1, p2, p3], fill=color, width=stroke)
    draw.line(
        [
            (p1[0], p1[1] - 1),
            (p2[0], p2[1] - 1),
            (p3[0], p3[1] - 1),
        ],
        fill=color,
        width=max(1, stroke - 1),
    )


def draw_mark(draw, size):
    """Stylized task board + check — readable at small sizes."""
    s = size
    pad = int(s * 0.20)
    card = [pad, int(s * 0.18), s - pad, int(s * 0.82)]
    radius = max(10, int(s * 0.09))
    draw.rounded_rectangle(card, radius=radius, fill=WHITE)

    left = pad + int(s * 0.11)
    right = s - pad - int(s * 0.11)
    row_h = max(4, int(s * 0.065))
    gap = int(s * 0.09)
    start_y = int(s * 0.32)
    box = max(10, int(s * 0.095))
    stroke = max(3, int(s * 0.028))
    outline_w = max(3, int(s * 0.022))

    for i in range(3):
        y = start_y + i * (row_h + gap)
        bx0 = left
        by0 = y + row_h // 2 - box // 2

        if i == 0:
            # filled checkbox + white check
            draw.rounded_rectangle(
                [bx0, by0, bx0 + box, by0 + box],
                radius=max(3, int(s * 0.016)),
                fill=BLUE_MID,
            )
            draw_check(draw, box, bx0, by0, WHITE, max(3, int(s * 0.03)))
            bar_color = BLUE_MID
        else:
            draw.rounded_rectangle(
                [bx0, by0, bx0 + box, by0 + box],
                radius=max(3, int(s * 0.016)),
                outline=BLUE_MID,
                width=outline_w,
            )
            bar_color = BLUE_MID if i == 1 else (147, 197, 253, 255)

        bar_left = bx0 + box + int(s * 0.05)
        bar_right = right if i < 2 else int(left + (right - left) * 0.58)
        draw.rounded_rectangle(
            [bar_left, y, bar_right, y + row_h],
            radius=max(3, int(s * 0.014)),
            fill=bar_color,
        )


def make_icon(size, radius_ratio=0.22):
    bg = gradient_bg(size)
    # draw mark on transparent then composite
    mark = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark), size)
    composed = Image.alpha_composite(bg, mark)
    # apply rounded corners for preview / Android adaptive-ish
    radius = int(size * radius_ratio)
    mask = rounded_mask(size, radius)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(composed, (0, 0), mask=mask)
    return out


def make_full_bleed(size):
    """iOS App Store / Android: full square, OS applies mask."""
    bg = gradient_bg(size)
    mark = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark), size)
    return Image.alpha_composite(bg, mark)


SIZES = [
    20, 29, 40, 58, 60, 72, 76, 80, 87, 96, 120, 144, 152, 167, 180, 192, 1024
]

master = make_full_bleed(1024)
for size in SIZES:
    img = master.resize((size, size), Image.Resampling.LANCZOS)
    path = RES / f"{size}x{size}.png"
    img.save(path, "PNG")
    print("wrote", path)

# Login / in-app logo: rounded
logo = make_icon(192, radius_ratio=0.22)
logo.save(STATIC / "logo.png", "PNG")
print("wrote", STATIC / "logo.png")

# Design preview (rounded, for design folder)
preview = make_icon(512, radius_ratio=0.22)
preview_path = ROOT / "design" / "assets" / "app-icon.png"
preview_path.parent.mkdir(parents=True, exist_ok=True)
preview.save(preview_path, "PNG")
print("wrote", preview_path)

print("done")
