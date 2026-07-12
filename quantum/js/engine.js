/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Antwort-Engine
   Lokales Demo-Gehirn: Befehls-Router (/help, /skills, …) plus
   einfache Intent-Erkennung für Smalltalk. Komplett offline.
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  /* Mini-Eventbus für Automationen & UI */
  const listeners = {};
  window.Quantum.bus = {
    on(event, fn) { (listeners[event] = listeners[event] || []).push(fn); },
    emit(event, data) { (listeners[event] || []).forEach(fn => fn(data)); },
  };

  const GREETINGS = [
    'Hey! ⚡ Ich bin Quantum, dein AI Worker. Was bauen wir heute?',
    'Neural-Link stabil. 🌐 Womit kann ich dich unterstützen?',
    'Hallo! Meine Skills glühen schon — schieß los.',
  ];

  const FALLBACKS = [
    'Interessant! In dieser Demo laufe ich komplett lokal ohne LLM — aber probier mal einen Skill: `/skills` zeigt dir alles.',
    'Verstanden. Für echte Denk-Power würdest du hier eine KI-API anbinden. Bis dahin: `/help` zeigt, was ich kann.',
    'Mein Quantenkern hat dazu (noch) keine Antwort — er ist eine lokale Demo. Aber `/skill ideen` wirft dir sofort etwas zu!',
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function helpText() {
    return [
      '📖 QUANTUM-BEFEHLE',
      '──────────────────',
      '`/help` — diese Übersicht',
      '`/skills` — alle Skills auflisten',
      '`/skill <name> <eingabe>` — Skill ausführen',
      '`/auto` — Automationen auflisten',
      '`/clear` — Chat leeren',
      '',
      'Skills kannst du links anklicken, Automationen rechts anlegen.',
      'Beispiel: `/skill rechner 42*10+2`',
    ].join('\n');
  }

  function skillsText() {
    const s = window.Quantum.skills;
    return '◈ VERFÜGBARE SKILLS\n──────────────────\n' + s.all.map(sk =>
      (s.isEnabled(sk.id) ? '🟢' : '⚫') + ' ' + sk.icon + ' **' + sk.name + '** — ' + sk.desc + '\n   ↳ `' + sk.usage + '`'
    ).join('\n');
  }

  function autosText() {
    const autos = window.Quantum.automations.all();
    if (!autos.length) return 'Noch keine Automationen. Leg rechts im Panel eine an! ⟳';
    return '⟳ DEINE AUTOMATIONEN\n──────────────────\n' + autos.map(a =>
      (a.paused ? '⏸' : '▶') + ' **' + a.name + '** — ' + window.Quantum.automations.describe(a)
    ).join('\n');
  }

  const INTENTS = [
    { re: /^(hi|hey|hallo|moin|servus|yo)\b/i, fn: () => pick(GREETINGS) },
    { re: /wie geht('?s| es dir)/i, fn: () => 'Alle Systeme im grünen Bereich. 🟢 Kerne kühl, Neonröhren warm. Und dir?' },
    { re: /wer bist du|was bist du|stell dich vor/i, fn: () => 'Ich bin **QUANTUM** ⚛ — ein AI-Worker-Interface mit Skills (Fähigkeiten auf Abruf) und Automationen (Aufgaben, die von selbst laufen). Diese Demo läuft zu 100 % lokal in deinem Browser.' },
    { re: /was kannst du|deine (skills|fähigkeiten)/i, fn: skillsText },
    { re: /danke|nice|cool|geil|super/i, fn: () => 'Immer gern! ⚡ Nächste Aufgabe?' },
    { re: /uhrzeit|wie spät/i, fn: () => '🕒 Es ist ' + new Date().toLocaleTimeString('de-DE') + '.' },
    { re: /datum|welcher tag/i, fn: () => '📅 Heute ist ' + new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '.' },
    { re: /^[\d\s+\-*/().^%]+$/, fn: (text) => window.Quantum.skills.run('rechner', text) },
  ];

  window.Quantum.engine = {
    greeting() { return pick(GREETINGS); },

    /* Verarbeitet eine User-Nachricht und liefert die Antwort */
    respond(raw) {
      const text = raw.trim();

      if (text.startsWith('/')) {
        const [cmd, ...rest] = text.slice(1).split(/\s+/);
        const arg = rest.join(' ');
        switch (cmd.toLowerCase()) {
          case 'help': return helpText();
          case 'skills': return skillsText();
          case 'auto':
          case 'autos':
          case 'automationen': return autosText();
          case 'skill': {
            const [id, ...input] = arg.split(/\s+/);
            if (!id) return 'Welchen Skill? Beispiel: `/skill wuerfel 3w6` — Liste mit `/skills`.';
            return window.Quantum.skills.run(id.toLowerCase(), input.join(' '));
          }
          case 'clear': return '__CLEAR__';
          default: return 'Unbekannter Befehl `/' + cmd + '`. Tippe `/help`.';
        }
      }

      for (const intent of INTENTS) {
        if (intent.re.test(text)) return intent.fn(text);
      }
      return pick(FALLBACKS);
    },
  };
})();
