# BrandMind Design Foundation — Sprint 4 / Aufgabe 2

## Offizieller Status

`frontend/src/design-system.js`, `frontend/src/design-tokens.js`, `frontend/src/index.css` und `frontend/src/components/bm.jsx` bilden ab sofort das einzige offizielle BrandMind Design System. Alle anderen Komponenten sind entweder shadcn-Primitives als technische Basis oder Legacy-Wrapper.

## Komponenten-Hauptbibliothek

Neue Oberflächen dürfen nur noch diese BM-Komponenten verwenden:

- BMPage
- BMHero
- BMSection
- BMCard
- BMMetricCard
- BMButton
- BMInput
- BMTextarea
- BMSelect
- BMBadge
- BMDialog
- BMEmptyState
- BMTable
- BMStat
- BMToolbar
- BMHeader

## Token-Regeln

Neue UI darf keine neuen Hex-Farben, `bg-[#...]`, `text-[#...]`, `border-[#...]` oder Inline-Farbwerte einführen. Farben, Schatten, Radien, Spacing und Motion laufen über CSS-Variablen bzw. `bmDesignSystem`.

## Verbindliche Radien

- App Shell: 12px
- Cards: 20px
- Buttons: 14px
- Inputs: 14px
- Badges: 9999px
- Dialogs: 24px

## Motion-System

Zentrale Motion-Tokens definieren Page Transition, Hover, Dialog, Tooltip, Dropdown, Loading/Skeleton sowie Success/Error Feedback. Neue Komponenten verwenden `fadeUp`, `bmMotion` und CSS-Klassen aus `index.css`.

## Appearance-System

Globale Effekte werden über Modi gesteuert:

- Minimal: keine Ambient-/Partikel-/Trail-Effekte
- Standard: Ambient Orb und Page Particles, kein Cursor Trail
- Immersive: alle Effekte aktiv

Die Konfiguration liegt in `frontend/src/design-system.js`.

## Legacy-Markierung

`PageHeader` ist als `LegacyPageHeader` markiert und leitet visuell auf `BMHero` weiter. Weitere historische Komponenten sollen in folgenden Migrationen analog `Legacy*` benannt oder durch BM-Komponenten ersetzt werden.
