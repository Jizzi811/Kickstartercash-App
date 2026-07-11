# Website-to-Brand Import

## 1. Produktziel
Der Existing-Brand-Onboarding-Pfad bietet zuerst einen Website-Import an. Nutzer geben eine öffentliche Website ein, Brandmind erstellt einen prüfbaren Markenprofil-Entwurf und speichert erst nach ausdrücklicher Bestätigung ausgewählte Felder in die bestehende Brand-Datenstruktur.

## 2. Nutzerablauf
`/onboarding/select-path` setzt den Schritt `website_import` und führt zu `/onboarding/existing-brand/import`. Dort können Nutzer eine URL analysieren oder jederzeit ohne Website zum bestehenden manuellen Brand-Brain-Formular wechseln.

## 3. Sicherheitsmodell
Der Abruf läuft ausschließlich serverseitig. Website-Inhalte gelten als nicht vertrauenswürdig und werden nur als Daten verarbeitet. Es werden keine Cookies, Browser-Sessions oder Zugangsdaten übernommen.

## 4. SSRF-Schutz
Der Import akzeptiert nur `http` und `https`, normalisiert URLs, blockiert Credentials, interne Hostnamen, localhost, Loopback, private Netze, Link-Local-Adressen, Cloud-Metadata-Ziele und nicht erlaubte Ports. DNS wird vor jedem Abruf und nach Redirects geprüft. Redirects sind begrenzt.

## 5. Seitenabruf
Zuerst wird die Startseite analysiert. Danach werden maximal sechs Seiten total aus priorisierten same-origin Links wie About, Services, Products, Pricing, FAQ, Contact und Blog ausgewählt. Downloads, Admin-/Account-/Logout-Pfade, Query-Fallen und externe Origins werden nicht automatisch geladen.

## 6. Inhaltsbereinigung
HTML wird mit einem eingeschränkten Parser extrahiert. Scripts, Styles, noscript/svg-Inhalte, Cookie-Banner-Muster und übermäßige Wiederholungen werden nicht als Haupttext genutzt. Text- und Antwortgrößen sind begrenzt.

## 7. Prompt-Injection-Schutz
Website-Text wird nie als Systemanweisung verwendet. Prompt-Injection-ähnliche Phrasen werden als Warnung markiert. Die aktuelle Implementierung erzeugt konservative technische Felder ohne LLM-Zwang; spätere Provideranalyse muss das gleiche Daten-/Anweisungs-Splitting beibehalten.

## 8. Extraktionsschema
Jedes Feld enthält `value`, `source_urls`, `confidence`, `evidence_summary` und `extraction_type`. Unterstützt werden Markenname, Branche, Website, Kurzbeschreibung, Produkte/Leistungen, Zielgruppe, Bedürfnisse, Nutzenversprechen, Positionierung, Differenzierung, Werte, Tonalität, Keywords, Farben, Logo-Kandidat, visueller Stil, Social Links und Kontaktinfos.

## 9. Konfidenz und Quellen
Explizite technische Funde wie URL, Titel, Social Links und Kontakte erhalten Quellen und Konfidenz. Ableitungen bleiben low-confidence oder leer, bis Nutzer oder Provideranalyse sie prüfbar ergänzt.

## 10. Draft-Modell
Entwürfe liegen in `brand_import_drafts` mit Workspace-, User- und Brand-Scope, Status, analysierten Seiten, extrahierten Feldern, Warnungen, Zeitstempeln und Ablaufdatum. Roh-HTML wird nicht dauerhaft gespeichert.

## 11. Bestätigung und Konfliktbehandlung
Nur ausgewählte Felder werden bestätigt. Bestehende Werte werden standardmäßig nicht überschrieben; Konflikte werden zurückgegeben und müssen manuell entschieden werden. Geeignete Felder werden auf bestehende Brand-Felder gemappt.

## 12. Bestehende Brand-Daten
Es wird keine parallele importierte Marke erstellt. Der Import aktualisiert die vorhandene aktive bzw. angegebene Brand über die bestehende `brands` Collection und nutzt Brand-Brain/Identity-Felder weiter.

## 13. Fallbacks
Ungültige URLs, blockierte Domains, Login-/Zugriffssperren, Timeouts, ungeeignete Inhalte und zu wenig Text führen zu verständlichen Meldungen. Nutzer können eine andere Website versuchen, fehlende Angaben manuell ergänzen oder vollständig manuell fortfahren.

## 14. Rate Limits
In-Memory Limits begrenzen Analysen auf fünf pro Nutzer/Workspace/Stunde und eine gleichzeitige Analyse pro Nutzer/Workspace. Produktionsbetrieb benötigt einen verteilten Store wie Redis, um Limits über mehrere Instanzen konsistent durchzusetzen.

## 15. Tests
Backend-Tests decken URL-Validierung, interne Netzblockaden, Redirect-Revalidierung, Content-Type-/Größenlogik über Servicefunktionen, same-origin-Selektion und Prompt-Injection-Warnungen ab. Frontend-Smoke-Tests prüfen Import-first-Flow, manuellen Fallback und Review-Metadaten.

## 16. Bekannte Einschränkungen
Die Analyse rendert kein JavaScript, beachtet robots.txt aktuell dokumentiert nicht technisch erzwingend und nutzt keine externe LLM-Anreicherung, wenn kein Provider angebunden ist. Konfliktauflösung zeigt Konflikte serverseitig und leitet zur manuellen Ergänzung statt ein eigenes Merge-Modal für jedes Feld zu erzwingen.

## 17. Produktionsanforderungen
Für Produktion empfohlen: verteiltes Rate Limiting, explizite robots.txt-Policy/Enforcement, optionaler HTML-Sanitizer mit Readability-Parser, Background-Job-Queue für lange Analysen, Provider-Schema-Validierung für LLM-Anreicherung und Browser-QA über authentifizierte Testdaten.
