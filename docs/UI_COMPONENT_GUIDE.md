# BrandMind UI Component Guide

## Card

Use `Card` from `frontend/src/components/ui/card.jsx` or the `.bm-card` utility. Variants are:

- `default`
- `hover`
- `interactive`
- `selected`
- `danger`
- `dashboard`

Cards use the shared 24px radius, dark translucent surface, subtle border, and a consistent premium shadow.

## Button

Use `Button` from `frontend/src/components/ui/button.jsx`. Supported variants:

- `default` / primary violet
- `secondary`
- `ghost`
- `outline`
- `destructive`
- `icon`
- `loading`
- disabled via native `disabled`

All buttons use Sora, 12px radius, visible focus rings, and the same icon sizing.

## Inputs

Use `.bm-input` or the existing input primitives. Text input, textarea, search, dropdown, checkbox, radio, switch, and file-upload controls should use dark surfaces, white text, muted placeholders, violet/cyan focus, and the 12px input radius.

## Tables

Use the table primitive in `frontend/src/components/ui/table.jsx`. Tables should be wrapped in a rounded bordered surface, use muted headers, 16px horizontal spacing, and hover rows.

## Icons

Use Lucide icons only. Sizes:

- 13px metadata/context
- 15–16px nav and compact controls
- 20px product identity
- 24px empty-state illustration

## Top Context Bar

Every authenticated view shares the same top-right context structure:

1. User
2. Workspace
3. Active Brand
4. Active Model
5. Notifications

This keeps orientation stable across Mission Control, Brand HQ, Knowledge Explorer, Studio pages, Settings, Analytics, Marketplace, agent pages, skill pages, Approval Center, Output Factory, Search, Profile, and future modules.
