# Founder Entry & Idea Discovery

## 1. Produktziel
Brandmind startet den Gründerpfad nicht mehr mit einer Visionsfrage, sondern mit „Wo stehst du gerade?“. Damit werden auch Nutzer abgeholt, die nur wissen, dass sie etwas Eigenes aufbauen möchten.

## 2. Drei Einstiegswege
- `no_idea`: keine Geschäftsidee; vollständiges Gründerprofil und Ideengenerierung.
- `rough_direction`: grobe Richtung; Profil plus Thema/Branche und Variantenentwicklung.
- `concrete_idea`: konkrete Idee; strukturierte Erfassung, Zusammenfassung und Bestätigung ohne erzwungene allgemeine Ideengenerierung.

## 3. Routing
Neue Founder-Nutzer starten auf `/onboarding/founder/start`. Danach folgen `/onboarding/founder/profile`, `/onboarding/founder/ideas`, optional `/onboarding/founder/ideas/compare` und nach Favoritenbestätigung der bestehende `/onboarding/founder/intake`.

## 4. Gründerprofil
Das bestehende `founder_profiles`-Dokument wird erweitert. Es gibt keine parallelen User-, Workspace-, Brand- oder Onboarding-Modelle. Profilfelder bleiben dem Founder-Prozess zugeordnet und werden nicht automatisch als öffentliche Brand-Fakten gespeichert.

## 5. Datenmodell
Geschäftsideen bleiben in der vorhandenen `founder_ideas`-Persistenz als strukturierte `ideas`-Liste mit `workspace_id`, `user_id`, optionalem `brand_id`, `founder_path`, Titel, Problem, Zielgruppe, Angebot, Erlösmodell, Liefermodell, Budget, Zeit, Fit, Annahmen, Risiken, Validierungsbedarf, `favorite` und `user_confirmed`.

## 6. Ideengenerierung
Die Generierung nutzt die bestehende LLM-Gateway-Funktion `llm_text`. Ohne Providerantwort werden keine Fake-Ideen erzeugt; der Client erhält einen verständlichen Providerfehler.

## 7. Ideenstatus und Annahmen
Marktpotenzial ist nur `ungeprüfte Einschätzung` oder `noch zu prüfen`. Wettbewerb ist `noch zu prüfen`. Evidence bleibt `unverified`; es werden keine Marktgrößen, Umsätze oder Profitabilitätsgarantien erfunden.

## 8. Rough-Direction-Varianten
Für `rough_direction` fordert der Prompt unterschiedliche Geschäftsmodellvarianten nach Angebot, Kundentyp, Erlösmodell und Liefermodell an.

## 9. Concrete-Idea-Weg
Konkrete Ideen werden strukturiert gespeichert und können direkt als Favorit bestätigt werden. Eine allgemeine Ideenliste ist nicht Pflicht.

## 10. Ideenvergleich
Der Vergleich ist auf maximal drei Ideen begrenzt und zeigt qualitative Kriterien: persönliche Passung, Interessen, Fähigkeiten, Budget, Aufwand, Liefermodell, B2B/B2C, Skalierbarkeit, Regulatorik, Risiken und Annahmen. Es gibt keine Erfolgswahrscheinlichkeiten.

## 11. Favoritenlogik
Genau eine Idee kann primärer Favorit sein. Ein Wechsel löscht alte Ideen nicht. Der bestätigte Favorit setzt `favorite`, `user_confirmed` und `confirmed_at`.

## 12. Übergabe in Founder Journey
Nach Bestätigung wird der Favorit als Arbeitsgrundlage in `founder_profiles.selected_idea` gespeichert und der Resume-Schritt auf `intake` gesetzt. Der bestehende Intake prüft danach Zielgruppe, Angebot und Geschäftsmodell weiter.

## 13. Gründungs-KI-Experte
Der Begleiter heißt „Gründungs-KI-Experte“. Er erklärt Status, Profilfragen, Unterschiede zwischen Ideen und Annahmen, gibt aber keine Rechts-, Steuer-, Anlage- oder Profitabilitätszusagen.

## 14. Sicherheit und Scoping
Alle Endpunkte verlangen Auth und nutzen bestehendes User-/Workspace-Scoping. Payloads werden feldweise übernommen und Freitexte begrenzt; fremde Profile oder Ideen sind durch Scope-Filter nicht erreichbar.

## 15. Providerverhalten
Providerdetails und interne Prompts werden nicht an den Client weitergegeben. Fehler sind neutral formuliert. Kein Provider bedeutet keine synthetische Fake-Liste.

## 16. Rate Limits
Ideengenerierung ist auf fünf Läufe pro Nutzer/Workspace/Tag begrenzt. Zusätzlich werden maximal 24 Ideen je Founder-Dokument gehalten.

## 17. Tests
Es gibt fokussierte Backendtests für Pfade, Providerfehler, Vergleichslimit und Favoritenlogik sowie Frontend-Import-/Texttests für Start, Routing und Vergleich.

## 18. Bekannte Einschränkungen
Dieser Sprint enthält keine Marktvalidierung, Webrecherche, Wettbewerberrecherche, Rechtsform-, Fördermittel-, Businessplan-, Finanzplan-, Markenentwicklungs-, Launchplan- oder Deployment-Arbeit.

## 19. Nächste Ausbaustufe
Nächste Schritte sind echte Nachfrage-/Wettbewerbsvalidierung, belastbare Marktquellen, Rechts-/Finanz-Hinweise über geeignete Expertenmodule und tiefere Integration in spätere Founder-Phasen.
