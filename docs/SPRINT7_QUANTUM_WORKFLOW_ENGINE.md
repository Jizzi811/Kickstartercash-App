# Sprint 7 – Quantum Multi-Agent Execution Engine

## Neue Engine

`frontend/src/lib/workflowEngine.js` ergänzt den bestehenden Quantum Orchestrator um eine getrennte Workflow-Schicht. Der Orchestrator bleibt für Analyse, Agent Matching und Execution Plan verantwortlich; die Workflow Engine erzeugt daraus eine ausführbare State Machine mit Shared Context, Activity Feed, Timeline-Daten und Output Bus.

## Statusmodell

Jeder Workflow-Schritt verwendet eines der folgenden Statusfelder:

- `pending`: Schritt wartet auf Ausführung.
- `running`: Schritt wird gerade ausgeführt.
- `completed`: Schritt wurde erfolgreich abgeschlossen.
- `failed`: Für spätere Fehlerfälle reserviert.
- `skipped`: Für spätere bedingte Workflow-Pfade reserviert.

Der Workflow selbst nutzt dasselbe Modell und berechnet den Fortschritt aus abgeschlossenen Schritten.

## Agent Runner

Der Agent Runner ist aktuell eine Mock-Ausführung. Jeder Schritt erhält:

- den aktuellen Step,
- den Shared Context,
- die bisherigen Output-Bus-Ergebnisse.

Daraus wird ein strukturiertes Mock-Output-Objekt mit Titel, Zusammenfassung, Artefakten, Agent-Name und Zeitstempel erzeugt. Es gibt noch keine echten KI-Calls.

## Output Bus

Der Output Bus sammelt Agenten-Ergebnisse nach:

- `byStepId`,
- `byAgentId`,
- `all`.

Folge-Agenten erhalten den Bus als Input und können vorherige Outputs in ihre Mock-Ergebnisse einbeziehen.

## Shared Context

Der Shared Context bündelt:

- Kampagnenziel,
- Plattform,
- Zielgruppe,
- Brand Context,
- Inputs,
- Outputs.

Dadurch bleibt der Workflow erweiterbar und kann später echte Agenten, Tools oder Persistenz anschließen.

## UI-Komponenten

Die `/quantum`-UI wurde um diese Komponenten erweitert:

- `WorkflowTimeline.jsx`: Status, Fortschritt, Dauer, Agent und Output Preview je Schritt.
- `ActivityFeed.jsx`: Live-Log mit Zeitstempeln.
- `OutputSummary.jsx`: Zusammenfassung aller Output-Bus-Ergebnisse.
- `WorkflowInspector.jsx`: Workflow-, Shared-Context- und Statusinspektion.

Zusätzlich gibt es einen Button `Workflow starten`, der die Mock-Ausführung triggert und einen Running State anzeigt.

## Bekannte Grenzen

- Keine echten KI-Calls oder externen Tool-Ausführungen.
- Fehler- und Skip-Pfade sind modelliert, aber noch nicht aktiv ausgelöst.
- Schritte laufen bewusst sequenziell, obwohl spätere Versionen parallele Agenten unterstützen können.
- Ergebnisse werden nur im lokalen React State gehalten und noch nicht persistiert.

## Empfehlung für Sprint 8

Für Sprint 8 sollten echte Agent Adapter eingeführt werden:

1. Agent Runner Interface für echte KI-Provider und interne Tools.
2. Persistenter Workflow Store inklusive Resume-Funktion.
3. Parallele Ausführung für unabhängige Schritte.
4. Fehlerbehandlung mit Retry, Skip und Human Approval.
5. Export der Output-Bus-Ergebnisse in Kampagnenassets oder Projektakten.
