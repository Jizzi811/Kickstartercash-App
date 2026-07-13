/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Web-Design-Check
   In-App-Gegenstück zu web-design-guidelines + frontend-design:
   prüft eingefügtes HTML/CSS gegen UI- und Accessibility-Regeln —
   echtes DOM-Parsing über DOMParser, komplett lokal.
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  function analyze(src) {
    var issues = [];
    var add = function (sev, msg) { issues.push({ sev: sev, msg: msg }); };
    var isFragment = !/<html[\s>]/i.test(src);
    var doc;
    try { doc = new DOMParser().parseFromString(src, 'text/html'); }
    catch (e) { return '⚠️ Konnte das HTML nicht parsen: ' + e.message; }

    /* ── Struktur & Metadaten (nur bei ganzen Seiten) ── */
    if (!isFragment) {
      if (!/<html[^>]+lang=/i.test(src)) add('error', '<html> ohne lang-Attribut — Screenreader raten die Sprache');
      if (!doc.querySelector('meta[name="viewport"]')) add('error', 'Kein Viewport-Meta — Seite ist auf Mobilgeräten winzig');
      if (!doc.querySelector('title') || !doc.querySelector('title').textContent.trim()) add('warn', 'Kein <title> — schlecht für Tabs, Lesezeichen, SEO');
    }
    var vp = doc.querySelector('meta[name="viewport"]');
    if (vp && /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(vp.content)) {
      add('error', 'Viewport verbietet Zoomen (user-scalable=no) — Accessibility-Verstoß');
    }

    /* ── Bilder & Medien ── */
    doc.querySelectorAll('img:not([alt])').forEach(function (el) {
      add('error', '<img src="' + (el.getAttribute('src') || '?').slice(0, 40) + '"> ohne alt-Attribut');
    });
    doc.querySelectorAll('video[autoplay]:not([muted])').forEach(function () {
      add('warn', 'Video mit autoplay ohne muted — wird geblockt oder nervt mit Ton');
    });
    doc.querySelectorAll('img:not([width]):not([height])').forEach(function (el, i, all) {
      if (i === 0) add('hint', all.length + ' Bild(er) ohne width/height — Layout springt beim Laden (CLS)');
    });

    /* ── Links & Buttons ── */
    doc.querySelectorAll('a[target="_blank"]').forEach(function (el) {
      if (!/noopener|noreferrer/.test(el.getAttribute('rel') || '')) {
        add('warn', 'target="_blank" ohne rel="noopener" — Tabnabbing-Risiko');
      }
    });
    doc.querySelectorAll('a').forEach(function (el) {
      var t = el.textContent.trim().toLowerCase();
      if (t === 'hier' || t === 'hier klicken' || t === 'click here' || t === 'mehr') {
        add('hint', 'Linktext „' + t + '“ sagt nichts aus — beschreibenden Text verwenden');
      }
    });
    doc.querySelectorAll('div[onclick], span[onclick]').forEach(function (el) {
      add('error', '<' + el.tagName.toLowerCase() + ' onclick> statt <button> — keine Tastatur-Bedienung');
    });

    /* ── Formulare ── */
    doc.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(function (el) {
      var id = el.getAttribute('id');
      var labelled = (id && doc.querySelector('label[for="' + id + '"]')) ||
        el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (!labelled) add('warn', '<' + el.tagName.toLowerCase() + (el.name ? ' name="' + el.name + '"' : '') + '> ohne Label — nur Placeholder reicht nicht');
    });

    /* ── Überschriften-Hierarchie ── */
    var hs = Array.prototype.map.call(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'), function (h) {
      return parseInt(h.tagName[1], 10);
    });
    if (doc.querySelectorAll('h1').length > 1) add('warn', doc.querySelectorAll('h1').length + '× <h1> — eine Seite, eine Hauptüberschrift');
    for (var i = 1; i < hs.length; i++) {
      if (hs[i] - hs[i - 1] > 1) { add('hint', 'Überschriften-Sprung h' + hs[i - 1] + ' → h' + hs[i] + ' — Ebenen nicht überspringen'); break; }
    }

    /* ── CSS (Inline-Styles + <style>-Blöcke) ── */
    var css = Array.prototype.map.call(doc.querySelectorAll('style'), function (s) { return s.textContent; }).join('\n') +
      '\n' + Array.prototype.map.call(doc.querySelectorAll('[style]'), function (s) { return s.getAttribute('style'); }).join('\n') +
      (isFragment && !/</.test(src.trim()[0] || '') ? '\n' + src : ''); /* reines CSS eingefügt */

    if (/outline\s*:\s*none|outline\s*:\s*0/i.test(css) && !/focus-visible/i.test(css)) {
      add('error', 'outline:none ohne :focus-visible-Ersatz — Tastatur-Fokus unsichtbar');
    }
    var m = css.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi) || [];
    m.forEach(function (f) {
      var px = parseFloat(f.match(/[\d.]+/)[0]);
      if (px > 0 && px < 12) add('warn', 'font-size ' + px + 'px — unter 12px ist kaum lesbar');
    });
    var imp = (css.match(/!important/g) || []).length;
    if (imp > 3) add('hint', imp + '× !important — Spezifitäts-Krieg, Struktur überdenken');
    if (/position\s*:\s*fixed/i.test(css) && /100vh/.test(css)) {
      add('hint', '100vh + fixed — auf iOS ragt das unter die Browser-Leiste (dvh nutzen)');
    }
    var animCount = (css.match(/animation|transition/gi) || []).length;
    if (animCount > 0 && !/prefers-reduced-motion/i.test(css) && animCount > 4) {
      add('hint', animCount + ' Animationen ohne prefers-reduced-motion-Fallback');
    }

    /* ── Ergebnis ── */
    var errors = issues.filter(function (x) { return x.sev === 'error'; });
    var warns = issues.filter(function (x) { return x.sev === 'warn'; });
    var hints = issues.filter(function (x) { return x.sev === 'hint'; });
    var count = doc.querySelectorAll('*').length;

    if (!issues.length) {
      return '✅ **DESIGN-CHECK: SAUBER** — ' + count + ' Elemente geprüft, keine Verstöße gegen die Guidelines gefunden. Sehr ordentlich! 🎨';
    }
    var fmt = function (list) { return list.map(function (x) { return '· ' + x.msg; }).join('\n'); };
    var score = Math.max(0, 100 - errors.length * 20 - warns.length * 8 - hints.length * 3);
    return [
      '🎨 **WEB-DESIGN-CHECK** — ' + count + ' Elemente · Score: **' + score + '/100**',
      errors.length ? '\n🔴 **KRITISCH (' + errors.length + ')**\n' + fmt(errors) : '',
      warns.length ? '\n🟡 **WARNUNGEN (' + warns.length + ')**\n' + fmt(warns) : '',
      hints.length ? '\n🔵 **HINWEISE (' + hints.length + ')**\n' + fmt(hints) : '',
      '\nGeprüft nach den Web-Interface-Guidelines (Accessibility, Formulare, Links, Typo, CSS). Farbkontrast & echtes Rendering prüft nur ein Browser-Test.',
    ].filter(Boolean).join('\n');
  }

  function openEditor() {
    if (document.getElementById('dc-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'dc-overlay';
    ov.className = 'cr-overlay';
    ov.innerHTML =
      '<div class="cr-box" role="dialog" aria-label="Web-Design-Check">' +
      '<div class="cr-box__head">🎨 WEB-DESIGN-CHECK — HTML oder CSS einfügen</div>' +
      '<textarea class="cr-box__code" id="dc-code" data-testid="designcheck-textarea" spellcheck="false" placeholder="Ganze Seite, HTML-Ausschnitt oder CSS hier einfügen …"></textarea>' +
      '<div class="cr-box__actions">' +
      '<button class="cr-box__btn cr-box__btn--go" id="dc-go" data-testid="designcheck-analyze-btn">⚡ PRÜFEN</button>' +
      '<button class="cr-box__btn" id="dc-close" data-testid="designcheck-close-btn">SCHLIESSEN</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.getElementById('dc-close').addEventListener('click', close);
    document.getElementById('dc-go').addEventListener('click', function () {
      var code = document.getElementById('dc-code').value;
      if (!code.trim()) return;
      close();
      var ui = window.Quantum.ui;
      if (ui) {
        ui.system('Design-Check läuft …');
        ui.reply(analyze(code));
      }
    });
    document.getElementById('dc-code').focus();
  }

  window.Quantum.skills.register({
    id: 'designcheck',
    icon: '🎨',
    name: 'Web-Design-Check',
    desc: 'Prüft HTML/CSS gegen UI- & A11y-Guidelines',
    usage: '/skill designcheck  (öffnet den Editor)',
    run(input) {
      if (input.trim()) return analyze(input);
      openEditor();
      return '🎨 Design-Check geöffnet — füg HTML oder CSS ein. Geprüft werden u. a.: alt-Texte, Labels, Fokus-Sichtbarkeit, Viewport/Zoom, Linktexte, Überschriften-Hierarchie, Schriftgrößen, !important-Inflation.';
    },
  });
})();
