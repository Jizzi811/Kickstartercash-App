# BrandMind UI Library (`frontend/src/components/bm.jsx`)

The single component library every page is built from. Goal of the Design
Sprint: every page looks like it was designed **on the same day by the same
designer** — same product, not just same theme. Style direction: Linear/Vercel
— more air, fewer borders, depth via elevation.

## The hard rule

> **After this sprint, no individual layouts or one-off CSS solutions may
> exist. Every page must be composed exclusively from the central design-system
> components.** New pages import from `@/components/bm` — they never define
> their own hero, card, button, badge, section header or empty state.

## Components

| Component | Purpose | Notes |
|---|---|---|
| `<Page>` | page wrapper | one vertical rhythm (`space-y-10 pb-12`) everywhere |
| `<Hero>` | page hero | Badge → H1 → description → chips · actions right; fixed padding + min-height on every page |
| `<Section>` / `<SectionHeader>` | content section | icon + gradient title + hairline + right slot |
| `<Card size="xs\|s\|m\|l">` | the only card | exactly four paddings (12/16/24/32); `tinted` for violet surfaces; no ad-hoc paddings |
| `<Metric>` / `<StatGrid>` | stat tiles | value + label (+ optional hint like "Keine aktiven Workflows.") |
| `<Btn variant="primary\|secondary\|ghost\|danger">` | the only button | three sizes sm/md/lg |
| `<BMBadge tone="violet\|neutral\|success\|danger">` | the only badge | one height, one radius |
| `<EmptyState>` | the only "no data" UI | icon + explanation + primary CTA (+ secondary CTA) |
| `GradientHeading`, `fadeUp`, `V`, `SORA` | shared primitives | gradient text, motion preset, brand tokens |

## Typography scale (`index.css`)

`.bm-h1` 56 · `.bm-h2` 40 · `.bm-h3` 28 · `.bm-h4` 22 · `.bm-body` 16 ·
`.bm-small` 14 — **no other heading/body sizes are allowed.** H1/H2 clamp down
responsively.

## Layout constants

- Content container: **`max-width: 1600px`** (`Layout.jsx`), identical on every page.
- Vertical rhythm: hero → stats → content always `2.5rem` apart (via `<Page>`).
- Sidebar: compact 12px items.

## Live data & empty states (combined sprint)

Three rules, enforced across the production UI:

1. **No fake data.** Removed: seeded demo assets + fabricated quality scores
   (Output Factory), fabricated departments/activity/insights/scores
   (BrandMind HQ), fake KPI fallbacks "17 / 2.4K / +38%" and the fabricated
   activity feed (Dashboard), hardcoded "17 agents" claims.
2. **Real data when it exists.** HQ now reads `/mission/overview`,
   `/intelligence/insights`, `/mission/plans` and `/brand-identity/{id}`;
   Output Factory reads only `/output-factory/assets`; Dashboard activity comes
   from `/mission/overview`. Loading shows `—`, never invented numbers; failed
   generation shows an error toast, never a fabricated result.
3. **Premium empty states.** `<EmptyState>` with icon, short explanation,
   primary CTA and optional secondary CTA (e.g. Output Factory → "Erste
   Kampagne starten"; HQ departments → "Erstes Ziel erstellen"; Skills →
   registry-unreachable / no-matches states). Stats with no data show `0` plus
   a hint ("Keine aktiven Workflows.").

Raw JSON is never shown to end users (skill schemas render as readable field
badges).

## Migration status

**On the kit:** BrandMind HQ, Output Factory, Skills Marketplace, Mission
Control, Intelligence, AI Gateway, Brand Identity, Memory, Dashboard
(demo-data fixes). Knowledge Explorer and Permissions already use live APIs and
inherit the global container/typography.

**Remaining checklist** (mechanical, same recipe: delete local helpers → import
from `bm.jsx`):
- [ ] Knowledge Explorer & Permissions → `<Hero>`/`<Card>`
- [ ] Legacy studios (Email/SEO/TikTok/LinkedIn/Finance/… via `StudioLayout`) →
      swap `StudioLayout` internals to kit components once
- [ ] Modals/forms → shared `<Modal>`/form fields (next iteration of the kit)
- [ ] Remove remaining duplicated CSS in `index.css` once all pages migrated

Migration recipe used (for reference): local `GradientHeading`/`SectionHeader`/
`Card`/`V`/`SORA`/`fadeUp` definitions were deleted and replaced by one import
from `@/components/bm`; `Card` has a migration escape hatch (explicit `p-*`
overrides `size`) that will be removed when the checklist is done.
