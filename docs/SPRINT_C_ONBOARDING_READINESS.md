# Sprint C – Onboarding & Brand Readiness

## 1. Ziel
Sprint C ergänzt einen geführten Ersteinstieg, persistierten Onboarding-Fortschritt, einen deterministischen Brand-Readiness-Score und drei schnelle Quantum-Startpunkte. Sprint D/E-Themen wie vollständige Legacy-Bereinigung, Security-Audit oder Early-Access-Backendformular bleiben ausgeklammert.

## 2. Vorhandene Ausgangslage
Brandmind besitzt bereits Auth, Workspace-Header, Brands, Brand Brain, Brand Identity, Knowledge Base, Mission Control, Output Factory und Founder-Journey-Endpunkte. Nutzer-, Workspace- und Brand-Kontext werden über `AppContext`, Bearer Token und `X-Workspace-Id` gesetzt.

## 3. Drei Onboarding-Pfade
- `existing_brand`: nutzt Brand Brain, Brand Identity und Knowledge Base.
- `founder`: nutzt die bestehenden Founder-Seiten von Intake bis Operations.
- `explore`: speichert keine Demo-Markendaten und zeigt eine kompakte Home-Checkliste.

## 4. Statusmodell
Collection: `onboarding_status`. Scope: `user_id` + `workspace_id`. Felder: `status`, `selected_path`, `current_step`, `completed_steps`, `started_at`, `updated_at`, `completed_at`, `skipped_at`.

## 5. Redirect- und Wiederaufnahmelogik
Neue Registrierungen landen auf `/onboarding/select-path`. Bestehende Logins landen weiter auf `/app`; dort erscheint nur ein nicht blockierender Fortsetzen-Hinweis. `resume_route` wird serverseitig aus Pfad und Schritt abgeleitet.

## 6. Bestehende Marke
Der Pfad führt nach `/brand-brain` und danach zu bestehenden Markenflächen. Es wurden keine parallelen Formulare für dieselben Markendaten eingeführt.

## 7. Founder Journey
Die Founder-Seiten erhalten eine konsistente Fortschrittsleiste. Der aktuelle Schritt wird über `/api/onboarding/status` gespeichert. Business- und Finanzplan zeigen einen Entwurfs-/Beratungshinweis.

## 8. Explore-Pfad
Explore wird auf Home als kompakte Checkliste mit maximal fünf Stationen umgesetzt: Home, Quantum, Meine Marke, Erstellen, Projekte. Es werden keine simulierten KPIs oder Markendaten gespeichert.

## 9. Brand-Readiness-Kategorien
1. Grundlagen
2. Zielgruppe
3. Positionierung
4. Angebot
5. Persönlichkeit
6. Visuelle Identität
7. Marketingausrichtung
8. Markenwissen

## 10. Vollständige Gewichtung
- Grundlagen: 14 Punkte
- Zielgruppe: 14 Punkte
- Positionierung: 14 Punkte
- Angebot: 14 Punkte
- Persönlichkeit: 12 Punkte
- Visuelle Identität: 12 Punkte
- Marketingausrichtung: 10 Punkte
- Markenwissen: 10 Punkte
Gesamt: 100 Punkte. Optionale Angaben wie Logo und Kanäle sind Teil kleinerer Kategorien und dominieren den Score nicht.

## 11. Score-Datenfluss
Frontend Home ruft `GET /api/brand-readiness?brand_id=...` auf. Der Backend-Service lädt ausschließlich die aktive Workspace-/Brand-Basis und Knowledge-Base-Einträge im passenden Scope. Das Frontend berechnet den Score nicht selbst.

## 12. Next-Action-Regeln
Der Backend-Service erzeugt maximal drei Actions aus den ersten unvollständigen Kategorien. Routen sind bestehende Produktflächen: `/brand-brain`, `/brand-identity`, `/knowledge`.

## 13. Schnellstarts
Home zeigt Social Post, Positionierung prüfen und Mini-Kampagne planen. Jeder Schnellstart schreibt einen editierbaren Prompt in Router-State und `sessionStorage` und öffnet `/quantum`. Quantum übernimmt den Prompt in das Eingabefeld, führt ihn aber nicht automatisch aus.

## 14. Datenschutz und Workspace-Scoping
Onboarding ist pro Nutzer und Workspace gespeichert. Readiness verwendet `current_workspace` und `_scope_filter`. Prompts werden nicht in URL-Parametern transportiert.

## 15. Tests
Ergänzt wurden fokussierte Backend-Tests für Statuskonstanten, Score-Determinismus, leere Werte, Routen, Scope-Felder und fehlende aktive Marke sowie Frontend-Tests für Pfadauswahl, Statusspeicherung, Readiness-UI, Quickstarts und Finanzhinweis.

## 16. Bekannte Einschränkungen
Die bestehenden Founder-Generierungsfunktionen hängen weiterhin von Provider-Keys ab. Die Explore-Tour ist bewusst eine robuste Checkliste statt Overlay-Tour. Bestehende Brand-Update-Endpunkte wurden nicht umfassend refaktoriert.

## 17. Bewusst verschobene Aufgaben
Vollständige Legacy-Bereinigung, umfassendes Security-Audit, Early-Access-Backendformular, umfassende Infrastrukturänderungen und breite Regression-Suite bleiben Sprint D/E.
