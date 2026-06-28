#!/usr/bin/env python3
"""
Compose social media images for KickstarterCash 14-day plan.
- Takes existing Gemini backgrounds from assets/generated/
- Overlays original card images (pixel-perfect, unchanged)
- Adds KickstarterCash logo and German text
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

CARDS_DIR = '/home/user/Kickstartercash-App/assets/cards'
GEN_DIR = '/home/user/Kickstartercash-App/assets/generated'
OUT_DIR = '/home/user/Kickstartercash-App/assets/composed'
os.makedirs(OUT_DIR, exist_ok=True)

CARD_BIZ = Image.open(f'{CARDS_DIR}/card_1.jpg').convert('RGBA')
CARD_PRIV = Image.open(f'{CARDS_DIR}/card_2.jpg').convert('RGBA')
LOGO = Image.open(f'{CARDS_DIR}/logo_transparent.png').convert('RGBA')

def load_bg(filename, target_w, target_h):
    """Load and crop background to target size."""
    path = f'{GEN_DIR}/{filename}'
    if not os.path.exists(path):
        # Create solid dark background as fallback
        bg = Image.new('RGB', (target_w, target_h), (10, 10, 15))
        return bg
    img = Image.open(path).convert('RGB')
    # Crop to fill target dimensions
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))
    return img

def darken_bg(bg, factor=0.65):
    """Darken background for text readability."""
    enhancer = ImageEnhance.Brightness(bg)
    return enhancer.enhance(factor)

def add_gradient_overlay(bg):
    """Add dark gradient at top and bottom for text areas."""
    w, h = bg.size
    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    # Top gradient
    for i in range(h // 3):
        alpha = int(160 * (1 - i / (h / 3)))
        draw.rectangle([(0, i), (w, i+1)], fill=(5, 5, 10, alpha))
    # Bottom gradient
    for i in range(h // 3):
        alpha = int(180 * (i / (h / 3)))
        y = h - h // 3 + i
        draw.rectangle([(0, y), (w, y+1)], fill=(5, 5, 10, alpha))
    result = bg.convert('RGBA')
    result = Image.alpha_composite(result, overlay)
    return result.convert('RGB')

def place_card(canvas, card_img, x_frac, y_frac, width_frac, angle=0, shadow=True):
    """
    Place card on canvas.
    x_frac, y_frac = center position as fraction of canvas
    width_frac = card width as fraction of canvas width
    """
    cw, ch = canvas.size
    card_w = int(cw * width_frac)
    card_h = int(card_w * card_img.height / card_img.width)

    card = card_img.resize((card_w, card_h), Image.LANCZOS)

    if angle != 0:
        card = card.rotate(angle, expand=True, resample=Image.BICUBIC)

    paste_x = int(cw * x_frac - card.width // 2)
    paste_y = int(ch * y_frac - card.height // 2)

    if shadow:
        # Soft drop shadow
        shadow_img = Image.new('RGBA', (card.width + 40, card.height + 40), (0,0,0,0))
        shadow_body = Image.new('RGBA', (card.width, card.height), (0, 0, 0, 140))
        shadow_img.paste(shadow_body, (20, 20))
        shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(15))
        canvas.paste(shadow_img, (paste_x - 20, paste_y - 10), shadow_img)

    canvas.paste(card, (paste_x, paste_y), card)
    return canvas

def place_logo(canvas, scale=0.18, position='top-right', margin=30):
    """Place KickstarterCash logo on canvas."""
    cw, ch = canvas.size
    logo_w = int(cw * scale)
    logo_h = int(logo_w * LOGO.height / LOGO.width)
    logo = LOGO.resize((logo_w, logo_h), Image.LANCZOS)

    if position == 'top-right':
        x = cw - logo_w - margin
        y = margin
    elif position == 'top-left':
        x = margin
        y = margin
    elif position == 'top-center':
        x = (cw - logo_w) // 2
        y = margin

    canvas.paste(logo, (x, y), logo)
    return canvas

def get_font(size, bold=False):
    """Get font, fall back to default."""
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                pass
    return ImageFont.load_default()

def add_text(canvas, text, y_frac, color=(255, 215, 0), size=72, bold=True, shadow=True, center=True):
    """Add text to canvas."""
    draw = ImageDraw.Draw(canvas)
    cw, ch = canvas.size
    font = get_font(size, bold)

    # Word wrap
    words = text.split()
    lines = []
    current = ''
    for word in words:
        test = (current + ' ' + word).strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > cw * 0.9:
            if current:
                lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)

    line_h = size + 10
    total_h = len(lines) * line_h
    start_y = int(ch * y_frac) - total_h // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        x = (cw - text_w) // 2 if center else 40
        y = start_y + i * line_h

        if shadow:
            draw.text((x+3, y+3), line, font=font, fill=(0, 0, 0, 180))
        draw.text((x, y), line, font=font, fill=color)

def add_subtitle(canvas, text, y_frac, color=(200, 200, 200), size=38):
    """Add subtitle text."""
    add_text(canvas, text, y_frac, color=color, size=size, bold=False)

def add_url_badge(canvas, url='kickstartercash.club', margin=30):
    """Add URL badge at bottom."""
    cw, ch = canvas.size
    draw = ImageDraw.Draw(canvas)
    font = get_font(28, bold=True)
    bbox = draw.textbbox((0, 0), url, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad = 16
    x = (cw - tw) // 2
    y = ch - margin - th - pad * 2
    # Badge background
    draw.rounded_rectangle(
        [(x - pad, y - pad), (x + tw + pad, y + th + pad)],
        radius=20, fill=(20, 20, 25, 200)
    )
    draw.text((x, y), url, font=font, fill=(212, 175, 55))

def compose(bg_file, out_name, w, h, cards, title, subtitle=None,
            title_y=0.12, sub_y=0.20, logo_pos='top-center', logo_scale=0.25):
    """Main compose function."""
    bg = load_bg(bg_file, w, h)
    bg = darken_bg(bg, 0.6)
    bg = add_gradient_overlay(bg)
    canvas = bg.convert('RGBA')

    # Place cards
    for card_cfg in cards:
        card_img = CARD_BIZ if card_cfg.get('type') == 'biz' else CARD_PRIV
        canvas = place_card(
            canvas,
            card_img,
            card_cfg.get('x', 0.5),
            card_cfg.get('y', 0.6),
            card_cfg.get('w', 0.7),
            card_cfg.get('angle', 0)
        )

    canvas = canvas.convert('RGB')

    # Logo (top-right, small, doesn't overlap text)
    place_logo(canvas, scale=logo_scale, position=logo_pos, margin=30)

    # Text starts below logo area
    add_text(canvas, title, title_y, size=int(w * 0.060), color=(212, 175, 55))
    if subtitle:
        add_subtitle(canvas, subtitle, sub_y, size=int(w * 0.035))

    # URL badge
    add_url_badge(canvas)

    out = f'{OUT_DIR}/{out_name}'
    canvas.save(out, quality=95)
    print(f'✓ {out_name} ({w}x{h})')
    return out

# ── 14-DAY PLAN IMAGES ────────────────────────────────────────────

# TAG 1 – Instagram 4:5
compose('tag01.png', 'tag01_ig.jpg', 1080, 1350,
    cards=[{'type': 'biz', 'x': 0.5, 'y': 0.62, 'w': 0.75, 'angle': -5}],
    title='DEINE PREMIUM BLACK CARD',
    subtitle='Starte jetzt in deine finanzielle Freiheit · kickstartercash.club',
    title_y=0.24, sub_y=0.36)

# TAG 1 – Story 9:16
compose('tag01.png', 'tag01_story.jpg', 1080, 1920,
    cards=[{'type': 'biz', 'x': 0.5, 'y': 0.6, 'w': 0.82, 'angle': -4}],
    title='TAG 1: DEINE PREMIUM BLACK CARD',
    subtitle='Eigene IBAN · Multi-Währung · Sofort verfügbar',
    title_y=0.22, sub_y=0.32, logo_scale=0.18)

# TAG 1 – LinkedIn/Facebook 16:9
compose('tag01.png', 'tag01_fb.jpg', 1200, 630,
    cards=[{'type': 'biz', 'x': 0.72, 'y': 0.58, 'w': 0.5, 'angle': -3}],
    title='PREMIUM BLACK CARD',
    subtitle='Jetzt starten · kickstartercash.club',
    title_y=0.32, sub_y=0.50, logo_pos='top-left', logo_scale=0.16)

# TAG 2 – Eigene IBAN
compose('tag02.png', 'tag02_ig.jpg', 1080, 1350,
    cards=[{'type': 'priv', 'x': 0.5, 'y': 0.62, 'w': 0.72, 'angle': 4}],
    title='EIGENE IBAN AB TAG 1',
    subtitle='Sofort einsatzbereit · SEPA & SWIFT · Weltweit',
    title_y=0.24, sub_y=0.36)

compose('tag02.png', 'tag02_story.jpg', 1080, 1920,
    cards=[
        {'type': 'biz', 'x': 0.35, 'y': 0.58, 'w': 0.58, 'angle': -8},
        {'type': 'priv', 'x': 0.65, 'y': 0.65, 'w': 0.55, 'angle': 6}
    ],
    title='ZWEI KARTEN. EIN ZIEL.',
    subtitle='Business & Private Debit · kickstartercash.club',
    title_y=0.22, sub_y=0.32)

# TAG 3 – Multi-Währung
compose('tag03.png', 'tag03_ig.jpg', 1080, 1350,
    cards=[{'type': 'biz', 'x': 0.5, 'y': 0.63, 'w': 0.73, 'angle': -3}],
    title='EUR · CHF · USD · GBP',
    subtitle='Multi-Währungskonto · Weltweit bezahlen ohne Grenzen',
    title_y=0.24, sub_y=0.36)

# TAG 4 – SEPA & SWIFT
compose('tag04.png', 'tag04_ig.jpg', 1080, 1350,
    cards=[
        {'type': 'biz', 'x': 0.42, 'y': 0.6, 'w': 0.62, 'angle': -6},
        {'type': 'priv', 'x': 0.62, 'y': 0.68, 'w': 0.58, 'angle': 5}
    ],
    title='TRANSFERS BIS €50.000',
    subtitle='SEPA & SWIFT · International · Sicher',
    title_y=0.24, sub_y=0.36)

compose('tag04.png', 'tag04_fb.jpg', 1200, 630,
    cards=[
        {'type': 'biz', 'x': 0.65, 'y': 0.55, 'w': 0.4, 'angle': -5},
        {'type': 'priv', 'x': 0.80, 'y': 0.62, 'w': 0.38, 'angle': 5}
    ],
    title='SEPA & SWIFT BIS €50.000',
    subtitle='International. Sicher. Sofort.',
    title_y=0.32, sub_y=0.50, logo_pos='top-left', logo_scale=0.16)

# TAG 5 – Business Debit
compose('tag05.png', 'tag05_ig.jpg', 1080, 1350,
    cards=[{'type': 'biz', 'x': 0.5, 'y': 0.63, 'w': 0.76, 'angle': -4}],
    title='BUSINESS DEBIT KARTE',
    subtitle='Für Unternehmer & Selbstständige · Professionell von Tag 1',
    title_y=0.24, sub_y=0.36)

# TAG 6 – Preise & Membership
compose('tag06.png', 'tag06_ig.jpg', 1080, 1350,
    cards=[{'type': 'priv', 'x': 0.5, 'y': 0.63, 'w': 0.73, 'angle': 3}],
    title='AB €299 · DEINE KARTE',
    subtitle='Mit Membership €385 · Deluxe €460 · Jetzt sichern',
    title_y=0.24, sub_y=0.36)

# TAG 7 – Deluxe mit Cashback
compose('tag07.png', 'tag07_ig.jpg', 1080, 1350,
    cards=[
        {'type': 'biz', 'x': 0.4, 'y': 0.6, 'w': 0.65, 'angle': -7},
        {'type': 'priv', 'x': 0.62, 'y': 0.68, 'w': 0.60, 'angle': 6}
    ],
    title='DELUXE: CASHBACK INKLUSIVE',
    subtitle='Exchange · DEX · WEX · Cashback · Nur €460',
    title_y=0.24, sub_y=0.36)

compose('tag07.png', 'tag07_story.jpg', 1080, 1920,
    cards=[
        {'type': 'biz', 'x': 0.38, 'y': 0.58, 'w': 0.60, 'angle': -8},
        {'type': 'priv', 'x': 0.65, 'y': 0.66, 'w': 0.58, 'angle': 7}
    ],
    title='DEIN UPGRADE ZUR PREMIUM KARTE',
    subtitle='TAG 7: Entdecke die Deluxe Black Card',
    title_y=0.22, sub_y=0.32)

# TAG 8 – Sicherheit
compose('tag08.png', 'tag08_ig.jpg', 1080, 1350,
    cards=[{'type': 'biz', 'x': 0.5, 'y': 0.63, 'w': 0.74, 'angle': -2}],
    title='DEIN GELD. DEINE SICHERHEIT.',
    subtitle='Geprüfte Infrastruktur · Europäische Standards · 24/7',
    title_y=0.24, sub_y=0.36)

# TAG 9 – Lifestyle
compose('tag09.png', 'tag09_ig.jpg', 1080, 1350,
    cards=[{'type': 'priv', 'x': 0.5, 'y': 0.62, 'w': 0.73, 'angle': 3}],
    title='DEIN LEBEN. DEINE REGELN.',
    subtitle='Private Debit · Weltweit · Keine Kompromisse',
    title_y=0.24, sub_y=0.36)

compose('tag09.png', 'tag09_story.jpg', 1080, 1920,
    cards=[{'type': 'priv', 'x': 0.5, 'y': 0.62, 'w': 0.80, 'angle': 3}],
    title='DEIN LEBEN. DEINE REGELN.',
    subtitle='Private Debit · kickstartercash.club',
    title_y=0.22, sub_y=0.32)

# TAG 10 – Community
compose('tag10.png', 'tag10_ig.jpg', 1080, 1350,
    cards=[
        {'type': 'biz', 'x': 0.42, 'y': 0.62, 'w': 0.62, 'angle': -6},
        {'type': 'priv', 'x': 0.62, 'y': 0.68, 'w': 0.58, 'angle': 5}
    ],
    title='JOIN THE NETWORK',
    subtitle='KickstarterCash Community · Gemeinsam stark',
    title_y=0.24, sub_y=0.36)

# TAG 11 – FAQ & Support
compose('tag11.png', 'tag11_ig.jpg', 1080, 1350,
    cards=[{'type': 'biz', 'x': 0.5, 'y': 0.63, 'w': 0.74, 'angle': -3}],
    title='ALLE ANTWORTEN. SOFORT.',
    subtitle='FAQ & Support · portal.kickstartercash.club',
    title_y=0.24, sub_y=0.36)

# TAG 12 – Social Proof
compose('tag12.png', 'tag12_ig.jpg', 1080, 1350,
    cards=[{'type': 'priv', 'x': 0.5, 'y': 0.62, 'w': 0.73, 'angle': 4}],
    title='ECHTE ERGEBNISSE.',
    subtitle='Tausende zufriedene Mitglieder · Jetzt du',
    title_y=0.24, sub_y=0.36)

# TAG 13 – Countdown
compose('tag13.png', 'tag13_ig.jpg', 1080, 1350,
    cards=[
        {'type': 'biz', 'x': 0.4, 'y': 0.60, 'w': 0.62, 'angle': -7},
        {'type': 'priv', 'x': 0.63, 'y': 0.67, 'w': 0.58, 'angle': 6}
    ],
    title='NUR NOCH 2 TAGE!',
    subtitle='Sichere jetzt deine Premium Black Card · Limitiertes Angebot',
    title_y=0.24, sub_y=0.36)

compose('tag13.png', 'tag13_fb.jpg', 1200, 630,
    cards=[
        {'type': 'biz', 'x': 0.67, 'y': 0.55, 'w': 0.38, 'angle': -5},
        {'type': 'priv', 'x': 0.82, 'y': 0.62, 'w': 0.35, 'angle': 5}
    ],
    title='NUR NOCH 2 TAGE!',
    subtitle='Jetzt sichern · kickstartercash.club',
    title_y=0.30, sub_y=0.48, logo_pos='top-left', logo_scale=0.16)

# TAG 14 – Grand Finale
compose('tag14.png', 'tag14_ig.jpg', 1080, 1350,
    cards=[
        {'type': 'biz', 'x': 0.38, 'y': 0.60, 'w': 0.65, 'angle': -8},
        {'type': 'priv', 'x': 0.65, 'y': 0.67, 'w': 0.60, 'angle': 7}
    ],
    title='FINANZIELLE FREIHEIT BEGINNT HEUTE',
    subtitle='14 Tage · 2 Karten · Unendliche Möglichkeiten',
    title_y=0.23, sub_y=0.34)

compose('tag14.png', 'tag14_story.jpg', 1080, 1920,
    cards=[
        {'type': 'biz', 'x': 0.37, 'y': 0.57, 'w': 0.62, 'angle': -8},
        {'type': 'priv', 'x': 0.65, 'y': 0.65, 'w': 0.58, 'angle': 7}
    ],
    title='STARTE HEUTE IN DEIN PREMIUM LEBEN',
    subtitle='kickstartercash.club · Jetzt registrieren',
    title_y=0.22, sub_y=0.32)

compose('tag14.png', 'tag14_fb.jpg', 1200, 630,
    cards=[
        {'type': 'biz', 'x': 0.65, 'y': 0.55, 'w': 0.40, 'angle': -5},
        {'type': 'priv', 'x': 0.82, 'y': 0.62, 'w': 0.37, 'angle': 5}
    ],
    title='14 TAGE ZUR FINANZIELLEN FREIHEIT',
    subtitle='Jetzt starten · kickstartercash.club',
    title_y=0.30, sub_y=0.48, logo_pos='top-left', logo_scale=0.16)

print(f'\n✅ Alle Bilder erstellt in: {OUT_DIR}')
