from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "src" / "static"
TAB = ROOT / "tab"
ICONS = ROOT / "icons"
ILLUS = ROOT / "illustrations"
for p in (TAB, ICONS, ILLUS):
    p.mkdir(parents=True, exist_ok=True)

MUTED = (148, 163, 184, 255)
ACTIVE = (37, 99, 235, 255)
WHITE = (255, 255, 255, 255)
SOFT = (219, 234, 254, 255)
WARN = (234, 88, 12, 255)
OK = (22, 163, 74, 255)
SLATE = (71, 85, 105, 255)
PAGE = (241, 245, 249, 255)


def new(size, bg=(0, 0, 0, 0)):
    return Image.new("RGBA", (size, size), bg)


def save(img, path):
    img.save(path, "PNG")
    print("wrote", path)


def draw_home(draw, color, s=81):
    m = s * 0.18
    draw.line([(m, s * 0.48), (s / 2, m), (s - m, s * 0.48)], fill=color, width=5)
    draw.rounded_rectangle([m + 4, s * 0.45, s - m - 4, s - m], radius=4, outline=color, width=5)
    dw = s * 0.18
    draw.rectangle([s / 2 - dw / 2, s * 0.62, s / 2 + dw / 2, s - m], outline=color, width=4)


def draw_task(draw, color, s=81):
    m = s * 0.2
    draw.rounded_rectangle([m, m * 0.9, s - m, s - m * 0.9], radius=8, outline=color, width=5)
    for i, y in enumerate([0.38, 0.52, 0.66]):
        x1 = m + 12
        x2 = s - m - (18 if i == 2 else 12)
        draw.line([(x1, s * y), (x2, s * y)], fill=color, width=4)


def draw_message(draw, color, s=81):
    m = s * 0.18
    draw.rounded_rectangle([m, m * 1.1, s - m, s * 0.72], radius=10, outline=color, width=5)
    draw.line([(m + 8, s * 0.68), (m + 8, s - m), (m + 28, s * 0.68)], fill=color, width=4)


def draw_me(draw, color, s=81):
    draw.ellipse([s * 0.32, s * 0.18, s * 0.68, s * 0.52], outline=color, width=5)
    draw.arc([s * 0.18, s * 0.48, s * 0.82, s * 1.05], start=200, end=340, fill=color, width=5)


for name, fn in [("home", draw_home), ("task", draw_task), ("message", draw_message), ("me", draw_me)]:
    for active, color in [(False, MUTED), (True, ACTIVE)]:
        img = new(81)
        fn(ImageDraw.Draw(img), color, 81)
        suffix = "-active" if active else ""
        save(img, TAB / f"{name}{suffix}.png")


def icon_bg(color_bg, draw_fn, color_fg, name):
    img = new(96)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, 95, 95], radius=22, fill=color_bg)
    glyph = new(96)
    draw_fn(ImageDraw.Draw(glyph), color_fg, 96)
    img = Image.alpha_composite(img, glyph)
    save(img, ICONS / f"{name}.png")


def draw_report(draw, color, s=96):
    m = 22
    draw.rounded_rectangle([m, m - 4, s - m, s - m + 4], radius=8, outline=color, width=5)
    draw.line([(m + 14, m + 18), (s - m - 14, m + 18)], fill=color, width=4)
    draw.line([(m + 14, m + 34), (s - m - 14, m + 34)], fill=color, width=4)
    draw.line([(m + 14, m + 50), (s - m - 28, m + 50)], fill=color, width=4)


def draw_bug(draw, color, s=96):
    draw.ellipse([32, 28, 64, 70], outline=color, width=5)
    draw.line([(48, 20), (48, 28)], fill=color, width=4)
    draw.arc([36, 14, 60, 30], 200, 340, fill=color, width=4)
    for x1, x2, y in [(28, 34, 40), (62, 68, 40), (28, 34, 55), (62, 68, 55)]:
        draw.line([(x1, y), (x2, y)], fill=color, width=4)


def draw_daily(draw, color, s=96):
    draw.rounded_rectangle([24, 22, 72, 74], radius=6, outline=color, width=5)
    draw.line([(36, 18), (36, 28)], fill=color, width=4)
    draw.line([(60, 18), (60, 28)], fill=color, width=4)
    draw.line([(32, 38), (64, 38)], fill=color, width=4)
    draw.rectangle([34, 46, 46, 58], outline=color, width=3)


def draw_scan(draw, color, s=96):
    for x, y, dx, dy in [(24, 24, 1, 1), (72, 24, -1, 1), (24, 72, 1, -1), (72, 72, -1, -1)]:
        draw.line([(x, y), (x + dx * 16, y)], fill=color, width=5)
        draw.line([(x, y), (x, y + dy * 16)], fill=color, width=5)
    draw.line([(30, 48), (66, 48)], fill=color, width=4)


def draw_bell(draw, color, s=96):
    draw.arc([30, 26, 66, 62], 200, 340, fill=color, width=5)
    draw.line([(30, 52), (30, 62), (66, 62), (66, 52)], fill=color, width=5)
    draw.arc([42, 62, 54, 74], 0, 180, fill=color, width=4)


def draw_attach(draw, color, s=96):
    draw.rounded_rectangle([34, 24, 62, 72], radius=10, outline=color, width=5)
    draw.line([(48, 36), (48, 60)], fill=color, width=4)


def draw_search(draw, color, s=96):
    draw.ellipse([28, 28, 58, 58], outline=color, width=5)
    draw.line([(56, 56), (70, 70)], fill=color, width=5)


def draw_plus(draw, color, s=96):
    draw.line([(48, 28), (48, 68)], fill=color, width=6)
    draw.line([(28, 48), (68, 48)], fill=color, width=6)


def draw_empty(draw, color, s=96):
    draw.rounded_rectangle([22, 28, 74, 70], radius=8, outline=color, width=4)
    draw.line([(34, 44), (62, 44)], fill=color, width=3)
    draw.line([(34, 54), (54, 54)], fill=color, width=3)


icon_bg(SOFT, draw_report, ACTIVE, "report")
icon_bg((255, 237, 213, 255), draw_bug, WARN, "bug")
icon_bg((220, 252, 231, 255), draw_daily, OK, "daily")
icon_bg(PAGE, draw_scan, SLATE, "scan")
icon_bg(SOFT, draw_bell, ACTIVE, "bell")
icon_bg(PAGE, draw_attach, SLATE, "attach")
icon_bg(PAGE, draw_search, MUTED, "search")
icon_bg(ACTIVE, draw_plus, WHITE, "plus")
icon_bg(PAGE, draw_empty, MUTED, "empty")

brand = new(192)
bd = ImageDraw.Draw(brand)
bd.rounded_rectangle([0, 0, 191, 191], radius=40, fill=ACTIVE)
bd.rounded_rectangle([48, 52, 72, 140], radius=6, fill=WHITE)
bd.rounded_rectangle([84, 52, 108, 140], radius=6, fill=WHITE)
bd.polygon([(108, 52), (148, 52), (148, 76), (128, 76), (148, 140), (120, 140), (108, 100)], fill=WHITE)
save(brand, ICONS / "logo.png")

empty = new(240, PAGE)
ed = ImageDraw.Draw(empty)
ed.rounded_rectangle([40, 50, 200, 190], radius=20, fill=WHITE, outline=MUTED, width=3)
ed.ellipse([90, 80, 150, 140], outline=ACTIVE, width=4)
ed.line([(110, 160), (170, 160)], fill=MUTED, width=4)
ed.line([(110, 175), (150, 175)], fill=MUTED, width=4)
save(empty, ILLUS / "empty-task.png")

for name, bg, fg in [
    ("msg-assign", SOFT, ACTIVE),
    ("msg-due", (255, 237, 213, 255), WARN),
    ("msg-mention", SOFT, ACTIVE),
    ("msg-report", (220, 252, 231, 255), OK),
    ("msg-status", PAGE, SLATE),
]:
    img = new(72)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, 71, 71], radius=16, fill=bg)
    if name == "msg-assign":
        d.ellipse([22, 16, 50, 44], outline=fg, width=3)
        d.arc([14, 40, 58, 70], 200, 340, fill=fg, width=3)
    elif name == "msg-due":
        d.ellipse([16, 16, 56, 56], outline=fg, width=3)
        d.line([(36, 24), (36, 38)], fill=fg, width=3)
        d.line([(36, 38), (46, 46)], fill=fg, width=3)
    elif name == "msg-mention":
        d.ellipse([18, 18, 54, 54], outline=fg, width=3)
        d.ellipse([30, 30, 42, 42], fill=fg)
    elif name == "msg-report":
        d.rounded_rectangle([22, 18, 50, 54], radius=4, outline=fg, width=3)
        d.line([(28, 30), (44, 30)], fill=fg, width=3)
        d.line([(28, 38), (44, 38)], fill=fg, width=3)
    else:
        d.rounded_rectangle([20, 22, 52, 50], radius=4, outline=fg, width=3)
        d.line([(28, 34), (44, 34)], fill=fg, width=3)
    save(img, ICONS / f"{name}.png")

print("done")
