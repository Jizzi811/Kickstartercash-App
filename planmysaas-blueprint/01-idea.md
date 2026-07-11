# Brandmind

> KI-gestützte Marken- und Gründungsplattform, die Gründer und bestehende Unternehmen von der Strategie bis zur Umsetzung begleitet — ein Betriebssystem statt zehn Einzeltools.

## Problem statement

Gründer und kleine Unternehmen im DACH-Raum jonglieren heute mit 8–15 Einzelwerkzeugen (Businessplan-Tool, Canva, ChatGPT, Newsletter-Tool, Website-Baukasten, Buchhaltung) plus teuren Beratern und Agenturen — und keines dieser Werkzeuge kennt die Marke, die Zielgruppe oder die Strategie des Nutzers. Generische KI-Tools liefern generischen Output, weil der Kontext bei jedem Prompt neu erklärt werden muss. Das Problem ist ungelöst, weil bestehende Anbieter entweder nur Teilschritte abdecken (LivePlan: nur Plan, Jasper: nur Text, Canva: nur Design) oder für den deutschsprachigen Gründungskontext (Rechtsformen, Fördermittel, IHK-Realität) blind sind.

## Target audience

**Primäre Buyer-Persona: „Gründerin Lena" (32)**
Solo- oder Duo-Gründerin im DACH-Raum, 0–12 Monate vor bzw. nach Gründung, Dienstleistung oder digitales Produkt. Hängt in Gründer-Facebook-Gruppen, LinkedIn, r/Existenzgründung und Gründerplattform.de ab. Nutzt aktuell ChatGPT + Canva + Google Docs. Budget für Tools: 20–60 €/Monat; für eine Agentur (3.000 €+) fehlt das Geld. Zahlt, wenn ihr das Tool nachweislich Berater-Stunden erspart.

**Sekundär 1: „KMU-Inhaber Markus" (45)**
Bestehendes Unternehmen, 3–20 Mitarbeiter, Marke gewachsen statt geplant. Will Marketing professionalisieren, ohne eine Stelle zu schaffen. Importiert seine bestehende Marke (Website, Logo, Tonalität) und erwartet, dass die KI damit arbeitet. Zahlungsbereitschaft 50–150 €/Monat.

**Sekundär 2: „Marketing-Allrounderin Sarah" (28)**
Einzige Marketing-Person in einem KMU. Braucht Content, E-Mails, Kampagnen in Markensprache — schnell. Nutzerin, nicht Käuferin; überzeugt Markus intern.

## Business model

**Freemium-Subscription.** Begründung: Das Produkt ist ein täglicher Arbeitsplatz mit laufenden LLM-Kosten — wiederkehrender Nutzen rechtfertigt wiederkehrenden Preis, und die Gratis-Stufe füttert den Funnel aus den Gründer-Communities.

Preishypothese (Stripe ist bereits integriert):
- **Free** — Founder-Journey bis Ideen-Vergleich, stark limitierte KI-Aufrufe (Budget-Deckel, keine teuren Modelle)
- **Pro 39 €/Monat** — volle Founder-Journey, Brand Brain, alle Studios, faire Nutzungsgrenzen
- **Business 99 €/Monat** — Marken-Import für Bestandsunternehmen, Automationen, mehrere Workspaces/Nutzer

## Key features (top 5)

- **Founder Journey** — geführter Weg von Ideenfindung über Ideen-Vergleich, Businessplan, Finanzplan bis zu Angeboten. *(Kernproblem)*
- **Brand Brain** — persistenter Marken-Kontext (Positionierung, Zielgruppe, Tonalität, Assets), den jede KI-Funktion automatisch nutzt. *(Kernproblem — der Differenzierer)*
- **Studios** — Copywriting, Design, E-Mail, Content-Kalender, Finanz-Suite: Umsetzung in Markensprache statt generischem Output. *(Retention)*
- **AI Marketing Director** — Nordstern: „Ich will 500 Leads in 30 Tagen" → Strategie, Content, Funnel, Newsletter aus einer Unterhaltung. *(Kernproblem, spätere Phase)*
- **Automation & Funnel** — wiederkehrende Marketing-Abläufe und veröffentlichbare Funnels. *(Retention)*

## Founder's rules

1. **DACH-first, Deutsch-first.** Kein „global vom ersten Tag" — der deutschsprachige Gründungskontext ist der Burggraben.
2. **Bestehender Stack bleibt.** React (CRA) + FastAPI + MongoDB + Stripe + Multi-LLM-Gateway. Kein Rewrite; Refactoring nur per Strangler-Fig (siehe ROADMAP.md).
3. **Kein Feature-Chaos.** Sprints mit Definition of Done; LLM-Kosten der Free-Stufe sind hart gedeckelt.

## Success criteria (Monat 6)

1. **100 zahlende Abos** (≈ 3.900 € MRR bei Pro-Mix) aus dem DACH-Raum.
2. **Aktivierung ≥ 40 %:** Anteil neuer Nutzer, die innerhalb von 7 Tagen ihr Brand Brain (oder Founder-Profil) vollständig einrichten und mindestens ein Studio-Ergebnis exportieren.

## Anti-goals

- **Kein Agentur-Marktplatz** — wir vermitteln keine Dienstleister, wir ersetzen den Bedarf.
- **Keine native Mobile-App** — Web-first; die Zielgruppe arbeitet am Laptop.
- **Kein generischer ChatGPT-Klon** — jede Chat-Oberfläche ohne Brand-Kontext ist Scope-Fehler.
- **Kein Enterprise-Vertrieb** — Self-Service bis mindestens 20k € MRR.
