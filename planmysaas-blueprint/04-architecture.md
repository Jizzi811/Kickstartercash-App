# System architecture — Brandmind

> Ziel-Architektur auf Basis des bestehenden Codes (`backend/app/*`, `frontend/src/*`). Kein Rewrite: `server.py` wird per Strangler-Fig in die Module unten überführt (läuft bereits, siehe ROADMAP Sprint 0).

## Containers (top-level)

| Container | Zweck | Tech | Externe Integrationen |
|---|---|---|---|
| **Web-App (SPA)** | Gesamte Nutzeroberfläche: Founder Journey, Brand Brain, Studios, Billing | React 18 (CRA + craco), Tailwind, shadcn/ui | Backend-API |
| **API-Backend** | Auth, Brand Brain, Skills/Studios, Billing, LLM-Gateway | FastAPI (Python), Uvicorn | MongoDB, Stripe, OpenAI/Gemini/xAI |
| **Datenbank** | Persistenz aller Domänen-Entitäten | MongoDB Atlas (Motor, async) | — |
| **Background-Worker** | Lange LLM-Jobs, E-Mail-Versand, Metering-Aggregation (heute in-process via FastAPI-Tasks; Ziel: eigener Prozess) | FastAPI BackgroundTasks → später eigener Worker-Prozess (gleiche Codebase) | LLM-Provider, E-Mail |
| **Marketing-Site / Funnel-Hosting** | Landingpage + veröffentlichte Nutzer-Funnels | Statisch (Netlify), Funnel-HTML aus Backend | — |

Deploy: Frontend Netlify · Backend Render/Railway (`deploy/render.yaml`, `railway.toml`) · Health-Check `GET /api/health`.

## Services (Module im Backend)

**Domäne: Identität & Zugriff**
- **Identity Service** (`app/identity`) — `service` · Registrierung, Login, JWT-Sessions, Passwort-Reset. Owns: User, Session. Talks to: Workspace, Billing.
- **Workspace & Permissions** (`app/permissions`) — `module` · Workspaces, Rollen, `current_user`/`current_workspace`-Pfad (Roadmap 0.5). Owns: Workspace, Membership. Talks to: Identity, alle Domänen-Services.

**Domäne: Marke & Wissen**
- **Brand Brain Service** (`app/memory`, `knowledge_graph.py`) — `service` · Persistenter Marken-Kontext: Positionierung, Zielgruppe, Tonalität, Assets; Kontext-Injektion für alle Skills. Owns: BrandProfile, BrandAsset, MemoryEntry. Talks to: LLM Gateway, Skills.
- **Founder Journey Service** — `service` · Geführter Pfad: Intake, Ideen, Ideen-Vergleich, Businessplan, Finanzplan, Angebote. Owns: FounderProject, Idea, BusinessPlan, Offer. Talks to: Brand Brain, LLM Gateway.
- **Brand Import Module** — `module` · Import bestehender Marken (Website-URL, Assets) für Business-Tier. Owns: ImportJob. Talks to: Brand Brain, Worker.

**Domäne: KI-Ausführung**
- **LLM Gateway** (`app/services/llm.py`, `app/gateway`) — `service` · Provider-Routing (OpenAI/Gemini/xAI), Fallback, Circuit-Breaker, Modellwahl nach Tier. Owns: nichts (Orchestrator). Talks to: externe LLM-APIs, Usage Metering.
- **Skills Engine** (`app/skills`) — `module` · Wiederverwendbare KI-Fähigkeiten (Copywriting, E-Mail, Plan-Kapitel …) mit Brand-Kontext-Injektion. Owns: SkillRun. Talks to: Brand Brain, LLM Gateway.
- **Workflow Engine** (`app/workflows`) — `module` · Mehrstufige Abläufe (Kampagne, später Director). Owns: WorkflowRun. Talks to: Skills Engine, Worker.
- **Usage Metering** — `module` · Zählt LLM-Aufrufe/Tokens pro Workspace, setzt Tier-Limits durch. Owns: UsageEvent, QuotaState. Talks to: Billing, LLM Gateway.

**Domäne: Umsetzung & Auslieferung**
- **Content Service** — `service` · Studio-Outputs: Texte, E-Mails, Kalender-Einträge, Kampagnen. Owns: ContentItem, Campaign, CalendarEntry. Talks to: Skills Engine, Export.
- **Funnel Service** (`funnel.py`) — `service` · Funnel-Erstellung + Veröffentlichung (HTML-Bundle). Owns: Funnel, FunnelPage. Talks to: Content, Brand Brain.
- **Export Center** — `module` · Export als Markdown/PDF/HTML mit Rückverlinkung. Owns: ExportJob. Talks to: Content, Founder Journey.

**Domäne: Kommerz & Betrieb**
- **Billing Service** — `service` · Stripe-Abos (Free/Pro/Business), Webhooks, Tier-Status. Owns: Subscription, Invoice-Referenzen. Talks to: Stripe, Usage Metering, Identity.
- **Notification Module** — `module` · Transaktions- und Lifecycle-E-Mails. Owns: NotificationLog. Talks to: Worker, Identity.
- **Config & Observability** (`app/core`) — `module` · Zentrale Config/Secrets, Logging, Health. Owns: nichts. Talks to: alle.

**Node count:** Services: 7 · Module: 8 · Stores: 1 (MongoDB) · External: 5 (Stripe, OpenAI, Gemini, xAI, E-Mail).

## Data models (MongoDB-Collections)

```
User
  _id            ObjectId  PK
  email          string    UNIQUE
  name           string
  passwordHash   string
  locale         string (default "de")
  createdAt      datetime
  → has many Membership

Workspace
  _id            ObjectId  PK
  name           string
  ownerId        ObjectId → User
  tier           enum(free, pro, business)
  createdAt      datetime
  → has one BrandProfile · has many FounderProject, ContentItem, UsageEvent

Membership
  _id            ObjectId  PK
  userId         ObjectId → User
  workspaceId    ObjectId → Workspace
  role           enum(owner, editor, viewer)

BrandProfile   (das Brand Brain — 1 pro Workspace)
  _id            ObjectId  PK
  workspaceId    ObjectId  UNIQUE → Workspace
  positioning    string
  audience       object (persona, pains, gains)
  toneOfVoice    object (attribute, do/dont, beispiele)
  visualIdentity object (farben, fonts, logoAssetId)
  facts          array<{key, value, source}>
  completeness   number (0–100, treibt Onboarding)
  updatedAt      datetime
  → has many BrandAsset, MemoryEntry

BrandAsset
  _id            ObjectId  PK
  brandProfileId ObjectId → BrandProfile
  kind           enum(logo, farbe, font, dokument, bild)
  url            string
  meta           object

MemoryEntry    (gelernter Kontext aus Sitzungen)
  _id            ObjectId  PK
  workspaceId    ObjectId → Workspace
  source         enum(journey, studio, import, manuell)
  content        string
  embeddingRef   string (optional)
  createdAt      datetime

FounderProject
  _id            ObjectId  PK
  workspaceId    ObjectId → Workspace
  path           enum(gruendung, marken_import)
  stage          enum(intake, ideen, vergleich, plan, finanzen, angebote, marke, betrieb)
  intake         object (antworten aus FounderIntake)
  → has many Idea · has one BusinessPlan · has many Offer

Idea
  _id            ObjectId  PK
  projectId      ObjectId → FounderProject
  title          string
  description    string
  scores         object (markt, machbarkeit, passung — je 1–10 + begründung)
  status         enum(entwurf, verglichen, gewaehlt, verworfen)

BusinessPlan
  _id            ObjectId  PK
  projectId      ObjectId → FounderProject
  chapters       array<{key, title, contentMd, status}>
  financePlan    object (umsatz, kosten, liquiditaet — 36 Monate)
  version        number

Offer
  _id            ObjectId  PK
  projectId      ObjectId → FounderProject
  name           string
  pricing        object (modell, preis, staffeln)
  descriptionMd  string

ContentItem
  _id            ObjectId  PK
  workspaceId    ObjectId → Workspace
  studio         enum(copywriter, email, kalender, kampagne, design)
  title          string
  bodyMd         string
  brandSnapshot  object (welcher Brain-Stand verwendet wurde)
  createdAt      datetime

Funnel
  _id            ObjectId  PK
  workspaceId    ObjectId → Workspace
  slug           string  UNIQUE
  pages          array<{path, html, meta}>
  published      boolean

SkillRun / WorkflowRun
  _id            ObjectId  PK
  workspaceId    ObjectId → Workspace
  skillKey       string
  input          object
  output         object
  model          string · tokensIn/out number · costEstimate number
  status         enum(laufend, ok, fehler)
  createdAt      datetime

UsageEvent
  _id            ObjectId  PK
  workspaceId    ObjectId → Workspace
  kind           enum(llm_call, export, funnel_publish)
  tokens         number · costEstimate number
  period         string (YYYY-MM)   ← Index (workspaceId, period)

Subscription
  _id                  ObjectId  PK
  workspaceId          ObjectId  UNIQUE → Workspace
  stripeCustomerId     string
  stripeSubscriptionId string
  tier                 enum(free, pro, business)
  status               enum(active, past_due, canceled)
  currentPeriodEnd     datetime
```

## API surface (Top-20-Endpunkte, `/api`-Präfix)

```
IDENTITY & WORKSPACE
POST   /api/auth/register                 Konto anlegen                       nein
POST   /api/auth/login                    JWT beziehen                        nein
GET    /api/me                            Profil + Workspaces                 ja
GET    /api/workspaces/current            Aktiver Workspace + Tier + Quota    ja

BRAND BRAIN
GET    /api/brand/profile                 Brand Brain lesen                   ja
PUT    /api/brand/profile                 Brand Brain aktualisieren           ja
POST   /api/brand/import                  Marken-Import starten (Business)    ja
GET    /api/brand/import/:jobId           Import-Status                       ja

FOUNDER JOURNEY
POST   /api/founder/projects              Projekt anlegen (Pfadwahl)          ja
GET    /api/founder/projects/:id          Projekt + Stage lesen               ja
POST   /api/founder/projects/:id/ideas    Idee generieren/anlegen             ja
POST   /api/founder/ideas/compare         Ideen-Vergleich (Scoring)           ja
POST   /api/founder/projects/:id/plan     Businessplan-Kapitel generieren     ja
POST   /api/founder/projects/:id/offers   Angebot generieren                  ja

STUDIOS & AUSFÜHRUNG
POST   /api/skills/:skillKey/run          Skill mit Brand-Kontext ausführen   ja
GET    /api/content?studio=…              Studio-Outputs listen               ja
POST   /api/funnels/:id/publish           Funnel veröffentlichen              ja
POST   /api/exports                       Export (MD/PDF) erzeugen            ja

BILLING & BETRIEB
POST   /api/billing/checkout              Stripe-Checkout-Session             ja
POST   /api/billing/webhook               Stripe-Webhook                      nein (signiert)
GET    /api/health                        Liveness/Deploy-Check               nein
```

## Background jobs

| Job | Trigger | Aufgabe | Failure mode |
|---|---|---|---|
| LLM-Langlauf (Plan-Kapitel, Import-Analyse) | API-Request → Task | Generierung außerhalb des Request-Zyklus, Status auf Run-Dokument | Status `fehler` + Retry-Knopf im UI; kein stiller Verlust |
| Marken-Import-Crawler | `POST /api/brand/import` | Website laden, Extraktion in BrandProfile-Vorschläge | Timeout → Teilergebnis speichern, Job als `teilweise` markieren |
| Quota-Aggregation | stündlich | UsageEvents je Workspace/Monat verdichten, Limits setzen | Verzögerung toleriert; Durchsetzung nutzt letzten bekannten Stand |
| Lifecycle-E-Mails | Ereignis (Signup, Tag 3, Limit erreicht) | Versand über E-Mail-Provider | Retry mit Backoff; NotificationLog verhindert Doppelversand |
| Stripe-Sync | Webhook + täglicher Abgleich | Subscription-Status ↔ Workspace-Tier | Abgleichslauf korrigiert verpasste Webhooks |

## External integrations

| Vendor | Zweck | Tier/Preislogik | Failover |
|---|---|---|---|
| OpenAI | Primäre Text-Generierung (Pro/Business) | Pay-per-Token | Fallback auf Gemini via Gateway |
| Google Gemini | Zweit-Provider + Free-Tier-Routing (billige Modelle) | Pay-per-Token | Fallback auf OpenAI |
| xAI (Grok) | Optionaler Dritt-Provider (bereits angebunden) | Pay-per-Token | abschaltbar per Config |
| Stripe | Abos, Checkout, Webhooks | Gebühr pro Transaktion | Grace-Period bei Webhook-Ausfall via Tagesabgleich |
| E-Mail (Resend o. ä.) | Transaktions-/Lifecycle-Mails | Free-Tier reicht anfangs | Queue + Retry; Mails sind nie kritischer Pfad |
| MongoDB Atlas | Datenhaltung | Free/Flex → dediziert ab Last | Tägliche Backups, Point-in-Time ab Paid-Cluster |

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + CRA/craco + Tailwind + shadcn/ui | Bestand; Migration wäre Risiko ohne Nutzen |
| Backend | FastAPI + Pydantic | Bestand; async, typisiert, schnell |
| Datenbank | MongoDB Atlas (Motor) | Bestand; flexible Dokumente passen zu Brain/Plan |
| Auth | JWT (stdlib, `BRANDMIND_JWT_SECRET`) | Bestand; kein Vendor-Lock |
| LLM | Multi-Provider-Gateway (OpenAI/Gemini/xAI) | Kosten-Routing + Ausfallsicherheit |
| Billing | Stripe | Bestand; Standard im DACH-SaaS |
| Jobs | FastAPI-Tasks → dedizierter Worker | Einfach starten, sauber skalieren |
| Hosting | Netlify (FE) + Render/Railway (BE) | Bestand; Configs liegen im Repo |
| CI | GitHub Actions (Import-, Build-, pyflakes-Gate) | Deploy-zum-Testen erzwingt CI-Netz |

## Connections diagram (textual)

```
Browser (React SPA, Netlify)
   │  HTTPS /api/*
   ▼
FastAPI Backend (Render/Railway)
   ├── Identity ──────────────► MongoDB (users, memberships)
   ├── Workspace/Permissions ─► MongoDB (workspaces)
   ├── Founder Journey ───┐
   ├── Studios/Skills ────┤──► Brand Brain ──► MongoDB (brand_profiles, memory)
   ├── Funnel/Export ─────┘         │
   │                                ▼
   ├── LLM Gateway ──sync──► OpenAI / Gemini / xAI
   │        └─────────────► Usage Metering ──► MongoDB (usage_events)
   ├── Billing ◄──webhook── Stripe
   └── Worker (async): Import-Crawler · Langlauf-LLM · Quota · Mails
```
