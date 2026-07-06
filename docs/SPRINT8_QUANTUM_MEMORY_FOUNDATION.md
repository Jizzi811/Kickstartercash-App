# Sprint 8 – Quantum Memory Foundation

## Ziel

Quantum erhält eine austauschbare Memory-Architektur, damit BrandMind später Wissen dauerhaft speichern, abrufen und aus Projekten lernen kann. In diesem Sprint gibt es **keine feste Abhängigkeit zu agimem**. Die App spricht nur mit dem Memory Manager Interface.

## Architektur

Die neue Frontend-Schicht liegt unter `frontend/src/lib/memory/`:

```text
memoryTypes.js
memoryManager.js
memoryProvider.js
adapters/
  localMemoryAdapter.js
  agimemAdapter.placeholder.js
```

Die restliche App soll künftig ausschließlich `memoryManager` oder eine `MemoryManager`-Instanz verwenden. Konkrete Adapter wie Local Storage, Supabase, Postgres, SQLite, JSON-Dateien oder agimem werden hinter dem Provider-Interface ausgetauscht.

## Memory Types

### Brand Memory

Speichert Markenwissen wie Markenname, Farben, Logo, Tonalität, Zielgruppen, Produkte und CI-Regeln.

### User Memory

Speichert Nutzerpräferenzen wie bevorzugte Sprache, Plattformen, Contentformate, Schreibstil und häufig genutzte Agenten.

### Project Memory

Speichert Projektwissen wie Kampagnen, Workflows, Agenten-Ausführungen, Outputs, Entscheidungen und Dateien.

### Experience Memory

Speichert Lernerfahrung wie Performance-Ergebnisse, was gut oder schlecht funktioniert hat, Optimierungsempfehlungen und wiederkehrende Muster.

## Memory Manager Interface

Der `MemoryManager` kapselt den aktiven Provider und stellt ein einheitliches Interface bereit:

- `saveMemory(type, payload)`
- `getMemory(type, filters)`
- `updateMemory(id, payload)`
- `deleteMemory(id)`
- `searchMemory(query, options)`
- `summarizeMemory(type)`
- `getRelevantMemory(context)`

Damit bleibt Quantum unabhängig von konkreten Speichertechnologien.

## Adapter-Konzept

Alle Adapter implementieren die Methoden aus `MemoryProvider`. Ein Adapter darf intern REST, MCP, localStorage, IndexedDB, Supabase, Postgres, SQLite oder andere Speicher verwenden. Nach außen bleibt das Interface gleich.

## Local Adapter

`localMemoryAdapter.js` ist der erste Demo-Provider. Er nutzt im Browser `localStorage` und fällt in nicht-browserartigen Kontexten auf eine In-Memory-Struktur zurück. Er enthält Seed-Einträge für alle vier Memory Types, damit die UI sofort demonstrierbar ist.

## agimem als möglicher Provider

`agimemAdapter.placeholder.js` dokumentiert die spätere Integration. Der Adapter ist absichtlich noch nicht aktiv und erzwingt keine externe Verbindung. Vor einer echten Integration sollte das Setup unter <https://agimem.dev/setup> geprüft werden.

Mögliche spätere Integrationswege:

1. Direkte Provider-Implementierung, falls agimem eine sichere Frontend- oder Backend-API anbietet.
2. Backend-vermittelter Provider, bei dem Secrets ausschließlich serverseitig liegen.
3. MCP-Integration, bei der Quantum Memory-Operationen über ein freigegebenes MCP Tool ausführt.

## Sicherheitsregeln

- Keine API Keys hardcoden.
- Keine Secrets committen.
- Memory-Speicherung nur nach Nutzerzustimmung oder aktivem Setting `Auto Memory`.
- Sensible Daten sollten vor Persistierung klassifiziert und minimiert werden.
- Adapter dürfen Implementierungsdetails nicht in UI-Komponenten leaken.

## Quantum UI

Die `/quantum` Seite zeigt jetzt die Quantum Memory Foundation mit Brand, User, Project und Experience Memory. Jede Karte zeigt Beschreibung, Beispiel-Einträge, Status `Local Demo Provider` und zukünftige Provider-Fähigkeit `agimem / MCP-ready`.

Nach einer Orchestrator-Analyse erzeugt Quantum eine Memory Preview: „Was Quantum daraus speichern würde“. Diese Preview wird nicht automatisch persistiert und bereitet Human Approval für spätere Sprints vor.

## Nächste Schritte

- Approval Flow mit explizitem Speichern-Button bauen.
- `Auto Memory` als echte Nutzereinstellung persistieren.
- Memory Preview in validierte Save-Payloads umwandeln.
- Relevante Memories in Orchestrator-Agentenauswahl einfließen lassen.
- agimem Provider evaluieren und ggf. über Backend oder MCP anbinden.
- Tests für Adapter-Konformität und Memory Preview ergänzen.
