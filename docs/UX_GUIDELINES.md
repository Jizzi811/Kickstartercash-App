# BrandMind UX Guidelines

## Product Feeling

BrandMind should feel like entering a premium AI company: minimal, elegant, deeply organized, and calm. Avoid visual noise and avoid copying chat-first AI products.

## Page Structure

Every page should follow this hierarchy:

1. Hero or page header with one clear outcome.
2. Context/status cards.
3. Primary work area.
4. Empty/loading/error states in-place.

Use generous whitespace and do not compress dense enterprise data unless the user explicitly opens developer/detail modes.

## Empty States

Every module empty state must include:

- A simple icon/illustration.
- A short business-oriented description.
- One CTA.

## Loading States

Use shimmer skeletons for cards, tables, and charts. Avoid spinners for large content areas unless the surface is tiny.

## Accessibility

- Keep visible focus rings on all interactive controls.
- Use semantic buttons/links for keyboard navigation.
- Maintain contrast on dark surfaces.
- Add ARIA labels for icon-only controls.
- Avoid color-only status communication; pair color with text or icon.

## Developer Mode

Business users should see business cards and summaries. Raw JSON, IDs, API routes, and object internals belong behind Developer Mode toggles.
