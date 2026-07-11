# Brandmind Product Readiness Audit – Sprint A

Stand: 2026-07-10. Fokus Sprint A: Funktionsstatus, Glaubwürdigkeitsrisiken auf Landingpage, Dashboard-Datenquellen. Status basiert auf statischer Codeanalyse von `frontend/src/App.js`, `frontend/src/components/Layout.jsx`, `frontend/src/pages/*`, `backend/server.py` und vorhandenen Docs.

## Umsetzungsplan Sprint A

1. Frontend-Routen, Navigation, Kernseiten und Backend-Endpunkte inventarisieren.
2. Sichtbare, statische oder überzogene UI-Aussagen markieren.
3. Landingpage-Testimonial-/Bewertungsclaims durch Early-Access-Kommunikation ersetzen.
4. Dashboard-KPIs nur aus echten Backend-/Workspace-Zählern anzeigen; sonst Empty States.
5. Relevante Builds/Lints/Tests ausführen und Einschränkungen dokumentieren.

## Funktionsmatrix

| Funktion | Route | sichtbarer Einstieg | Frontend vorhanden | Backend vorhanden | persistiert Daten | reale KI-Anbindung | Status | bekannte Einschränkungen | Empfehlung |
|---|---|---|---:|---:|---:|---:|---|---|---|
| Landingpage / Public Site | `/` | Öffentlich | Ja | Teilweise | Nein | Nein | Beta | Early-Access-Formular folgt erst später; CTA führt aktuell zu Auth. | Sprint 10: Early-Access-Endpoint/Formular ergänzen. |
| Authentifizierung | `/auth` | Public Header / Guards | Ja | Ja (`brandmind_router`) | Ja | Nein | verfügbar | Externe Prüfung von Rollen/Workspace-Trennung folgt später. | In Sprint D sicherheitlich prüfen. |
| BrandMind HQ / Home | `/app` | Sidebar, Auth-Redirect | Ja | Teilweise | Liest Daten | Teilweise | Beta | Zentrale Quantum-Eingabe erst Sprint B. | Home als zentrale Startseite konsolidieren. |
| Dashboard / Module Marketplace | `/modules` | Sidebar | Ja | Ja (`/api/stats`) | Liest echte Zähler | Nein | Beta | Modulbeschreibungen teils aspirativ; keine Performance-KPIs ohne Datenquelle. | Nach Sprint B in „Mehr/Marketplace“ einordnen. |
| Quantum Command | `/quantum` | Sidebar / Hero | Ja | Teilweise (`/mission/ceo/plan`, lokale Orchestrator-Engine) | Teilweise | Optional über Provider | Beta | UI beschreibt Mock-/Preview-Workflow; echte Ausführung getrennt. | Übergabe von Home in Sprint B. |
| Mission Control | `/mission`, `/mission/plans/:planId` | Sidebar | Ja | Ja (`/mission/*`) | Ja | Optional | Beta | Pläne/Tasks bleiben human-in-the-loop; keine automatische externe Ausführung. | Weiter als Projekte-Bereich gruppieren. |
| Brand Brain | `/brand-brain` | Sidebar | Ja | Ja (`/brands`, `/brand-brain/onboard`) | Ja | Nein | verfügbar | Abhängig von Workspace/Brand-Kontext. | Für Brand Readiness in Sprint C nutzen. |
| Brand Identity | `/brand-identity` | Sidebar | Ja | Ja (`/brand-identity/*`) | Ja | Teilweise | Beta | Score existiert für Identity, aber noch nicht als kompletter Brand Readiness Score. | Sprint C: nachvollziehbaren Score zentralisieren. |
| Knowledge Base | `/knowledge` | Sidebar | Ja | Ja (`/knowledge/*`) | Ja | Suche/Context | verfügbar | Upload-/Dokumentqualität sicherheitlich später prüfen. | Für Quantum-Kontext nutzen. |
| Knowledge Graph | `/knowledge-graph` | Sidebar | Ja | Ja (`/knowledge-graph/*`) | Liest aggregiert | Nein | Beta | Graph basiert auf vorhandenen Collections; Visualisierung abhängig von Daten. | Als Beta kennzeichnen. |
| Memory | `/memory` | Sidebar | Ja | Ja (`/memory/*`) | Ja | Nein | Beta | Memory-Kontext vorhanden; automatische Memory-Freigaben begrenzt. | Human-Approval klar darstellen. |
| Agents | `/agents`, `/specialists` | Sidebar | Ja | Ja (`/agents`, `/agents/chat`) | History/Logs teils | Optional | Beta | Provider-Keys fehlen lokal; Ergebnisse können fehlschlagen. | Statushinweise beibehalten. |
| Custom Agents | `/builder` | Sidebar | Ja | Ja (`/custom-agents`, `/agent-builder/generate`) | Ja | Optional | Beta | Dokumentenverarbeitung/Provider abhängig. | Upload- und Prompt-Sicherheit prüfen. |
| Character Studio | `/character-studio` | Sidebar | Ja | Teilweise | Teilweise | Optional | in Entwicklung | Stark creative-/promptbasiert. | Als „In Entwicklung“ kennzeichnen. |
| Design Studio | `/design`, legacy `/image` | Sidebar | Ja | Ja (`/generate/image`) | History/Output optional | Optional | Beta | Bildanbieter erfordern Keys; keine garantierte Canva-Veröffentlichung. | Claims auf Prompts/Briefings begrenzen. |
| Video Studio | `/video` | Sidebar | Ja | Ja (`/video/*`) | Gallery/Jobs | Optional | in Entwicklung | Kein allgemeiner Videoschnitt; Provider-/Status-Endpunkte abhängig. | Nur Skripte, Storyboards, Prompts kommunizieren. |
| SEO Studio | `/seo`, `/seo-specialist` | Sidebar | Ja | Ja (`/generate/*`, Agenten) | History | Optional | Beta | Keine echten Ranking-/Search-Console-Daten angebunden. | Keine Performanceversprechen anzeigen. |
| Social Media | `/social` | Sidebar | Ja | Ja (`/generate/social`, `/social/*`) | Ja | Optional | Beta | Publishing-Jobs existieren, externe echte Veröffentlichung muss pro Connector geprüft werden. | Veröffentlichung nicht als fertig bewerben. |
| Email / LinkedIn / TikTok / TTS | `/email`, `/linkedin`, `/tiktok`, `/tts` | Sidebar | Ja | Ja/Teilweise | Teilweise | Optional | Beta | Provider-/Connector-Abhängigkeiten. | Beta-Badges und klare Output-Grenzen. |
| Automation / Workflows | `/automation`, `/workflow-architect`, `/workflow`, `/orchestrator`, `/ops` | Sidebar | Ja | Ja (`/workflows/*`, `/planner/*`, `/ops/*`) | Ja | Optional | Beta | Entwürfe/Validierung statt autonom laufender Kampagnen. | Human approval deutlich machen. |
| Output Factory | `/output-factory`, legacy `/export` | Sidebar | Ja | Ja (`/output-factory/assets`) | Ja | Nein | verfügbar | Export-/Speicheraktionen nur für vorhandene Assets. | Als Ergebnis-Persistenz für Schnellstarts nutzen. |
| AI Business Card | `/ai-business-card`, `/card/:hash` | Sidebar / public card | Ja | Ja (`/business-cards/*`) | Ja | Optional Chat | Beta | Öffentliche Karte benötigt Datenschutz-/Prompt-Prüfung. | Sprint D Sicherheit prüfen. |
| Founder Journey | `/onboarding/select-path`, `/onboarding/founder/*`, `/ops` | Hidden/Sidebar teils | Ja | Ja (`/founder/*`, `/decisions/*`) | Ja | Optional | Beta | Pfade noch nicht sauber nach Registrierung geführt. | Sprint C: geführten Ersteinstieg verbessern. |
| Finance Studios | `/finance-cfo`, `/finance-analyst`, `/finance-fpa`, `/finance-bookkeeper`, `/finance-tax` | Sidebar unter Settings | Ja | Agent/LLM Tools | Teilweise | Optional | in Entwicklung | Sensible Beratung; Haftungshinweis fehlt teils. | Sprint D: Warnhinweise und Navigation „Mehr > Business & Finanzen“. |
| Billing / Plans | `/billing` | Sidebar | Ja | `brandmind_router` | Ja | Nein | Beta | Tarif-/Checkout-Realität prüfen. | CTA „Kostenlos starten“ nur bei echtem Free-Tier. |
| Permissions | `/permissions` | Sidebar | Ja | Ja (`/permissions/*`) | Ja | Nein | Beta | Policy-Wirkung pro Route muss geprüft werden. | Sprint D Security Audit. |
| Gateway / Provider | `/gateway` | Sidebar | Ja | Ja (`/gateway/*`) | Ja | Nein | Beta | Secrets dürfen nicht offengelegt werden; Provider Health abhängig von Keys. | Sprint D Secret/Logging prüfen. |
| Legacy tools | `/copy`, `/funnel`, `/calendar`, `/guardian`, `/prompts`, `/chat-gpt`, `/chat-gemini`, `/chat-grok`, `/campaign` | Routen direkt/teils Sidebar | Ja | Ja/Teilweise | Teils | Optional | Legacy | Sichtbare alte Begriffe und Beispiele möglich. | Sprint D Legacy-Klassifizierung und sichtbare Bereinigung. |

## Backend-Endpunkte und Datenquellen – Überblick

- Persistente Kernquellen: MongoDB Collections für Brands, Workspaces/Auth, Knowledge, Custom Agents, Mission Plans/Tasks, Output Factory Assets, Memory, Founder Journey, Business Cards, Tickets, Gateway Config.
- KI-Anbindung: zentral über Provider-/LLM-Services und Gateway; ohne `OPENAI_API_KEY`, `GEMINI_API_KEY` oder andere Provider-Keys schlagen generative Funktionen lokal erwartbar fehl.
- Sprint-A-Ergänzung: `/api/stats` liefert nur reale, workspace-gescopte Zähler (`AGENTS` Registry, Custom Agents, Output Factory Assets, Mission Control Projekte, Knowledge Docs). Keine Reichweiten-/Performancewerte werden erfunden.

## Statische, beispielhafte oder potenziell irreführende UI-Werte

| Fund | Ort | Bewertung | Sprint-A-Maßnahme |
|---|---|---|---|
| Testimonials mit Namen, Rollen und 5 Sternen | Landingpage | Nicht verifiziert | Entfernt; durch Early-Access-Bereich ersetzt. |
| „von drei Tagen auf wenige Stunden“, „Arbeitstag sparen“ | Landing Content | Nicht belegte Zeitersparnis | Entfernt mit Testimonials. |
| „direkt live“ / „published directly“ | Landing Steps | Publishing-Claim nicht allgemein belegt | Ersetzt durch prüfbare Entwürfe. |
| „Video & editing“ / „Kurzvideos & Schnitt“ | Landing Features | Videoschnitt nicht als generelle Funktion belegt | Auf Skripte, Storyboards und Prompts begrenzt; Status „In Entwicklung“. |
| „Workflows ... selbst weiterlaufen“ | Landing Features | Autonome Kampagnen nicht belegt | Auf Workflow-Entwürfe mit Freigabe begrenzt; Beta. |
| „92/100 Marketing Score“ | Landing Output Samples | Beispielwert wirkt wie echte Bewertung | Entfernt. |
| `40+`, `2.4K`, `+38%`, `14` Dashboard-KPIs | Dashboard Fallback | Wirkt wie echte Kontodaten | Ersetzt durch echte `/api/stats`-Zähler oder Empty States. |
| `KASH Chat-Sessions` | Dashboard | Legacy-/irreführender Nutzerbezug | Ersetzt durch Projekte aus Mission Control. |

## Sprint-A Einschränkungen

- Early-Access-Formular und geschützte Admin-Exports sind explizit Sprint 10 und wurden noch nicht umgesetzt.
- Navigation wurde in Sprint A nicht umgebaut; folgt Sprint B.
- Home-Quantum-Eingabe, Onboarding-Verbesserung und Brand Readiness Score folgen Sprint B/C.
- Vollständige Legacy- und Security-Bereinigung folgt Sprint D.

---

## Sprint B – Navigation & Quantum Home Entry

Stand: 2026-07-11. Sprint B konsolidiert ausschließlich Navigation, Home/HQ-Struktur und die Prompt-Übergabe zu Quantum. Sprint C/D/E-Themen wie Brand-Readiness-Score, Onboarding-Entscheidungen, Security-/Legacy-Bereinigung oder neue Backend-Datenmodelle wurden bewusst nicht umgesetzt.

### Umsetzungsplan Sprint B

1. `/app` bleibt die authentifizierte Home-/HQ-Seite; `/` bleibt die öffentliche Landingpage.
2. `/quantum` bleibt die zentrale Quantum-Command-Route und wird als eigener Hauptpunkt sichtbar gemacht.
3. Bestehende Routen bleiben in `frontend/src/App.js` registriert; die Navigation gruppiert sie nur neu.
4. Home übergibt Prompts über React-Router-State plus Session-Storage-Fallback an Quantum; keine Query-Parameter.
5. Quantum übernimmt den Prompt in das bestehende Orchestrator-Eingabefeld, löscht temporären Zustand nach Übernahme und führt ihn nicht automatisch aus.

### Neue Navigationsarchitektur

Sichtbare Hauptnavigation: Home, Quantum, Meine Marke/My Brand, Erstellen/Create, Projekte/Projects, Mehr/More. Desktop und Mobile nutzen dieselbe Konfiguration. Primäre Bereiche werden nicht dauerhaft alle aufgeklappt; Home und Quantum sind Direktlinks, die übrigen Gruppen sind Tastatur-bedienbare Buttons mit `aria-expanded` und `aria-controls`.

### Route-zu-Gruppe-Zuordnung

| Gruppe | Routen |
|---|---|
| Home | `/app` |
| Quantum | `/quantum` |
| Meine Marke / My Brand | `/brand-brain`, `/brand-identity`, `/knowledge`, `/knowledge-graph`, `/memory` |
| Erstellen / Create | `/social`, `/design`, `/video`, `/seo`, `/email`, `/linkedin`, `/tiktok`, `/tts`, `/output-factory` |
| Projekte / Projects | `/mission`, `/campaign`, `/workflow`, `/automation`, `/workflow-architect`, `/orchestrator`, `/ops`, `/tickets` |
| Mehr / More | `/agents`, `/builder`, `/character-studio`, `/ai-business-card`, `/intelligence`, `/analytics`, `/skills`, `/modules`, `/arena`, `/gateway`, `/billing`, `/permissions` |
| Mehr → Business & Finanzen / Business & Finance | `/finance-cfo`, `/finance-analyst`, `/finance-fpa`, `/finance-bookkeeper`, `/finance-tax` |

### Home-Entscheidung

`/app` ist die Home-/HQ-Seite für angemeldete Nutzer. Die bestehende Dashboard-/Marketplace-Seite bleibt unter `/modules`; es wurde keine zweite Dashboard-Architektur erzeugt.

### Quantum-Promptübergabe

Home speichert einen validierten, nicht-leeren Prompt mit `saveQuantumHomePrompt()` in Session Storage und navigiert zusätzlich mit Router-State nach `/quantum`. Quantum liest zuerst Router-State, danach Session Storage, setzt den Text in `orchestratorPrompt`, löscht den temporären Speicher und ersetzt den Router-State. Dadurch bleibt der Prompt bei verzögerter Initialisierung erhalten, ohne sensible Inhalte in der URL offenzulegen.

### Mock-Workflow-Kennzeichnung

Die Orchestrator-Oberfläche bezeichnet den initialen Ablauf als „Workflow-Vorschlag“ / “workflow proposal”. Die spätere lokale Demo-Ausführung wird als vorbereiteter Workflow beziehungsweise Vorschau-Output beschrieben und nicht als veröffentlichte Kampagne oder reale Agentenarbeit.

### Responsive- und Accessibility-Prüfung

Strukturell geprüft: mobile Navigation schließt per Escape und bei Navigation; lange Gruppen sind scrollbar; Fokuszustände sind über `focus-visible` sichtbar; aufklappbare Gruppen besitzen `aria-expanded`/`aria-controls`; Hauptinhalt bleibt durch `overflow-x-hidden` und responsive Grids nutzbar. Eine echte Browser-Viewport-Screenshotprüfung für 1440×900, 1280×720, 768×1024, 390×844 und 360×800 wurde in dieser Umgebung nicht automatisiert ausgeführt.

### Ausgeführte Tests

- `npm test -- --watchAll=false`
- `CI=false npm run build`
- `npx eslint src/lib/navigationConfig.js src/lib/quantumPromptTransfer.js src/pages/BrandMindHQ.jsx src/pages/QuantumAgent.jsx src/components/Layout.jsx src/components/quantum/WorkflowTimeline.jsx src/lib/workflowEngine.js` wurde versucht; ESLint 9 bricht ab, weil im Frontend kein `eslint.config.js` vorhanden ist.

### Offene Risiken

- Vollständige visuelle Prüfung über alle Ziel-Viewports benötigt Browser-Automation oder manuelle QA.
- Einige Quantum-Bereiche enthalten weiterhin historische Demo-/Preview-Module; Sprint B hat nur die irreführende Workflow-Ausführungsbezeichnung entschärft.
- Reale LLM-/Provider-Ausführung hängt weiterhin von API-Keys ab.

### Bewusst verschoben

- Sprint C: Brand Readiness Score, Onboarding-Entscheidungen und neue Ersteinstiegslogik.
- Sprint D: Security-/Legacy-Audit, rechtliche Finance-Hinweise, umfassende Route-/Permission-Härtung.
- Sprint E: weitergehende Integrationen, echte Agenten-/Workflow-Ausführung und neue persistente Datenmodelle.

---

# Sprint C Ergänzung – Onboarding & Brand Readiness

## Umsetzungsplan und Datenmodell
Sprint C nutzt keine parallelen Nutzer-, Workspace- oder Brandmodelle. Der Onboarding-Fortschritt wird in `onboarding_status` pro `user_id` und `workspace_id` gespeichert. Zulässige Statuswerte sind `not_started`, `path_selected`, `in_progress`, `completed` und `skipped`; zulässige Pfade sind `existing_brand`, `founder` und `explore`.

## Pfadauswahl und Auslöselogik
Neue Registrierungen werden nach `/onboarding/select-path` geführt. Bestehende Nutzer ohne Status werden nicht ausgesperrt und erreichen `/app`; Home zeigt nur einen nicht blockierenden Hinweis „Brandmind gemeinsam einrichten“. Übersprungene Nutzer können später neu starten.

## Wiederaufnahmeverhalten
Der Backend-Status liefert `resume_route`. Für bestehende Marken führt die Wiederaufnahme zu Brand Brain, Brand Identity, Knowledge oder Home. Für Founder führt sie zu Intake, Ideas, Brand, Offers, Business Plan, Finance oder Operations. Explore bleibt auf Home als Checkliste.

## Founder-Fortschritt
Die Founder-Seiten verwenden eine gemeinsame Fortschrittsanzeige und persistieren den aktuellen Schritt über `/api/onboarding/status`. Business- und Finanzpläne sind als Entwürfe gekennzeichnet und enthalten den Steuer-/Rechts-/Finanzhinweis.

## Brand-Readiness-Berechnung
Der Score wird im Backend über `calculate_brand_readiness` und `GET /api/brand-readiness` berechnet. Grundlage sind nur gespeicherte, workspace-/brand-gescopte Werte aus Brand, Brand-DNA-Feldern und Knowledge Base. Whitespace, Platzhalter und offensichtliche Default-Leerwerte zählen nicht.

## Gewichtung
Grundlagen 14, Zielgruppe 14, Positionierung 14, Angebot 14, Persönlichkeit 12, visuelle Identität 12, Marketingausrichtung 10, Markenwissen 10 Punkte. Der Score ist deterministisch, kein Qualitätsurteil und keine Erfolgsprognose.

## Home-Darstellung
Home zeigt Einrichtungsstand, Kategorien, maximal drei nächste Schritte, Quickstarts und ehrliche Lade-/Fehler-/Empty-States. Bei API-Fehler wird kein Fake-Wert angezeigt.

## Schnellstarts
Die drei Schnellstarts öffnen Quantum mit editierbaren Prompts über Router-State plus `sessionStorage`-Fallback. Es erfolgt keine automatische Ausführung und keine Ergebnis-Persistenz ohne Nutzeraktion.

## Tests
Neu: `backend/tests/test_sprint_c_onboarding_readiness.py` und `frontend/src/sprintC.test.js`. Sie decken Statuswerte, Score-Determinismus, Scope-Felder, leere Werte, Pfadauswahl, Quickstarts, Readiness-Fehlerzustand und Finanzhinweise ab.

## Offene Risiken und verschobene Sprint-D/E-Aufgaben
Provider-abhängige Founder-Generierung kann lokal ohne Keys fehlschlagen. Browser-QA an echten Viewports ist weiterhin offen. Vollständige Security-/Legacy-Bereinigung, Early-Access-Backendformular und breite Regression-Suite wurden bewusst nicht vorgezogen.
