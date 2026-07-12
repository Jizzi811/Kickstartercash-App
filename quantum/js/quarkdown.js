/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Quarkdown-Studio
   Browser-Adaption des quarkdown-Skills (github.com/iamgio/quarkdown):
   kompiliert ein praktisches Subset der .qd-Sprache (Markdown-Superset
   mit .funktion {arg}-Aufrufen) zu HTML-Dokumenten, Seiten oder
   Slides — komplett lokal, geöffnet in neuem Tab wie Dokument-Studio.
   Subset: .doctype/.docname/.docauthor/.theme, .var + .name-Referenzen,
   .box (tip/note/warning/error), .align/.center, <<< Seitenumbrüche,
   Markdown-Basics (Überschriften, Listen, Code, Zitate, fett/kursiv).
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Argumente eines Funktionsaufrufs: '{pos} name:{wert}' */
  function parseArgs(s) {
    var pos = [], named = {}, m;
    var re = /([a-zA-Z]\w*):\{([^{}]*)\}|\{([^{}]*)\}/g;
    while ((m = re.exec(s))) {
      if (m[1] !== undefined) named[m[1]] = m[2];
      else pos.push(m[3]);
    }
    return { pos: pos, named: named };
  }

  /* Eingerückter Funktions-Body (Tab oder 2+ Leerzeichen) */
  function collect(lines, from) {
    var body = [], j = from;
    while (j < lines.length) {
      var l = lines[j];
      if (!l.trim()) { body.push(''); j++; continue; }
      if (!/^(\t| {2,})/.test(l)) break;
      body.push(l.replace(/^(\t| {1,4})/, ''));
      j++;
    }
    while (body.length && !body[body.length - 1].trim()) body.pop();
    return { body: body, next: j, has: body.some(function (x) { return x.trim(); }) };
  }

  var BOX_ICONS = { tip: '💡', note: 'ℹ️', warning: '⚠️', error: '⛔', callout: '📌' };

  function compile(src) {
    var meta = { doctype: 'plain', docname: '', docauthor: '', theme: 'paperwhite' };
    var vars = {};
    var warnings = [];

    function inline(text, depth) {
      var s = esc(text);
      if ((depth || 0) < 4) {
        s = s.replace(/\.([a-zA-Z]\w*)/g, function (m, name) {
          return vars[name] !== undefined ? inline(vars[name], (depth || 0) + 1) : m;
        });
      }
      return s
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    /* top=true liefert Sections (getrennt durch <<<), sonst HTML-Blöcke */
    function parseBlocks(lines, top) {
      var out = [], sec = [], sections = [sec], i = 0;
      function push(html) { (top ? sec : out).push(html); }

      while (i < lines.length) {
        var line = lines[i], t = line.trim(), m;
        if (!t) { i++; continue; }
        if (top && t === '<<<') { sec = []; sections.push(sec); i++; continue; }

        if ((m = t.match(/^```\w*$/))) {
          var code = []; i++;
          while (i < lines.length && lines[i].trim() !== '```') code.push(lines[i++]);
          i++;
          push('<pre class="qd-code"><code>' + esc(code.join('\n')) + '</code></pre>');
          continue;
        }

        if ((m = line.match(/^\s*\.([a-zA-Z]\w*)\s*(.*)$/))) {
          var fn = m[1], args = parseArgs(m[2]), body = collect(lines, i + 1);
          if (fn === 'doctype' || fn === 'theme') {
            meta[fn] = (args.pos[0] || '').toLowerCase();
            i++;
          } else if (fn === 'docname' || fn === 'docauthor' || fn === 'doclang') {
            meta[fn === 'doclang' ? 'lang' : fn] = args.pos[0] || '';
            i++;
          } else if (fn === 'var' && args.pos[0]) {
            if (args.pos.length >= 2) { vars[args.pos[0]] = args.pos[1]; i++; }
            else { vars[args.pos[0]] = body.body.join('\n'); i = body.next; }
          } else if (fn === 'box') {
            var type = (args.named.type || 'callout').toLowerCase();
            if (!BOX_ICONS[type]) type = 'callout';
            push('<div class="qd-box qd-box--' + type + '">' +
              (args.pos[0] ? '<div class="qd-box__title">' + BOX_ICONS[type] + ' ' + inline(args.pos[0]) + '</div>' : '') +
              parseBlocks(body.body, false).join('\n') + '</div>');
            i = body.has ? body.next : i + 1;
          } else if (fn === 'center' || fn === 'align') {
            var dir = fn === 'center' ? 'center' : ({ start: 'left', center: 'center', end: 'right' }[(args.pos[0] || '').toLowerCase()] || 'left');
            push('<div style="text-align:' + dir + '">' + parseBlocks(body.body, false).join('\n') + '</div>');
            i = body.has ? body.next : i + 1;
          } else if (fn === 'whitespace') {
            push('<div style="height:1.5em"></div>');
            i++;
          } else if (vars[fn] !== undefined) {
            push('<p>' + inline(t) + '</p>'); /* Variablen-Referenz als Absatz */
            i++;
          } else {
            if (warnings.indexOf(fn) === -1) warnings.push(fn);
            push('<p class="qd-unknown">⚠ .' + esc(fn) + ' — nicht im Browser-Subset, Zeile übersprungen</p>');
            i = body.has ? body.next : i + 1;
          }
          continue;
        }

        if ((m = t.match(/^(#{1,6})\s+(.*)$/))) {
          var lvl = Math.min(m[1].length, 6);
          push('<h' + lvl + '>' + inline(m[2]) + '</h' + lvl + '>');
          i++;
          continue;
        }
        if (/^-{3,}$/.test(t)) { push('<hr>'); i++; continue; }
        if (/^>\s?/.test(t)) {
          var q = [];
          while (i < lines.length && /^>\s?/.test(lines[i].trim())) q.push(lines[i++].trim().replace(/^>\s?/, ''));
          push('<blockquote>' + inline(q.join(' ')) + '</blockquote>');
          continue;
        }
        if (/^[-*]\s+/.test(t)) {
          var ul = [];
          while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) ul.push('<li>' + inline(lines[i++].trim().replace(/^[-*]\s+/, '')) + '</li>');
          push('<ul>' + ul.join('') + '</ul>');
          continue;
        }
        if (/^\d+[.)]\s+/.test(t)) {
          var ol = [];
          while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) ol.push('<li>' + inline(lines[i++].trim().replace(/^\d+[.)]\s+/, '')) + '</li>');
          push('<ol>' + ol.join('') + '</ol>');
          continue;
        }
        var p = [];
        while (i < lines.length && lines[i].trim() &&
               !/^(#{1,6}\s|>|```|[-*]\s|\d+[.)]\s|\s*\.[a-zA-Z]|<<<$|-{3,}$)/.test(lines[i].trim())) {
          p.push(lines[i++].trim());
        }
        if (p.length) push('<p>' + inline(p.join(' ')) + '</p>');
        else i++;
      }
      if (top) {
        return sections.map(function (s) { return s.join('\n'); })
          .filter(function (s) { return s.trim(); });
      }
      return out;
    }

    var sections = parseBlocks(src.replace(/\r/g, '').split('\n'), true);
    if (['plain', 'paged', 'slides', 'docs'].indexOf(meta.doctype) === -1) meta.doctype = 'plain';
    if (meta.doctype === 'docs') meta.doctype = 'paged';
    return { meta: meta, sections: sections, warnings: warnings, varCount: Object.keys(vars).length };
  }

  /* ── HTML-Ausgabe ────────────────────────────────────────────── */

  var THEMES = {
    paperwhite: {
      label: 'Paperwhite (hell)',
      css: 'body{background:#e9e6de;color:#1d1d1f}.qd-sheet{background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.14)}' +
        'h1,h2,h3{font-family:Georgia,serif;color:#111}h2{border-bottom:2px solid #c9c2ae;padding-bottom:.3rem}' +
        'code{background:#f0ede4;color:#8a3d00}.qd-code{background:#23241f;color:#f8f8f2}a{color:#0a58a8}' +
        'blockquote{border-left:4px solid #c9c2ae;color:#555}.qd-cover p{color:#777}',
    },
    darko: {
      label: 'Darko (dunkel)',
      css: 'body{background:#101318;color:#e6e6ea}.qd-sheet{background:#1b1e28;box-shadow:0 8px 40px rgba(0,0,0,.6)}' +
        'h1,h2,h3{color:#8ab4ff}h2{border-bottom:2px solid #2e3442;padding-bottom:.3rem}' +
        'code{background:#0d0f14;color:#7ee787}.qd-code{background:#0d0f14;color:#e6e6ea}a{color:#7ab8ff}' +
        'blockquote{border-left:4px solid #2e3442;color:#9aa4b2}.qd-cover p{color:#9aa4b2}',
    },
  };

  var BASE_CSS =
    'body{margin:0;font-family:-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.65;font-size:1.04rem}' +
    'p,ul,ol,blockquote{margin:.6rem 0}li{margin:.25rem 0}hr{border:none;border-top:1px solid rgba(128,128,128,.35);margin:1.4rem 0}' +
    'blockquote{margin-left:0;padding-left:1rem;font-style:italic}' +
    '.qd-code{padding:.9rem 1.1rem;border-radius:8px;overflow-x:auto;font-size:.88rem;line-height:1.5}' +
    '.qd-code code{background:none;color:inherit;padding:0}code{padding:.1rem .35rem;border-radius:4px;font-size:.9em}' +
    '.qd-box{border-radius:9px;padding:.8rem 1rem;margin:1rem 0;border:1px solid;background:rgba(128,128,128,.07);border-color:rgba(128,128,128,.35)}' +
    '.qd-box__title{font-weight:700;margin-bottom:.35rem}' +
    '.qd-box--tip{border-color:#2da44e;background:rgba(45,164,78,.09)}.qd-box--note{border-color:#0969da;background:rgba(9,105,218,.09)}' +
    '.qd-box--warning{border-color:#bf8700;background:rgba(191,135,0,.1)}.qd-box--error{border-color:#cf222e;background:rgba(207,34,46,.09)}' +
    '.qd-unknown{opacity:.55;font-size:.85rem}.qd-cover{text-align:center;margin:2.5rem 0 3rem}.qd-cover h1{font-size:2.3rem;margin-bottom:.4rem}';

  function buildHtml(r) {
    var theme = THEMES[r.meta.theme] || THEMES.paperwhite;
    var title = r.meta.docname || 'Quarkdown-Dokument';
    var coverHtml = r.meta.docname
      ? '<header class="qd-cover"><h1>' + esc(r.meta.docname) + '</h1><p>' +
        (r.meta.docauthor ? esc(r.meta.docauthor) + ' · ' : '') +
        new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }) + '</p></header>'
      : '';
    var head = '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + esc(title) + '</title>' +
      '<style>' + BASE_CSS + theme.css;
    var parts;

    if (r.meta.doctype === 'slides') {
      parts = r.sections.slice();
      if (coverHtml) parts.unshift(coverHtml.replace('header class="qd-cover"', 'div class="qd-cover"').replace('</header>', '</div>'));
      var slides = parts.map(function (s, n) {
        return '<section class="qd-slide' + (n === 0 ? ' on' : '') + '">' + s + '</section>';
      }).join('\n');
      return head +
        '.qd-slide{display:none;position:fixed;inset:0;flex-direction:column;justify-content:center;padding:7vh 10vw;overflow-y:auto}' +
        '.qd-slide.on{display:flex}.qd-slide h1{font-size:2.4rem}.qd-slide h2{font-size:1.9rem}' +
        '.qd-nav{position:fixed;right:1rem;bottom:1rem;display:flex;gap:.5rem;align-items:center;font-size:.85rem;opacity:.8;z-index:9}' +
        '.qd-nav button{font-size:1rem;padding:.35rem .8rem;cursor:pointer;border-radius:6px;border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit}' +
        '@media print{.qd-slide{display:block;position:static;page-break-after:always}.qd-nav{display:none}}' +
        '</style></head><body>' + slides +
        '<div class="qd-nav"><button id="qp">‹</button><span id="qc"></span><button id="qn">›</button></div>' +
        '<scr' + 'ipt>var S=document.querySelectorAll(".qd-slide"),i=0,c=document.getElementById("qc");' +
        'function go(n){i=Math.max(0,Math.min(S.length-1,n));for(var k=0;k<S.length;k++)S[k].classList.toggle("on",k===i);c.textContent=(i+1)+" / "+S.length}' +
        'document.getElementById("qp").onclick=function(){go(i-1)};document.getElementById("qn").onclick=function(){go(i+1)};' +
        'document.addEventListener("keydown",function(e){if(e.key==="ArrowRight"||e.key===" ")go(i+1);if(e.key==="ArrowLeft")go(i-1)});go(0);' +
        '</scr' + 'ipt></body></html>';
    }

    if (r.meta.doctype === 'paged') {
      parts = r.sections.map(function (s, n) {
        return '<section class="qd-sheet qd-page">' + (n === 0 ? coverHtml : '') + s +
          '<footer class="qd-pageno">' + (n + 1) + ' / ' + r.sections.length + '</footer></section>';
      }).join('\n');
      return head +
        '.qd-page{width:min(794px,94vw);min-height:1000px;margin:2rem auto;padding:3.2rem 3.4rem 4rem;position:relative;box-sizing:border-box}' +
        '.qd-pageno{position:absolute;bottom:1.1rem;right:1.6rem;font-size:.75rem;opacity:.55}' +
        '@media print{body{background:#fff}.qd-page{margin:0;box-shadow:none;min-height:auto;page-break-after:always;width:auto}}' +
        '</style></head><body>' + parts + '</body></html>';
    }

    /* plain */
    return head +
      '.qd-flow{max-width:760px;margin:2rem auto;padding:2.6rem 2.8rem 3rem}.qd-sep{margin:2.2rem 0}' +
      '@media print{body{background:#fff}.qd-flow{box-shadow:none;margin:0;max-width:none}}' +
      '</style></head><body><main class="qd-sheet qd-flow">' + coverHtml +
      r.sections.join('\n<hr class="qd-sep">\n') + '</main></body></html>';
  }

  /* Neuer Tab; bei Popup-Blocker Download (wie Dokument-Studio) */
  function deliver(html, title) {
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    if (window.open(url, '_blank')) return 'tab';
    var a = document.createElement('a');
    a.href = url;
    a.download = title.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-+|-+$/g, '') + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'download';
  }

  function build(src) {
    var r = compile(src);
    if (!r.sections.length) return 'Das Dokument ist leer — schreib etwas Quarkdown. 😄 `/skill quarkdown` öffnet den Editor mit Beispiel.';
    var how = deliver(buildHtml(r), r.meta.docname || 'quarkdown');
    var kind = { slides: 'Slide(s)', paged: 'Seite(n)', plain: 'Abschnitt(e)' }[r.meta.doctype];
    return '📐 **' + (r.meta.docname || 'Quarkdown-Dokument') + '** kompiliert — Doctype `' + r.meta.doctype +
      '`, ' + r.sections.length + ' ' + kind + ', Theme `' + (THEMES[r.meta.theme] ? r.meta.theme : 'paperwhite') + '`' +
      (r.varCount ? ', ' + r.varCount + ' Variable(n)' : '') + '.' +
      (r.warnings.length ? '\n⚠ Nicht im Browser-Subset: `.' + r.warnings.join('`, `.') + '`' : '') +
      (how === 'tab'
        ? '\nDas Ergebnis ist in einem neuen Tab geöffnet — dort druckbar/als PDF speicherbar.'
        : '\nPopup war blockiert — das Ergebnis wurde als HTML-Datei heruntergeladen.');
  }

  var DEMO = [
    '.docname {Quantum Pitch}', '.docauthor {Du}', '.doctype {slides}', '.theme {darko}', '',
    '.var {produkt} {Quantum}', '',
    '# .produkt — dein AI Worker', '', 'Skills, Automationen und ein Neon-Herz.', '',
    '<<<', '', '## Warum .produkt?', '',
    '- Läuft **komplett lokal** im Browser', '- Über 20 Skills, vom Rechner bis SongSee', '- Automationen: zeit- und ereignisgesteuert', '',
    '.box {Tipp} type:{tip}', '\tÄndere `.doctype {slides}` in `paged` oder `plain` und bau neu!', '',
    '<<<', '', '## Roadmap', '', '1. Mehr Skills', '2. Mehr Neon', '3. Weltherrschaft *(die freundliche Variante)*', '',
    '.center', '\t**Danke!**',
  ].join('\n');

  function openEditor() {
    if (document.getElementById('qd-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'qd-overlay';
    ov.className = 'cr-overlay';
    ov.innerHTML =
      '<div class="cr-box" role="dialog" aria-label="Quarkdown-Studio">' +
      '<div class="cr-box__head">📐 QUARKDOWN-STUDIO — .qd schreiben, Dokument/Slides bauen</div>' +
      '<textarea class="cr-box__code" id="qd-src" data-testid="quarkdown-textarea" spellcheck="false"></textarea>' +
      '<div class="cr-box__actions">' +
      '<button class="cr-box__btn cr-box__btn--go" id="qd-go" data-testid="quarkdown-build-btn">⚡ BAUEN &amp; ÖFFNEN</button>' +
      '<button class="cr-box__btn" id="qd-close" data-testid="quarkdown-close-btn">SCHLIESSEN</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    document.getElementById('qd-src').value = DEMO;
    var close = function () { ov.remove(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.getElementById('qd-close').addEventListener('click', close);
    document.getElementById('qd-go').addEventListener('click', function () {
      var src = document.getElementById('qd-src').value;
      if (!src.trim()) return;
      close();
      var ui = window.Quantum.ui;
      if (ui) { ui.system('Quarkdown kompiliert …'); ui.reply(build(src)); }
    });
    document.getElementById('qd-src').focus();
  }

  window.Quantum.skills.register({
    id: 'quarkdown',
    icon: '📐',
    name: 'Quarkdown-Studio',
    desc: 'Markdown-Superset → Dokumente, Seiten & Slides',
    usage: '/skill quarkdown  (öffnet den .qd-Editor)',
    run(input) {
      if (input.trim()) return build(input.replace(/\\n/g, '\n'));
      openEditor();
      return '📐 Quarkdown-Editor geöffnet (mit Beispiel-Pitch). Subset: `.doctype {plain|paged|slides}`, `.docname`, `.theme {paperwhite|darko}`, `.var` + `.name`, `.box {Titel} type:{tip|note|warning|error}`, `.center`, `<<<` als Umbruch — plus normales Markdown.';
    },
  });
})();
