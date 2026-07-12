# Frontend blueprint — Brandmind

> Basis: bestehende React-SPA (`frontend/src/pages/*`, CRA + Tailwind + shadcn/ui, Design-Tokens in `src/design-tokens.js`). Dieses Blueprint definiert die **Ziel-Navigation für den Wedge** — bestehende Seiten werden neu gruppiert und hinter „Mehr" progressiv freigeschaltet, nicht gelöscht. Hinweis: Da die App eine CRA-SPA ist, gilt statt RSC-Regel: Daten-Fetching in Hooks (`src/hooks`), Seiten bleiben dünn, Logik in Komponenten/Hooks.

## Routes (sitemap)

```
PUBLIC
  /                          Landingpage (Wedge-Pitch: KI-Co-Founder)        nein
  /pricing                   Preise Free/Pro/Business                        nein
  /auth                      Login + Registrierung (bestehend: Auth.jsx)     nein
  /f/[slug]                  Veröffentlichte Nutzer-Funnels                  nein

ONBOARDING (auth)
  /onboarding                Pfadwahl: Gründen vs. Bestandsunternehmen       ja   F-03
  /onboarding/intake         Founder-Intake, Schritt-für-Schritt             ja   F-05

APP — GRÜNDUNGSPFAD (auth)
  /app                       Dashboard: nächster Schritt + Brain-Status      ja   F-03
  /app/journey               Journey-Übersicht (Stages + Fortschritt)        ja   F-05–F-13
  /app/journey/ideas         Ideen sammeln + generieren                      ja   F-11
  /app/journey/compare       Ideen-Vergleich mit Scoring                     ja   F-06
  /app/journey/plan          Businessplan (Kapitel-Editor)                   ja   F-07
  /app/journey/finance       Finanzplan (36 Monate, Szenarien)               ja   F-12
  /app/journey/offers        Angebots-Baukasten                              ja   F-13

APP — MARKE & STUDIOS (auth)
  /app/brand-brain           Brand Brain einrichten & pflegen                ja   F-04
  /app/brand-brain/import    Marken-Import (Business-Tier)                   ja   F-16
  /app/studios/copywriter    Copywriter-Studio                               ja   F-08
  /app/studios/email         E-Mail-Studio                                   ja   F-15
  /app/content               Alle gespeicherten Outputs (Filter je Studio)   ja   F-08/F-15
  /app/exports               Export Center                                   ja   F-14

APP — KONTO (auth)
  /app/billing               Abo, Nutzung/Quota, Upgrade                     ja   F-09, F-10
  /app/settings              Profil, Workspace, Sprache                     ja   F-01, F-02

MEHR (auth, eingeklappt — Bestandsseiten hinter progressiver Freischaltung)
  /app/more/*                ContentCalendar, DesignStudio, Automation,      ja   Backlog
                             FinanceSuite, ChatArena, AgentBuilder …
```

## Page specs (top 8)

### /app (Dashboard)
- **Above-fold:** „Dein nächster Schritt"-Karte (aktuelle Journey-Stage) + Brain-Completeness-Ring.
- **Sections:** Nächster Schritt · Brain-Status mit CTA · zuletzt erstellte Inhalte (3) · Quota-Anzeige · „Mehr entdecken" (eingeklappt).
- **Components:** `<NextStepCard>`, `<BrainCompletenessRing>`, `<ContentItemRow>`, `<QuotaMeter>`, `<PageHeader>`.
- **Data:** `GET /api/workspaces/current`, `GET /api/founder/projects/:id`, `GET /api/content?limit=3`.
- **Empty:** Neuer Nutzer ohne Projekt → direkter Onboarding-Einstieg statt leerem Grid.
- **Loading:** Skeleton-Karten. **Error:** Inline-Retry-Karte, App-Shell bleibt stehen.

### /onboarding (Pfadwahl)
- **Above-fold:** Zwei große Wahlkarten: „Ich gründe" / „Ich habe schon ein Unternehmen".
- **Sections:** Begrüßung mit Namen · 2 Pfadkarten mit je 3 Bullet-Erwartungen · „Später entscheiden"-Link.
- **Components:** `<PathChoiceCard>` ×2, `<OnboardingShell>`.
- **Data:** `POST /api/founder/projects` bei Wahl.
- **Empty:** n/a. **Loading:** Button-Spinner nach Klick. **Error:** Toast + Karte bleibt wählbar.

### /onboarding/intake
- **Above-fold:** Eine Frage, groß, mit Fortschrittsleiste (Schritt x/10).
- **Sections:** Frage · Eingabe (Text/Auswahl) · Zurück/Weiter · Überspringen-Link.
- **Components:** `<IntakeStep>`, `<ProgressBar>`, `<StepNav>`.
- **Data:** `PATCH` pro Schritt auf das Projekt (persistiert einzeln, F-05).
- **Empty:** n/a. **Loading:** optimistisch, Speichern im Hintergrund. **Error:** Antwort lokal halten, Retry-Hinweis.

### /app/brand-brain
- **Above-fold:** Completeness-Ring + vier Abschnitts-Karten (Positionierung, Zielgruppe, Tonalität, Visuals).
- **Sections:** Statuskopf · 4 Abschnitts-Editoren (auf-/zuklappbar) · Facts-Liste (aus Journey gelernt) · Asset-Galerie.
- **Components:** `<BrainSectionCard>`, `<AiSuggestButton>`, `<FactList>`, `<AssetGrid>`, `<DiffConfirmDialog>`.
- **Data:** `GET/PUT /api/brand/profile`.
- **Empty:** Geführter „2-Minuten-Start" (3 Pflichtfelder). **Loading:** Abschnitts-Skeletons. **Error:** Abschnitt einzeln fehlerbar, Rest editierbar.

### /app/journey/compare
- **Above-fold:** Vergleichstabelle (Ideen × Dimensionen) mit Scores und Empfehlungs-Banner.
- **Sections:** Gewichts-Regler (Markt/Machbarkeit/Fit) · Tabelle · Begründungen je Zelle (Popover) · „Idee wählen"-CTA.
- **Components:** `<IdeaCompareTable>`, `<WeightSlider>`, `<ScoreBadge>`, `<ReasoningPopover>`, `<ChooseIdeaButton>`.
- **Data:** `POST /api/founder/ideas/compare`.
- **Empty:** < 2 Ideen → Hinweis + Link zu /app/journey/ideas. **Loading:** Zeilenweise Streaming der Scores. **Error:** Retry pro Idee, fertige Scores bleiben.

### /app/journey/plan
- **Above-fold:** Kapitel-Sidebar (Status-Punkte) + aktives Kapitel im Editor.
- **Sections:** Kapitelnavigation · Markdown-Editor · „Generieren/Neu generieren mit Hinweis" · Versions-Hinweis · Export-CTA.
- **Components:** `<ChapterNav>`, `<MarkdownEditor>`, `<GenerateButton>`, `<RunStatusChip>`, `<ExportButton>`.
- **Data:** `GET /api/founder/projects/:id`, `POST …/plan` (Langlauf-Job mit Polling).
- **Empty:** Kapitelstruktur steht, Inhalte „leer" mit Generieren-CTA. **Loading:** Status-Chip „generiert…" pro Kapitel. **Error:** Fehler-Chip + Retry, Editor-Inhalt unangetastet.

### /app/studios/copywriter
- **Above-fold:** Formatwahl (Karten) + Eingabefeld mit Brain-Badge („Markenprofil aktiv · Stand 12.07.").
- **Sections:** Formatwahl · Prompt-Eingabe · Varianten (2–3 Karten) · Verfeinerungs-Thread · Speichern.
- **Components:** `<FormatPicker>`, `<BrainBadge>`, `<VariantCard>`, `<RefineThread>`, `<SaveToContentButton>`.
- **Data:** `POST /api/skills/copywriter/run`, `POST /api/content`.
- **Empty:** Brain leer → `<BrainQuickstartPrompt>` statt Generieren. **Loading:** Streaming-Text in Variantenkarten. **Error:** Variante einzeln retry-bar; Quota-Fehler zeigt `<UpgradeInline>`.

### /app/billing
- **Above-fold:** Aktueller Plan + Quota-Balken (KI-Aufrufe diesen Monat).
- **Sections:** Plan-Karte · Nutzungsdetails · Tier-Vergleichstabelle · Upgrade/Downgrade · Rechnungen (Stripe-Portal-Link).
- **Components:** `<PlanCard>`, `<QuotaMeter>`, `<TierTable>`, `<CheckoutButton>`.
- **Data:** `GET /api/workspaces/current`, `POST /api/billing/checkout`.
- **Empty:** Free-Plan ist der Empty-State (immer Inhalt da). **Loading:** Skeleton. **Error:** Checkout-Fehler als Toast, nie stiller Abbruch.

## Wireframes (text-form)

```
/app  (Dashboard, Gründungspfad)
┌──────────────────────────────────────────────────────────┐
│ [≡] Brandmind      Journey  Marke  Studios   [Quota][👤]│
├──────────────┬───────────────────────────────────────────┤
│ Journey      │  Guten Morgen, Lena                       │
│  ● Intake ✓  │  ┌─────────────────────────────────────┐  │
│  ● Ideen ✓   │  │ ▶ Nächster Schritt                  │  │
│  ○ Vergleich │  │   Vergleiche deine 3 Ideen          │  │
│  ○ Plan      │  │   [Weiter im Vergleich →]           │  │
│  ○ Angebote  │  └─────────────────────────────────────┘  │
│ Marke        │  ┌───────────────┐ ┌───────────────────┐  │
│  Brand Brain │  │ Brand Brain   │ │ Zuletzt erstellt  │  │
│ Studios      │  │   ◔ 45 %      │ │ · LinkedIn-Post   │  │
│  Copywriter  │  │ [Vervollst.]  │ │ · Kapitel Markt   │  │
│  E-Mail      │  └───────────────┘ └───────────────────┘  │
│ ▸ Mehr       │  KI-Aufrufe: ▓▓▓▓▓░░░░░ 48/100 [Upgrade] │
└──────────────┴───────────────────────────────────────────┘

/app/journey/compare
┌──────────────────────────────────────────────────────────┐
│  Ideen-Vergleich                    Gewichte: M[▒] F[▒]  │
│  ┌────────────────┬────────┬────────┬────────┬────────┐  │
│  │                │ Markt  │ Machb. │ Fit    │ Gesamt │  │
│  │ Idee A: …      │  7 ⓘ   │  8 ⓘ   │  9 ⓘ   │  8.0   │  │
│  │ Idee B: …      │  8 ⓘ   │  5 ⓘ   │  6 ⓘ   │  6.3   │  │
│  │ Idee C: …      │  6 ⓘ   │  7 ⓘ   │  5 ⓘ   │  6.0   │  │
│  └────────────────┴────────┴────────┴────────┴────────┘  │
│  ★ Empfehlung: Idee A — weil du [Intake-Zitat] …         │
│                     [Idee A wählen → Businessplan]       │
└──────────────────────────────────────────────────────────┘

/app/studios/copywriter
┌──────────────────────────────────────────────────────────┐
│  Copywriter          [🧠 Markenprofil aktiv · 12.07.]    │
│  Format: (LinkedIn-Post) (Landing-Sektion) (Anzeige)     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Worum geht's? z. B. „Launch meines Angebots X"     │  │
│  └────────────────────────────────────────────────────┘  │
│                                   [Varianten erstellen] │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │ Variante 1    │ │ Variante 2    │ │ Variante 3    │  │
│  │ …             │ │ …             │ │ …             │  │
│  │ [Verfeinern]  │ │ [Verfeinern]  │ │ [Speichern]   │  │
│  └───────────────┘ └───────────────┘ └───────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Component tree (Neu- und Schlüssel-Komponenten)

**Layout**
- `<AppShell>` — Sidebar + Topbar + Content-Slot; props: `activeSection`, `quotaState`
- `<OnboardingShell>` — reduzierte Shell ohne Sidebar; props: `step`, `totalSteps`
- `<PageHeader>` — Titel, Beschreibung, Aktions-Slot

**Journey (Domain)**
- `<NextStepCard>` — nächste Stage + CTA; props: `stage`, `progress`, `onContinue`
- `<IntakeStep>` — eine Intake-Frage; props: `question`, `type`, `value`, `onSave`
- `<IdeaCompareTable>` — Score-Matrix; props: `ideas`, `weights`, `onChoose`
- `<ChapterNav>` — Plan-Kapitel mit Status; props: `chapters`, `activeKey`
- `<MarkdownEditor>` — Editor mit Autosave; props: `value`, `onChange`, `saveState`
- `<FinanceTable>` — 36-Monats-Raster; props: `scenario`, `onCellEdit`

**Brand (Domain)**
- `<BrainCompletenessRing>` — props: `percent`, `size`
- `<BrainSectionCard>` — Abschnitt mit Edit + KI-Vorschlag; props: `section`, `data`, `onSuggest`
- `<BrainBadge>` — „Markenprofil aktiv"-Chip in Studios; props: `updatedAt`, `completeness`
- `<DiffConfirmDialog>` — KI-Vorschlag vs. Bestand; props: `current`, `suggested`, `onAccept`
- `<BrainQuickstartPrompt>` — 3-Felder-Schnellstart; props: `onComplete`

**Studios (Domain)**
- `<FormatPicker>` — props: `formats`, `selected`
- `<VariantCard>` — Output-Karte mit Aktionen; props: `content`, `streaming`, `onRefine`, `onSave`
- `<RefineThread>` — Verfeinerungs-Verlauf; props: `runs`, `onSend`
- `<RunStatusChip>` — laufend/ok/fehler + Retry; props: `status`, `onRetry`

**Commerce/System**
- `<QuotaMeter>` — Balken + Warnstufen; props: `used`, `limit`, `tier`
- `<UpgradeInline>` — kontextueller Upgrade-Hinweis; props: `reason`, `targetTier`
- `<TierTable>` — Free/Pro/Business-Vergleich; props: `currentTier`
- `<EmptyState>` — Illustration + CTA; props: `title`, `action`
- `<ErrorCard>` — Inline-Fehler + Retry; props: `message`, `onRetry`

## Design system

> Quelle der Wahrheit: `frontend/src/design-tokens.js` + `design_guidelines.json` (bestehend). Unten die Soll-Werte für den Wedge; bei Konflikt gewinnen die Repo-Tokens und dieses Dokument wird angepasst.

- **Colors:** Brand-Primary (bestehendes Brandmind-Violett/Blau aus Tokens) · Neutral-Skala 5 Stufen (50/200/400/600/900) · Semantik: success (grün), warn (amber, Quota 80 %), error (rot), info (blau)
- **Typography:** H1 30/38 · H2 24/32 · H3 20/28 · H4 16/24 · Body 15/24 · Caption 13/18 · Mono (Zahlen in FinanceTable). Font: bestehende Token-Wahl (Inter-kompatibel)
- **Spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
- **Radius:** 4 (Chips) / 8 (Buttons) / 12 (Cards) / 16 (Modals)
- **Shadow:** subtle (Cards) / medium (Popover) / dramatic (Dialoge)
- **Motion:** cubic-bezier(.2,.7,.2,1), 0.2–0.4 s; Streaming-Text ohne Layout-Shift (feste Kartenhöhe während des Streams)

## Responsive grid

- **Mobile (≤ 640):** eine Spalte; Sidebar wird Bottom-Sheet/Burger; Vergleichstabelle wird horizontal scrollbarer Container; Intake bleibt Ein-Frage-pro-Screen (mobil am stärksten)
- **Tablet (641–1024):** 2 Spalten wo natürlich (Dashboard-Karten, Variantenkarten 2er-Grid)
- **Desktop (≥ 1025):** max-width 1280 px; persistente Sidebar ab 1280; Varianten 3er-Grid
