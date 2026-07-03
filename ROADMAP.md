# Brandmind — Roadmap

> **Vision:** Das KI-Betriebssystem für Marketing. Nicht „eine App mit vielen
> KI-Tools", sondern das Tool, das ein Unternehmer morgens als erstes öffnet
> und den ganzen Arbeitstag darin verbringt.

**Nordstern-Feature:** *AI Marketing Director* — der Nutzer schreibt „Ich will in
30 Tagen 500 Leads", der Director erstellt Strategie → Content → Anzeigen →
Landingpage → Funnel → Newsletter → Social → SEO → KPI-Dashboard. Alles aus
einer Unterhaltung.

Dieses Feature ist das Ziel. Es steht aber **am Ende** der Kette, weil es alle
darunterliegenden Bausteine (Brain, Agenten-Orchestrierung, Studio, Automation)
voraussetzt. Wir bauen das Fundament, dann den Director darauf.

---

## Arbeitsmodell

- **CTO / Architektur (Claude):** Roadmap, Architektur, Datenmodell, präzise
  Umsetzungs-Aufträge, Qualitätskontrolle.
- **Produkt (du):** Produktentscheidungen, Prioritäten, Tests, Feedback.
- **Regel:** Kein Feature-Chaos. Wir arbeiten in Sprints mit klarer „Definition
  of Done". Ein Feature gilt erst als fertig, wenn du es getestet und
  freigegeben hast.

**Wichtige Rahmenbedingung:** Wir testen bisher fast nur „live" (Deploy →
anschauen), weil die Umgebung die App nicht lokal ausführen kann. Deshalb ist
**Schritt 0 jeder Arbeit ein automatisches Sicherheitsnetz (CI)**, das Fehler
vor dem Deploy fängt. Das ist die Voraussetzung, um sicher umbauen zu können.

---

## Sprint 0 — Fundament (jetzt)

Ziel: aus einem funktionierenden Projekt eine **skalierbare, sicher
veränderbare** Plattform machen.

| # | Aufgabe | Status | Definition of Done |
|---|---------|--------|--------------------|
| 0.1 | **CI-Sicherheitsnetz** (Backend-Import + Frontend-Build bei jedem Push) | ✅ fertig | CI grün auf `14cc4bb` (Backend-Import + Frontend-Build) |
| 0.2 | **Backend modularisieren** (server.py → `app/`), *inkrementell* | 🚧 läuft | App bootet nach jedem Schritt identisch; CI grün |
| 0.3 | Konfiguration & Secrets zentralisieren (`app/core/config.py`) | 🚧 Start | Erste Env-Konstanten ausgelagert; nächste Module ziehen nach |
| 0.4 | Logging & Fehlerbehandlung vereinheitlichen | offen | Einheitliches Log-Format; Fehler liefern klare Meldungen |
| 0.5 | Rollen-/Rechtekonzept konsolidieren | offen | Ein `current_user`/`current_workspace`-Pfad, überall genutzt |

### Tech-Debt (im Blick behalten)

- **Frontend Peer-Deps:** `react-day-picker@8.10.1` erwartet `date-fns` 2/3, das
  Projekt nutzt `date-fns@4`. Läuft heute nur über `--legacy-peer-deps`. Später
  sauber auflösen (react-day-picker upgraden oder date-fns downgraden).

### Der Refactor-Ansatz (CTO-Entscheidung)

server.py (~4.700 Zeilen) wird **nicht** in einem großen Wurf zerlegt. Das wäre
in unserer Deploy-zum-Testen-Umgebung russisches Roulette mit der laufenden App.
Stattdessen **Strangler-Fig**, Modul für Modul:

```
server.py bleibt der laufende Einstiegspunkt.
→ Wir ziehen ein zusammenhängendes Stück heraus (z. B. services/llm.py),
→ importieren es zurück in server.py,
→ App bootet nach dem Schritt exakt wie vorher,
→ CI grün + dein Smoke-Test → nächster Schritt.
```

Reihenfolge der Extraktion (geplant):
`core/config` → `services/llm` → `services/image` → `services/tts` →
`core/security` (Auth/JWT) → Router (`api/auth`, `api/brands`, `api/content`,
`api/agents`, `api/studio`, `api/billing`, `api/support`) → `main.py`.

Zielstruktur:

```
backend/app/
├── api/        auth, brands, content, agents, studio, workspaces,
│               billing, analytics, support, automations
├── core/       config, security, database, logging
├── services/   llm(openai), image, video, voice, seo
├── models/     (DB-/Domänenmodelle)
├── schemas/    (Pydantic-Request/Response)
└── main.py
```

---

## Danach — die großen Phasen

**Phase B – Datenbasis**
- Zentrales Brand-Memory (Brain) als Single Source of Truth
- Vektor-Datenbank für Markenwissen (semantische Suche für alle Agenten)
- Medienbibliothek + Asset-Versionierung

**Phase C – Agentenplattform**
- Agent-Orchestrierung (Marketing Director delegiert an Spezialisten)
- Gemeinsamer Kontext zwischen Agenten
- Aufgaben-Warteschlange + Hintergrundjobs für lange Generierungen

**Phase D – Produktfunktionen**
- Automation-Builder (Drag & Drop: Idee → Content → Bild → Video → Kanäle)
- Analytics 2.0 (nicht nur Zahlen, sondern Empfehlungen + „jetzt umsetzen")
- Marketplace (Agenten, Templates, Funnels, Automationen)
- API für Erweiterungen, Team-Kollaboration, Mobile

**Nordstern**
- **AI Marketing Director** — die Klammer über allem.

---

## Produkt-Navigation (Zielbild)

Statt ~30 Menüpunkten neun klare Ebenen:

`🏠 Home · 🧠 Brain · 🎨 Studio · 📈 Marketing · 🤖 Agenten · ⚙️ Automationen ·
📊 Analytics · ⚡ Marketplace · 👤 Workspace`

Die heutigen Studios/Agenten werden unter diese Ebenen einsortiert (Information
Architecture) — ein reines Frontend-/Routing-Thema, das wir nach der
Backend-Stabilisierung angehen, damit wir nicht auf wackeligem Fundament die
Fassade umbauen.
