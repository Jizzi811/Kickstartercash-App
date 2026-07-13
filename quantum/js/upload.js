/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Datei-Upload (📎)
   Upload-Button in der Chat-Eingabe für Dokumente und Bilder.
   Alles wird LOKAL verarbeitet: Bilder → Vorschau + Farbanalyse,
   Texte/Code/Daten → passender Skill (Zusammenfassung, Code-Review,
   Design-Check, JSON-Validierung, CSV-Statistik, Quarkdown-Build).
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  var MAX_IMG = 8 * 1048576;   /* 8 MB  */
  var MAX_TEXT = 1048576;      /* 1 MB  */

  function fmtSize(b) {
    return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  }

  /* ── Bilder: Vorschau + dominante Farben ─────────────────────── */

  function toHex(r, g, b) {
    var h = function (v) { return ('0' + v.toString(16)).slice(-2); };
    return '#' + h(r) + h(g) + h(b);
  }

  function analyzeImage(dataUrl, file) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      var s = 48;
      c.width = s; c.height = s;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, s, s);
      var bins = {};
      try {
        var d = ctx.getImageData(0, 0, s, s).data;
        for (var i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 120) continue;
          var key = (d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5);
          bins[key] = (bins[key] || 0) + 1;
        }
      } catch (e) { /* getImageData kann bei exotischen Formaten scheitern */ }
      var top = Object.keys(bins).sort(function (a, b) { return bins[b] - bins[a]; }).slice(0, 4)
        .map(function (k) {
          var p = k.split(',').map(function (v) { return (parseInt(v, 10) << 5) + 16; });
          return toHex(Math.min(255, p[0]), Math.min(255, p[1]), Math.min(255, p[2]));
        });
      var mp = (img.naturalWidth * img.naturalHeight / 1e6).toFixed(1);
      var ui = window.Quantum.ui;
      ui.image(dataUrl, { alt: file.name, filename: file.name, label: '📎 UPLOAD · ' + file.name.toUpperCase() });
      ui.reply('🖼 **' + file.name + '** — ' + img.naturalWidth + '×' + img.naturalHeight + ' px (' + mp + ' MP), ' +
        fmtSize(file.size) + ', ' + (file.type.split('/')[1] || '?').toUpperCase() + '.' +
        (top.length ? '\nDominante Farben: ' + top.map(function (h) { return '`' + h + '`'; }).join(' ') : '') +
        '\nSeitenverhältnis: ' + (img.naturalWidth / img.naturalHeight).toFixed(2) +
        (img.naturalWidth >= 1200 ? ' — taugt als Header/Poster.' : ' — eher Thumbnail-Größe.'));
    };
    img.onerror = function () {
      window.Quantum.ui.reply('⚠️ Konnte das Bild nicht laden — Format nicht unterstützt?');
    };
    img.src = dataUrl;
  }

  /* ── Texte, Code & Daten ─────────────────────────────────────── */

  function textStats(text) {
    var words = (text.match(/\S+/g) || []).length;
    return text.split('\n').length + ' Zeilen · ' + words + ' Wörter · ~' + Math.max(1, Math.round(words / 200)) + ' Min. Lesezeit';
  }

  function analyzeText(text, file) {
    var ui = window.Quantum.ui;
    var run = function (id, input) { return window.Quantum.skills.run(id, input); };
    var ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
    var head = '📎 **' + file.name + '** (' + fmtSize(file.size) + ') — ' + textStats(text);
    window.Quantum.upload = { name: file.name, text: text }; /* für Folge-Skills */

    if (text.length > MAX_TEXT) {
      ui.reply(head + '\nDie Datei ist groß — ich habe sie geladen, aber automatische Analysen übersprungen.');
      return;
    }
    if (ext === 'json') {
      var check;
      try {
        var parsed = JSON.parse(text);
        var kind = Array.isArray(parsed) ? 'Array mit ' + parsed.length + ' Einträgen' : 'Objekt mit ' + Object.keys(parsed).length + ' Schlüsseln';
        check = '✅ JSON ist valide — ' + kind + '.';
      } catch (e) { check = '🔴 JSON-Fehler: ' + e.message; }
      ui.reply(head + '\n' + check);
    } else if (ext === 'csv') {
      var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
      var sep = (lines[0] || '').indexOf(';') > -1 ? ';' : ',';
      var cols = (lines[0] || '').split(sep);
      ui.reply(head + '\n📊 CSV: ' + lines.length + ' Zeilen × ' + cols.length + ' Spalten (Trenner „' + sep + '“).\nSpalten: ' +
        cols.slice(0, 8).map(function (c) { return '`' + c.trim().slice(0, 20) + '`'; }).join(' ') + (cols.length > 8 ? ' …' : ''));
    } else if (ext === 'qd') {
      ui.system(head);
      ui.reply(run('quarkdown', text));
    } else if (['js', 'py', 'ts', 'jsx', 'tsx'].indexOf(ext) > -1) {
      ui.system(head + ' — starte Code-Review …');
      ui.reply(run('codereview', text));
    } else if (['html', 'htm', 'css'].indexOf(ext) > -1) {
      ui.system(head + ' — starte Design-Check …');
      ui.reply(run('designcheck', text));
    } else {
      /* txt, md & Rest: Kurzfassung */
      ui.system(head + ' — fasse zusammen …');
      ui.reply(run('zusammenfassen', text.slice(0, 20000)));
    }
  }

  /* ── Routing nach Dateityp ───────────────────────────────────── */

  var BINARY_HINT = {
    pdf: 'PDFs kann ich im Browser nicht lesen — dafür ist der installierte `pdf`-Skill in Claude Code da.',
    docx: 'Word-Dateien kann ich im Browser nicht lesen — dafür ist der installierte `docx`-Skill in Claude Code da.',
    doc: 'Word-Dateien kann ich im Browser nicht lesen — dafür ist der installierte `docx`-Skill in Claude Code da.',
    mp3: 'Audio? Nimm den 🌊 SongSee-Skill: `/skill songsee` und die Datei dort auswählen.',
    wav: 'Audio? Nimm den 🌊 SongSee-Skill: `/skill songsee` und die Datei dort auswählen.',
    ogg: 'Audio? Nimm den 🌊 SongSee-Skill: `/skill songsee` und die Datei dort auswählen.',
    m4a: 'Audio? Nimm den 🌊 SongSee-Skill: `/skill songsee` und die Datei dort auswählen.',
  };

  function handleFile(file) {
    var ui = window.Quantum.ui;
    if (!file) return;
    var ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();

    if (file.type.indexOf('image/') === 0) {
      if (file.size > MAX_IMG) { ui.reply('⚠️ Bild ist größer als 8 MB — bitte verkleinern.'); return; }
      var r = new FileReader();
      r.onload = function () { analyzeImage(r.result, file); };
      r.readAsDataURL(file);
      return;
    }
    if (BINARY_HINT[ext]) {
      ui.reply('📎 **' + file.name + '** (' + fmtSize(file.size) + ')\n' + BINARY_HINT[ext]);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var text = String(reader.result);
      if (/[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 2000))) {
        ui.reply('📎 **' + file.name + '** sieht binär aus — damit kann ich lokal nichts anfangen. Bilder, Text, Code, JSON, CSV und .qd gehen!');
        return;
      }
      analyzeText(text, file);
    };
    reader.readAsText(file);
  }

  /* ── Button & Drag-and-Drop verdrahten ───────────────────────── */

  function init() {
    var btn = document.getElementById('btn-upload');
    var input = document.getElementById('file-upload');
    if (!btn || !input) return;
    btn.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      Array.prototype.forEach.call(input.files, handleFile);
      input.value = '';
    });
    /* Dateien direkt ins Chatfenster ziehen */
    var frame = document.querySelector('.chat-frame');
    if (frame) {
      frame.addEventListener('dragover', function (e) { e.preventDefault(); });
      frame.addEventListener('drop', function (e) {
        e.preventDefault();
        Array.prototype.forEach.call(e.dataTransfer.files, handleFile);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
