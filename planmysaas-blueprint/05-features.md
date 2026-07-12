# Feature specifications — Brandmind

## Summary

- Total features: 16 (+ Backlog)
- Modules covered: Identity, Workspace/Permissions, Brand Brain, Founder Journey, Skills Engine, Content, Funnel, Export, Usage Metering, Billing, Brand Import
- Coverage: 100 % der Architektur-Module haben mindestens 1 Feature-Spec

## Feature index

| ID | Modul | Titel | Priority | Effort |
|---|---|---|---|---|
| F-01 | Identity | Registrierung & Login | P0 | 2 Tage |
| F-02 | Workspace | Workspace-, Tier- & Quota-Kontext | P0 | 2 Tage |
| F-03 | Founder Journey | Onboarding mit Pfadwahl | P0 | 3 Tage |
| F-04 | Brand Brain | Brand Brain einrichten & pflegen | P0 | 5 Tage |
| F-05 | Founder Journey | Founder-Intake | P0 | 3 Tage |
| F-06 | Founder Journey | Ideen-Vergleich mit Scoring | P0 | 3 Tage |
| F-07 | Founder Journey | Businessplan-Generator | P0 | 7 Tage |
| F-08 | Skills Engine | Copywriter-Studio mit Brand-Injektion | P0 | 4 Tage |
| F-09 | Usage Metering | Nutzungsmetering & Free-Limits | P0 | 4 Tage |
| F-10 | Billing | Stripe-Abo & Upgrade-Flow | P0 | 3 Tage |
| F-11 | Founder Journey | Ideen-Generator | P1 | 2 Tage |
| F-12 | Founder Journey | Finanzplan | P1 | 5 Tage |
| F-13 | Founder Journey | Angebots-Baukasten | P1 | 3 Tage |
| F-14 | Export | Export Center (MD/PDF) | P1 | 3 Tage |
| F-15 | Content | E-Mail-Studio | P2 | 3 Tage |
| F-16 | Brand Import | Marken-Import (Business) | P2 | 7 Tage |

---

### F-01 · Registrierung & Login

**Module:** Identity · **Primary actor:** Lena · **Secondary:** Markus
**Priority:** P0 · **Effort:** 2 Tage (Bestand härten, nicht neu bauen)

#### Purpose
Zugang zum Produkt; Basis für Workspace- und Tier-Logik. Löst kein Nutzerproblem, aber jedes Feature hängt daran.

#### User flow
```
1. Nutzerin öffnet /auth
2. Wählt „Registrieren", gibt E-Mail + Passwort ein
3. System legt User + Default-Workspace (tier=free) an
4. System stellt JWT aus, leitet zu /onboarding weiter
5. Alternativ: „Login" → JWT → zurück zur zuletzt besuchten Seite
6. Alternate: Passwort vergessen → Reset-Mail → neues Passwort → Login
```

#### Acceptance criteria
- [ ] User kann sich mit E-Mail + Passwort (≥ 10 Zeichen) registrieren
- [ ] Doppelte E-Mail liefert klaren Fehler, keinen 500
- [ ] JWT läuft ab und Refresh/Neu-Login funktioniert ohne Datenverlust im Formular
- [ ] Passwort-Reset-Link ist einmalig gültig und läuft nach 60 Min. ab
- [ ] Login-Versuche sind rate-limitiert (z. B. 5/Minute/IP)

#### Edge cases
- Registrierung mit existierender, aber nie bestätigter E-Mail · Reset-Link doppelt geklickt · JWT-Secret-Rotation invalidiert Sessions kontrolliert

#### Telemetry events
`auth_registered`, `auth_login`, `auth_reset_requested`

---

### F-02 · Workspace-, Tier- & Quota-Kontext

**Module:** Workspace/Permissions · **Primary actor:** System/alle Personas
**Priority:** P0 · **Effort:** 2 Tage

#### Purpose
Ein einziger `current_user`/`current_workspace`-Pfad (ROADMAP 0.5), an dem Tier und Quota hängen — Voraussetzung für Metering und Billing.

#### User flow
```
1. Frontend ruft nach Login GET /api/workspaces/current
2. System liefert Workspace, tier, Quota-Stand, Brain-Completeness
3. Jede Studio-/Journey-Aktion sendet implizit den Workspace-Kontext
4. Bei Tier-Wechsel (Stripe-Webhook) aktualisiert sich der Kontext ohne Re-Login
5. Alternate: Quota erschöpft → Antwort enthält quota_exceeded → UI zeigt Upgrade-Hinweis
```

#### Acceptance criteria
- [ ] Jeder geschützte Endpoint löst User + Workspace über genau eine Dependency auf
- [ ] Tier-Änderung via Stripe ist ≤ 60 s nach Webhook im Kontext sichtbar
- [ ] Quota-Stand (verbraucht/Limit) ist im Response von /workspaces/current enthalten
- [ ] Zugriff auf fremden Workspace liefert 403, nie 500
- [ ] Es existiert kein zweiter, alter Auth-Pfad mehr (Grep-Check in CI)

#### Edge cases
- Webhook kommt vor DB-Commit des Checkouts · Nutzer ohne Workspace (Migration Altbestand) · gleichzeitige Requests beim Tier-Wechsel

#### Telemetry events
`workspace_loaded`, `quota_blocked`

---

### F-03 · Onboarding mit Pfadwahl

**Module:** Founder Journey · **Primary actor:** Lena · **Secondary:** Markus
**Priority:** P0 · **Effort:** 3 Tage

#### Purpose
Löst Problem-Cluster 2 („Reihenfolge") und Insight 3 (Breite erschlägt): Neue Nutzer sehen zwei Pfade statt 30 Seiten — „Ich gründe" vs. „Ich habe schon ein Unternehmen".

#### User flow
```
1. Nach Registrierung landet Nutzerin auf /onboarding (FounderPathSelect)
2. Wählt „Ich gründe" → FounderProject (path=gruendung) wird angelegt
3. System führt direkt in den Founder-Intake (F-05)
4. Alternativ „Bestehendes Unternehmen" → Brand-Brain-Setup (F-04), Business-Tier-Hinweis für Import
5. Sidebar zeigt nur den gewählten Pfad + „Mehr entdecken" (eingeklappt)
6. Alternate: Abbruch mittendrin → Fortschritt gespeichert, Wiedereinstieg an gleicher Stelle
```

#### Acceptance criteria
- [ ] Neuer Nutzer sieht nach Signup genau 2 primäre Optionen, nicht das volle Menü
- [ ] Pfadwahl ist jederzeit umkehrbar, ohne Datenverlust im anderen Pfad
- [ ] Wiedereinstieg (Logout/Login) setzt exakt an der letzten Stage fort
- [ ] Aktivierungs-Events feuern (siehe Telemetry) und landen im Analytics-Tool
- [ ] Vollständige Navigation bleibt über „Mehr" erreichbar (kein Feature gelöscht)

#### Edge cases
- Bestandsnutzer vor Einführung der Pfadwahl (Default: „Mehr"-Ansicht) · zwei Projekte parallel · Deep-Link auf verborgene Seite

#### Telemetry events
`onboarding_path_selected`, `onboarding_completed`, `activation_step` (Kernmetrik aus Stage 03)

---

### F-04 · Brand Brain einrichten & pflegen

**Module:** Brand Brain · **Primary actor:** Lena · **Secondary:** Sarah
**Priority:** P0 · **Effort:** 5 Tage

#### Purpose
Der Differenzierer (Marktlücke 1): ein persistentes Markenprofil, das jede KI-Funktion automatisch speist — „ich erkläre nie wieder bei null".

#### User flow
```
1. Nutzerin öffnet /brand-brain (aus Onboarding oder Sidebar)
2. Geführtes Formular: Positionierung → Zielgruppe → Tonalität → Visuals
3. Jeder Abschnitt bietet „Mit KI vorschlagen" (nutzt Intake-/Journey-Daten)
4. System berechnet completeness (0–100) und zeigt sie als Fortschrittsring
5. Nutzerin speichert; Brain-Snapshot ist ab sofort in jedem Skill-Aufruf
6. Alternate: Journey-Ergebnisse (z. B. gewählte Idee) schreiben Facts ins Brain zurück
```

#### Acceptance criteria
- [ ] Brain-Daten werden bei jedem Skill-Run nachweislich injiziert (sichtbar im Run-Log)
- [ ] Completeness-Score aktualisiert sich live und stimmt mit gefüllten Feldern überein
- [ ] KI-Vorschläge überschreiben nie stillschweigend manuelle Eingaben (immer Diff/Bestätigen)
- [ ] Studio-Output zeigt Badge „erstellt mit deinem Markenprofil (Stand: Datum)"
- [ ] Brain ist pro Workspace genau einmal vorhanden (Unique-Index greift)

#### Edge cases
- Leeres Brain beim ersten Studio-Besuch (Hinweis statt generischem Output) · sehr lange Freitexte (Kontext-Budget kappen, wichtigste Felder priorisieren) · gleichzeitiges Editieren in zwei Tabs

#### Telemetry events
`brain_section_saved`, `brain_completed`, `brain_injected` (pro Skill-Run)

---

### F-05 · Founder-Intake

**Module:** Founder Journey · **Primary actor:** Lena
**Priority:** P0 · **Effort:** 3 Tage

#### Purpose
Strukturierte Aufnahme (Situation, Fähigkeiten, Ressourcen, Ziele) als Datenbasis für Ideen, Vergleich und Plan — löst „ich weiß nicht, wo anfangen".

#### User flow
```
1. Nutzerin startet Intake (aus Onboarding)
2. 8–12 Fragen in Schritten (eine Frage pro Screen, Fortschrittsleiste)
3. Antworten speichern sich pro Schritt (kein Verlust bei Abbruch)
4. Abschluss-Screen fasst Profil zusammen, KI ergänzt Hypothesen
5. CTA: „Ideen finden" (F-11) oder „Ideen vergleichen" (F-06) falls Ideen mitgebracht
6. Alternate: Nutzerin überspringt Fragen → als „offen" markiert, später nachholbar
```

#### Acceptance criteria
- [ ] Jeder Schritt persistiert einzeln (Reload verliert maximal die aktuelle Antwort)
- [ ] Zusammenfassung referenziert die tatsächlichen Antworten (Stichproben-Check)
- [ ] Intake-Daten fließen als Facts ins Brand Brain (source=journey)
- [ ] Abschlussrate des Intakes ist als Funnel im Analytics sichtbar
- [ ] Zurück-Navigation ändert Antworten, ohne Folge-Antworten zu löschen

#### Edge cases
- Abbruch nach Frage 1 (Win-back-Mail Tag 3) · widersprüchliche Antworten (KI fragt nach statt rät) · Copy-paste von sehr langen Texten

#### Telemetry events
`intake_started`, `intake_step_completed`, `intake_finished`

---

### F-06 · Ideen-Vergleich mit Scoring

**Module:** Founder Journey · **Primary actor:** Lena
**Priority:** P0 · **Effort:** 3 Tage

#### Purpose
Entscheidungshilfe zwischen 2–5 Ideen mit transparentem Scoring (Markt, Machbarkeit, Gründer-Fit) — direkt gegen Problem-Cluster 2 („drei Ideen, keine Methode").

#### User flow
```
1. Nutzerin öffnet Ideen-Vergleich mit ≥ 2 Ideen (aus F-11 oder manuell)
2. System scored jede Idee je Dimension 1–10 mit Begründung (Intake als Kontext)
3. Vergleichstabelle + Empfehlung mit klarer Begründung
4. Nutzerin markiert eine Idee als „gewählt"
5. Gewählte Idee schreibt Positionierungs-Fact ins Brand Brain
6. CTA: „Businessplan starten" (F-07)
7. Alternate: Nutzerin widerspricht dem Scoring → passt Gewichte an, Score rechnet neu
```

#### Acceptance criteria
- [ ] Scoring liefert je Dimension eine Begründung, die Intake-Daten zitiert
- [ ] Gewichte sind verstellbar und die Rangfolge reagiert korrekt
- [ ] „Gewählt"-Status ist idempotent und exklusiv (genau eine gewählte Idee pro Projekt)
- [ ] Vergleich mit nur 1 Idee ist blockiert mit hilfreicher Meldung
- [ ] Ergebnis ist als Teil des Projekts exportierbar (F-14)

#### Edge cases
- 5+ Ideen (UI bleibt lesbar, Rest paginiert) · LLM-Ausfall mitten im Scoring (Teilergebnis + Retry pro Idee) · identische Ideen

#### Telemetry events
`ideas_compared`, `idea_chosen`

---

### F-07 · Businessplan-Generator

**Module:** Founder Journey · **Primary actor:** Lena
**Priority:** P0 · **Effort:** 7 Tage

#### Purpose
Kapitelweiser Businessplan (deutsches Gliederungs-Schema: Geschäftsmodell, Markt, Marketing, Organisation/Rechtsform, Finanzen) aus Intake + gewählter Idee — das Herz des Wedge.

#### User flow
```
1. Nutzerin startet Plan aus gewählter Idee
2. System zeigt Kapitelstruktur mit Status (leer/entwurf/fertig)
3. Pro Kapitel: „Generieren" → Langlauf-Job → Entwurf erscheint (Streaming/Polling)
4. Nutzerin editiert im Markdown-Editor, markiert Kapitel als „fertig"
5. Finanz-Kapitel verlinkt in den Finanzplan (F-12)
6. Export als Dokument (F-14)
7. Alternate: Kapitel neu generieren mit Feedback-Hinweis („kürzer", „formeller")
```

#### Acceptance criteria
- [ ] Kapitel generieren einzeln (kein Alles-oder-nichts-Lauf > 60 s Request)
- [ ] Manuelle Edits überleben eine Neu-Generierung anderer Kapitel
- [ ] Deutsche Rechtsformen (UG, GmbH, Einzelunternehmen, GbR) werden korrekt behandelt
- [ ] Plan-Versionen sind nachvollziehbar (version inkrementiert bei Struktur-Änderung)
- [ ] Generierung bricht bei Quota-Ende sauber ab (Hinweis, kein halbes Kapitel gespeichert)

#### Edge cases
- Sehr dünner Intake (KI stellt Rückfragen statt zu halluzinieren) · gleichzeitige Generierung zweier Kapitel · Nutzer löscht gewählte Idee nach Planstart

#### Telemetry events
`plan_chapter_generated`, `plan_chapter_completed`, `plan_exported`

---

### F-08 · Copywriter-Studio mit Brand-Injektion

**Module:** Skills Engine / Content · **Primary actor:** Sarah · **Secondary:** Lena
**Priority:** P0 · **Effort:** 4 Tage

#### Purpose
Das erste Studio, das den Brain-Wert beweist: Texte (Website, Social, Anzeigen) in Markensprache — Problem-Cluster 1 („nichts klingt nach mir").

#### User flow
```
1. Nutzerin öffnet Copywriter, wählt Format (Landingpage-Sektion, LinkedIn-Post, Anzeige)
2. Gibt Thema/Ziel ein; Brain-Kontext wird automatisch angehängt (sichtbares Badge)
3. System liefert 2–3 Varianten in Markensprache
4. Nutzerin verfeinert („kürzer", „mehr Du-Form") im gleichen Thread
5. Speichert Ergebnis als ContentItem (mit brandSnapshot)
6. Alternate: Brain leer → Studio bietet 2-Minuten-Brain-Quickstart an, statt generisch zu texten
```

#### Acceptance criteria
- [ ] Output verwendet Tonalitäts-Attribute aus dem Brain nachweislich (Run-Log zeigt injizierten Kontext)
- [ ] Varianten unterscheiden sich substanziell (nicht nur Synonyme)
- [ ] Verfeinerung behält Thema + Brand-Kontext über min. 5 Runden
- [ ] Gespeicherte Items erscheinen in der Content-Liste mit Studio-Filter
- [ ] Jeder Run erzeugt genau ein UsageEvent mit Token-Zahlen

#### Edge cases
- Extrem lange Eingaben (Kappung mit Hinweis) · Marken-Ton widerspricht Format (Anzeige will knapp, Ton ist blumig → KI benennt den Konflikt) · Provider-Fallback mitten im Thread

#### Telemetry events
`studio_run` (studio=copywriter), `content_saved`, `brain_quickstart_shown`

---

### F-09 · Nutzungsmetering & Free-Limits

**Module:** Usage Metering · **Primary actor:** System · **Secondary:** alle Personas
**Priority:** P0 · **Effort:** 4 Tage

#### Purpose
Existenzsicherung (Risiko Nr. 1 aus Stage 03): LLM-Verbrauch pro Workspace zählen, Free-Tier hart deckeln, Pro fair begrenzen, Kosten sichtbar machen.

#### User flow
```
1. Jeder LLM-Aufruf schreibt ein UsageEvent (tokens, costEstimate, period)
2. Gateway prüft vor jedem Aufruf den Quota-Stand des Workspace
3. Free-Nutzer bei 80 %: Banner „Limit fast erreicht" mit Upgrade-CTA
4. Bei 100 %: Aufrufe blockiert, klare Meldung + Upgrade-Pfad (kein stiller Fehler)
5. Founder-Sicht: internes Dashboard Kosten/Workspace/Monat
6. Alternate: Monatswechsel setzt Quota zurück (period-basiert, kein Cron nötig)
```

#### Acceptance criteria
- [ ] Kein LLM-Aufruf ohne UsageEvent (Gateway ist der einzige Pfad zu Providern)
- [ ] Free-Tier wird bei Limit zuverlässig blockiert (Test: 1 Aufruf über Limit → 402/Upgrade-Hinweis)
- [ ] Free-Tier routet auf günstige Modelle (Modellwahl im Run-Log prüfbar)
- [ ] Quota-Anzeige im UI weicht max. 1 Aufruf vom Server-Stand ab
- [ ] Kosten-Schätzung pro Workspace/Monat auf ±20 % genau (Stichprobe gegen Provider-Abrechnung)

#### Edge cases
- Parallele Aufrufe am Limit (leichtes Überlaufen tolerieren, nie doppelt blocken) · fehlgeschlagene Runs (zählen Input-Tokens, markiert als fehler) · Tier-Upgrade mitten im Monat (Limit sofort anheben)

#### Telemetry events
`quota_warning_shown`, `quota_blocked`, `usage_aggregated`

---

### F-10 · Stripe-Abo & Upgrade-Flow

**Module:** Billing · **Primary actor:** Lena (zahlend) · **Secondary:** Markus
**Priority:** P0 · **Effort:** 3 Tage (Bestand auf Tiers ausrichten)

#### Purpose
Umsatz: Free→Pro→Business-Upgrades über Stripe Checkout, Tier-Status als einzige Wahrheit am Workspace.

#### User flow
```
1. Nutzerin klickt Upgrade (aus Quota-Banner, Billing-Seite oder Business-Feature)
2. POST /api/billing/checkout → Stripe-Checkout-Session → Redirect
3. Zahlung → Stripe-Webhook → Subscription + Workspace.tier aktualisiert
4. Rückkehr-URL zeigt Erfolg + neue Limits
5. Alternate: Zahlung abgebrochen → zurück ohne Änderung, Event getrackt
6. Alternate: Zahlungsausfall später → status=past_due → Grace-Banner, nach 14 Tagen Downgrade
```

#### Acceptance criteria
- [ ] Checkout→aktives Pro-Tier dauert Ende-zu-Ende < 2 Minuten
- [ ] Webhook-Signatur wird verifiziert; unsignierte Requests → 400
- [ ] Doppelte Webhooks sind idempotent (kein doppeltes Tier-Event)
- [ ] Kündigung setzt Tier erst zum Periodenende zurück
- [ ] Täglicher Abgleich korrigiert verpasste Webhooks (Log beweist Lauf)

#### Edge cases
- Nutzer kauft in zwei Tabs · Webhook vor Redirect-Rückkehr · Wechsel Pro↔Business (Proration)

#### Telemetry events
`checkout_started`, `subscription_activated`, `subscription_churned`

---

### F-11 · Ideen-Generator

**Module:** Founder Journey · **Priority:** P1 · **Effort:** 2 Tage
**Primary actor:** Lena

#### Purpose
Für Nutzer ohne fertige Idee: Vorschläge aus Intake-Profil (Fähigkeiten × Markt-Lücken), Einstieg in F-06.

#### User flow
```
1. Aus Intake-Abschluss: „Ideen finden"
2. System generiert 3–5 Ideen mit Kurzbegründung (Bezug auf Intake-Antworten)
3. Nutzerin verwirft/behält, fordert Nachschub gezielt an („mehr Richtung B2B")
4. Behaltene Ideen landen im Projekt (status=entwurf)
5. Alternate: eigene Idee manuell hinzufügen
```

#### Acceptance criteria
- [ ] Jede Idee referenziert min. 1 konkrete Intake-Antwort
- [ ] Nachschub-Anforderung respektiert die Richtungs-Vorgabe
- [ ] Verworfene Ideen tauchen nicht erneut auf (Session-Gedächtnis)
- [ ] Manuell + generiert sind im Vergleich gleichberechtigt

#### Edge cases
- Intake fast leer (erst Fragen nachholen) · 20+ behaltene Ideen (sanftes Limit mit Hinweis)

#### Telemetry events
`ideas_generated`, `idea_kept`

---

### F-12 · Finanzplan

**Module:** Founder Journey · **Priority:** P1 · **Effort:** 5 Tage
**Primary actor:** Lena

#### Purpose
Einfacher 36-Monats-Finanzplan (Umsatz, Kosten, Liquidität) mit deutschen Spezifika (Kleinunternehmerregelung, Gründungszuschuss als Hinweis) — konsolidiert die 5 Finanz-Studios im Wedge auf eines.

#### User flow
```
1. Aus Plan-Kapitel „Finanzen" oder Sidebar
2. Geführte Annahmen: Preis (aus F-13-Angeboten vorausgefüllt), Menge, Fixkosten
3. System rechnet Tabellen + einfache Charts, KI kommentiert Plausibilität
4. Werte editierbar; Neuberechnung live
5. Ergebnis fließt ins Businessplan-Finanzkapitel
6. Alternate: Szenario kopieren (vorsichtig/realistisch/optimistisch)
```

#### Acceptance criteria
- [ ] Rechenlogik ist deterministisch (kein LLM in der Mathematik)
- [ ] KI-Plausibilitäts-Kommentar bezieht sich auf konkrete Zellwerte
- [ ] Szenarien sind unabhängig editierbar
- [ ] Kleinunternehmerregelung-Schalter ändert USt-Behandlung korrekt
- [ ] Export enthält Tabellen in lesbarer Form (F-14)

#### Edge cases
- Negative Liquidität (deutlich markieren, nicht verstecken) · absurde Eingaben (Validierung an Systemgrenze) · Währung fix EUR

#### Telemetry events
`finance_plan_created`, `finance_scenario_added`

---

### F-13 · Angebots-Baukasten

**Module:** Founder Journey · **Priority:** P1 · **Effort:** 3 Tage
**Primary actor:** Lena

#### Purpose
Aus Idee + Zielgruppe konkrete Angebote mit Preisstruktur formen — die Brücke von Plan zu erstem Umsatz.

#### User flow
```
1. Aus Journey-Stage „Angebote"
2. KI schlägt 2–3 Angebots-Pakete vor (Name, Leistungsumfang, Preislogik) auf Basis Brain + Plan
3. Nutzerin editiert Pakete, legt Preise fest
4. Angebot als Beschreibung exportierbar; Facts (Kernangebot, Preisanker) ins Brain
5. Alternate: von Null manuell anlegen
```

#### Acceptance criteria
- [ ] Vorschläge nutzen Zielgruppen- und Positionierungs-Daten aus dem Brain
- [ ] Preisfelder validieren (Zahl, EUR, ≥ 0) an der API-Grenze
- [ ] Gewähltes Kernangebot ist im Brain als Fact sichtbar
- [ ] Copywriter (F-08) kann ein Angebot als Kontext referenzieren

#### Edge cases
- Dienstleistung vs. Produkt (unterschiedliche Preislogik-Templates) · 10+ Pakete (UI-Grenze)

#### Telemetry events
`offer_generated`, `offer_finalized`

---

### F-14 · Export Center (MD/PDF)

**Module:** Export · **Priority:** P1 · **Effort:** 3 Tage
**Primary actor:** Lena · **Secondary:** Bank/Berater (Empfänger)

#### Purpose
Businessplan, Angebote und Content als Markdown/PDF ausgeben — mit Rückverlinkung, damit das Dokument lebt statt im PDF-Friedhof zu enden (Insight 4).

#### User flow
```
1. Nutzerin klickt Export auf Plan/Angebot/Content
2. Wählt Format (PDF für Bank, MD für Weiterbearbeitung)
3. System rendert serverseitig, bietet Download
4. Fußzeile: „Lebende Version in Brandmind" + Link
5. Alternate: Export erneut nach Änderungen → Version 2, alte bleibt abrufbar
```

#### Acceptance criteria
- [ ] PDF ist bank-tauglich formatiert (Deckblatt, Inhaltsverzeichnis, Seitenzahlen)
- [ ] Umlaute/Sonderzeichen korrekt in PDF (ÄÖÜß-Test)
- [ ] Export erzeugt UsageEvent (kind=export)
- [ ] Große Pläne (50+ Seiten) exportieren < 30 s oder laufen als Job mit Status

#### Edge cases
- Leere Kapitel (als „in Arbeit" markiert, nicht leer gedruckt) · Bilder/Logos fehlen (Platzhalter)

#### Telemetry events
`export_created` (format, artefakt)

---

### F-15 · E-Mail-Studio

**Module:** Content · **Priority:** P2 · **Effort:** 3 Tage
**Primary actor:** Sarah

#### Purpose
Zweites Studio nach Copywriter: Newsletter/Sequenzen in Markensprache — Retention-Feature nach bewiesenem Kern.

#### User flow
```
1. Format wählen (einzelner Newsletter, 3-teilige Willkommens-Sequenz)
2. Ziel + Anlass eingeben; Brain-Kontext automatisch
3. Entwurf mit Betreff-Varianten (3) und Preheader
4. Verfeinern, speichern als ContentItem, Copy-out (kein eigener Versand im Wedge)
```

#### Acceptance criteria
- [ ] Betreff-Varianten unterscheiden sich im Ansatz (Neugier/Nutzen/Dringlichkeit)
- [ ] Sequenz-Mails referenzieren einander (kein Episoden-Bruch)
- [ ] Kein E-Mail-Versand im Produkt (Anti-Scope: Copy-out reicht)

#### Edge cases
- Sehr formeller Marken-Ton in Marketing-Mail (Konflikt benennen)

#### Telemetry events
`studio_run` (studio=email), `content_saved`

---

### F-16 · Marken-Import (Business)

**Module:** Brand Import · **Priority:** P2 · **Effort:** 7 Tage
**Primary actor:** Markus

#### Purpose
Bestehende Unternehmen laden ihre Marke (Website-URL, Logo, Dokumente); System extrahiert Brain-Vorschläge — der Business-Tier-Anker (Marktlücke 4).

#### User flow
```
1. Markus wählt Onboarding-Pfad „Bestehendes Unternehmen", Business-Tier aktiv
2. Gibt Website-URL ein, lädt Logo/Dokumente hoch
3. Import-Job crawlt, extrahiert Positionierung/Ton/Farben als Vorschläge
4. Markus reviewt Vorschläge (Diff-Ansicht), übernimmt selektiv ins Brain
5. Alternate: Import teilweise fehlgeschlagen → Teilergebnis + manuelle Ergänzung
```

#### Acceptance criteria
- [ ] Import läuft async mit sichtbarem Status (nie eingefrorenes UI)
- [ ] Kein Vorschlag wird ohne Bestätigung ins Brain geschrieben
- [ ] Extraktion nennt Quellen (welche Seite/welches Dokument)
- [ ] Free/Pro sehen das Feature mit Business-Upgrade-Hinweis (kein 404)
- [ ] Robots.txt wird respektiert; nur die angegebene Domain wird gecrawlt

#### Edge cases
- JS-lastige Websites (Fallback: Nutzer pastet Texte) · sehr große Sites (Seitenlimit) · fremde URL eingegeben (Bestätigungs-Hinweis)

#### Telemetry events
`import_started`, `import_reviewed`, `import_applied`

---

## Backlog (bewusst NICHT im Wedge)

- **AI Marketing Director** — Nordstern; braucht F-04, F-08, F-09, Workflow-Engine stabil (Stage 07, Phase 4)
- **Content-Kalender & Automationen** — Retention-Ausbau nach PMF-Signal
- **Team-Workspaces / Multi-User** — Business-Ausbau
- **Design-Studio-Ausbau, Character Studio, Chat-Arenen-Konsolidierung** — hinter Feature-Flag halten
- **API/Zapier, Mehrsprachigkeit (EN)** — nach 20k € MRR (Anti-Goals Stage 01)
