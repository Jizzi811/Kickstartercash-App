# Sprint D Legacy Cleanup

Stand: 2026-07-11. Umfang: statische Repository-Suche nach sichtbaren und technischen Resten früherer Kickstartercash-/AlphaCash-/Karten-/Referral-Funktionen. Kategorien: A nutzersichtbarer Inhalt, B technischer Bezeichner/Abhängigkeit, C Legacy-Funktion erreichbar, D Seed/Demo/Testdaten, E historische Dokumentation, F Datei/Asset, G sicherheits-/datenschutzrelevant.

| Datei | Fund | Kategorie | Nutzersichtbar | Maßnahme | Geändert | Begründung | Mögliches Risiko |
|---|---|---:|---|---|---|---|---|
| `frontend/src/pages/SeoStudio.jsx` | `kickstartercash.club` Beispiel | A | Ja | durch neutrales Brandmind-Beispiel ersetzt | Ja | sichtbarer Altprojektbezug | Vertrauensverlust/Irreführung |
| `frontend/src/pages/Funnel.jsx` | Referral-Link-Placeholder mit alter Domain | A/C/G | Ja | durch `https://example.com/angebot` ersetzt | Ja | keine alte Domain oder Reflink-Kommunikation im UI | falsche Kontakt-/Referralflüsse |
| `frontend/src/pages/CampaignWorkflow.jsx` | `Brandmind Black Card Launch` | A | Ja | durch Early-Access-Launch ersetzt | Ja | keine geschäftsspezifischen Kartenprodukte als Brandmind-Beispiel | falscher Produktclaim |
| `frontend/src/pages/KnowledgeBase.jsx` | `Exclusive Cards`, Kartenkosten-Provision | A/D | Ja | Kategorie/Placeholder neutralisiert | Ja | sichtbare Karten-/Provisionserwartung veraltet | alte Produktannahmen |
| `backend/server.py` | Default-ID `kickstartercash` | B/D | Nein | belassen und kommentiert | Nein | interne ID ist Backward-Compatibility; Umbenennung wäre migrationsriskant | technische Altlast |
| `backend/server.py` | Legacy-Seed-Migration von `Kickstartercash.Club` | D | Nein | belassen | Nein | schützt bestehende Daten vor sichtbarer Altmarke | geringe Legacy-Präsenz im Code |
| `backend/server.py` | KASH-Systemprompt, Black/Deluxe Card, alte Preis-/Portaltexte | A/C/G | Potenziell über Legacy-Chat erreichbar | dokumentiert, nicht großflächig entfernt | Nein | Legacy-Funktion ist umfangreich und erreichbar; sichere Entfernung wäre eigene Migration | alte Produkt-/Preisclaims, Datenschutz bei Reports |
| `backend/server.py` | KASH Daily Report Scheduler/Report-E-Mails | C/G | Nein, operativ | dokumentiert | Nein | Änderung kann bestehende Deployments beeinflussen; Provider-Keys fehlen lokal | unerwünschte Reports bei Konfiguration |
| `backend/server.py` | Funnel-Mail „Kickstartercash.Club Funnel“ | C/G | Potenziell | dokumentiert | Nein | Legacy-Funnel bleibt erreichbar; größere Bereinigung separat | alte Absender-/Produktkommunikation |
| `backend/tests/backend_test.py` | Erwartung `Kickstartercash.Club` | D | Nein | dokumentiert, nicht geändert | Nein | AGENTS weist auf legacy/data-key-abhängige Integrationserwartung hin | veralteter Integrationscheck |
| `backend/tests/test_guardian.py` | Kickstartercash-Beispiel | D | Nein | dokumentiert | Nein | Testdaten für Guardian, nicht UI | veralteter Beispielkontext |
| `backend/tests/test_funnel_photo.py` | alte Portal-Domain | D | Nein | dokumentiert | Nein | Legacy-Funnel-Testdaten | veralteter Testkontext |
| `index.html` im Repo-Root | KASHBOT/Kickstartercash statische Seite | F/A/C/G | Nur falls separat ausgeliefert | dokumentiert, nicht gelöscht | Nein | nicht CRA-Frontend; unklare Nutzung historischer Landing/Widget-Datei | versehentliche Auslieferung alter Seite |
| `design_guidelines.json` | Kickstartercash.Club | F/D | Nein | dokumentiert | Nein | historisches Design-Artefakt | Verwechslung bei manueller Nutzung |
| `backend/funnel_bundle.html` | eingebettete Legacy-Funnel-Assets | F/C | Potenziell | dokumentiert | Nein | generiertes Bundle sehr groß; keine sichere Nutzungsausschlussprüfung | alte Asset-Auslieferung |
| `frontend/src/i18n.js` | Reflink/Funnel-Texte | A/C | Ja, auf Legacy-Funnel | dokumentiert | Nein | Legacy-Funnel bleibt bewusst erreichbar; Produktentscheidung erforderlich | alte Funnel-Logik sichtbar |

## Erneute Suche und verbleibende Treffer

Nach der Bereinigung verbleiben Treffer vor allem in Legacy-Funktionen (`KASH`, Funnel), historischen/generierten Dateien (`index.html`, `backend/funnel_bundle.html`), internen Backward-Compatibility-IDs und alten Tests. Sie bleiben bestehen, weil Sprint D keine sichere Komplettentfernung alter Routen, Datenmigrationen oder unbekannter Assets verlangt. Vor öffentlichem Early Access sollte entschieden werden, ob Legacy-KASH/Funnel-Routen deaktiviert, hinter Auth verschoben oder vollständig migriert werden.
