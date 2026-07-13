/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Landingpage-Studio
   In-App-Gegenstück zu web-artifacts-builder + here.now: baut aus
   ein paar Angaben eine komplette, responsive Single-File-Landingpage
   (Hero, Features, CTA, Footer) — fertig zum Hosten via Netlify Drop
   oder here.now. Komplett lokal generiert.
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var SCHEMES = {
    neon: {
      label: 'Neon (dunkel, leuchtend)',
      css: ':root{--bg:#05011a;--card:#0d0530;--text:#e8e6ff;--dim:#9a93c9;--a:#00f5ff;--b:#ff2df7}' +
        'body{background:radial-gradient(circle at 20% 0%,#12064a,var(--bg) 55%)}' +
        '.hero h1{background:linear-gradient(90deg,var(--a),var(--b));-webkit-background-clip:text;background-clip:text;color:transparent}' +
        '.cta{background:linear-gradient(90deg,var(--a),var(--b));color:#05011a;box-shadow:0 0 30px rgba(0,245,255,.45)}' +
        '.card{border:1px solid rgba(0,245,255,.25)}.card:hover{box-shadow:0 0 26px rgba(0,245,255,.25)}',
    },
    hell: {
      label: 'Hell (freundlich, klar)',
      css: ':root{--bg:#f7f5f0;--card:#ffffff;--text:#1c1c1e;--dim:#6e6e73;--a:#0a7c66;--b:#f0a12e}' +
        'body{background:var(--bg)}.hero h1{color:var(--text)}' +
        '.cta{background:var(--a);color:#fff;box-shadow:0 10px 26px rgba(10,124,102,.3)}' +
        '.card{border:1px solid #e8e4da;box-shadow:0 4px 18px rgba(0,0,0,.05)}.card:hover{box-shadow:0 10px 30px rgba(0,0,0,.1)}',
    },
    mitternacht: {
      label: 'Mitternacht (dunkel, seriös)',
      css: ':root{--bg:#0e1420;--card:#161f30;--text:#e8edf6;--dim:#8c99ad;--a:#4d9fff;--b:#7a5cff}' +
        'body{background:var(--bg)}.hero h1{color:var(--text)}' +
        '.cta{background:var(--a);color:#fff;box-shadow:0 10px 30px rgba(77,159,255,.35)}' +
        '.card{border:1px solid #24304a}.card:hover{border-color:var(--a)}',
    },
  };

  var ICONS = ['⚡', '🛡️', '🚀', '💡', '🧩', '📈'];

  function build(o) {
    var features = o.features.map(function (f, i) {
      var parts = f.split(':');
      var title = parts.shift().trim();
      var body = parts.join(':').trim() || 'Beschreibung folgt.';
      return '<div class="card"><div class="card__icon">' + ICONS[i % ICONS.length] + '</div>' +
        '<h2>' + esc(title) + '</h2><p>' + esc(body) + '</p></div>';
    }).join('');

    return '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + esc(o.name) + ' — ' + esc(o.claim) + '</title>' +
      '<meta name="description" content="' + esc(o.claim) + '">' +
      '<style>*{margin:0;box-sizing:border-box}' +
      'body{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--text);line-height:1.6}' +
      '.wrap{max-width:1040px;margin:0 auto;padding:0 1.4rem}' +
      'header{padding:1.2rem 0;display:flex;justify-content:space-between;align-items:center}' +
      '.logo{font-weight:800;font-size:1.15rem;letter-spacing:.02em}' +
      '.hero{text-align:center;padding:5.5rem 0 4.5rem}' +
      '.hero h1{font-size:clamp(2.2rem,6vw,3.8rem);font-weight:800;letter-spacing:-.02em;line-height:1.1}' +
      '.hero p{font-size:clamp(1.05rem,2.4vw,1.35rem);color:var(--dim);max-width:640px;margin:1.2rem auto 2.2rem}' +
      '.cta{display:inline-block;padding:.95rem 2.2rem;border-radius:999px;font-weight:700;font-size:1.05rem;text-decoration:none;transition:transform .15s}' +
      '.cta:hover{transform:translateY(-2px)}.cta:focus-visible{outline:3px solid var(--b);outline-offset:3px}' +
      '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.2rem;padding:1rem 0 4rem}' +
      '.card{background:var(--card);border-radius:14px;padding:1.6rem;transition:all .2s}' +
      '.card__icon{font-size:1.8rem;margin-bottom:.6rem}.card h2{margin-bottom:.4rem;font-size:1.12rem}.card p{color:var(--dim);font-size:.95rem}' +
      '.bottom{text-align:center;padding:3.5rem 0 4.5rem}.bottom h2{font-size:clamp(1.5rem,4vw,2.2rem);margin-bottom:1.6rem}' +
      'footer{border-top:1px solid rgba(128,128,128,.25);padding:1.6rem 0;text-align:center;color:var(--dim);font-size:.85rem}' +
      '@media (prefers-reduced-motion: reduce){.cta,.card{transition:none}}' +
      SCHEMES[o.scheme].css +
      '</style></head><body>' +
      '<div class="wrap"><header><span class="logo">' + esc(o.name) + '</span>' +
      '<a class="cta" style="padding:.5rem 1.2rem;font-size:.9rem" href="#cta">' + esc(o.cta) + '</a></header>' +
      '<main><section class="hero"><h1>' + esc(o.name) + '</h1><p>' + esc(o.claim) + '</p>' +
      '<a class="cta" href="#cta">' + esc(o.cta) + ' →</a></section>' +
      (features ? '<section class="grid" aria-label="Funktionen">' + features + '</section>' : '') +
      '<section class="bottom" id="cta"><h2>Bereit loszulegen?</h2>' +
      '<a class="cta" href="#">' + esc(o.cta) + '</a></section></main>' +
      '<footer>© ' + new Date().getFullYear() + ' ' + esc(o.name) + ' · Erstellt mit Quantum ⚛</footer>' +
      '</div></body></html>';
  }

  function deliver(html, name) {
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    if (window.open(url, '_blank')) return 'tab';
    var a = document.createElement('a');
    a.href = url;
    a.download = name.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-+|-+$/g, '') + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'download';
  }

  function openStudio() {
    if (document.getElementById('ws-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'ws-overlay';
    ov.className = 'ss-overlay';
    ov.innerHTML =
      '<div class="ss-box" role="dialog" aria-label="Landingpage-Studio">' +
      '<div class="ss-box__head">🌐 LANDINGPAGE-STUDIO — EINE DATEI, FERTIG ZUM HOSTEN</div>' +
      '<div class="ss-row">' +
      '<label class="ss-field" style="flex:2">Produkt/Projekt <input type="text" id="ws-name" maxlength="40" value="Quantum" /></label>' +
      '<label class="ss-field">Farbschema <select id="ws-scheme">' +
      Object.keys(SCHEMES).map(function (k) { return '<option value="' + k + '">' + k + ' — ' + SCHEMES[k].label + '</option>'; }).join('') +
      '</select></label></div>' +
      '<label class="ss-field">Claim (ein Satz) <input type="text" id="ws-claim" maxlength="120" value="Dein AI Worker mit Skills und Automationen — komplett lokal." /></label>' +
      '<label class="ss-field">Features (Titel: Beschreibung | …) <input type="text" id="ws-features" maxlength="400" value="Schnell: Läuft ohne Server direkt im Browser | Privat: Deine Daten bleiben bei dir | Erweiterbar: Skills wie Lego-Steine" /></label>' +
      '<label class="ss-field">Call-to-Action <input type="text" id="ws-cta" maxlength="40" value="Jetzt starten" /></label>' +
      '<div class="ss-actions">' +
      '<button class="ss-btn ss-btn--go" id="ws-go" data-testid="webseite-build-btn">⚡ SEITE BAUEN</button>' +
      '<button class="ss-btn" id="ws-close" data-testid="webseite-close-btn">SCHLIESSEN</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.getElementById('ws-close').addEventListener('click', close);
    document.getElementById('ws-go').addEventListener('click', function () {
      var o = {
        name: document.getElementById('ws-name').value.trim() || 'Mein Projekt',
        claim: document.getElementById('ws-claim').value.trim() || 'Ein Satz, der neugierig macht.',
        features: document.getElementById('ws-features').value.split('|').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6),
        cta: document.getElementById('ws-cta').value.trim() || 'Los geht’s',
        scheme: document.getElementById('ws-scheme').value,
      };
      close();
      var how = deliver(build(o), o.name);
      var ui = window.Quantum.ui;
      if (ui) {
        ui.reply('🌐 **' + o.name + '** ist gebaut — Schema `' + o.scheme + '`, ' + o.features.length + ' Feature-Karten, responsive, mit Fokus-Styles und reduced-motion-Fallback.' +
          (how === 'tab' ? '\nDie Seite ist im neuen Tab geöffnet.' : '\nPopup blockiert — als HTML-Datei heruntergeladen.') +
          '\nHosten: Datei speichern und auf **app.netlify.com/drop** ziehen — oder mit dem here-now-Skill auf `{name}.here.now` veröffentlichen.');
      }
    });
    document.getElementById('ws-name').focus();
  }

  window.Quantum.skills.register({
    id: 'webseite',
    icon: '🌐',
    name: 'Landingpage-Studio',
    desc: 'Baut eine fertige Landingpage (1 Datei, hostbar)',
    usage: '/skill webseite  (öffnet das Studio)',
    run() {
      openStudio();
      return '🌐 **Landingpage-Studio geöffnet** — Name, Claim, Features und CTA eintragen, Farbschema wählen, **⚡ SEITE BAUEN**. Ergebnis: eine einzige HTML-Datei mit Hero, Feature-Grid und CTA — bereit für Netlify Drop oder here.now.';
    },
  });
})();
