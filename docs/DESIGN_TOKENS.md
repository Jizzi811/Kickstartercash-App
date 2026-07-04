# BrandMind Design Tokens 2.0

BrandMind uses one premium, dark, violet-led visual language inspired by Apple, Linear, Vercel, and Arc Browser.

## Typography

- Font family: `Sora` only.
- H1: `text-4xl md:text-5xl`, bold, tight tracking.
- H2: `text-2xl md:text-3xl`, semibold.
- H3: `text-xl`, semibold.
- H4/body controls: `text-base`, semibold where actionable.
- Body: `text-sm` / `text-base`, relaxed line height.
- Caption/small: `text-xs` / `text-[11px]`, uppercase tracking only for metadata.

## Color Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bm-primary` | `#7c3aed` | Primary action and brand anchor |
| `--bm-secondary` | `#a78bfa` | Secondary violet text and subtle highlights |
| `--bm-accent` | `#22d3ee` | Sparse cyan focus/status highlight |
| `--bm-gradient-purple` | Violet gradient | Hero text, premium CTAs |
| `--bm-success` | `#34d399` | Success |
| `--bm-warning` | `#f59e0b` | Warning only |
| `--bm-error` | `#f43f5e` | Destructive states |
| `--bm-info` | `#38bdf8` | Info |
| `--bm-bg` | `#05040a` | App background |
| `--bm-surface` | `#0f0d18` | Cards and panels |
| `--bm-border` | `rgba(255,255,255,.10)` | Standard borders |
| `--bm-focus` | `#22d3ee` | Keyboard focus |

Legacy KickstarterCash gold is removed from the active theme. Compatibility aliases now resolve to violet only where old code still references them.

## Spacing

The system is based on an 8px rhythm: `--bm-space-2` is 8px, then 16, 24, 32, 40, and 48px for sections and page spacing.

## Radius

- Small: `8px`
- Medium: `12px`
- Large: `16px`
- XL/card: `24px`
- Full: pills and avatars only

## Motion

- Fade-up: page and card entry.
- Slide-in: panels and contextual surfaces.
- Shimmer: skeleton loading.
- Hover: slight elevation, not large movement.
