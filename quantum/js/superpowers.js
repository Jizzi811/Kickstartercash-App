/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Superpowers-Coach
   In-App-Adaption der Superpowers-Skill-Bibliothek (obra/superpowers,
   installiert unter .claude/skills/): die 14 Prozess-Skills als
   Kompakt-Guides im Chat, plus interaktive Coach-Sessions für
   Brainstorming und systematisches Debugging.
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  /* ── Die 14 Superpowers als Kompakt-Guides ───────────────────── */

  var GUIDES = {
    'using-superpowers': {
      icon: '🦸', title: 'Skill-First-Arbeitsweise', group: 'META',
      one: 'Wann und wie man Skills überhaupt einsetzt',
      law: 'Wenn auch nur 1 % Chance besteht, dass ein Skill passt: Skill nutzen. Keine Ausreden.',
      steps: [
        'Passenden Skill VOR jeder Antwort oder Aktion aufrufen — auch vor Rückfragen',
        'Ankündigen: „Nutze [Skill], um [Zweck]“ — dann exakt dem Skill folgen',
        'Prozess-Skills (Brainstorming, Debugging) kommen vor Implementierungs-Skills',
        '„Lass uns X bauen“ heißt: erst Brainstorming, dann Code',
      ],
    },
    brainstorming: {
      icon: '💡', title: 'Brainstorming', group: 'PROZESS', coach: 'brainstorm',
      one: 'Ideen in geprüfte Designs verwandeln — vor jedem Feature',
      law: 'HARD GATE: Kein Code, kein Scaffolding, bevor ein Design präsentiert und freigegeben wurde. Auch bei „simplen“ Projekten.',
      steps: [
        'Projekt-Kontext erkunden (Dateien, Doku, letzte Commits)',
        'Klärungsfragen stellen — EINE nach der anderen: Zweck, Constraints, Erfolgskriterien',
        '2–3 Lösungsansätze mit Trade-offs vorschlagen, eine Empfehlung markieren',
        'Design abschnittsweise präsentieren, Freigabe einholen',
        'Design-Dokument schreiben und selbst reviewen (Platzhalter? Widersprüche? Scope?)',
        'Erst nach Freigabe: Implementierungsplan (writing-plans)',
      ],
    },
    'systematic-debugging': {
      icon: '🔬', title: 'Systematisches Debugging', group: 'PROZESS', coach: 'debug',
      one: 'Root Cause finden statt Symptome flicken',
      law: 'IRON LAW: Kein Fix ohne abgeschlossene Ursachen-Analyse (Phase 1). Symptom-Fixes gelten als Fehlschlag.',
      steps: [
        'Phase 1 — Ursache: Fehlermeldung KOMPLETT lesen · zuverlässig reproduzieren · letzte Änderungen prüfen · an Komponenten-Grenzen loggen',
        'Phase 2 — Muster: Funktionierende ähnliche Stellen finden und Unterschiede vergleichen',
        'Phase 3 — Hypothese: kleinstmöglichen Test der Vermutung bauen, erst verstehen, dann fixen',
        'Phase 4 — Umsetzung: EIN Fix pro Hypothese, danach verifizieren; kein Stapeln von Versuchen',
        'Schlägt Fix Nr. 3 fehl: STOPP — eine Grundannahme ist falsch, zurück zu Phase 1',
      ],
    },
    'test-driven-development': {
      icon: '🔴', title: 'Test-Driven Development', group: 'PROZESS',
      one: 'RED → GREEN → REFACTOR, ohne Ausnahmen',
      law: 'IRON LAW: Kein Produktionscode ohne vorher fehlgeschlagenen Test. „Test schreib ich danach“ ist kein TDD.',
      steps: [
        'RED: einen kleinen Test für das gewünschte Verhalten schreiben',
        'Test ausführen und das SCHEITERN mit eigenen Augen sehen (falscher Test = wertlos)',
        'GREEN: minimalen Code schreiben, bis genau dieser Test grün ist',
        'Alle Tests laufen lassen — alles grün',
        'REFACTOR: aufräumen, solange alles grün bleibt — dann nächster Zyklus',
      ],
    },
    'verification-before-completion': {
      icon: '✅', title: 'Verifizieren vor „Fertig“', group: 'PROZESS',
      one: 'Erst beweisen, dann Erfolg melden',
      law: 'IRON LAW: Keine Erfolgsmeldung ohne frisch ausgeführten, gelesenen Beweis. „Sollte jetzt gehen“ = nicht verifiziert.',
      steps: [
        'Verifikationskommando bestimmen (Tests, Build, Lint, manueller Durchlauf)',
        'Es KOMPLETT ausführen — nicht nur den schnellen Teil',
        'Die Ausgabe wirklich LESEN (Exit-Code allein reicht nicht)',
        'Erst danach berichten — inklusive dessen, was NICHT geprüft wurde',
      ],
    },
    'writing-plans': {
      icon: '📋', title: 'Pläne schreiben', group: 'PLANUNG',
      one: 'Mehrstufige Arbeit vor dem Code in Häppchen zerlegen',
      steps: [
        'Plan-Dokument mit Ziel, Kontext und globalen Constraints beginnen',
        'Aufgaben mundgerecht schneiden: je 2–5 Minuten, exakte Datei + Änderung + Test',
        'Keine Platzhalter wie „usw.“ oder „analog“ — jeder Schritt konkret ausformuliert',
        'Selbst-Review: Reihenfolge? Lücken? Abhängigkeiten?',
        'Dann Übergabe an die Ausführung (executing-plans)',
      ],
    },
    'executing-plans': {
      icon: '🚀', title: 'Pläne ausführen', group: 'PLANUNG',
      one: 'Diszipliniert abarbeiten, verifizieren, committen',
      steps: [
        'Einen Task nach dem anderen — Reihenfolge des Plans respektieren',
        'Nach jedem Task verifizieren und committen',
        'Bei Blockern: stoppen und nachfragen statt improvisieren',
        'Abweichungen zurück in den Plan schreiben, nicht still abweichen',
      ],
    },
    'subagent-driven-development': {
      icon: '🤖', title: 'Subagenten-Entwicklung', group: 'PLANUNG',
      one: 'Unabhängige Plan-Tasks an Agenten delegieren',
      steps: [
        'Nur unabhängige, klar geschnittene Tasks delegieren',
        'Jedem Agenten vollständigen Kontext mitgeben (er kennt deinen Chat nicht)',
        'Ergebnisse reviewen wie fremden Code',
        'Integration und Gesamtverifikation bleiben Chefsache',
      ],
    },
    'dispatching-parallel-agents': {
      icon: '🧵', title: 'Parallele Agenten', group: 'PLANUNG',
      one: 'Ab 2 unabhängigen Aufgaben parallelisieren',
      steps: [
        'Prüfen: wirklich unabhängig? Kein gemeinsamer Zustand, keine Reihenfolge?',
        'Jeder Agent bekommt einen in sich geschlossenen Auftrag',
        'Keine zwei Agenten an denselben Dateien',
        'Ergebnisse einsammeln, zusammenführen, gemeinsam verifizieren',
      ],
    },
    'using-git-worktrees': {
      icon: '🌳', title: 'Git Worktrees', group: 'GIT & REVIEW',
      one: 'Feature-Arbeit vom Arbeitsstand isolieren',
      steps: [
        'Worktree anlegen: `git worktree add ../projekt-feature -b feature`',
        'Projekt-Setup im Worktree ausführen (install, build)',
        'Sauberen Baseline-Test verifizieren, BEVOR die Arbeit beginnt',
        'Hauptarbeitskopie bleibt unangetastet — nach Merge Worktree entfernen',
      ],
    },
    'finishing-a-development-branch': {
      icon: '🏁', title: 'Branch abschließen', group: 'GIT & REVIEW',
      one: 'Strukturiert mergen, PRen oder verwerfen',
      steps: [
        'Erst: kompletter Testlauf muss grün sein',
        'Optionen sauber anbieten: mergen / Pull Request / behalten / verwerfen',
        'Beim Merge: erst mergen, dann Tests auf dem Ergebnis, DANN erst Branch/Worktree löschen',
        'Niemals etwas löschen, bevor der Merge verifiziert ist',
      ],
    },
    'requesting-code-review': {
      icon: '🔍', title: 'Review anfordern', group: 'GIT & REVIEW',
      one: 'Nach jedem größeren Feature, vor jedem Merge',
      steps: [
        'Review anfordern, sobald ein Feature steht — nicht erst am Ende des Projekts',
        'Diff, Kontext und eigene Unsicherheiten mitliefern',
        'Findings nach Schwere sortieren lassen und priorisiert abarbeiten',
      ],
    },
    'receiving-code-review': {
      icon: '🧐', title: 'Review empfangen', group: 'GIT & REVIEW',
      one: 'Feedback prüfen statt blind umsetzen',
      steps: [
        'Verboten: performatives „Guter Punkt!“ ohne Prüfung — erst verifizieren, dann antworten',
        'Unklares Feedback: nachfragen statt raten',
        'Technisch falsches Feedback: respektvoll mit Belegen zurückweisen',
        'YAGNI-Check bei „professionellen“ Extra-Wünschen: braucht es das jetzt wirklich?',
        'Berechtigtes Feedback in sinnvoller Reihenfolge umsetzen und verifizieren',
      ],
    },
    'writing-skills': {
      icon: '✍️', title: 'Skills schreiben', group: 'META',
      one: 'Wissen als wiederverwendbaren Skill verpacken',
      steps: [
        'Name + Beschreibung so formulieren, dass klar ist, WANN der Skill greift',
        'Kern-Anleitung kompakt in die SKILL.md, Details in references/ auslagern',
        'Konkrete Beispiele und Red Flags aufnehmen',
        'Skill testen (führt er wirklich zum Ziel?), bevor er ausgeliefert wird',
      ],
    },
  };

  var GROUPS = ['PROZESS', 'PLANUNG', 'GIT & REVIEW', 'META'];
  var ALIASES = {
    tdd: 'test-driven-development', debug: 'systematic-debugging', debugging: 'systematic-debugging',
    brainstorm: 'brainstorming', verify: 'verification-before-completion', plan: 'writing-plans',
    plans: 'writing-plans', worktree: 'using-git-worktrees', worktrees: 'using-git-worktrees',
    review: 'receiving-code-review',
  };

  function resolve(name) {
    var n = name.toLowerCase().replace(/\s+/g, '-');
    if (GUIDES[n]) return n;
    if (ALIASES[n]) return ALIASES[n];
    var hit = Object.keys(GUIDES).filter(function (k) { return k.indexOf(n) > -1; });
    return hit.length === 1 ? hit[0] : null;
  }

  function catalog() {
    var out = ['🦸 **SUPERPOWERS** — 14 Profi-Workflows (nach obra/superpowers)', '──────────────────'];
    GROUPS.forEach(function (g) {
      out.push('**' + g + '**');
      Object.keys(GUIDES).forEach(function (k) {
        var s = GUIDES[k];
        if (s.group === g) out.push(s.icon + ' `' + k + '` — ' + s.one);
      });
    });
    out.push('', 'Guide zeigen: `/skill superpowers tdd` · Interaktiv: `/skill superpowers brainstorm start` oder `/skill superpowers debug start`');
    return out.join('\n');
  }

  function guide(key) {
    var s = GUIDES[key];
    var out = [s.icon + ' **' + s.title.toUpperCase() + '** (`' + key + '`)', s.one, ''];
    if (s.law) out.push('⚖️ ' + s.law, '');
    s.steps.forEach(function (st, i) { out.push((i + 1) + '. ' + st); });
    if (s.coach) out.push('', '▶ Interaktiver Coach: `/skill superpowers ' + s.coach + ' start`');
    return out.join('\n');
  }

  /* ── Interaktive Coach-Sessions ──────────────────────────────── */

  var session = null;

  var COACHES = {
    brainstorm: {
      title: '💡 BRAINSTORMING-COACH', intro: 'Wir schärfen deine Idee mit 5 Fragen — eine nach der anderen (Superpowers-Stil). `stop` bricht ab.',
      questions: [
        'Frage 1/5 — Was willst du bauen? Beschreib die Idee in 1–2 Sätzen.',
        'Frage 2/5 — Für wen ist das, und welches Problem löst es für diese Person?',
        'Frage 3/5 — Was MUSS Version 1 können — und was ist ausdrücklich NICHT Teil davon (YAGNI)?',
        'Frage 4/5 — Welche Constraints gibt es? (Technik-Stack, Zeit, Abhängigkeiten, Budget)',
        'Frage 5/5 — Woran erkennst du, dass es ein Erfolg ist? Nenn ein messbares Kriterium.',
      ],
      finish: function (a) {
        return [
          '💡 **DEIN DESIGN-BRIEF**', '──────────────────',
          '**Idee:** ' + a[0], '**Zielgruppe & Problem:** ' + a[1],
          '**Scope V1 / Nicht-Ziele:** ' + a[2], '**Constraints:** ' + a[3],
          '**Erfolgskriterium:** ' + a[4], '',
          '**Nächste Schritte (Superpowers-Prozess):**',
          '1. 2–3 Lösungsansätze mit Trade-offs skizzieren, einen empfehlen',
          '2. Design freigeben lassen — HARD GATE: vorher kein Code',
          '3. Plan schreiben: `/skill superpowers plans`',
          '',
          'Tipp: `/skill dokument premium Design-Brief | # Idee\\n' + a[0].slice(0, 60) + ' …` macht ein Dokument daraus.',
        ].join('\n');
      },
    },
    debug: {
      title: '🔬 DEBUGGING-COACH', intro: 'Systematisch zur Ursache in 4 Phasen. Iron Law: kein Fix vor Phase 1! `stop` bricht ab.',
      questions: [
        'Phase 1 · Frage 1/6 — Was ist die EXAKTE Fehlermeldung? (komplett einfügen, inkl. Zeilennummern)',
        'Phase 1 · Frage 2/6 — Kannst du den Fehler zuverlässig reproduzieren? Mit welchen Schritten?',
        'Phase 1 · Frage 3/6 — Was wurde zuletzt geändert? (Commits, Dependencies, Config, Umgebung)',
        'Phase 2 · Frage 4/6 — Funktioniert etwas Ähnliches woanders im Projekt? Was ist dort anders?',
        'Phase 3 · Frage 5/6 — Deine Hypothese: Was ist die GRUND-Ursache (nicht das Symptom)?',
        'Phase 3 · Frage 6/6 — Wie testest du diese Hypothese mit minimalem Eingriff, bevor du fixt?',
      ],
      finish: function (a) {
        return [
          '🔬 **DEIN DEBUG-PROTOKOLL**', '──────────────────',
          '**Fehler:** ' + a[0], '**Reproduktion:** ' + a[1], '**Letzte Änderungen:** ' + a[2],
          '**Vergleichsstelle:** ' + a[3], '**Hypothese:** ' + a[4], '**Hypothesen-Test:** ' + a[5], '',
          '**Phase 4 — Umsetzung:**',
          '1. Hypothese mit dem Mini-Test bestätigen',
          '2. EINEN gezielten Fix bauen (kein Stapeln von Versuchen)',
          '3. Verifizieren: `/skill superpowers verify`',
          '⚖️ Schlägt Fix Nr. 3 fehl: STOPP — eine Grundannahme ist falsch, zurück zu Phase 1.',
        ].join('\n');
      },
    },
  };

  function onMessage(text) {
    if (!session) return undefined;
    var t = text.trim();
    if (/^(stop|abbruch|abbrechen|exit|\/stop)$/i.test(t)) {
      session = null;
      window.Quantum.engine.clearSession();
      return 'Coach-Session beendet. 🦸 Jederzeit wieder: `/skill superpowers`';
    }
    if (t.startsWith('/')) return undefined; /* Befehle durchlassen */
    if (t.length < 3) return 'Etwas mehr Kontext hilft mir — oder `stop` zum Abbrechen.';
    session.answers.push(t);
    var coach = COACHES[session.coach];
    if (session.answers.length >= coach.questions.length) {
      var result = coach.finish(session.answers);
      session = null;
      window.Quantum.engine.clearSession();
      return result;
    }
    return '**' + coach.questions[session.answers.length] + '**';
  }

  window.Quantum.skills.register({
    id: 'superpowers',
    icon: '🦸',
    name: 'Superpowers-Coach',
    desc: 'Profi-Workflows: TDD, Debugging, Planung, Reviews',
    usage: '/skill superpowers [name] — Liste ohne Argument',
    run(input) {
      var arg = input.trim().toLowerCase();
      if (session) return 'Eine Coach-Session läuft schon — beantworte die aktuelle Frage oder tippe `stop`.';
      if (!arg || arg === 'liste' || arg === 'list' || arg === 'hilfe') return catalog();

      var m = arg.match(/^(\S+)(?:\s+start)?$/);
      var wantStart = /\sstart$/.test(arg) || arg === 'start';
      var name = arg.replace(/\s*start$/, '').trim();
      if (!name) return catalog();

      var coachKey = COACHES[name] ? name : (resolve(name) && GUIDES[resolve(name)].coach);
      if (wantStart) {
        if (!coachKey || !COACHES[coachKey]) {
          return 'Einen interaktiven Coach gibt es für `brainstorm` und `debug`. Für alles andere: `/skill superpowers <name>` zeigt den Kompakt-Guide.';
        }
        session = { coach: coachKey, answers: [] };
        window.Quantum.engine.setSession(onMessage);
        var c = COACHES[coachKey];
        return c.title + ' **GESTARTET**\n' + c.intro + '\n\n**' + c.questions[0] + '**';
      }

      if (COACHES[name]) return guide(name === 'debug' ? 'systematic-debugging' : 'brainstorming');
      var key = resolve(name);
      if (key) return guide(key);
      return 'Kenne ich nicht: `' + m[1] + '`. `/skill superpowers` zeigt alle 14 Workflows.';
    },
  });
})();
