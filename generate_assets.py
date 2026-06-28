"""
Generates Play Store assets + APK mipmap icons for Panchangam.

Outputs
-------
store-assets/
  icon-512.png          Play Store high-res icon
  feature-graphic.png   1024x500 banner
  icon-playstore.png    alias of icon-512

panchangam-app/src/main/res/
  mipmap-*/  ic_launcher.png + ic_launcher_round.png (48–192px)
"""

from PIL import Image, ImageDraw, ImageFont
import math, os

# ── Palette ───────────────────────────────────────────────────────────────────
SAFFRON      = (230,  92,   0)  # deep saffron
SAFFRON_DARK = (180,  60,   0)
GOLD         = (245, 200,  66)
WHITE        = (255, 255, 255)
CREAM        = (255, 248, 231)
DARK_TEXT    = ( 45,  20,   0)
TEXT_MUTE    = (180, 120,  80)

FONT_BOLD = "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf"
FONT_REG  = "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf"
FONT_MED  = "/usr/share/fonts/truetype/ubuntu/Ubuntu-M.ttf"

BASE  = os.path.dirname(os.path.abspath(__file__))
RES   = os.path.join(BASE, "panchangam-app", "src", "main", "res")
STORE = os.path.join(BASE, "store-assets")


# ── Helpers ───────────────────────────────────────────────────────────────────

def grad_v(draw, w, h, top, bot):
    for y in range(h):
        t = y / h
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def circle_mask(size):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size, size], fill=255)
    return m


def rounded_mask(size, frac=0.22):
    m = Image.new("L", (size, size), 0)
    r = int(size * frac)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size, size], radius=r, fill=255)
    return m


# ── Sun + moon icon drawing ───────────────────────────────────────────────────

def draw_sun_rays(draw, cx, cy, outer_r, inner_r, n_rays, color, width):
    """Draw n_rays triangular rays around (cx, cy)."""
    for i in range(n_rays):
        angle = math.radians(i * 360 / n_rays - 90)
        side  = math.radians(360 / n_rays * 0.35)
        # tip
        tx = cx + outer_r * math.cos(angle)
        ty = cy + outer_r * math.sin(angle)
        # left base
        lx = cx + inner_r * math.cos(angle - side)
        ly = cy + inner_r * math.sin(angle - side)
        # right base
        rx = cx + inner_r * math.cos(angle + side)
        ry = cy + inner_r * math.sin(angle + side)
        draw.polygon([(tx, ty), (lx, ly), (rx, ry)], fill=color)


def make_icon_square(size):
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Gradient background (will be masked)
    grad_v(draw, size, size, SAFFRON, SAFFRON_DARK)

    cx, cy = size / 2, size * 0.46
    disc_r  = size * 0.21
    outer_r = size * 0.40
    inner_r = size * 0.26

    # 8 gold rays
    draw_sun_rays(draw, cx, cy, outer_r, inner_r, 8, GOLD, max(2, int(size*0.03)))

    # White sun disc
    draw.ellipse([cx - disc_r, cy - disc_r, cx + disc_r, cy + disc_r], fill=WHITE)

    # Gold crescent overlapping right
    cr   = disc_r * 0.88
    offx = disc_r * 0.38
    draw.ellipse([cx + offx - cr, cy - cr, cx + offx + cr, cy + cr], fill=GOLD)
    draw.ellipse([cx + offx - cr + cr*0.25, cy - cr,
                  cx + offx + cr + cr*0.25, cy + cr], fill=SAFFRON_DARK)

    # Three dots at bottom
    dot_r  = size * 0.035
    dot_y  = size * 0.76
    for dx in [-size*0.14, 0, size*0.14]:
        dc = (WHITE if dx != 0 else GOLD)
        draw.ellipse([cx + dx - dot_r, dot_y - dot_r,
                      cx + dx + dot_r, dot_y + dot_r], fill=dc)
    return img


def make_icon_png(size, shape="square"):
    raw  = make_icon_square(size)
    mask = circle_mask(size) if shape == "circle" else rounded_mask(size)
    out  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(raw, mask=mask)
    return out


# ── Feature graphic ───────────────────────────────────────────────────────────

def make_feature_graphic():
    W, H = 1024, 500
    img  = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    grad_v(draw, W, H, (220, 80, 0), (140, 40, 0))

    # Subtle dot grid
    for gy in range(0, H, 28):
        for gx in range(0, W, 28):
            draw.ellipse([gx, gy, gx+2, gy+2], fill=(255, 255, 255, 12))

    # Left icon card
    card_size = 240
    icon_cx, icon_cy = 220, H // 2
    ch = card_size // 2

    # Glow
    for ro in range(140, 60, -12):
        alpha = int(15 * (1 - ro / 140))
        draw.ellipse([icon_cx - ro, icon_cy - ro, icon_cx + ro, icon_cy + ro],
                     fill=(*GOLD, alpha))

    # Card
    draw.rounded_rectangle([icon_cx - ch, icon_cy - ch, icon_cx + ch, icon_cy + ch],
                            radius=int(card_size*0.18), fill=SAFFRON_DARK)

    # Icon contents on card (re-draw at card scale)
    inner = make_icon_square(card_size)
    # Paste icon drawing onto feature graphic (convert RGBA -> paste with mask)
    inner_rgb = Image.new("RGB", (card_size, card_size))
    inner_rgb.paste(inner, mask=inner.split()[3])
    img.paste(inner_rgb, (icon_cx - ch, icon_cy - ch))

    # Right text
    tx = 490
    try:
        f_title = ImageFont.truetype(FONT_BOLD, 70)
        f_sub   = ImageFont.truetype(FONT_MED,  30)
        f_body  = ImageFont.truetype(FONT_REG,  24)
        f_badge = ImageFont.truetype(FONT_MED,  18)
    except Exception:
        f_title = f_sub = f_body = f_badge = ImageFont.load_default()

    draw.text((tx, 90),  "Panchangam",           font=f_title, fill=WHITE)
    draw.text((tx, 178), "पंचांग · Daily Almanac", font=f_sub,   fill=(*GOLD, 230))
    draw.line([(tx, 222), (tx + 430, 222)],       fill=GOLD, width=2)

    bullets = [
        (WHITE, "Tithi · Nakshatra · Yoga · Karana"),
        (GOLD,  "Sunrise, Sunset & Rahu Kalam"),
        (WHITE, "Monthly calendar with tithis"),
        (GOLD,  "Festival list · 100% Offline"),
    ]
    by = 238
    for clr, txt in bullets:
        draw.text((tx + 16, by), "•  " + txt, font=f_body, fill=clr)
        by += 42

    draw.rounded_rectangle([tx, 458, tx + 240, 484], radius=12, fill=(0, 0, 0, 70))
    draw.text((tx + 14, 462), "Free  ·  No ads  ·  No internet", font=f_badge, fill=TEXT_MUTE)

    return img


# ── Save helper ───────────────────────────────────────────────────────────────

def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    kb = os.path.getsize(path) // 1024
    print(f"  ✓  {os.path.relpath(path, BASE)}  ({kb} KB)")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n── Play Store assets ─────────────────────────────────────────────────")
    icon512 = make_icon_png(512, shape="square")
    flat    = Image.new("RGB", (512, 512), SAFFRON_DARK)
    flat.paste(icon512, mask=icon512.split()[3])
    save(flat, os.path.join(STORE, "icon-512.png"))
    save(flat, os.path.join(STORE, "icon-playstore.png"))
    save(icon512, os.path.join(STORE, "icon-512-transparent.png"))
    save(make_feature_graphic(), os.path.join(STORE, "feature-graphic.png"))

    print("\n── APK mipmap icons ──────────────────────────────────────────────────")
    SIZES = {
        "mipmap-mdpi":    48,
        "mipmap-hdpi":    72,
        "mipmap-xhdpi":   96,
        "mipmap-xxhdpi":  144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, px in SIZES.items():
        save(make_icon_png(px, "square"),
             os.path.join(RES, folder, "ic_launcher.png"))
        save(make_icon_png(px, "circle"),
             os.path.join(RES, folder, "ic_launcher_round.png"))

    print("\nDone!\n")
    print("Upload checklist:")
    print("  store-assets/icon-512.png        → App icon (512×512)")
    print("  store-assets/feature-graphic.png → Feature graphic (1024×500)")
    print("  Take 2–8 screenshots from device/emulator")
