# Sprint D Security Review

## 1. Umfang
Fokussierte Prüfung von Auth, Workspace-/Brand-Scoping, Early Access, Provider/Secrets, Uploads, öffentlichen Business Cards, Tickets, Eingabevalidierung, rechtlichen Platzhaltern und nutzersichtbaren Legacy-Resten. Keine vollständige Penetrationstest- oder Browser-E2E-Abdeckung.

## 2. Architekturüberblick
Backend: FastAPI unter `/api`, MongoDB, Auth/Workspace aus `brandmind.py`, zentrale Workspace-Header über `X-Workspace-Id`. Frontend: React/CRA, öffentliche Landing/Auth/Legal/Card-Routen und geschützte App-Shell.

## 3. Geprüfte Bereiche
Landing, Auth, AppContext, Backend-Auth-Abhängigkeiten, Brands, Readiness/Onboarding, Permissions, Billing/Gateway, AI Business Card, Upload-/Knowledge-Endpunkte, Tickets/Support, Legacy-KASH/Funnel, Deployment-Env-Beispiele.

## 4. Authentifizierung
Die App-Shell schützt alle nicht öffentlichen Routen clientseitig. Backend-Endpunkte nutzen gemischt `current_workspace` (Legacy erlaubt) und `_authed_user` (Auth zwingend). Neue Early-Access-Submit-Route ist bewusst öffentlich; Verwaltung/Export verwenden `_authed_user` plus globale Admin-Claim-Prüfung.

## 5. Autorisierung
Workspace-Rollen (`owner`, `admin`) sind tenant-lokal und werden nicht als globale Early-Access-Adminrechte interpretiert. Der neue globale Admincheck akzeptiert nur `is_platform_admin` oder `early_access.admin` im User-Objekt; ohne diese Claims sind Listen, Patch und Export 403.

## 6. Workspace- und Brand-Scoping
Kleine Korrektur: `GET/PUT/DELETE /api/brands/{brand_id}` verwenden jetzt `_scope_filter(ws)` und vermeiden dadurch direkte Zugriffe auf fremde Workspace-Brands. Weitere ältere Legacy-Endpunkte besitzen teils Legacy-Fallbacks und brauchen vor Multi-Tenant-Produktivbetrieb eine breitere Prüfung.

## 7. Öffentliche Endpunkte
Öffentlich bleiben Landing, Auth, Business-Card-Public-View/Chat und `POST /api/early-access`. Der neue öffentliche Endpoint validiert Längen, Enums, E-Mail, Source, Honeypot und führt keine KI-/Provider-Anfrage aus.

## 8. Early Access
Collection `early_access_requests` speichert nur Formularfelder, Einwilligung und serverseitige Zeitstempel. IP/User-Agent werden nicht gespeichert. Deduplizierung erfolgt über `normalized_email` und aktive Datensätze; Duplikate erhalten neutrale Erfolgsantworten.

## 9. Provider und Secrets
Gateway-Konfiguration bleibt serverseitig. Frontend verwendet nur Backend-URL. Provider-Keys werden nicht im neuen Formular genutzt, nicht an Clients zurückgegeben und nicht in neuen Tests/Docs genannt. Beispiel-Env-Dateien enthalten nur Platzhalter.

## 10. Uploads
Bestehende Upload-Flows wurden statisch geprüft, aber nicht umfassend refaktoriert. Größere Risiken wie SVG-/Dateityp-Policy, Dateigrößen und öffentliche URL-Härtung bleiben vor Launch erneut zu prüfen.

## 11. Öffentliche Business Cards
Public-Card-Routen bleiben bestehen. Sprint D hat keine Strukturänderung vorgenommen; offener Prüfpunkt bleibt, dass veröffentlichte Karten nur freigegebenes Wissen/keine privaten Notizen ausgeben.

## 12. Tickets und Support
Tickets sind teils öffentlich erstellbar und im Backend workspace-scope-/Auth-abhängig abrufbar. Rollenbasierte interne Notizen und Anhänge sollten vor breiter Nutzung gezielt geprüft werden.

## 13. Eingabevalidierung
Early Access erzwingt erlaubte Enums, Längen, E-Mail-Format, Pflichtfelder, Source-Whitelist und Datenschutzzustimmung. Frontend rendert Erfolg/Fehler als Text und führt kein HTML aus.

## 14. Logging und Fehlerausgaben
Neue Early-Access-Fehler geben neutrale Meldungen aus. Insert-/Indexfehler werden nur mit Typ geloggt, nicht mit Formularinhalt. Frontend zeigt keine Stacktraces für Formularfehler.

## 15. Behobene Funde
- Brand-IDOR für zentrale Brand-Detail/Update/Delete-Endpunkte reduziert.
- Early-Access-Formular ersetzt Auth-CTA-Fluss.
- Sichtbare alte Domain/Kartenbeispiele in Kernseiten neutralisiert.
- Legal-/Privacy-/Contact-Platzhalter erreichbar gemacht.
- CSV-Injection-Schutz für Export implementiert.

## 16. Offene Funde
- Legacy-KASH/Funnel ist weiterhin erreichbar und enthält alte Produkt-/Preis-/Domaintexte.
- Root-`index.html` und `backend/funnel_bundle.html` enthalten alte statische Assets und sollten nicht öffentlich ausgeliefert werden.
- Vollständige Upload-/Business-Card-/Ticket-Härtung benötigt eigene Detailprüfung.
- In-Memory-Rate-Limit ist nur Basisschutz und nicht instanzübergreifend.

## 17. Risikostufe
- Kritisch: keine neuen kritischen Funde bestätigt.
- Hoch: Legacy-KASH/Funnel bei öffentlicher Auslieferung wegen alter Preis-/Produktclaims und möglicher Report-Mails.
- Mittel: Upload-/Public-Card-/Ticket-Detailprüfung offen.
- Niedrig: interne Legacy-IDs und historische Tests/Dokumente.
- Hinweis: rechtliche Platzhalter sind erreichbar, aber vor Launch nicht ausreichend.

## 18. Empfohlene Maßnahmen vor Early Access
Legacy-KASH/Funnel deaktivieren oder klar separieren, finale Rechtstexte juristisch prüfen, externen Rate-Limiter/WAF nutzen, Upload-Policy härten, Public-Business-Card-Payloads minimieren, globale Admin-Claims offiziell definieren.

## 19. Bewusst nicht geprüfte Bereiche
Keine vollständige Browser-QA, kein Deployment-Test, keine umfassende Architekturmodernisierung, keine vollständige Regression aller KI-/Provider-Funktionen, keine Sprint-E-Integrationen.
