/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Doku-Co-Autor
   In-App-Gegenstück zum doc-coauthoring-Skill: strukturiertes
   Interview im Chat (Typ → Titel → Leser → Kernpunkte → Theme),
   danach baut das Dokument-Studio daraus ein fertiges Dokument
   (druckbar/als PDF speicherbar — deckt die docx/pdf-Richtung ab).
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  var state = null;

  var QUESTIONS = [
    'Frage 1/5 — Was für ein Dokument schreiben wir? (z. B. Konzept, Angebot, Bericht, Anleitung, Ankündigung)',
    'Frage 2/5 — Wie soll der Titel lauten?',
    'Frage 3/5 — Für wen ist das Dokument, und was soll diese Person danach wissen oder tun?',
    'Frage 4/5 — Nenn mir die Kernpunkte (mit | getrennt — jeder wird ein eigener Abschnitt):',
    'Frage 5/5 — Welches Design? `premium` (Gold/Schwarz, klassisch) oder `neon` (Quantum-Look)?',
  ];

  function ask() {
    return '**' + QUESTIONS[state.answers.length] + '**';
  }

  function finish() {
    var a = state.answers;
    state = null;
    window.Quantum.engine.clearSession();

    var docType = a[0];
    var title = a[1];
    var audience = a[2];
    var points = a[3].split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    var theme = /neon/i.test(a[4]) ? 'neon' : 'premium';

    var content = [
      '# Worum es geht',
      'Dieses Dokument (' + docType + ') richtet sich an: ' + audience,
    ];
    points.forEach(function (p) {
      var parts = p.split(':');
      var head = parts.shift().trim();
      var body = parts.join(':').trim();
      content.push('## ' + head);
      content.push(body || 'Wird im nächsten Entwurf ausformuliert.');
    });
    content.push('# Nächste Schritte');
    content.push('- Entwurf gegenlesen: Stimmen Ton und Reihenfolge für die Zielgruppe?');
    content.push('- Lücken füllen, wo „Wird ausformuliert“ steht');
    content.push('- Im Druckdialog als PDF speichern und teilen');

    var result = window.Quantum.skills.run('dokument', theme + ' ' + title + ' | ' + content.join('\n'));
    return [
      '📝 **ENTWURF STEHT** — „' + title + '“ (' + docType + ', Theme ' + theme + ', ' + points.length + ' Abschnitte)',
      '',
      String(result),
      '',
      'Co-Autor-Tipp: Ein Dokument funktioniert, wenn die Zielgruppe nach dem Lesen weiß, was zu tun ist — prüf jeden Abschnitt gegen deine Antwort aus Frage 3.',
    ].join('\n');
  }

  function onMessage(text) {
    if (!state) return undefined;
    var t = text.trim();
    if (/^(stop|abbruch|abbrechen|exit|\/stop)$/i.test(t)) {
      state = null;
      window.Quantum.engine.clearSession();
      return 'Co-Autor-Session beendet — nichts wurde erstellt. 📝';
    }
    if (t.startsWith('/')) return undefined;
    if (t.length < 2) return 'Da brauche ich etwas mehr — oder `stop` zum Abbrechen.';
    state.answers.push(t);
    if (state.answers.length >= QUESTIONS.length) return finish();
    return ask();
  }

  window.Quantum.skills.register({
    id: 'coauthor',
    icon: '📝',
    name: 'Doku-Co-Autor',
    desc: 'Interview → fertiges Dokument (5 Fragen)',
    usage: '/skill coauthor',
    run() {
      if (state) return 'Das Interview läuft schon — beantworte die aktuelle Frage oder tippe `stop`.';
      if (window.Quantum.engine.hasSession()) return 'Gerade läuft eine andere Session — beende sie erst (`stop`).';
      state = { answers: [] };
      window.Quantum.engine.setSession(onMessage);
      return '📝 **DOKU-CO-AUTOR GESTARTET** — 5 Fragen, dann baue ich dir ein fertiges Dokument (druckbar/als PDF). `stop` bricht ab.\n\n' + ask();
    },
  });
})();
