# Sprint D – Early Access & Security

## 1. Ziel
Sprint D macht Brandmind frühzugangsfähiger: nutzersichtbare Legacy-Reste bereinigen, Early-Access-Anfragen sicher speichern, öffentliche CTAs konsistent führen, rechtliche Platzhalter erreichbar machen und fokussierte Sicherheitsrisiken dokumentieren.

## 2. Legacy-Bereinigung
Sichtbare alte Domains, Kartenbeispiele und provisions-/referralnahe Beispiele wurden in Kernseiten neutralisiert. Verbleibende Treffer sind in `docs/LEGACY_CLEANUP.md` dokumentiert.

## 3. Early-Access-Formular
Die Landingpage enthält ein DE/EN-Formular mit Name, E-Mail, Status, Marketing-Herausforderung, optionalem Unternehmen/Projekt und nicht vorausgewählter Datenschutzzustimmung. CTAs scrollen zum Formular; Anmeldung bleibt separat verfügbar.

## 4. Datenmodell
Collection: `early_access_requests`. Felder: `id`, `name`, `normalized_email`, `display_email`, `company_or_project`, `audience_status`, `marketing_challenge`, `privacy_consent`, `privacy_consent_at`, `locale`, `source`, `created_at`, `updated_at`, `request_status`.

## 5. API-Ablauf
`POST /api/early-access` ist öffentlich, validiert serverseitig, setzt IDs/Zeitstempel serverseitig und sendet keine externen E-Mails oder Provider-Anfragen.

## 6. Deduplizierung
`normalized_email` wird für aktive Datensätze eindeutig behandelt. Wiederholte Anfragen erhalten eine freundliche neutrale Erfolgsantwort und enden nicht in einem Datenbankfehler.

## 7. Datenschutz
Es werden keine IP-Adressen oder User-Agents standardmäßig gespeichert. Datenschutzzustimmung wird mit Zeitstempel gespeichert. Freitextlängen sind begrenzt; HTML wird nicht als HTML gerendert.

## 8. Adminzugriff
Listen/Patch/Export sind nur für explizite globale Admin-Claims (`is_platform_admin` oder `early_access.admin`) erreichbar. Workspace-Owner/Admin-Rechte reichen bewusst nicht aus.

## 9. Export
`GET /api/early-access/export.csv` exportiert nur erlaubte Felder, keine Secrets, Tokens, IPs oder Providerdaten. CSV-Injection wird durch Prefix bei `=`, `+`, `-`, `@` verhindert.

## 10. Spam-Schutz
Basisschutz: In-Memory-Rate-Limit pro unmittelbarem Client, Honeypot-Feld, Längenbegrenzung, Deduplizierung und keine teuren KI-Aufrufe. Einschränkung: nicht instanzübergreifend; Produktion braucht Plattformschutz oder externen Store.

## 11. Rechtliche Seiten
`/impressum`, `/datenschutz`/`/privacy` und `/kontakt`/`/contact` sind erreichbar und klar als Platzhalter vor Veröffentlichung markiert. Es wurden keine Unternehmensdaten erfunden.

## 12. Sicherheitskorrekturen
Brand-Detail/Update/Delete wurden workspace-gescopet. Early-Access-Adminrechte interpretieren keine tenant-lokalen Rollen als Plattformrechte. Formularfehler sind nutzerverständlich und enthalten keine Stacktraces.

## 13. Tests
Ergänzt: Backend-Unit-Tests für Early-Access-Validierung, Deduplizierung/Neutralantwort, Admin-Routenschutz und CSV-Injection; Frontend-Tests für Formular/CTA/Labels/Privacy-Link/Legacy-Kernseiten.

## 14. Bekannte Einschränkungen
Legacy-KASH/Funnel bleibt erreichbar und enthält alte Inhalte. Vollständige Upload-, Ticket- und Public-Business-Card-Härtung bleibt offen. Rate-Limit ist nur In-Memory. Rechtstexte sind Platzhalter.

## 15. Voraussetzungen vor öffentlichem Early Access
Finale Rechtstexte, Entscheidung zu Legacy-KASH/Funnel, produktionsfähiger Rate-Limit-/Spam-Schutz, finale globale Adminberechtigung, erneute Upload/Public-Card/Ticket-Prüfung und Browser-QA aus Sprint E.
