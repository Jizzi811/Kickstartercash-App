# Phases + release plan — Brandmind

## Total scope summary

- Total features: 16 (Stage 05) + Backlog
- Services/Module: 15 + MongoDB (Stage 04)
- Sondersituation: **Produkt existiert bereits** — Phasen bauen um/aus, nicht von Null
- MVP-Timeline (Wedge-fokussiert): **6 Wochen** (Solo-Founder, ehrlich gerechnet)
- v1.0 (öffentlicher Launch): **Woche 10**
- Team: 1 Founder + Claude Code als Umsetzungspartner; ab Phase 4 erste Anstellung/Freelancer

## Phase 0 — Fundament härten (Woche 0–1)

Ziel: Jede weitere Änderung ist durch CI abgesichert und läuft über einen einzigen Auth-/Workspace-Pfad.

**Tasks:**
- CI-Gates vervollständigen (Backend-Import, Frontend-Build, pyflakes — ROADMAP 0.1/0.5 sind ✅, Rest schließen)
- Backend-Tests für Identity + Workspace (pytest liegt schon in `backend/tests`)
- `current_user`/`current_workspace`-Pfad konsolidieren (ROADMAP 0.5, = F-02)
- Analytics-Grundgerüst: Aktivierungs-Events definieren und senden (F-03-Telemetrie)
- Fehler-Monitoring (Sentry) an Backend + Frontend

**Exit criteria:** CI blockt kaputte Merges nachweislich (1 absichtlicher Fehlversuch); ein Testnutzer kann sich registrieren, einloggen und sein Workspace-Objekt mit Tier + Quota-Feld abrufen; Aktivierungs-Events erscheinen im Analytics-Tool.

## Phase 1 — Wedge-MVP (Woche 2–6)

Ziel: Eine Gründerin durchläuft Onboarding → Intake → Ideen-Vergleich → Businessplan → Copywriter vollständig, mit Brand Brain sichtbar im Output — getestet mit 10 freundlichen Nutzern.

**Features (aus Stage 05):** F-03 (Pfadwahl), F-04 (Brand Brain), F-05 (Intake), F-06 (Vergleich), F-07 (Businessplan), F-08 (Copywriter), F-09 (Metering), F-11 (Ideen-Generator)

**Wochenplan:**
- Woche 2: F-09 Metering + Gateway-Härtung (Kostenrisiko zuerst), F-02 fertig
- Woche 3: F-03 Onboarding-Pfadwahl + Navigation verengen; F-05 Intake überarbeiten
- Woche 4: F-04 Brand Brain (Datenmodell + UI + Injektion)
- Woche 5: F-06/F-11 Ideen-Flow, F-07 Plan-Generator auf Brain umziehen
- Woche 6: F-08 Copywriter mit Brain-Badge; Polish; 10 Beta-Nutzer einladen

**Exit criteria:**
- 5 von 10 Beta-Nutzern schließen den Kern-Flow Ende-zu-Ende ab
- Aktivierungsrate messbar (Brain eingerichtet + 1 Export/Save ≤ 7 Tage)
- 0 P0-Bugs offen; Free-Tier-Deckel greift nachweislich
- LLM-Kosten pro aktivem Beta-Workspace < 2 €/Woche

## Phase 2 — Öffentlicher Launch (Woche 7–10)

Ziel: Launch in DACH-Gründer-Communities; erste 100 Signups und 10 zahlende Kunden.

**Features:**
- F-10 Upgrade-Flow auf neue Tiers ausrichten (Stripe-Bestand anpassen)
- F-12 Finanzplan (konsolidiert die Finanz-Studios), F-13 Angebote, F-14 Export
- E-Mail-Lifecycle: Willkommen, Tag-3-Anstupser (Intake unfertig), Limit-erreicht, Win-back
- Landingpage auf Wedge-Positionierung umschreiben („KI-Co-Founder für deine Gründung")

**Marketing:**
- 5 SEO-Artikel im Cluster „nach dem Businessplan" / „Marke aufbauen ohne Agentur"
- 60-Sekunden-Demo-Video (Kern-Flow, echte Nutzung)
- Launch: LinkedIn (Founder-Story), 2–3 Gründer-Communities, Product Hunt
- 10 Beta-Nutzer um Testimonials/Case-Snippets bitten

**Exit criteria:**
- 100 Signups · 10 zahlende Abos
- Aktivierungsrate ≥ 30 % (Ziel 40 % in Phase 3)
- W4-Retention gemessen (nicht zwingend gut — aber gemessen)

## Phase 3 — Wachstum (Woche 11–16)

Ziel: 1.000 Nutzer, 3–5k € MRR, Aktivierung ≥ 40 %.

**Features:**
- Onboarding-Iterationen aus Funnel-Daten (größter Hebel)
- F-15 E-Mail-Studio; Content-Bibliothek-Verbesserungen (Suche, Tags)
- F-16 Marken-Import (Business-Tier-Anker) — öffnet das KMU-Segment
- Funnel-Publishing polieren (`/f/[slug]` als viraler Kanal: „erstellt mit Brandmind")

**Growth-Taktiken:**
- SEO auf 10–15 Longtail-Artikel ausbauen; Gratis-Tools (Rechtsform-Quiz, Preis-Kalkulator) als Lead-Magnete
- Partnerschaft mit 1–2 Gründungsberatern/Communities (Empfehlungs-Deal)
- Monatlicher „Gründen mit KI"-Newsletter aus eigenen Studio-Outputs (dogfooding)

## Phase 4 — Skalierung + Director (Monat 5+)

Ziel: 20k € MRR; der AI Marketing Director wird vom Nordstern zum Feature.

**Features:**
- **AI Marketing Director MVP:** Ziel-Eingabe → Plan aus vorhandenen Skills (Workflow-Engine orchestriert Copywriter, E-Mail, Funnel, Kalender) — erst jetzt, weil Brain + Skills + Metering stabil sind
- Team-Workspaces (Business-Ausbau), Automation-Studio reaktivieren
- Worker-Prozess aus FastAPI-Tasks herauslösen (Lastgrenze)
- Performance: Mongo-Indexe auditieren, Caching für Brain-Reads, Bundle-Split der SPA

## Risk register (aus Stage 03, phasen-bewusst)

| Risiko | Phase | Mitigation |
|---|---|---|
| Free-Tier verbrennt LLM-Marge | 1–2 | Metering ist bewusst das ERSTE Feature in Woche 2, vor jedem Wachstum |
| Onboarding-Überforderung | 1–3 | Pfadwahl in Phase 1; Funnel-Messung ab Tag 1; Iteration ist Phase-3-Kernaufgabe |
| server.py-Refactor bricht Produktion | 0–2 | Strangler-Fig nur mit CI-Gates aus Phase 0; keine Big-Bang-Migrationen im Launch-Fenster |
| ChatGPT Memory wird „gut genug" | 2–4 | Positionierung auf Struktur + DACH + Umsetzung; Director in Phase 4 zieht die Kategorie hoch |
| Solo-Founder-Überlastung | alle | Wochen-Scope hart begrenzen; Phase-Exit-Kriterien sind Stopp-Schilder, keine Vorschläge |

## Decision log (initial)

1. **Bestehender Stack bleibt (CRA + FastAPI + MongoDB)** — Rewrite wäre Monate ohne Kundennutzen; Strangler-Fig läuft bereits.
2. **Metering vor Wachstum** — variable LLM-Kosten sind das einzige existenzbedrohende Risiko; wird als erstes MVP-Feature gebaut.
3. **Wedge = Gründungspfad, nicht KMU-Import** — Gründer sind erreichbarer (Communities/SEO); Import wird Business-Tier-Anker in Phase 3.
4. **Finanz-Suite (5 Studios) → 1 Finanzplan im Wedge** — Wartungslast runter, Story schärfer; Alt-Studios hinter Flag, nicht gelöscht.
5. **Kein E-Mail-Versand im Produkt** — E-Mail-Studio liefert Copy-out; Versand-Infrastruktur (Deliverability!) ist ein eigenes Geschäft und Anti-Scope.
6. **Director erst in Phase 4** — dokumentiert in eigener Roadmap: er setzt Brain, Skills, Orchestrierung voraus; früher gebaut wäre er die teuerste Ablenkung.
7. **Bestehende Plan-IDs bleiben stabil** (trial/starter/pro/agency aus `brandmind.py`) — sie stecken in produktiven Workspace-Dokumenten und Stripe-Preis-Envs; eine Umbenennung auf die Blueprint-Tiers (Free/Pro/Business) wäre Migrationsrisiko ohne Kundennutzen. Die Blueprint-Namen sind Marketing-Labels; Preis-/Struktur-Anpassungen laufen über die Stripe-Preise, nicht über die IDs.

## Initiatives (cross-cutting)

- **Onboarding-Exzellenz** — kontinuierlich ab Phase 2: wöchentlich Funnel ansehen, eine Verbesserung shippen
- **LLM-Kosten-Budget** — kontinuierlich: Kosten/aktiver Workspace als Wochen-KPI, Modell-Routing nachschärfen
- **Refactoring-Strang (server.py → app/)** — kontinuierlich, aber nie > 20 % der Wochenkapazität und nie in Launch-Wochen
- **Content-Motor** — ab Phase 2: 1 SEO-Artikel/Woche, aus echten Nutzerfragen gespeist
- **Dokumentation & Runbooks** — BRANDMIND_DEPLOY.md aktuell halten; jedes Incident-Learning wird Runbook-Zeile (Bus-Faktor 1!)
