# BrandMind Design System 2.0

BrandMind Design System 2.0 unifies the application around one premium dark visual language: violet as the single brand color, cyan as a sparse status/focus accent, Sora typography, 8px spacing, shared components, and consistent motion.

## Audit Summary

The app previously mixed one-off Tailwind classes, legacy KickstarterCash naming, inconsistent radii, page-specific cards, mixed button treatments, and technical JSON-first views. The new system establishes global tokens in `frontend/src/index.css`, updates core UI primitives, adds a consistent authenticated top context bar, and documents the component rules for future work.

## Principles

- Minimal over decorative.
- Dark premium canvas with intentional whitespace.
- Violet is the brand anchor.
- Cyan is sparse and functional.
- Glass/frosted surfaces are subtle.
- Business views first; developer detail behind toggles.
- One icon family: Lucide.
- One font: Sora.

## Implemented Foundation

- Global design tokens: colors, radius, spacing, typography, focus, shadow, and motion.
- Tailwind theme alignment with BrandMind semantic tokens.
- Button primitive variants for primary, secondary, ghost, outline, danger, icon, loading, and disabled states.
- Card primitive variants for default, hover, interactive, selected, danger, and dashboard surfaces.
- Top-right orientation model across authenticated views: user, workspace, active brand, active model, notifications.
- Knowledge Explorer presents business cards by default and keeps raw JSON behind Developer Mode.

## Validation Checklist

- Frontend build must pass.
- Backend checks must pass.
- No new product functionality should be introduced by visual changes.
- Future modules must use the tokens and component guide before adding bespoke classes.
