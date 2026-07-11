# Early Access Release Checklist

Stand: 2026-07-11. Statuswerte: bestanden, bedingt bestanden, offen, blockiert, nicht anwendbar.

| Prüfung | Status | Nachweis / Kommentar |
|---|---|---|
| Frontend-Build | bestanden | `CI=false npm run build` erfolgreich. |
| Frontendtests | bestanden | Sprint-B/C/D Jest: 22 Tests bestanden. |
| Backendtests | bedingt bestanden | Sprint-C/D bestanden; bestehende Integrationstests ohne Mongo/Provider teilweise fehlgeschlagen. |
| Import-Smoke-Test | bestanden | `MONGO_URL="" DB_NAME=brandmind_ci ... import server` erfolgreich. |
| Health-Check | bedingt bestanden | 200 OK, aber ohne DB `db_configured=false`. |
| MongoDB | blockiert | `mongod` nicht installiert; `mongodb-org` nicht verfügbar. |
| Auth | bedingt bestanden | Code/Tests vorhanden; Live-Registrierung ohne Mongo nicht geprüft. |
| Workspace-Trennung | bedingt bestanden | Sprint-C/D Tests bestanden; Live-Integration offen. |
| Brand-Trennung | bedingt bestanden | Sprint-D Tests bestanden; Live-Integration offen. |
| Onboarding | bestanden | Sprint-C Tests bestanden. |
| Founder Resume | bedingt bestanden | Tests bestanden; Live-Persistenz offen. |
| Explore | bestanden | Sprint-C Tests bestanden. |
| Quantum-Promptübergabe | bestanden | Sprint-B/C Frontendtests bestanden. |
| Brand Readiness | bestanden | Sprint-C Tests bestanden. |
| Navigation | bedingt bestanden | Tests bestanden; echte Tastatur-/Viewport-QA blockiert. |
| Desktop | blockiert | Kein startbarer Browser. |
| Tablet | blockiert | Kein startbarer Browser. |
| Mobile | blockiert | Kein startbarer Browser. |
| Deutsch | bedingt bestanden | Test-/Codepfade vorhanden; Browser-QA offen. |
| Englisch | bedingt bestanden | Test-/Codepfade vorhanden; Browser-QA offen. |
| Early-Access-Formular | bedingt bestanden | Validierung und Adminschutz geprüft; vollständige Persistenz ohne Mongo offen. |
| Deduplizierung | bedingt bestanden | Sprint-D Tests bestanden; Live-Persistenz offen. |
| Adminschutz | bestanden | Sprint-D Tests und HTTP 401 für öffentliche Liste/CSV. |
| CSV-Schutz | bestanden | Sprint-D CSV-Injection-Test bestanden. |
| Spam-Schutz | bedingt bestanden | Honeypot/Rate-Limit vorhanden; In-Memory-Limiter nicht produktionsreif. |
| Impressum | bedingt bestanden | Route vorhanden; finale Rechtstexte fehlen. |
| Datenschutz | bedingt bestanden | `/privacy` erreichbar; finale Rechtstexte fehlen. |
| Kontakt | bedingt bestanden | Platzhalter vorhanden; finale Angaben prüfen. |
| Uploads | offen | Detail-Härtung für Dateitypen/Größe/SVG/öffentliche URLs offen. |
| Business Cards | offen | Public-Payload-/Notizprüfung weiter vor breiter Nutzung. |
| Tickets | offen | Fremdzugriff/Anhänge/interne Notizen live prüfen. |
| Legacy | offen | KASH/Funnel direkt erreichbar; vor öffentlichem EA behandeln. |
| Providerfehler | bedingt bestanden | Fehlende Provider geben kontrollierte Fehler; UX live offen. |
| Empty States | bedingt bestanden | Sprint-C Tests; umfassende Live-Fehlerzustände offen. |
| Accessibility | blockiert | Statische Hinweise, aber echte Browser-/Tastaturprüfung blockiert. |
| Secrets-Prüfung | bedingt bestanden | Keine echten Secrets im Build ausgewertet; Drittanbieter-Bundle-Treffer klassifiziert. |
| Backup-/Recovery-Konzept | offen | Nicht Bestandteil lokaler Sprint-E-Prüfung. |
| Monitoring | offen | Kein Deployment/Monitoring eingerichtet. |
| Produktions-Rate-Limit | offen | In-Memory-Limiter reicht nicht für Multi-Instance-Produktion. |
