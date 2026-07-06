# Sprint 6.2 – Quantum Orchestrator Engine

## Neue Funktionen

- Regelbasierter Task Analyzer für Nutzerprompts in Quantum.
- Skill-basiertes Agent Matching über eine erweiterbare `AGENT_REGISTRY`.
- Mock Execution Plan mit Phasen, Agenten, Aufgaben, Outputs, Priorität, Status und Abhängigkeiten.
- Interaktive Eingabe in `/quantum` inklusive Analysezustand, erkanntem Ziel, Skills, Agentenbegründung und Workflow Timeline.
- Drei direkt testbare Demo-Prompts für Facebook-Kampagne, 9:16 Reel und SEO-Landingpage.

## Neue Dateien

- `frontend/src/lib/quantumOrchestrator.js` trennt Orchestrator-Regeln, Registry, Matching und Plan-Generierung von der UI.
- `docs/SPRINT6_2_QUANTUM_ORCHESTRATOR.md` dokumentiert Sprintumfang, Regeln, Grenzen und Empfehlungen.

## Orchestrator-Logik

Der Orchestrator besteht aus vier vorbereiteten Funktionen:

1. `analyzeTask(prompt)` erkennt Ziel, Branche/Kontext, gewünschten Output, Plattform, benötigte Fähigkeiten, Priorität und Komplexität.
2. `matchAgents(analysis)` vergleicht benötigte Skills gegen Agent-Skills.
3. `createExecutionPlan(analysis, matchedAgents)` baut eine ausführbare Mock-Timeline.
4. `orchestrateQuantumWorkflow(prompt)` fasst Analyse, Matching, Plan und erwartete Outputs zusammen.

Die Struktur ist bewusst pure JavaScript ohne UI-Abhängigkeiten gehalten, damit später LLM-Analyse, echte Agent Runs oder Backend-Ausführung angeschlossen werden können.

## Matching-Regeln

- Facebook-/Kampagnen-Prompts erzeugen Skills wie `Social`, `Copy`, `Design`, `Analytics` und `Campaign`.
- Reel-/9:16-/Video-Prompts erzeugen Skills wie `Video`, `Copy`, `Design`, `Social`, `Reel` und `9:16`.
- SEO-/Google-/Landingpage-Prompts erzeugen Skills wie `SEO`, `Copy`, `Analytics`, `Google`, `Keywords` und `Landing Page`.
- Der Match Score basiert auf Skill-Abdeckung, vorhandenen Treffern und Agent-Priorität.
- Jeder Agent liefert passende Skills, fehlende Skills, Auswahlgrund und empfohlene Workflow-Rolle.

## Beispielprompts

- „Erstelle eine Facebook-Kampagne für BrandMind.“
- „Plane ein 9:16 Reel für ein neues Produkt.“
- „Optimiere meine Landingpage für SEO.“

## Bekannte Grenzen

- Die Analyse ist regelbasiert und erkennt aktuell nur definierte Keyword-Cluster.
- Die Ausführung ist Mock-State-Logic; es werden keine echten KI-Agenten gestartet.
- Match Scores sind heuristisch und noch nicht anhand historischer Performance kalibriert.
- Mehrsprachigkeit der Resultate ist vorbereitet, aber die Orchestrator-Daten selbst sind aktuell primär deutsch formuliert.

## Nächste Empfehlung für Sprint 6.3

- Persistente Quantum Memory einführen: erfolgreiche Prompts, Agent-Auswahlen, Outputs und Performance speichern.
- Nutzerfreigaben pro Workflow-Schritt ergänzen.
- Backend-API für echte Run-Erstellung vorbereiten.
- Optional LLM Analyzer als austauschbaren Adapter hinter `analyzeTask` anbinden.
