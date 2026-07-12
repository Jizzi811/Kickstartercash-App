/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Bild-Schmiede
   In-App-Gegenstück zum imagegen-Skill: generiert Poster, Cover
   und Wallpaper prozedural auf einem Canvas — ohne API-Key,
   komplett lokal. Fünf Stile, drei Formate, Ausgabe als PNG
   direkt im Chat (mit Download-Link).
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  var SIZES = { quer: [1600, 900], quadrat: [1200, 1200], story: [1080, 1920] };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* Schrift so verkleinern, dass sie in maxW passt */
  function fitFont(ctx, text, family, weight, startPx, maxW) {
    var px = startPx;
    do {
      ctx.font = weight + ' ' + px + 'px ' + family;
      if (ctx.measureText(text).width <= maxW) break;
      px -= 4;
    } while (px > 18);
    return px;
  }

  function glowText(ctx, text, x, y, color, blur) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = blur / 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function orb(ctx, x, y, r, color) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  var FONT_HEAD = '"Orbitron", "Arial Black", sans-serif';
  var FONT_SUB = '"Rajdhani", "Segoe UI", sans-serif';

  var STYLES = {
    neon: {
      label: 'Neon (Quantum-Look)',
      draw: function (ctx, W, H, o) {
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#05011a');
        g.addColorStop(1, '#0c032c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        orb(ctx, W * 0.18, H * 0.22, W * 0.35, 'rgba(0,245,255,0.22)');
        orb(ctx, W * 0.85, H * 0.8, W * 0.4, 'rgba(255,45,247,0.2)');
        ctx.strokeStyle = 'rgba(0,245,255,0.13)';
        ctx.lineWidth = 1;
        var step = W / 22;
        for (var x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (var y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(0,245,255,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(W * 0.04, H * 0.05, W * 0.92, H * 0.9);
        ctx.textAlign = 'center';
        var px = fitFont(ctx, o.title, FONT_HEAD, '900', Math.round(W / 8), W * 0.82);
        glowText(ctx, o.title, W / 2, H / 2, '#00f5ff', px * 0.6);
        if (o.subtitle) {
          ctx.font = '600 ' + Math.round(px * 0.34) + 'px ' + FONT_SUB;
          glowText(ctx, o.subtitle.toUpperCase(), W / 2, H / 2 + px * 0.85, '#ff2df7', px * 0.35);
        }
      },
    },
    synthwave: {
      label: 'Synthwave (Sonne & Grid)',
      draw: function (ctx, W, H, o) {
        var horizon = H * 0.62;
        var sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, '#12002e');
        sky.addColorStop(1, '#5b0f54');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, horizon);
        /* Sonne mit Streifen */
        var r = Math.min(W, H) * 0.24, sx = W / 2, sy = horizon - r * 0.15;
        var sun = ctx.createLinearGradient(0, sy - r, 0, sy + r);
        sun.addColorStop(0, '#ffd23f');
        sun.addColorStop(1, '#ff2d78');
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = sun;
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
        ctx.fillStyle = '#12002e';
        for (var i = 0; i < 6; i++) ctx.fillRect(sx - r, sy + r * 0.1 + i * r * 0.16, r * 2, r * 0.05 + i * r * 0.012);
        ctx.restore();
        /* Boden-Grid in Perspektive */
        var floor = ctx.createLinearGradient(0, horizon, 0, H);
        floor.addColorStop(0, '#1c0640');
        floor.addColorStop(1, '#05011a');
        ctx.fillStyle = floor;
        ctx.fillRect(0, horizon, W, H - horizon);
        ctx.strokeStyle = 'rgba(255,45,247,0.7)';
        ctx.lineWidth = 2;
        for (i = 0; i <= 14; i++) {
          var t = i / 14;
          var y = horizon + (H - horizon) * t * t;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        for (i = -10; i <= 10; i++) {
          ctx.beginPath();
          ctx.moveTo(W / 2 + i * W * 0.06, horizon);
          ctx.lineTo(W / 2 + i * W * 0.3, H);
          ctx.stroke();
        }
        ctx.textAlign = 'center';
        var px = fitFont(ctx, o.title, FONT_HEAD, '900', Math.round(W / 8), W * 0.85);
        glowText(ctx, o.title, W / 2, horizon * 0.42, '#ff2d78', px * 0.55);
        if (o.subtitle) {
          ctx.font = '600 ' + Math.round(px * 0.32) + 'px ' + FONT_SUB;
          glowText(ctx, o.subtitle.toUpperCase(), W / 2, horizon * 0.42 + px * 0.8, '#ffd23f', px * 0.3);
        }
      },
    },
    sterne: {
      label: 'Sternenfeld (Nebula)',
      draw: function (ctx, W, H, o) {
        ctx.fillStyle = '#020208';
        ctx.fillRect(0, 0, W, H);
        orb(ctx, W * rnd(0.2, 0.4), H * rnd(0.2, 0.5), W * 0.45, 'rgba(90,40,160,0.4)');
        orb(ctx, W * rnd(0.6, 0.85), H * rnd(0.4, 0.75), W * 0.4, 'rgba(20,80,160,0.35)');
        for (var i = 0; i < 420; i++) {
          var s = Math.random();
          ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + s * 0.75) + ')';
          ctx.beginPath();
          ctx.arc(Math.random() * W, Math.random() * H, s * s * 2.6 + 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.textAlign = 'center';
        var px = fitFont(ctx, o.title, FONT_HEAD, '900', Math.round(W / 8), W * 0.85);
        glowText(ctx, o.title, W / 2, H / 2, '#9db8ff', px);
        if (o.subtitle) {
          ctx.font = '600 ' + Math.round(px * 0.32) + 'px ' + FONT_SUB;
          ctx.fillStyle = 'rgba(220,228,255,0.85)';
          ctx.fillText(o.subtitle.toUpperCase(), W / 2, H / 2 + px * 0.85);
        }
      },
    },
    wellen: {
      label: 'Wellen (fließende Bänder)',
      draw: function (ctx, W, H, o) {
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#021a2e');
        g.addColorStop(1, '#00404d');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        var colors = ['rgba(0,245,255,0.2)', 'rgba(0,180,255,0.22)', 'rgba(120,255,220,0.18)', 'rgba(255,255,255,0.08)'];
        for (var l = 0; l < colors.length; l++) {
          var base = H * (0.45 + l * 0.14), amp = H * rnd(0.05, 0.11), ph = rnd(0, 6.28), fr = rnd(1.2, 2.6);
          ctx.fillStyle = colors[l];
          ctx.beginPath();
          ctx.moveTo(0, H);
          for (var x = 0; x <= W; x += 8) ctx.lineTo(x, base + Math.sin(ph + (x / W) * Math.PI * fr) * amp);
          ctx.lineTo(W, H);
          ctx.closePath();
          ctx.fill();
        }
        ctx.textAlign = 'center';
        var px = fitFont(ctx, o.title, FONT_HEAD, '900', Math.round(W / 9), W * 0.85);
        glowText(ctx, o.title, W / 2, H * 0.26, '#aefcff', px * 0.5);
        if (o.subtitle) {
          ctx.font = '600 ' + Math.round(px * 0.34) + 'px ' + FONT_SUB;
          ctx.fillStyle = 'rgba(230,255,255,0.85)';
          ctx.fillText(o.subtitle.toUpperCase(), W / 2, H * 0.26 + px * 0.8);
        }
      },
    },
    minimal: {
      label: 'Minimal (ruhig & klar)',
      draw: function (ctx, W, H, o) {
        var bg = pick(['#101418', '#f4f1ea', '#0f2430']);
        var dark = bg !== '#f4f1ea';
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        var accent = pick(['#ff5c39', '#00b8a9', '#ffd23f', '#7a5cff']);
        ctx.textAlign = 'left';
        ctx.fillStyle = dark ? '#f2f2f2' : '#141414';
        var px = fitFont(ctx, o.title, FONT_SUB, '700', Math.round(W / 9), W * 0.8);
        ctx.fillText(o.title, W * 0.08, H * 0.72);
        ctx.fillStyle = accent;
        ctx.fillRect(W * 0.08, H * 0.72 - px * 1.22, W * 0.12, Math.max(6, px * 0.07));
        if (o.subtitle) {
          ctx.font = '500 ' + Math.round(px * 0.36) + 'px ' + FONT_SUB;
          ctx.fillStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
          ctx.fillText(o.subtitle, W * 0.08, H * 0.72 + px * 0.62);
        }
      },
    },
  };

  function generate(o) {
    var size = SIZES[o.size];
    var canvas = document.createElement('canvas');
    canvas.width = size[0];
    canvas.height = size[1];
    var ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    STYLES[o.style].draw(ctx, size[0], size[1], o);
    return canvas.toDataURL('image/png');
  }

  window.Quantum.skills.register({
    id: 'bild',
    icon: '🎨',
    name: 'Bild-Schmiede',
    desc: 'Generiert Poster & Wallpaper (5 Stile, lokal)',
    usage: '/skill bild Titel | Untertitel | stil | format',
    run(input) {
      var parts = input.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
      var o = { title: '', subtitle: '', style: '', size: '' };
      if (parts.length) o.title = parts.shift();
      parts.forEach(function (p) {
        var k = p.toLowerCase();
        if (STYLES[k]) o.style = k;
        else if (SIZES[k]) o.size = k;
        else if (!o.subtitle) o.subtitle = p;
      });
      var showHelp = !o.title;
      if (!o.title) o.title = 'QUANTUM';
      if (!o.style) o.style = pick(Object.keys(STYLES));
      if (!o.size) o.size = 'quer';

      var dataUrl = generate(o);
      var ui = window.Quantum.ui;
      if (ui) {
        ui.image(dataUrl, {
          alt: 'Generiertes Bild: ' + o.title + ' (' + o.style + ')',
          filename: o.title.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-+|-+$/g, '') + '-' + o.style + '.png',
        });
      }
      var lines = [
        '🎨 **' + o.title + '** geschmiedet — Stil `' + o.style + '` (' + STYLES[o.style].label + '), Format `' + o.size + '` (' + SIZES[o.size].join('×') + ' px).',
        'Nochmal ausführen = neue Variante (Stile mischen Zufall rein).',
      ];
      if (showHelp) {
        lines.push('So geht’s: `/skill bild Mein Titel | Untertitel | ' + Object.keys(STYLES).join('/') + ' | ' + Object.keys(SIZES).join('/') + '`');
      }
      return lines.join('\n');
    },
  });
})();
