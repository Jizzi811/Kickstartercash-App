# Sprint B – Navigation & Quantum Entry

## 1. Ziel

Sprint B vereinfacht die sichtbare App-Navigation, macht Quantum von überall direkt erreichbar und integriert auf Home eine zentrale Eingabe für markenbezogene Ziele. Bestehende Routen, Seiten, APIs und Deep Links bleiben erhalten.

## 2. Vorherige Navigation

Die vorherige Sidebar war in fachliche und technische Bereiche wie Headquarters, Company, AI, Studios, Workflow und Settings aufgeteilt. Dadurch waren viele Einträge gleichzeitig sichtbar; Finance war unter Settings einsortiert.

## 3. Neue Navigation

Die sichtbare Hauptnavigation besteht aus sechs Bereichen:

1. Home
2. Quantum
3. Meine Marke / My Brand
4. Erstellen / Create
5. Projekte / Projects
6. Mehr / More

Home und Quantum sind Direktlinks. Meine Marke, Erstellen, Projekte und Mehr sind aufklappbare Gruppen. Quantum bleibt ein hervorgehobener Hauptpunkt ohne eigenes abweichendes Designsystem.

## 4. Vollständige Route-Zuordnung

| Bereich | Route(n) |
|---|---|
| Home | `/app` |
| Quantum | `/quantum` |
| Meine Marke / My Brand | `/brand-brain`, `/brand-identity`, `/knowledge`, `/knowledge-graph`, `/memory` |
| Erstellen / Create | `/social`, `/design`, `/video`, `/seo`, `/email`, `/linkedin`, `/tiktok`, `/tts`, `/output-factory` |
| Projekte / Projects | `/mission`, `/campaign`, `/workflow`, `/automation`, `/workflow-architect`, `/orchestrator`, `/ops`, `/tickets` |
| Mehr / More | `/agents`, `/builder`, `/character-studio`, `/ai-business-card`, `/intelligence`, `/analytics`, `/skills`, `/modules`, `/arena`, `/gateway`, `/billing`, `/permissions` |
| Mehr → Business & Finanzen / Business & Finance | `/finance-cfo`, `/finance-analyst`, `/finance-fpa`, `/finance-bookkeeper`, `/finance-tax` |

Legacy-Routen wie `/image`, `/copy`, `/funnel`, `/calendar`, `/guardian`, `/prompts`, `/chat-gpt`, `/chat-gemini`, `/chat-grok`, `/export` und `/specialists` bleiben weiterhin in der Router-Konfiguration erreichbar, werden aber nicht als Hauptnavigation priorisiert.

## 5. Prompt-Datenfluss Home → Quantum

1. Nutzer gibt auf `/app` ein Ziel ein oder übernimmt einen Beispiel-Prompt.
2. Leere Eingaben werden nicht abgeschickt.
3. Enter sendet ab; Shift+Enter erzeugt im Textfeld einen Zeilenumbruch.
4. Home speichert den Prompt mit `saveQuantumHomePrompt()` in Session Storage.
5. Home navigiert nach `/quantum` und übergibt zusätzlich React-Router-State `{ quantumPrompt, source: "home" }`.
6. Quantum liest mit `readQuantumHomePrompt()` zuerst Router-State und danach Session Storage.
7. Quantum setzt den Prompt in das bestehende Orchestrator-Eingabefeld, führt ihn nicht automatisch aus und löscht temporäre Übergabedaten.

## 6. Verhalten bei Reload und Rücknavigation

Wenn Router-State bei verzögerter Navigation nicht mehr verfügbar ist, greift der Session-Storage-Fallback. Nach erfolgreicher Übernahme löscht Quantum den Fallback und ersetzt den Router-State, damit derselbe Prompt nicht unbeabsichtigt erneut übernommen wird. Nach der Übernahme bleibt der Prompt manuell editierbar.

## 7. Accessibility

- Aufklappbare Gruppen sind Buttons mit `aria-expanded` und `aria-controls`.
- Fokuszustände sind sichtbar (`focus-visible` Ring).
- Mobile Navigation schließt per Escape und beim Navigieren.
- Home-Quantum-Eingabe besitzt ein `aria-label`.
- Beispiel-Prompts sind echte Buttons.
- Navigationselemente bleiben Links oder Buttons und sind per Tastatur erreichbar.

## 8. Responsive-Verhalten

Desktop nutzt die fixe Sidebar mit reduzierter Gruppierung. Mobile nutzt ein Overlay mit derselben Navigationsstruktur, scrollbaren Gruppen und Escape-Schließen. Die Home-Quantum-Eingabe verwendet responsive Grids und bleibt auf kleinen Displays vollständig erreichbar. Eine echte visuelle Browserprüfung aller Ziel-Viewports steht noch als manuelle QA aus.

## 9. Tests

Fokussierte CRA/Jest-Tests prüfen:

- sechs Hauptbereiche in Deutsch und Englisch,
- Gruppenzuordnung der Unterseiten,
- Finance unter Business & Finanzen statt Settings,
- Erhalt zentraler Routen,
- leere Prompt-Absendung,
- Beispiel-Prompts,
- Router-State/Session-Storage-Promptübergabe,
- einmalige Quantum-Übernahme durch Löschen des temporären Zustands,
- ehrliche Mock-/Workflow-Vorschlagsbezeichnung,
- deutsche und englische Hauptlabels.

## 10. Bekannte Einschränkungen

- Keine neuen Hub-Seiten: Die Gruppierung ist innerhalb der bestehenden Navigation verständlich lösbar.
- Keine neuen Backend-Modelle oder APIs.
- Keine Sprint-C-Onboarding- oder Brand-Readiness-Logik.
- Keine Sprint-D-Security-/Legacy-Bereinigung.
- Vollständige visuelle Prüfung benötigt Browser-Automation oder manuelle QA.
