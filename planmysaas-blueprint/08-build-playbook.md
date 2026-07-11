# Build playbook — Brandmind

> Decision-grade build instructions for the Brandmind SaaS.
> Follow steps in order. Do not skip rubric items. Stop and review at the gate after every step.

## How to use this playbook

Dies ist eine Bau-Sequenz, keine Wunschliste. Jeder Schritt setzt auf dem vorherigen auf — die Reihenfolge ist eine Abhängigkeitskette (Blatt zuerst, Wurzel zuletzt), abgestimmt auf den **bestehenden** Brandmind-Code (`backend/app/*`, `frontend/src/*`). Es wird nichts von Null gebaut, was schon existiert; es wird gehärtet, verengt und vervollständigt.

Nach jedem Schritt kommt ein „Stop and review"-Gate. Nicht weitergehen, bevor jedes Rubrik-Item bestanden ist. Der nächste Schritt geht davon aus, dass alles davor funktioniert.

## Build sequence — at a glance

```
01 CI-Sicherheitsnetz + Deploy-Pipeline            (keine Deps — Blatt)
   └─ 02 Identity & Workspace-Konsolidierung (F-01, F-02)
        └─ 03 Datenmodell & Repositories (Collections + Indexe)
             └─ 04 LLM-Gateway-Härtung + Usage Metering (F-09)
                  └─ 05 Onboarding-Pfadwahl + Navigations-Verengung (F-03)
                       └─ 06 Brand Brain (F-04)
                            └─ 07 Founder-Journey-Kern: Intake, Ideen, Vergleich (F-05, F-11, F-06)
                                 └─ 08 Businessplan-Generator (F-07)
                                      └─ 09 Copywriter-Studio mit Brain-Injektion (F-08)
                                           └─ 10 Billing-Tiers + Export (F-10, F-14)
                                                └─ 11 Frontend-Polish + Landingpage-Umbau
                                                     └─ 12 Observability, Runbooks & Launch (Wurzel)
```

---

## Build Step 01 — CI-Sicherheitsnetz + Deploy-Pipeline

### 🎯 Goal
Jeder Push auf `main` läuft durch CI-Gates (Backend-Import, pytest, pyflakes, Frontend-Build), und ein kaputter Stand kann Produktion nachweislich nicht mehr erreichen.

### 📍 Why this is the leaf
Die Umgebung ist „Deploy-zum-Testen" (ROADMAP): ohne automatisches Netz ist jeder spätere Schritt — besonders das laufende server.py-Refactoring — russisches Roulette. Alle folgenden Schritte ändern Kern-Pfade; sie brauchen dieses Netz.

### 📥 Inputs (preconditions)
- GitHub-Repo mit Actions aktiviert (Gates aus ROADMAP 0.1/0.5 teils vorhanden — prüfen, nicht neu erfinden)
- Render/Railway- und Netlify-Deploys funktionierend (BRANDMIND_DEPLOY.md)
- Lokal: `pip install -r backend/requirements.txt`, `npm ci --legacy-peer-deps` in `frontend/`

### 📤 Outputs
- `.github/workflows/ci.yml` mit vier Jobs: backend-import, backend-tests, pyflakes, frontend-build
- Branch-Protection auf `main`: Merge nur bei grüner CI
- `GET /api/health` als Deploy-Smoke-Check dokumentiert

### 🛠 Implementation details

**Files to create/touch:**
```
.github/workflows/ci.yml        vier Gate-Jobs, Trigger: push + pull_request
backend/tests/test_smoke.py     Import von server:app + /api/health via TestClient
```

**Tech decisions (locked, Stage 04):**
- GitHub Actions — Repo liegt auf GitHub, kein zweites System
- pytest + FastAPI TestClient — liegt schon in `backend/tests`
- `npm ci --legacy-peer-deps` — bekannter Peer-Dep-Konflikt (react-day-picker/date-fns, ROADMAP Tech-Debt); im CI explizit machen
- pyflakes-Gate — fängt undefinierte Namen beim Strangler-Fig-Refactor

**Patterns (mandatory ab jetzt):**
- Kein Merge auf `main` ohne grüne CI — auch nicht „nur Doku" (Gewohnheit schlägt Ausnahme)
- Jeder Bugfix bekommt einen Test, der ohne den Fix rot ist
- Secrets nur als GitHub-/Render-/Netlify-Env, nie im Repo (`BRANDMIND_JWT_SECRET`, LLM-Keys)

### ✅ Acceptance rubric
- [ ] `git push` mit absichtlichem Syntaxfehler in `backend/` → CI rot, Merge blockiert
- [ ] `git push` mit absichtlich kaputtem Import in `frontend/src/App.js` → CI rot
- [ ] pytest läuft in CI und lokal identisch (`cd backend && pytest`)
- [ ] pyflakes-Job schlägt bei undefiniertem Namen an (Test mit Dummy-Commit)
- [ ] CI-Gesamtlaufzeit < 8 Minuten (sonst wird sie umgangen werden)
- [ ] Branch-Protection aktiv: Direkt-Push auf `main` abgewiesen
- [ ] `GET /api/health` liefert 200 auf Staging/Prod nach Deploy
- [ ] README/ROADMAP verweisen auf die CI-Pflicht (eine Zeile genügt)

### ⚠️ Edge cases
- Peer-Dep-Konflikt bricht `npm ci` ohne `--legacy-peer-deps` — Flag im Workflow festschreiben, nicht der Maschine überlassen
- Flaky LLM-abhängige Tests: Provider-Aufrufe in Tests immer mocken, nie echte Keys in CI
- pytest-Sammlung importiert Module mit Seiteneffekten — Import-Smoke-Test isoliert halten

### ❌ Common pitfalls
- Don't: CI-Fehler mit `continue-on-error` „lösen" — das Netz ist dann Deko.
- Don't: echte `MONGO_URL` in CI verwenden — Tests gegen Prod-Daten sind ein Datenverlust mit Anlauf. In-Memory/Mock oder eigener Test-Cluster.
- Never: LLM-Keys als Klartext in Workflow-Dateien.
- Don't: das bestehende Gate löschen und „sauber neu bauen" — erweitern, was ROADMAP 0.1/0.5 schon grün hat.

### 📊 Quality bar
- CI < 8 min · pytest ≥ 5 sinnvolle Tests als Startbestand · 0 pyflakes-Findings · Deploy-Smoke (health=200) nach jedem Prod-Deploy

### 🛑 Stop and review
1. Öffne einen PR mit absichtlichem Fehler → CI rot → Merge-Button gesperrt? 2. Fehler fixen → CI grün → Merge möglich? 3. Deploy auslösen → `curl https://<backend>/api/health` → 200? Wenn eines fehlschlägt: Schritt nicht bestanden.

---

## Build Step 02 — Identity & Workspace-Konsolidierung (F-01, F-02)

### 🎯 Goal
Es gibt genau EINEN Auth-/Workspace-Pfad: jede geschützte Route löst `current_user` + `current_workspace` (mit `tier` und Quota-Feld) über dieselbe FastAPI-Dependency auf.

### 📍 Why this step is here
From blueprint stage 04 — `Identity Service` und `Workspace & Permissions` sind die Basis, an der Metering (Step 04) und Billing (Step 10) hängen. ROADMAP 0.5 nennt genau diese Konsolidierung als offen. Zwei parallele Auth-Pfade = inkonsistente Session-Validierung = Sicherheitsloch.

### 📥 Inputs
- Step 01 bestanden (CI grün)
- Bestandscode: `backend/app/identity`, `backend/app/permissions`, JWT-Logik mit `BRANDMIND_JWT_SECRET`
- Inventur: `grep -rn "get_current_user\|decode_jwt\|Authorization" backend/ | grep -v tests` — Liste aller heutigen Auth-Aufrufstellen

### 📤 Outputs
- `app/identity/deps.py` mit `CurrentUser`- und `CurrentWorkspace`-Dependencies (einzige Wahrheit)
- Alle Routen in `server.py` + `app/*` nutzen diese Dependencies (Grep beweist es)
- `GET /api/workspaces/current` liefert `{workspace, tier, quota: {used, limit}, brainCompleteness}`
- Migrationsskript: Bestandsnutzer ohne Workspace bekommen Default-Workspace (tier=free)

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/identity/deps.py        CurrentUser/CurrentWorkspace-Dependencies
backend/app/identity/routes.py      register/login/reset (Bestand hierher ziehen)
backend/app/permissions.py          Rollen-Check (owner/editor/viewer) als Dependency-Fabrik
backend/tests/test_identity.py      Auth-Flows inkl. Negativfälle
scripts/migrate_default_workspace.py  einmalige Migration Altbestand
```

**Tech decisions (locked):**
- JWT stdlib-basiert, HS256, `exp` gesetzt — Bestand, kein Auth-Vendor
- Workspace-Dokument trägt `tier` — Stripe schreibt später NUR hierhin (Step 10)
- Rate-Limit Login: einfacher In-Memory/Mongo-Zähler reicht (kein Redis-Zwang)

**Patterns (mandatory):**
- Auth-Checks NIE inline in Route-Handlern — nur über die Dependencies aus `deps.py`
- 403 für fremde Workspaces, 401 für fehlende/abgelaufene Tokens — konsistent, getestet
- Input-Validierung an der Systemgrenze via Pydantic-Modelle (CLAUDE.md-Regel)

### ✅ Acceptance rubric
- [ ] `grep -rn "jwt.decode\|decode_token" backend/ --include=*.py | grep -v identity | grep -v tests` → 0 Treffer
- [ ] Registrierung legt User + Default-Workspace (tier=free) in einer Transaktion/atomar an
- [ ] Doppelte E-Mail → 409 mit klarer Meldung, kein 500
- [ ] Abgelaufenes JWT → 401; Request auf fremden Workspace → 403 (Tests beweisen beides)
- [ ] `GET /api/workspaces/current` enthält tier + quota-Felder (auch wenn Quota noch statisch ist)
- [ ] Login-Rate-Limit: 6. Versuch in einer Minute → 429
- [ ] Migrationsskript idempotent (2× laufen lassen = gleicher Zustand)
- [ ] Alle Bestandsrouten funktionieren unverändert (Smoke-Klick durch die App auf Staging)

### ⚠️ Edge cases
- Nutzer mit mehreren Workspaces (Datenaltbestand): `current` = zuletzt aktiver, Fallback erster
- JWT-Secret-Rotation: alte Tokens werden ungültig — bewusst, mit Re-Login-UX, nicht mit 500
- Gleichzeitige Registrierung derselben E-Mail (Unique-Index fängt, Handler übersetzt in 409)

### ❌ Common pitfalls
- Don't: den alten Auth-Pfad „vorerst drin lassen" — genau das erzeugt die zwei Wahrheiten, die dieser Schritt beseitigt.
- Don't: Tier-Logik in diesem Schritt bauen — hier nur das Feld; Stripe-Kopplung ist Step 10.
- Never: Passwort-Hashes mit md5/sha1 — bcrypt/argon2 (prüfen, was Bestand nutzt; ggf. Re-Hash beim Login).
- Don't: die Migration im App-Start ausführen — separates Skript, bewusst ausgeführt.

### 📊 Quality bar
- 100 % der geschützten Routen über die zentrale Dependency (Grep-Beweis) · Auth-Testabdeckung: min. 8 Fälle (happy + 5 Negativ) · p95 Login < 400 ms

### 🛑 Stop and review
1. Registrieren → ausloggen → einloggen, 3× hintereinander: keine Fehler. 2. Token im DevTools manipulieren → geschützte Route → 401. 3. Zweiten Testnutzer anlegen, dessen Workspace-ID in einen Request des ersten einsetzen → 403. 4. Grep-Checks aus der Rubrik laufen lassen. Erst dann weiter.

---

## Build Step 03 — Datenmodell & Repositories

### 🎯 Goal
Alle Collections aus Blueprint Stage 04 existieren mit Indexen und typisierten Repository-Funktionen; kein Domänencode spricht mehr „roh" mit Motor.

### 📍 Why this step is here
From blueprint stage 04 — BrandProfile, FounderProject, UsageEvent & Co. sind das Fundament von Brain (06), Journey (07/08) und Metering (04). Erst Schema + Zugriffsschicht, dann Features — sonst wächst jede Route ihr eigenes Datenformat.

### 📥 Inputs
- Step 02 bestanden (Workspace-Kontext existiert)
- Stage-04-Entitätenliste als Checkliste
- Inventur bestehender Collections: `mongosh` → `db.getCollectionNames()` + Stichproben-Dokumente

### 📤 Outputs
- Pydantic-Modelle je Entität in `app/<domain>/models.py`
- Repositories in `app/<domain>/repo.py` (get/create/update, immer workspace-gescoped)
- Index-Setup-Skript (`scripts/ensure_indexes.py`): u. a. `brand_profiles.workspaceId` UNIQUE, `usage_events (workspaceId, period)`, `funnels.slug` UNIQUE
- Kurzes Migrations-Memo: welche Bestands-Collections auf neue Modelle gemappt werden

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/brand/models.py + repo.py       BrandProfile, BrandAsset, MemoryEntry
backend/app/founder/models.py + repo.py     FounderProject, Idea, BusinessPlan, Offer
backend/app/usage/models.py + repo.py       UsageEvent, QuotaState
backend/app/content/models.py + repo.py     ContentItem, Funnel
backend/scripts/ensure_indexes.py           idempotentes Index-Setup
backend/tests/test_repos.py                 CRUD + Scoping-Tests (mongomock o. Test-DB)
```

**Tech decisions (locked):**
- MongoDB + Motor (async) — Bestand
- Pydantic v2-Modelle als einzige Serialisierungswahrheit (keine Dict-Freiform in Routen)
- Kein ODM-Wechsel (kein Beanie-Umbau mitten im Refactor) — dünne Repos genügen

**Patterns (mandatory):**
- JEDE Repo-Funktion nimmt `workspace_id` als ersten Parameter — Scoping ist nicht optional
- `_id`-Erzeugung nur serverseitig; Client-IDs werden nie übernommen
- Zeitstempel UTC, Feld `createdAt`/`updatedAt` konsistent

### ✅ Acceptance rubric
- [ ] `python backend/scripts/ensure_indexes.py` läuft idempotent (2× = gleiche Indexe, kein Fehler)
- [ ] Unique-Index auf `brand_profiles.workspaceId` verhindert zweites Brain (Test)
- [ ] Repo-Test: Workspace A kann Dokumente von Workspace B nicht lesen/ändern
- [ ] Jede Entität aus Stage 04 hat Modell + Repo (Checkliste abhaken)
- [ ] Kein `db[collection].find` außerhalb von `repo.py`-Dateien (Grep-Check)
- [ ] Bestandsdaten (User, Workspaces aus Step 02) bleiben lesbar (Staging-Smoke)
- [ ] `usage_events`-Index (workspaceId, period) existiert (explain zeigt IXSCAN)
- [ ] CI grün mit den neuen Tests

### ⚠️ Edge cases
- Bestands-Dokumente mit abweichendem Schema: Modelle mit toleranten Defaults lesen, beim nächsten Write normalisieren (Lazy-Migration)
- ObjectId vs. String-IDs im Frontend: an der API-Grenze immer String
- Sehr große Plan-Dokumente (>16 MB-Mongo-Limit unrealistisch, aber Kapitel einzeln speichern, nicht als Monolith wachsen lassen)

### ❌ Common pitfalls
- Don't: „schnell mal" eine Route direkt auf Motor zugreifen lassen — der eine Verstoß wird zum Muster.
- Don't: Indexe im App-Startup anlegen — bei Deploy-Rennen entstehen Konflikte; bewusstes Skript.
- Never: workspace_id aus dem Request-Body akzeptieren — immer aus dem Auth-Kontext (Step 02).
- Don't: alle Bestands-Collections sofort umbenennen/migrieren — Lazy-Migration schlägt Big-Bang.

### 📊 Quality bar
- Repo-Testabdeckung: jede Entität min. create+get+scope-Test · ensure_indexes < 10 s · 0 Grep-Verstöße

### 🛑 Stop and review
1. `ensure_indexes.py` zweimal laufen lassen — identisches Ergebnis? 2. Repo-Tests grün? 3. In mongosh: `db.brand_profiles.getIndexes()` zeigt Unique-Index? 4. Staging-App klickbar wie zuvor? Dann weiter.

---

## Build Step 04 — LLM-Gateway-Härtung + Usage Metering (F-09)

### 🎯 Goal
Kein LLM-Aufruf verlässt das System außer durch das Gateway; jeder Aufruf erzeugt ein UsageEvent, und ein Free-Workspace wird am Limit zuverlässig geblockt.

### 📍 Why this step is here
From blueprint stage 03 — Risiko Nr. 1 ist die LLM-Marge im Free-Tier. Das Gateway (`app/services/llm.py`, Fallback/Circuit-Breaker laut ROADMAP 0.4 ✅) existiert; es fehlen Metering-Pflicht und Tier-Routing. Alles Spätere (Brain, Journey, Studios) ruft LLMs — deshalb VOR den Features.

### 📥 Inputs
- Steps 02–03 bestanden (Workspace-Kontext + `usage_events`-Repo)
- Inventur: `grep -rn "openai\|genai\|generativeai\|grok\|anthropic" backend/ --include=*.py | grep -v services/llm` — jede Fundstelle außerhalb des Gateways ist Arbeit dieses Schritts
- Tier-Limits als Config: z. B. free=50 Aufrufe/Monat, pro=1.000, business=3.000 (Startwerte, in `app/core/config.py`)

### 📤 Outputs
- `llm.run(workspace, skill_key, prompt, …)` als EINZIGE öffentliche Funktion Richtung Provider
- Quota-Check vor, UsageEvent nach jedem Aufruf (auch bei Fehlern: Input-Tokens zählen)
- Modell-Routing: free → günstiges Modell (z. B. Gemini Flash-Klasse), pro/business → Qualitätsmodell
- Interner Kosten-Report: `GET /api/admin/usage?period=YYYY-MM` (nur Founder-Rolle)

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/services/llm.py         run() mit Quota-Gate + Metering + Modell-Routing
backend/app/usage/service.py        check_quota(), record_usage(), month_key()
backend/app/usage/routes.py         Admin-Report; Quota-Anteil in /workspaces/current
backend/tests/test_metering.py      Limit-Block, Event-Pflicht, Routing je Tier
```

**Tech decisions (locked):**
- Multi-Provider (OpenAI/Gemini/xAI) mit Fallback — Bestand; Routing-Tabelle je Tier in Config
- Quota-Periode = Kalendermonat als String `YYYY-MM` — kein Cron für Resets nötig
- Kostenschätzung: Tokenzahl × Preistabelle in Config (Genauigkeit ±20 % reicht, Stage 05 F-09)

**Patterns (mandatory):**
- Skills/Features erhalten NIE Provider-Clients — nur `llm.run(...)`
- Quota-Fehler ist ein typisierter Fehler (`QuotaExceededError`) → API übersetzt in 402 + Upgrade-Payload
- Jeder Run schreibt `model`, `tokensIn/out`, `costEstimate` aufs Run-/Usage-Dokument

### ✅ Acceptance rubric
- [ ] Grep: 0 Provider-Importe außerhalb `app/services/llm.py` (+ Gateway-Modul)
- [ ] Test: Free-Workspace mit Limit 2 → 3. Aufruf liefert 402 mit `{error: "quota_exceeded", upgradeUrl}`
- [ ] Test: jeder erfolgreiche Aufruf erzeugt genau 1 UsageEvent (kein Doppel bei Fallback!)
- [ ] Test: Fallback OpenAI→Gemini erzeugt EIN Event mit dem tatsächlich genutzten Modell
- [ ] Free-Tier-Run nutzt nachweislich das günstige Modell (Feld `model` im Event)
- [ ] `GET /api/workspaces/current` zeigt `quota.used` nach einem Aufruf um 1 erhöht
- [ ] Admin-Report summiert Kosten je Workspace für den Monat korrekt (Fixture-Test)
- [ ] Monatswechsel: Event mit neuem `period`-Key → `used` startet bei 0 (Test mit gemocktem Datum)
- [ ] Parallele Aufrufe am Limit: max. 1 Aufruf Überlauf, keine Exception-Kaskade

### ⚠️ Edge cases
- Provider-Timeout nach Token-Verbrauch: Event mit status=fehler + Input-Tokens schreiben
- Circuit-Breaker offen (alle Provider down): klarer 503 mit Retry-Hinweis, KEIN Quota-Verbrauch
- Streaming-Antworten: Tokens erst am Stream-Ende final, Event danach schreiben

### ❌ Common pitfalls
- Don't: Quota nur im Frontend prüfen — der API-Pfad ist die einzige Wahrheit.
- Don't: UsageEvents „später batchen" — Verlust bei Crash; einzeln schreiben, Aggregation ist Lesesache.
- Never: Preistabellen hart in Code verteilen — eine Config-Stelle, sonst driften Schätzungen.
- Don't: Free-Nutzer bei Limit kommentarlos auf 500 laufen lassen — 402 + Upgrade-Pfad ist Umsatz, 500 ist Churn.

### 📊 Quality bar
- 0 Grep-Verstöße · Metering-Overhead p95 < 50 ms pro Aufruf · Kostenschätzung ±20 % gegen eine echte Provider-Abrechnung (Stichprobe nach 1 Woche Staging)

### 🛑 Stop and review
1. Staging: Free-Test-Workspace-Limit auf 3 setzen, 4 Copywriter-ähnliche Aufrufe machen → 4. blockt mit Upgrade-Hinweis im UI. 2. `usage_events` in mongosh ansehen: 3 Events, korrektes Modell, period stimmt. 3. Einen Provider-Key absichtlich invalidieren → Fallback greift, genau 1 Event. Erst dann weiter.

---

## Build Step 05 — Onboarding-Pfadwahl + Navigations-Verengung (F-03)

### 🎯 Goal
Ein neuer Nutzer sieht nach dem Signup genau zwei Pfade („Ich gründe" / „Bestehendes Unternehmen") und eine auf den Wedge verengte Sidebar; das Aktivierungs-Event-Set feuert.

### 📍 Why this step is here
From blueprint stage 03 — Aktivierung ist der Engpass (Empfehlung Nr. 1); from stage 02, Insight 3 — die 30+ Bestandsseiten erschlagen Neueinsteiger. Ab hier bauen alle Feature-Schritte (06–09) in diese Navigation hinein — deshalb kommt sie vor ihnen.

### 📥 Inputs
- Steps 02–04 bestanden
- Bestand: `FounderPathSelect.jsx`, `FounderStart.jsx` (Pfadwahl-Ansätze existieren — erweitern, nicht duplizieren)
- Ziel-Sitemap aus Blueprint Stage 06

### 📤 Outputs
- `/onboarding` als Pflicht-Redirect für Nutzer ohne FounderProject/BrandProfile
- `POST /api/founder/projects` mit `path`-Feld (gruendung | marken_import)
- Neue `<AppShell>`-Navigation: Journey / Marke / Studios / „Mehr" (Bestandsseiten eingeklappt, per Deep-Link weiter erreichbar)
- Events: `onboarding_path_selected`, `activation_step` im Analytics sichtbar

### 🛠 Implementation details

**Files to create/touch:**
```
frontend/src/pages/Onboarding.jsx        Pfadwahl (Basis: FounderPathSelect)
frontend/src/components/AppShell.jsx     verengte Sidebar + „Mehr"-Sektion
frontend/src/hooks/useWorkspace.js       lädt /workspaces/current inkl. Quota/Brain-Status
backend/app/founder/routes.py            POST /projects (Pfadwahl), GET /projects/:id
frontend/src/lib/analytics.js            track()-Wrapper (ein Aufrufpunkt)
```

**Tech decisions (locked):**
- Bestandsseiten werden NICHT gelöscht — Route bleibt, Menüpunkt wandert unter „Mehr" (Decision Log Nr. 4)
- Analytics-Tool: PostHog o. ä. mit EU-Hosting — ein `track()`-Wrapper, direkt austauschbar
- Redirect-Logik im Frontend-Router, Wahrheit über „braucht Onboarding" kommt vom Backend-Flag

**Patterns (mandatory):**
- Events heißen exakt wie in Stage 05 spezifiziert (`onboarding_path_selected` …) — kein Wildwuchs
- Jede neue Seite nutzt `<AppShell>`; keine Eigenbau-Layouts mehr
- Deutsch als UI-Sprache, du-Form, konsistent (i18n.js existiert — Keys dort pflegen)

### ✅ Acceptance rubric
- [ ] Frischer Testnutzer landet nach Signup zwingend auf /onboarding (auch bei Deep-Link-Versuch)
- [ ] Wahl „Ich gründe" erzeugt FounderProject (path=gruendung) und führt in den Intake-Einstieg
- [ ] Wahl „Bestehendes Unternehmen" führt zum Brain-Setup mit Business-Hinweis für Import
- [ ] Sidebar zeigt im Wedge-Modus ≤ 8 primäre Einträge; „Mehr" klappt Bestandsseiten aus
- [ ] Bestandsnutzer (mit Daten) sehen KEIN erzwungenes Onboarding
- [ ] Alle alten Deep-Links (z. B. /app/more/ContentCalendar-Äquivalent) laden weiterhin
- [ ] `onboarding_path_selected` erscheint im Analytics mit path-Property
- [ ] Abbruch nach Pfadwahl + erneuter Login → Wiedereinstieg an derselben Stelle
- [ ] Frontend-Build grün, keine toten Menü-Links (Klick-Smoke über alle Sidebar-Einträge)

### ⚠️ Edge cases
- Nutzer wählt Pfad, wechselt dann bewusst → beide Projekte/Zustände koexistieren, kein Datenverlust
- Analytics geblockt (Adblocker): App funktioniert vollständig ohne track()
- Workspace mit Brain, aber ohne Projekt (Import-Pfad): Dashboard zeigt Marken-Fokus statt Journey

### ❌ Common pitfalls
- Don't: Bestandsseiten löschen oder auskommentieren — hinter „Mehr" verschieben; Löschen ist eine spätere, bewusste Entscheidung mit Nutzungsdaten.
- Don't: Onboarding als Modal über dem vollen UI — die Verengung IST der Punkt.
- Never: Aktivierungs-Events nachträglich umbenennen — die Zeitreihe ist die PMF-Beweisführung.
- Don't: Redirect-Schleifen bauen (Onboarding ↔ Dashboard) — ein serverseitiges Flag `needsOnboarding` entscheidet, sonst nichts.

### 📊 Quality bar
- Lighthouse Performance ≥ 80 auf /onboarding (mobil) · Time-to-Interactive nach Login < 3 s auf Staging · 0 tote Links (Smoke-Klick)

### 🛑 Stop and review
1. Neuen Testnutzer registrieren → Pfadwahl → Intake-Einstieg: flüssig, ohne Konsole-Errors. 2. Logout/Login → Wiedereinstieg korrekt. 3. Bestandsnutzer einloggen → kein Onboarding-Zwang, „Mehr" enthält alle alten Seiten. 4. Analytics-Dashboard zeigt die zwei Events. Erst dann weiter.

---

## Build Step 06 — Brand Brain (F-04)

### 🎯 Goal
Jeder Workspace hat genau ein pflegbares BrandProfile mit Completeness-Score, und ein Testlauf beweist: derselbe Prompt liefert mit gefülltem Brain markenspezifischen, ohne Brain generischen Output.

### 📍 Why this step is here
From blueprint stage 02 — Marktlücke 1 und Kern-Versprechen („ich erkläre nie wieder bei null"). Journey (07/08) schreibt ins Brain, Studios (09) lesen daraus — das Brain muss vor beiden stehen. Bestandscode: `app/memory`, `knowledge_graph.py`, `BrandBrain.jsx` als Ausgangspunkt.

### 📥 Inputs
- Steps 03–05 bestanden (BrandProfile-Repo, Gateway, Navigation)
- Stage-04-Schema für BrandProfile (positioning, audience, toneOfVoice, visualIdentity, facts, completeness)
- Sichtung Bestand: was aus `BrandBrain.jsx`/`BrandIdentity.jsx` wiederverwendbar ist

### 📤 Outputs
- `GET/PUT /api/brand/profile` auf dem neuen Schema
- Brain-Editor-Seite mit 4 Abschnitts-Karten, KI-Vorschlag + Diff-Bestätigung, Completeness-Ring
- `brand_context(workspace)` — Serverfunktion, die den injizierbaren Kontextblock rendert (mit Budget-Kappung)
- Facts-Rückschreibkanal: `add_brain_fact(workspace, key, value, source)` für Journey/Import

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/brand/routes.py         GET/PUT profile, POST facts
backend/app/brand/context.py        brand_context() — Prompt-Block, Budget max ~1.500 Tokens
frontend/src/pages/BrandBrain.jsx   Umbau auf Abschnitts-Karten + Ring (Bestand erweitern)
frontend/src/components/brand/…     BrainSectionCard, DiffConfirmDialog, BrainCompletenessRing
backend/tests/test_brand.py         Schema, Unique, Completeness-Berechnung, Kontext-Kappung
```

**Tech decisions (locked):**
- Completeness = gewichtete Pflichtfelder (Positionierung 30, Zielgruppe 30, Ton 25, Visuals 15) — deterministisch, kein LLM
- Kontext-Injektion als strukturierter Textblock (kein Embedding-Zwang im Wedge; MemoryEntry/HNSW ist Phase-4-Ausbau)
- KI-Vorschläge laufen durch `llm.run` (Step 04) — zählen also aufs Kontingent

**Patterns (mandatory):**
- KI-Vorschlag überschreibt NIE direkt — immer `DiffConfirmDialog` (Stage 05 F-04-Kriterium)
- `brand_context()` ist die EINZIGE Quelle für Brain-Kontext in Prompts — kein Skill baut eigenen Brain-Text
- Jede Injektion loggt `brain_injected` mit Brain-`updatedAt` (Nachweisbarkeit)

### ✅ Acceptance rubric
- [ ] Zweites Brain für denselben Workspace ist unmöglich (Unique-Index-Test aus Step 03 greift end-to-end)
- [ ] Completeness-Ring zeigt nach Ausfüllen von Positionierung exakt +30 Punkte
- [ ] „Mit KI vorschlagen" zeigt Diff; „Ablehnen" lässt Bestand unangetastet
- [ ] `brand_context()` kappt bei überlangen Feldern auf Budget und priorisiert Positionierung+Ton (Test)
- [ ] A/B-Beweis: identischer Copywriter-Prompt mit/ohne Brain — Output mit Brain enthält Tonalitäts-Attribute (manuell dokumentiert, Screenshot in PR)
- [ ] Journey-Fact-Rückschreibung: gewählte Idee erzeugt Fact mit source=journey (Integrationstest)
- [ ] Brain-Seite: Empty-State führt in 2-Minuten-Quickstart (3 Pflichtfelder)
- [ ] Zwei Tabs editieren parallel → letzter Save gewinnt mit Hinweis, kein stiller Verlust (updatedAt-Vergleich)

### ⚠️ Edge cases
- Brain leer + Studio-Aufruf: `brand_context()` liefert expliziten „kein Profil"-Marker, Studio zeigt Quickstart (Verhalten in Step 09 getestet)
- Sehr lange Facts-Liste: nur Top-N nach Aktualität ins Budget
- Nutzer pastet Marketing-Floskeln als Ton: zulassen — das Brain ist des Nutzers Wahrheit, keine Bewertung

### ❌ Common pitfalls
- Don't: das Brain als Chat bauen — es ist ein strukturiertes Profil; Chat-Eingabe kann später Felder befüllen, ersetzt sie nicht.
- Don't: Embeddings/Vektor-Suche jetzt einbauen — Budget-gekappter Strukturblock reicht im Wedge (Anti-Overbuild, Stage 02).
- Never: Brain-Kontext heimlich injizieren — das Badge (Step 09) und das Log machen den Wert sichtbar; Unsichtbarkeit verschenkt den Differenzierer.
- Don't: `knowledge_graph.py`-Bestand blind ersetzen — erst lesen, wiederverwenden was trägt.

### 📊 Quality bar
- Completeness-Berechnung 100 % deterministisch (Property-Test) · brand_context() < 20 ms ohne LLM-Aufruf · Brain-Seite Lighthouse ≥ 80

### 🛑 Stop and review
1. Brain auf Staging komplett ausfüllen → Ring 100 %. 2. Copywriter-Testprompt (per curl auf `/api/skills/copywriter/run`, auch wenn Studio-UI erst Step 09 kommt) mit/ohne Brain vergleichen → Unterschied dokumentieren. 3. Diff-Dialog: Vorschlag ablehnen → Feld unverändert. Erst dann weiter.

---

## Build Step 07 — Founder-Journey-Kern: Intake, Ideen, Vergleich (F-05, F-11, F-06)

### 🎯 Goal
Eine Nutzerin kommt vom Onboarding über den Intake zu einem begründeten Ideen-Vergleich und wählt eine Idee, die als Fact im Brain landet.

### 📍 Why this step is here
From blueprint stage 02 — der Wedge beginnt hier (Problem-Cluster 2). Braucht Brain (Fact-Rückschreibung, Step 06), Gateway (Scoring-Läufe, Step 04) und Navigation (Step 05). Der Businessplan (Step 08) konsumiert Intake + gewählte Idee. Bestand: `FounderIntake.jsx`, `FounderIdeas.jsx`, `FounderIdeaCompare.jsx` — umbauen auf neue Modelle, nicht neu erfinden.

### 📥 Inputs
- Steps 04–06 bestanden
- Stage-05-Flows F-05/F-11/F-06 als Spezifikation
- Intake-Fragenkatalog final (8–12 Fragen, deutsch, du-Form) — vor Baubeginn festlegen

### 📤 Outputs
- Intake: Ein-Frage-pro-Screen, Persistenz pro Schritt (`PATCH` aufs Projekt)
- Ideen: manuell anlegen + generieren (Bezug auf Intake-Antworten), verwerfen/behalten
- Vergleich: Scoring-Matrix (Markt/Machbarkeit/Fit) mit Begründungen, verstellbaren Gewichten, exklusiver „gewählt"-Status
- Fact „Kernidee" im Brain nach Wahl (source=journey)

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/founder/routes.py       PATCH intake-step, POST ideas, POST ideas/compare, POST ideas/:id/choose
backend/app/founder/scoring.py      Score-Prompting + deterministische Gewichtsverrechnung
frontend/src/pages/onboarding/Intake.jsx    Umbau FounderIntake auf Step-Persistenz
frontend/src/pages/journey/Ideas.jsx         Umbau FounderIdeas
frontend/src/pages/journey/Compare.jsx       Umbau FounderIdeaCompare auf Matrix + Gewichte
backend/tests/test_journey.py       Step-Persistenz, Scoring-Verrechnung, Exklusivität der Wahl
```

**Tech decisions (locked):**
- LLM scored je Dimension 1–10 + Begründung; Gesamtscore = deterministische Gewichtssumme im Backend (LLM rechnet nicht)
- Scoring-Läufe sind `SkillRun`s über `llm.run` — Metering inklusive
- Intake-Antworten werden bei Abschluss als Facts (source=journey) ins Brain gespiegelt (kuratiert, nicht roh)

**Patterns (mandatory):**
- Jeder Intake-Schritt persistiert einzeln — Reload verliert höchstens die offene Antwort (Stage 05 F-05)
- LLM-Begründungen müssen Intake-Daten referenzieren; Prompt erzwingt Zitat-Feld
- Retry pro Idee, nie „alles neu scoren" als einziger Weg

### ✅ Acceptance rubric
- [ ] Intake: Browser-Kill nach Frage 5 → Wiedereinstieg bei Frage 6 mit gespeicherten Antworten 1–5
- [ ] Zurück-Navigation ändert Frage 3, Antworten 4–5 bleiben erhalten
- [ ] Ideen-Generator: jede generierte Idee zitiert min. 1 Intake-Antwort (Stichprobe 5 Läufe)
- [ ] Verworfene Idee erscheint im selben Projekt nicht erneut
- [ ] Vergleich mit 1 Idee → blockiert mit Hinweis + Link zu Ideen
- [ ] Gewichts-Regler ändern die Rangfolge korrekt (deterministischer Test der Verrechnung)
- [ ] „Idee wählen" ist idempotent und exklusiv; vorher gewählte Idee wird sauber abgewählt
- [ ] Nach Wahl: Brain enthält Kernidee-Fact (source=journey) — im Brain-UI sichtbar
- [ ] LLM-Ausfall bei Idee 2 von 3: Scores 1+3 bleiben, Idee 2 hat Retry-Chip
- [ ] Alle Läufe erzeugen UsageEvents (Step-04-Invariante hält)

### ⚠️ Edge cases
- Intake fast leer + „Ideen generieren": System fordert konkrete fehlende Antworten an, statt zu raten
- Widersprüchliche Intake-Antworten: Zusammenfassung benennt den Widerspruch als offene Frage
- 20+ Ideen: sanftes Limit mit Hinweis (UI-Grenze aus Stage 05)

### ❌ Common pitfalls
- Don't: den Gesamtscore vom LLM „schätzen" lassen — Zahlen rechnet der Server; das LLM liefert Teil-Scores + Begründung.
- Don't: Intake-Antworten roh in jeden späteren Prompt kippen — kuratierte Facts + brand_context() sind der Kanal (Token-Budget!).
- Never: die Empfehlung ohne Begründung anzeigen — die zitierte Begründung ist der Vertrauens-Moment des Produkts.
- Don't: die drei Bestandsseiten parallel weiterleben lassen — alte Routen auf neue umleiten, sonst zwei Journeys.

### 📊 Quality bar
- Intake-Abschlussrate auf Staging-Beta ≥ 70 % (10 Testnutzer) · Scoring-Lauf je Idee p95 < 15 s · 0 verlorene Antworten in 20 simulierten Abbrüchen

### 🛑 Stop and review
1. Kompletter Durchlauf als neuer Nutzer: Onboarding → Intake (mit einem absichtlichen Browser-Kill) → 3 Ideen → Vergleich → Wahl. 2. Brain öffnen: Kernidee-Fact da? 3. `usage_events` zählen: plausible Anzahl? 4. Gewichte verschieben → Rangfolge reagiert nachvollziehbar. Erst dann weiter.

---

## Build Step 08 — Businessplan-Generator (F-07)

### 🎯 Goal
Aus Intake + gewählter Idee entsteht ein kapitelweise generierter, editierbarer deutscher Businessplan; manuelle Edits überleben Neu-Generierungen anderer Kapitel.

### 📍 Why this step is here
From blueprint stage 05 — F-07 ist das Herz des Wedge und der erste „Bank-taugliche" Wert. Braucht Journey-Daten (Step 07), Brain-Kontext (06), Langlauf über Gateway (04). Bestand: `FounderBusinessPlan.jsx`.

### 📥 Inputs
- Step 07 bestanden (gewähltes Projekt mit Intake + Idee auf Staging vorhanden)
- Kapitelstruktur final: Zusammenfassung · Geschäftsmodell · Markt & Wettbewerb · Marketing & Vertrieb · Organisation & Rechtsform · Finanzen (Platzhalter → F-12) · Meilensteine
- Langlauf-Mechanik: BackgroundTask + Status-Polling (Stage 04 Jobs)

### 📤 Outputs
- `POST /api/founder/projects/:id/plan` (kapitelweise: `{chapterKey}`) startet Job; `GET` pollt Status
- Kapitel-Editor: ChapterNav mit Status, Markdown-Editor mit Autosave, „Neu generieren mit Hinweis"
- Versionierung: `version` inkrementiert bei Strukturänderung; Kapitel tragen `status` (leer/entwurf/fertig)

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/founder/plan.py          Kapitel-Prompts (deutsch, Rechtsform-bewusst), Job-Logik
backend/app/founder/routes.py        plan-Endpoints (start, status, save-chapter)
frontend/src/pages/journey/Plan.jsx  Umbau FounderBusinessPlan: ChapterNav + Editor + RunStatusChip
backend/tests/test_plan.py           Edit-Überleben, Quota-Abbruch, Status-Maschine
```

**Tech decisions (locked):**
- Kapitel einzeln generieren — kein Gesamtlauf > 60 s Request (Stage 05 F-07)
- Kapitel-Prompts erhalten: brand_context() + Intake-Kuratiert + gewählte Idee + bereits FERTIGE Kapitel als Kontext (Konsistenz)
- Markdown als Speicherformat (`contentMd`) — Export (Step 10) rendert daraus

**Patterns (mandatory):**
- Editor-Autosave debounced (2 s), Save-State sichtbar (`gespeichert · 12:03`)
- Neu-Generierung eines Kapitels fasst NIE andere Kapitel an
- Status-Maschine pro Kapitel: leer → generiert… → entwurf → fertig; Fehler ist Seitenzustand, kein Toast-und-weg

### ✅ Acceptance rubric
- [ ] Kapitel „Markt" generieren, Kapitel „Geschäftsmodell" manuell editieren, „Markt" NEU generieren → Edit unangetastet (Test)
- [ ] Generiertes Rechtsform-Kapitel behandelt die im Intake angegebene Rechtsform korrekt (UG-Testfall: Stammkapital, Rücklagenpflicht erwähnt)
- [ ] Quota läuft während Generierung aus → Kapitel bleibt „leer" mit klarem Hinweis, kein halber Text gespeichert
- [ ] Zwei Kapitel parallel angestoßen → beide laufen, Status-Chips korrekt, keine Vermischung
- [ ] Autosave: Tippen, Tab schließen, wiederkommen → max. 2 s Textverlust
- [ ] „Neu generieren mit Hinweis" („kürzer") verändert den Output erkennbar in die Richtung
- [ ] Fertige Kapitel fließen als Kontext in später generierte (Konsistenz-Stichprobe: Zahlen/Claims widersprechen sich nicht)
- [ ] Plan-Läufe erzeugen UsageEvents mit skill_key=plan_chapter

### ⚠️ Edge cases
- Sehr dünner Intake: Kapitel-Prompt erzwingt Rückfragen-Block statt Halluzination („Um dieses Kapitel zu vervollständigen, beantworte: …")
- Nutzer löscht gewählte Idee nach Planstart: Plan bleibt, Banner „Grundlage geändert — Kapitel prüfen"
- Riesige manuelle Kapitel (Copy-paste 30 Seiten): Speichern ja, als Generierungs-Kontext gekappt

### ❌ Common pitfalls
- Don't: den ganzen Plan in einem Prompt generieren — Timeout, Kosten, und ein Fehler vernichtet alles.
- Don't: Nutzer-Edits und KI-Text im selben Feld ohne Versionsstempel mischen und dann „regenerate all" anbieten — das ist Datenverlust per Knopfdruck.
- Never: Finanzzahlen im Plan vom LLM erfinden lassen — Finanzen-Kapitel verweist auf F-12 (deterministische Rechnung) oder bleibt explizit offen.
- Don't: Streaming-UI bauen, bevor Polling stabil ist — Polling zuerst, Streaming ist Polish.

### 📊 Quality bar
- Kapitel-Generierung p95 < 45 s · 0 Fälle von Edit-Verlust in 20 Testzyklen · Konsistenz-Stichprobe: 0 harte Widersprüche zwischen Kapiteln in 3 Testplänen

### 🛑 Stop and review
1. Kompletten Plan auf Staging erzeugen (alle Kapitel), dabei 1× Quota-Abbruch provozieren und 1× parallel generieren. 2. Zwei Kapitel manuell editieren, zwei andere neu generieren → Edits intakt. 3. Plan lesen: würde eine Bank das ernst nehmen? Wenn nein, Prompts nachschärfen BEVOR es weitergeht — Step 10 exportiert genau das.

---

## Build Step 09 — Copywriter-Studio mit Brain-Injektion (F-08)

### 🎯 Goal
Das Copywriter-Studio liefert 2–3 markensprachliche Varianten mit sichtbarem Brain-Badge und Verfeinerungs-Thread; leeres Brain führt in den Quickstart statt zu generischem Output.

### 📍 Why this step is here
From blueprint stage 03 — Empfehlung 4: der Differenzierer muss erlebbar sein. Der Copywriter ist das erste Studio, das den Brain-Wert im Alltag beweist (Retention). Braucht Brain (06), Gateway (04), ContentItem-Repo (03). Bestand: `Copywriter.jsx`.

### 📥 Inputs
- Steps 06–08 bestanden (Brain gefüllt auf Staging, brand_context() stabil)
- Formatliste v1: LinkedIn-Post · Landingpage-Sektion · Anzeige (3 Formate, nicht 10)
- `POST /api/skills/copywriter/run` (Grundgerüst aus Step 06-Gate vorhanden)

### 📤 Outputs
- Studio-Seite: FormatPicker, Eingabe, 3 Variantenkarten, RefineThread, Speichern als ContentItem
- BrainBadge mit `updatedAt` + Klickweg zum Brain
- BrainQuickstartPrompt bei completeness < 30
- Content-Liste `/app/content` mit Studio-Filter

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/skills/copywriter.py     Format-Prompts, Varianten-Erzwingung, Verfeinerungs-Kontext
frontend/src/pages/studios/Copywriter.jsx   Umbau auf VariantCard/RefineThread
frontend/src/pages/Content.jsx       Liste gespeicherter Items (Filter, Suche später)
backend/tests/test_copywriter.py     Varianten-Anzahl, brandSnapshot, Thread-Kontext
```

**Tech decisions (locked):**
- Ein Run erzeugt alle Varianten (ein LLM-Aufruf mit strukturierter Ausgabe) — 3× billiger als 3 Runs
- ContentItem speichert `brandSnapshot` (Brain-Stand des Runs) — Nachvollziehbarkeit
- Verfeinerung hängt Thread-Verlauf (gekappt auf letzte 5 Runden) + brand_context() an

**Patterns (mandatory):**
- Quota-Fehler rendert `<UpgradeInline>` im Studio — der Moment höchster Zahlungsbereitschaft
- Jede Variante einzeln speicherbar; Speichern ist explizit, kein Auto-Hoarding
- Studio-Outputs sind ContentItems — KEIN Studio erfindet eigene Speicherformate

### ✅ Acceptance rubric
- [ ] Run mit gefülltem Brain: min. 2 Tonalitäts-Attribute aus dem Brain im Output nachweisbar (Log zeigt injizierten Kontext)
- [ ] Varianten unterscheiden sich im Ansatz (Hook/Struktur), nicht nur in Synonymen (Review von 5 Läufen)
- [ ] Brain-completeness < 30 → Quickstart statt Generierung; nach Quickstart läuft der ursprüngliche Prompt weiter
- [ ] Verfeinerung „mehr Du-Form, kürzer" über 5 Runden behält Thema + Marke
- [ ] Gespeichertes Item erscheint in /app/content mit korrektem Studio-Tag + brandSnapshot
- [ ] Quota erschöpft mitten im Thread → UpgradeInline, Thread-Verlauf bleibt erhalten
- [ ] Provider-Fallback während eines Runs → Nutzer merkt nichts außer Latenz (1 Event, richtiges Modell)
- [ ] Streaming/Progressive Anzeige ohne Layout-Shift (feste Kartenhöhe)

### ⚠️ Edge cases
- Marken-Ton vs. Format-Konflikt (blumiger Ton, knappe Anzeige): KI benennt den Konflikt in einer Variante
- Sehr lange Eingabe: Kappung mit sichtbarem Hinweis, nicht stilles Abschneiden
- Nutzer speichert identische Variante zweimal: idempotent per Inhalts-Hash oder Duplikat-Hinweis

### ❌ Common pitfalls
- Don't: das Badge weglassen, „weil es ja funktioniert" — unsichtbare Differenzierung existiert für den Kunden nicht.
- Don't: 10 Formate zum Start — 3 gute Formate mit sauberen Prompts schlagen 10 mittelmäßige (Anti-Overbuild).
- Never: den Thread-Verlauf ungekappt mitschicken — Token-Kosten wachsen quadratisch mit der Sitzung.
- Don't: generischen Fallback-Text liefern, wenn das Brain leer ist — der Quickstart-Moment ist der Aktivierungs-Hebel (Stage 03, Kernmetrik).

### 📊 Quality bar
- Run p95 < 12 s bis erste sichtbare Variante · Kosten pro Run (free-Modell) < 0,01 € geschätzt · „Speichern"-Rate der Beta ≥ 30 % der Runs (sonst stimmt die Qualität nicht)

### 🛑 Stop and review
1. Mit dem Staging-Brain 3 Formate je 2× laufen lassen → Marke hörbar? Speichern-würdig? 2. Brain-Ton temporär auf „sachlich, Sie-Form" ändern → Output kippt nachweislich. 3. Quota-Limit provozieren → UpgradeInline erscheint im Studio. 4. `activation_step`-Event (Save) feuert. Erst dann weiter.

---

## Build Step 10 — Billing-Tiers + Export (F-10, F-14)

### 🎯 Goal
Free→Pro→Business-Upgrades laufen über Stripe Checkout Ende-zu-Ende in < 2 Minuten, und der Businessplan verlässt das System als bank-taugliches PDF mit Rückverlinkung.

### 📍 Why this step is here
From blueprint stage 01 — Erfolgskriterium ist zahlende Kunden; from stage 02, Insight 4 — der Export muss zurückverlinken, sonst stirbt die Retention im PDF. Braucht: Tier am Workspace (02), Quota (04, liefert den Upgrade-Moment), Plan-Inhalte (08). Stripe-Bestand (`Billing.jsx`, Webhook-Code) wird auf die Tiers ausgerichtet.

### 📥 Inputs
- Steps 04, 08, 09 bestanden (Quota-Momente existieren, Plan exportierbar)
- Stripe-Konto mit Produkten/Preisen: pro_monthly 39 €, business_monthly 99 € (+ Jahrespreise) — im Stripe-Dashboard angelegt, IDs in Config
- Webhook-Secret als Env (`STRIPE_WEBHOOK_SECRET`)

### 📤 Outputs
- `POST /api/billing/checkout` (target_tier) → Checkout-URL; Webhook setzt `Subscription` + `Workspace.tier`
- Billing-Seite: PlanCard, QuotaMeter, TierTable, Stripe-Portal-Link (Kündigung/Rechnungen an Stripe delegiert)
- Täglicher Abgleichs-Job Stripe↔DB
- `POST /api/exports` (artefakt=plan|offer|content, format=pdf|md) mit serverseitigem Rendering + Fußzeilen-Link

### 🛠 Implementation details

**Files to create/touch:**
```
backend/app/billing/routes.py        checkout, webhook (Signatur-Pflicht), portal-link
backend/app/billing/sync.py          täglicher Abgleich (idempotent)
backend/app/export/service.py        MD→PDF-Rendering (Deckblatt, TOC, Seitenzahlen, ÄÖÜß)
backend/app/export/routes.py         POST /exports (+ Job-Status für große Pläne)
frontend/src/pages/Billing.jsx       Umbau auf Tiers + Quota
backend/tests/test_billing.py        Webhook-Idempotenz, Signatur, Tier-Übergänge
```

**Tech decisions (locked):**
- Stripe Checkout + Customer Portal — kein eigenes Karten-UI, kein PCI-Scope
- Tier-Wahrheit: `Workspace.tier`, geschrieben NUR vom Webhook/Abgleich (nie vom Frontend)
- PDF-Rendering serverseitig (z. B. WeasyPrint) — ein Werkzeug, im Deploy-Image verankert

**Patterns (mandatory):**
- Webhook verifiziert Signatur VOR jedem Parsing; unsigniert → 400 + Log
- Alle Webhook-Handler idempotent (event.id-Dedupe in eigener Collection)
- Export erzeugt UsageEvent (kind=export) — auch Exporte sind Aktivierungs-Signal

### ✅ Acceptance rubric
- [ ] Stripe-Testmodus: Free-Workspace → Checkout → Zahlung → Tier=pro in DB + UI in < 2 Minuten
- [ ] Webhook 2× zugestellt (Stripe-CLI resend) → genau EIN Tier-Wechsel, keine Dopplung
- [ ] Unsignierter Webhook-POST → 400, kein Zustandseffekt
- [ ] Kündigung im Portal → Tier bleibt pro bis Periodenende, dann free (Test mit verkürzter Test-Clock)
- [ ] past_due → Grace-Banner im UI, kein sofortiger Feature-Entzug
- [ ] Quota-Limits heben sich beim Upgrade sofort (Aufruf direkt nach Webhook funktioniert)
- [ ] Plan-Export als PDF: Deckblatt, Inhaltsverzeichnis, Seitenzahlen, ÄÖÜß korrekt (Sichtprüfung + automatisierter Text-Extrakt-Test)
- [ ] PDF-Fußzeile enthält klickbaren Link zur lebenden Version
- [ ] 50-Seiten-Plan exportiert < 30 s oder als Job mit Status
- [ ] Abgleichs-Job korrigiert einen absichtlich verpassten Webhook (Test: Webhook-Endpoint kurz deaktivieren)

### ⚠️ Edge cases
- Checkout in zwei Tabs: zweite Session läuft ins Leere, kein Doppel-Abo (Stripe-Kunde wiederverwenden)
- Webhook erreicht System vor Redirect-Rückkehr: Erfolgsseite pollt Tier statt ihn anzunehmen
- Nutzer exportiert leeren Plan: Kapitel als „in Arbeit" markiert, kein leeres Bank-PDF ohne Warnung

### ❌ Common pitfalls
- Don't: Tier im Frontend-State „optimistisch" setzen — die DB-Wahrheit kommt vom Webhook, alles andere erzeugt Support-Tickets.
- Don't: eigenes Rechnungs-/Kündigungs-UI bauen — Stripe Portal existiert genau dafür.
- Never: den Webhook-Endpoint ohne Signaturprüfung deployen — das ist eine offene Tier-Schreib-API.
- Don't: PDF im Browser rendern (html2canvas & Co.) — serverseitig ist reproduzierbar und bank-tauglich.

### 📊 Quality bar
- Checkout→aktiv Ende-zu-Ende < 2 min (3 Messungen) · Webhook-Handler p95 < 500 ms · 0 Signatur-Bypässe (Test) · PDF-Erzeugung 10-Seiten-Plan < 8 s

### 🛑 Stop and review
1. Stripe-Testmodus: Upgrade, Downgrade, Kündigung, past_due — alle vier Übergänge durchspielen, DB nach jedem prüfen. 2. Export des Staging-Plans ausdrucken/ansehen: Würdest du DAS einer Bank geben? 3. Webhook-Resend-Test. Erst wenn alle drei sauber sind, weiter.

---

## Build Step 11 — Frontend-Polish + Landingpage-Umbau

### 🎯 Goal
Jede Wedge-Seite hat explizite Empty/Loading/Error-Zustände, die Landingpage verkauft den Wedge-Pitch, und der E-Mail-Lifecycle (Willkommen, Tag-3, Limit, Win-back) läuft.

### 📍 Why this step is here
From blueprint stage 06 — die Zustands-Matrix ist spezifiziert; Polish VOR Launch, weil Beta-Nutzer (Step 07–10-Gates) genau an rohen Kanten abspringen. Braucht alle Features (05–10), sonst poliert man Bewegliches.

### 📥 Inputs
- Steps 05–10 bestanden; Beta-Feedback-Notizen aus den Gates
- Stage-06-Page-Specs als Checkliste (Empty/Loading/Error je Seite)
- E-Mail-Provider-Konto (Resend o. ä.), Absender-Domain verifiziert (SPF/DKIM)

### 📤 Outputs
- `<EmptyState>`, `<ErrorCard>`, Skeletons konsistent auf allen Wedge-Routen
- Landingpage: Wedge-Positionierung (Stage 02: „KI-Co-Founder"), Kern-Flow-Screenshots, Preise, FAQ
- 4 Lifecycle-Mails (deutsch, du-Form) über NotificationLog (kein Doppelversand)
- Mobile-Durchgang: Intake und Dashboard auf 375-px-Viewport sauber

### 🛠 Implementation details

**Files to create/touch:**
```
frontend/src/components/EmptyState.jsx, ErrorCard.jsx, Skeleton-Varianten
frontend/src/pages/Landing.jsx        Umbau auf Wedge-Pitch (bestehende Landing als Basis)
backend/app/notifications/…           Lifecycle-Trigger + Templates + NotificationLog
docs/copy/lifecycle-mails.md          die 4 Mail-Texte als Quelle der Wahrheit
```

**Tech decisions (locked):**
- E-Mail transaktional via API-Provider; KEIN Marketing-Automation-Tool im Wedge
- Landingpage bleibt Teil der SPA/statisch auf Netlify — kein separates CMS
- Fehlertexte deutsch, konkret, mit Handlungsoption („Erneut versuchen", „Support")

**Patterns (mandatory):**
- Kein `catch {}` das schluckt: jeder Fehlerpfad rendert ErrorCard oder Toast MIT Retry
- Jede Liste hat Empty-State mit CTA (nie „keine Daten")
- Lifecycle-Mails prüfen NotificationLog vor Versand (Idempotenz)

### ✅ Acceptance rubric
- [ ] Zustands-Matrix: 8 Wedge-Kernrouten × (empty/loading/error) manuell durchgetestet und abgehakt (24 Checks, Netzwerk-Drossel + leerer Testnutzer)
- [ ] Landingpage beantwortet „Warum nicht ChatGPT?" above-the-fold (Stage 02, Insight 1)
- [ ] Lighthouse: Landing ≥ 90 Performance/Accessibility (mobil), App-Kernrouten ≥ 80
- [ ] Willkommens-Mail kommt < 2 min nach Signup; Tag-3-Mail nur bei unfertigem Intake (Test mit gemocktem Datum)
- [ ] Limit-Mail verlinkt direkt in den Checkout (ein Klick vom Problem zur Lösung)
- [ ] Kein Doppelversand bei doppeltem Trigger (NotificationLog-Test)
- [ ] 375-px-Durchgang: Onboarding→Intake→Dashboard ohne horizontales Scrollen
- [ ] Alle sichtbaren Texte deutsch + du-Form (Stichprobe: 0 englische Restfetzen in Wedge-Routen)

### ⚠️ Edge cases
- Adblocker blockt Analytics: UI zeigt keine Fehler (track() fail-silent)
- E-Mail-Provider down: App-Fluss ungestört, Mails in Retry-Queue
- Langsame Verbindung (3G-Drossel): Skeletons statt weißer Seiten, kein Layout-Sprung

### ❌ Common pitfalls
- Don't: Polish mit Redesign verwechseln — Design-Tokens bleiben, nur Zustände + Copy werden vervollständigt.
- Don't: Marketing-Superlative auf die Landing („revolutionär") — die Persona ist skeptisch; Screenshot + konkreter Nutzen schlagen Adjektive.
- Never: Win-back-Mails ohne Abmelde-Möglichkeit — rechtlich (UWG/DSGVO) und reputativ ein Eigentor.
- Don't: neue Features „wo wir gerade dran sind" — dieser Schritt fügt NULL Features hinzu.

### 📊 Quality bar
- Lighthouse-Ziele oben · 0 unbehandelte Promise-Rejections in der Konsole über einen kompletten Kern-Flow · Mail-Zustellrate > 95 % (Provider-Dashboard)

### 🛑 Stop and review
1. Kompletter Kern-Flow auf gedrosseltem 3G + 375 px: erträglich? 2. Frischer Testnutzer: Signup→Mail da? Intake abbrechen→Tag-3-Mail (Datum gemockt)? 3. Landing einer fremden Person 10 Sekunden zeigen: Kann sie sagen, was Brandmind tut und für wen? Wenn nein — Copy nachschärfen. Erst dann weiter.

---

## Build Step 12 — Observability, Runbooks & Launch (Wurzel)

### 🎯 Goal
Produktion ist beobachtbar (Fehler, Kosten, Aktivierung), dokumentiert (Runbooks) und der öffentliche Launch ist durchgeführt — mit Rollback-Plan.

### 📍 Why this is the root
Alles davor macht das Produkt; dieser Schritt macht es betreibbar durch EINE Person (Stage 03, Bus-Faktor-Risiko). Launch ohne Observability heißt: der erste schlechte Tag bleibt unbemerkt, bis Kunden kündigen.

### 📥 Inputs
- Steps 01–11 bestanden; Beta-Aktivierung ≥ 30 % über 2 Wochen (Stage 07, Phase-2-Kriterium)
- Sentry-Projekt (Step 0-Basis) + Analytics-Dashboards angelegt
- Launch-Assets: Demo-Video 60 s, 5 SEO-Artikel, Community-Posts entworfen (Stage 07 Phase 2)

### 📤 Outputs
- Dashboards: Fehlerrate, p95-Latenz je Endpoint-Gruppe, LLM-Kosten/Tag, Aktivierungs-Funnel, MRR
- Alerts: health-Check rot > 5 min · Fehlerrate > 2 % · LLM-Tageskosten > Budget-Schwelle · Stripe-Webhook-Fehler
- `docs/runbooks/`: Deploy & Rollback · Provider-Ausfall · Mongo-Restore-Probe · Stripe-Abgleich · „App ist langsam"-Diagnose
- Launch durchgeführt: Communities + Product Hunt; Status-Checkliste abgearbeitet

### 🛠 Implementation details

**Files to create/touch:**
```
docs/runbooks/deploy-rollback.md      inkl. „letzten grünen Stand re-deployen" in < 10 min
docs/runbooks/llm-provider-down.md    Circuit-Breaker-Verhalten, manuelle Provider-Abschaltung
docs/runbooks/mongo-restore.md        Backup-Restore einmal ECHT geprobt, mit Zeitmessung
docs/runbooks/stripe-desync.md        Abgleich manuell anstoßen, Symptome erkennen
backend/app/core/logging.py           strukturierte Logs (workspace_id, skill_key, request_id)
```

**Tech decisions (locked):**
- Sentry (Fehler) + Analytics-Tool (Produkt) + Provider-Dashboards (Kosten) — keine Eigenbau-Metriken-Plattform
- Alerts nach E-Mail/Push an den Founder — wenige, dafür ernstgemeinte Schwellen
- Rollback = Redeploy des letzten grünen Commits (Render/Netlify halten Historie) — dokumentiert, geprobt

**Patterns (mandatory):**
- Jeder Incident endet mit einer Runbook-Zeile (Stage 07, Initiative Dokumentation)
- Wöchentlicher 30-min-Review: Aktivierungs-Funnel + Kosten/Workspace + Top-3-Fehler
- Feature-Arbeit pausiert, solange ein P0-Alert offen ist

### ✅ Acceptance rubric
- [ ] Absichtlicher Testfehler im Backend erscheint < 2 min in Sentry mit workspace_id-Kontext
- [ ] Rollback-Probe: absichtlich „kaputtes" Deploy → letzter grüner Stand live in < 10 min (gemessen)
- [ ] Mongo-Restore-Probe durchgeführt: Test-Restore in getrennte DB, Daten stichprobengeprüft, Dauer dokumentiert
- [ ] LLM-Kosten-Alert feuert bei künstlich gesenkter Schwelle
- [ ] Aktivierungs-Funnel-Dashboard zeigt die Stage-03-Metrik (Brain + Export ≤ 7 Tage) live
- [ ] Alle 5 Runbooks von einer „fremden" Perspektive gegengelesen (würde ein Vertreter sie ausführen können?)
- [ ] Launch-Checkliste (unten) vollständig abgehakt
- [ ] 48 h nach Launch: 0 offene P0, Fehlerrate < 2 %, Kosten im Budget

### ⚠️ Edge cases
- Launch-Traffic-Spike: Render-Instanz-Limits vorher prüfen; Funnel-Seiten (`/f/[slug]`) sind statisch genug zum Cachen
- Product-Hunt-Kommentare mit Bug-Reports: Triage-Fenster im Launch-Tag einplanen (keine Live-Fixes ohne CI!)
- Erster zahlender Kunde mit Problem: Support-Kanal (E-Mail) ist besetzt und im Produkt verlinkt

### ❌ Common pitfalls
- Don't: am Launch-Tag deployen, was nicht schon 48 h auf Staging lief.
- Don't: Alerts auf „alles" stellen — 20 Alarme/Tag = 0 Alarme/Tag (Abstumpfung).
- Never: Backups haben, die nie restored wurden — ungeprobte Backups sind Hoffnung, keine Absicherung.
- Don't: Launch verschieben, um „noch ein Feature" zu shippen — die Exit-Kriterien aus Stage 07 sind erfüllt oder nicht.

### 📊 Quality bar
- Uptime-Ziel 99,5 %/Monat (gemessen via Health-Ping) · Alert-Reaktionsweg dokumentiert < 30 min · Fehlerrate < 2 % · Kosten/aktiver Workspace wöchentlich im Review

### 🛑 Stop and review
1. Rollback-Probe und Restore-Probe WIRKLICH ausführen (nicht nur lesen). 2. Eine Woche Staging-Betrieb mit Beta-Nutzern: Dashboards täglich prüfen — verstehst du, was du siehst? 3. Launch-Checkliste durchgehen. Dann: launchen.

---

## Final ship checklist

- [ ] CI grün, Branch-Protection aktiv, Deploy-Smoke (health=200) automatisch
- [ ] Ein Auth-/Workspace-Pfad; Grep-Checks aus Step 02/03/04 alle sauber
- [ ] Free-Tier-Deckel nachweislich aktiv; Kosten-Dashboard zeigt Tageswerte
- [ ] Neuer Nutzer: Signup → Pfadwahl → Intake → Ideen → Vergleich → Plan → Copywriter → Export in einer Sitzung möglich
- [ ] Brain-Badge in Studios sichtbar; A/B-Beweis (mit/ohne Brain) dokumentiert
- [ ] Stripe: alle 4 Tier-Übergänge im Testmodus verifiziert, Webhook signiert + idempotent
- [ ] PDF-Export bank-tauglich (Sichtprüfung durch eine zweite Person)
- [ ] 24 Zustands-Checks (8 Routen × 3 Zustände) abgehakt
- [ ] 4 Lifecycle-Mails live, Abmeldung funktioniert
- [ ] Lighthouse: Landing ≥ 90, App-Kernrouten ≥ 80
- [ ] Sentry + Aktivierungs-Funnel + Kosten-Alert live
- [ ] Rollback- und Restore-Probe durchgeführt (mit Zeiten dokumentiert)
- [ ] 5 Runbooks vorhanden und gegengelesen
- [ ] Launch-Posts + Demo-Video bereit; Support-Kanal besetzt

## What to do when a step fails

1. **Nicht vorspringen.** Jeder Schritt ist Fundament des nächsten — Überspringen erzeugt Schulden, die 10× teurer zurückkommen.
2. **Die Abhängigkeit erneut lesen.** Die meisten Fehler stammen aus einem verfehlten Input des Vorschritts (📥-Liste prüfen).
3. **Zuerst die Pitfalls-Liste checken** — sie existiert, weil dort schon jemand einen Bug geshippt hat.
4. **Das fehlschlagende Rubrik-Item bisektieren:** kleinste Änderung finden, die es brach; notfalls revertieren (CI aus Step 01 macht Revert billig).
5. **Wenn festgefahren:** das fehlschlagende Rubrik-Item in Claude Code einfügen und diese Datei (`08-build-playbook.md`) samt betroffener Blueprint-Stage referenzieren — der Kontext ist die halbe Lösung.

## Why this playbook is different from generic build prompts

Dieses Playbook ist projekt-spezifisch: Es referenziert die echten Entitäten (BrandProfile, FounderProject, UsageEvent aus Stage 04), die echten Feature-IDs (F-03 bis F-14 aus Stage 05), den echten Bestandscode (`app/services/llm.py`, `FounderIntake.jsx`, ROADMAP-Sprint-0-Stände) und den Wedge aus Stage 02. Ein generisches Playbook würde ein zweites, neues Produkt neben das bestehende bauen — dieses hier härtet und verengt, was existiert.

Es sequenziert von Blatt zu Wurzel: CI vor Auth, Auth vor Daten, Daten vor Metering, Metering vor jedem LLM-Feature — weil das Kostenrisiko (Stage 03, Risiko Nr. 1) sonst mit jedem Feature wächst. Kein Schritt ist optional; was optional wäre, steht im Backlog von Stage 05.

Und es gated: Jede Rubrik ist ein Test, der besteht oder nicht. Die Stop-and-review-Sequenzen sind aktive Handlungen (Browser-Kill, Webhook-Resend, Restore-Probe), keine Gefühle. If a step feels generic, you're missing context — re-read the relevant blueprint stage first.

## Future expansions (nach dem Launch, NICHT Teil dieser Sequenz)

- AI Marketing Director MVP (Stage 07, Phase 4 — Workflow-Engine orchestriert die dann stabilen Skills)
- Marken-Import F-16 (Business-Anker, Phase 3), E-Mail-Studio F-15, Finanzplan F-12/Angebote F-13 falls nicht schon in Phase 2 gezogen
- Worker-Prozess-Auslagerung, Mongo-Index-Audit, Bundle-Split (Stage 07, Phase 4)
