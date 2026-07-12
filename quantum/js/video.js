/* ═══════════════════════════════════════════════════════════════
   QUANTUM — Video-Studio
   In-App-Gegenstück zu den Remotion-Skills: programmatische Videos
   nach dem Remotion-Prinzip — jeder Frame ist eine Funktion von
   (frame, dauer, optionen). Gerendert auf Canvas, aufgenommen mit
   MediaRecorder als echtes WebM — komplett lokal im Browser.
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  var FPS = 30;
  var FORMATS = { quer: [1280, 720], hoch: [720, 1280], quadrat: [960, 960] };
  var SCHEMES = {
    quantum: { bg1: '#05011a', bg2: '#0c032c', a: '#00f5ff', b: '#ff2df7' },
    sunset:  { bg1: '#1a0533', bg2: '#3d0a2e', a: '#ff9e42', b: '#ff2d78' },
    matrix:  { bg1: '#020a02', bg2: '#04140a', a: '#39ff14', b: '#baffc0' },
  };

  /* ── Animations-Helfer (Remotion-Stil) ───────────────────────── */

  function interp(f, from, to, a, b) {
    var t = Math.max(0, Math.min(1, (f - from) / Math.max(1, to - from)));
    return a + (b - a) * t;
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function backOut(t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function hash(i) { var s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); }

  function fitFont(ctx, text, weight, startPx, maxW) {
    var px = startPx;
    do {
      ctx.font = weight + ' ' + px + 'px "Orbitron", "Arial Black", sans-serif';
      if (ctx.measureText(text).width <= maxW) break;
      px -= 4;
    } while (px > 16);
    return px;
  }

  function bg(ctx, W, H, c) {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, c.bg1);
    g.addColorStop(1, c.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function grid(ctx, W, H, c, offset, alpha) {
    ctx.strokeStyle = c.a.replace(')', '');
    ctx.strokeStyle = c.a;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    var step = W / 18;
    for (var x = -step + (offset % step); x <= W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = -step + (offset % step); y <= H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function particles(ctx, W, H, c, f, n) {
    for (var i = 0; i < n; i++) {
      var speed = 0.3 + hash(i) * 1.2;
      var x = ((hash(i * 3 + 1) * W) + f * speed) % W;
      var y = ((hash(i * 7 + 2) * H) - f * speed * 0.4) % H;
      if (y < 0) y += H;
      ctx.fillStyle = i % 2 ? c.a : c.b;
      ctx.globalAlpha = 0.25 + hash(i * 13) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 1 + hash(i * 5) * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function glow(ctx, text, x, y, color, blur) {
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

  function fadeInOut(ctx, W, H, f, T) {
    var a = 0;
    if (f < 12) a = 1 - f / 12;
    if (f > T - 15) a = (f - (T - 15)) / 15;
    if (a > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, a) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── Templates: draw(ctx, W, H, frame, totalFrames, opts) ────── */

  var TEMPLATES = {
    intro: {
      label: 'Neon-Intro',
      draw: function (ctx, W, H, f, T, o) {
        var c = o.scheme;
        bg(ctx, W, H, c);
        grid(ctx, W, H, c, f * 0.6, 0.12);
        particles(ctx, W, H, c, f, 50);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var appear = interp(f, 8, 34, 0, 1);
        if (appear > 0) {
          var s = backOut(appear);
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.scale(Math.max(0.01, s), Math.max(0.01, s));
          var px = fitFont(ctx, o.title, '900', Math.round(W / 8), W * 0.84);
          glow(ctx, o.title, 0, 0, c.a, px * 0.6);
          ctx.restore();
        }
        var sub = interp(f, 36, 58, 0, 1);
        if (sub > 0 && o.subtitle) {
          ctx.globalAlpha = easeOut(sub);
          ctx.font = '600 ' + Math.round(W / 26) + 'px "Rajdhani", sans-serif';
          glow(ctx, o.subtitle.toUpperCase(), W / 2, H / 2 + W / 9, c.b, 18);
          ctx.globalAlpha = 1;
        }
        /* Scan-Linie */
        var ly = (f * 4) % (H + 80) - 40;
        var lg = ctx.createLinearGradient(0, ly - 30, 0, ly + 30);
        lg.addColorStop(0, 'rgba(255,255,255,0)');
        lg.addColorStop(0.5, 'rgba(255,255,255,0.06)');
        lg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(0, ly - 30, W, 60);
        fadeInOut(ctx, W, H, f, T);
      },
    },
    slides: {
      label: 'Text-Slides',
      draw: function (ctx, W, H, f, T, o) {
        var c = o.scheme;
        var slides = o.slides.length ? o.slides : [o.title];
        var per = T / slides.length;
        var idx = Math.min(slides.length - 1, Math.floor(f / per));
        var lf = f - idx * per; /* Frame innerhalb des Slides */
        bg(ctx, W, H, c);
        grid(ctx, W, H, c, f * 0.4, 0.1);
        particles(ctx, W, H, c, f, 30);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var inA = easeOut(interp(lf, 0, 14, 0, 1));
        var outA = interp(lf, per - 10, per, 1, 0);
        ctx.globalAlpha = Math.min(inA, outA);
        var zoom = 0.92 + 0.08 * inA + (lf / per) * 0.04;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(zoom, zoom);
        var px = fitFont(ctx, slides[idx], '700', Math.round(W / 11), W * 0.84);
        glow(ctx, slides[idx], 0, 0, idx % 2 ? c.b : c.a, px * 0.5);
        ctx.restore();
        ctx.globalAlpha = 1;
        /* Fortschrittsbalken */
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(W * 0.1, H - 26, W * 0.8, 4);
        ctx.fillStyle = c.a;
        ctx.fillRect(W * 0.1, H - 26, W * 0.8 * (f / T), 4);
        fadeInOut(ctx, W, H, f, T);
      },
    },
    countdown: {
      label: 'Countdown',
      draw: function (ctx, W, H, f, T, o) {
        var c = o.scheme;
        bg(ctx, W, H, c);
        particles(ctx, W, H, c, f, 40);
        var total = Math.round(T / FPS);
        var sec = total - Math.floor(f / FPS);
        var inSec = (f % FPS) / FPS;
        var R = Math.min(W, H) * 0.3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (sec > 0) {
          /* Ring läuft pro Sekunde einmal um */
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = c.a;
          ctx.shadowColor = c.a;
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, R, -Math.PI / 2, -Math.PI / 2 + (1 - inSec) * Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          var pulse = 1 + 0.16 * Math.pow(1 - inSec, 3);
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.scale(pulse, pulse);
          ctx.font = '900 ' + Math.round(R * 0.9) + 'px "Orbitron", sans-serif';
          glow(ctx, String(sec), 0, 0, sec <= 3 ? c.b : c.a, 34);
          ctx.restore();
          if (o.title) {
            ctx.font = '600 ' + Math.round(W / 24) + 'px "Rajdhani", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(o.title.toUpperCase(), W / 2, H / 2 + R + W / 20);
          }
        } else {
          var s = backOut(Math.min(1, (f - (T - FPS)) / 14 + 0.01));
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.scale(Math.max(0.01, s), Math.max(0.01, s));
          var px = fitFont(ctx, o.subtitle || 'GO!', '900', Math.round(W / 6), W * 0.8);
          glow(ctx, o.subtitle || 'GO!', 0, 0, c.b, px * 0.6);
          ctx.restore();
        }
        fadeInOut(ctx, W, H, f, Math.max(T, f + 99));
      },
    },
  };

  /* ── Rendern: Canvas → MediaRecorder → WebM ──────────────────── */

  function render(o, onProgress) {
    return new Promise(function (resolve, reject) {
      if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) {
        reject(new Error('Dein Browser unterstützt kein MediaRecorder/captureStream — Video-Rendern nicht möglich.'));
        return;
      }
      var size = FORMATS[o.format];
      var canvas = document.createElement('canvas');
      canvas.width = size[0];
      canvas.height = size[1];
      var ctx = canvas.getContext('2d');
      var T = Math.round(o.seconds * FPS);
      var stream = canvas.captureStream(FPS);
      var mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find(function (m) { return MediaRecorder.isTypeSupported(m); }) || '';
      var rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5e6 } : undefined);
      var chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onerror = function (e) { reject(e.error || new Error('MediaRecorder-Fehler')); };
      rec.onstop = function () {
        resolve({ blob: new Blob(chunks, { type: rec.mimeType || 'video/webm' }), frames: T });
      };
      var f = 0;
      TEMPLATES[o.template].draw(ctx, size[0], size[1], 0, T, o);
      rec.start(200);
      var timer = setInterval(function () {
        f++;
        if (f >= T) {
          clearInterval(timer);
          setTimeout(function () { rec.stop(); }, 250);
          return;
        }
        TEMPLATES[o.template].draw(ctx, size[0], size[1], f, T, o);
        if (f % 15 === 0) onProgress(f / T);
      }, 1000 / FPS);
    });
  }

  /* ── Studio-Overlay (nutzt die ss-* Styles von SongSee) ──────── */

  function collectOpts(ov) {
    var slidesRaw = ov.querySelector('#vs-sub').value.trim();
    return {
      template: ov.querySelector('#vs-template').value,
      format: ov.querySelector('#vs-format').value,
      scheme: SCHEMES[ov.querySelector('#vs-scheme').value],
      schemeName: ov.querySelector('#vs-scheme').value,
      title: ov.querySelector('#vs-title').value.trim() || 'QUANTUM',
      subtitle: slidesRaw.split('|')[0].trim(),
      slides: slidesRaw ? slidesRaw.split('|').map(function (s) { return s.trim(); }).filter(Boolean) : [],
      seconds: Math.max(2, Math.min(15, parseFloat(ov.querySelector('#vs-sec').value) || 6)),
    };
  }

  function openStudio() {
    if (document.getElementById('vs-overlay')) return;
    var opts = function (obj) {
      return Object.keys(obj).map(function (k) {
        return '<option value="' + k + '">' + k + (obj[k].label ? ' — ' + obj[k].label : '') + '</option>';
      }).join('');
    };
    var ov = document.createElement('div');
    ov.id = 'vs-overlay';
    ov.className = 'ss-overlay';
    ov.innerHTML =
      '<div class="ss-box" role="dialog" aria-label="Video-Studio">' +
      '<div class="ss-box__head">🎬 VIDEO-STUDIO — REMOTION-STIL, 100 % LOKAL</div>' +
      '<canvas id="vs-preview" style="width:100%;border-radius:8px;border:1px solid rgba(0,245,255,0.3);background:#000"></canvas>' +
      '<div class="ss-row">' +
      '<label class="ss-field">Template <select id="vs-template">' + opts(TEMPLATES) + '</select></label>' +
      '<label class="ss-field">Format <select id="vs-format">' + opts(FORMATS) + '</select></label>' +
      '<label class="ss-field">Farben <select id="vs-scheme">' + opts(SCHEMES) + '</select></label>' +
      '</div>' +
      '<div class="ss-row">' +
      '<label class="ss-field" style="flex:2">Titel <input type="text" id="vs-title" maxlength="60" value="QUANTUM" /></label>' +
      '<label class="ss-field">Dauer (s) <input type="number" id="vs-sec" min="2" max="15" step="1" value="6" /></label>' +
      '</div>' +
      '<label class="ss-field">Untertitel / Slides (mit | trennen) <input type="text" id="vs-sub" maxlength="200" placeholder="Dein AI Worker | Skills | Automationen" /></label>' +
      '<div class="ss-status" id="vs-status" hidden></div>' +
      '<div class="ss-actions">' +
      '<button class="ss-btn ss-btn--go" id="vs-go" data-testid="video-render-btn">⚡ RENDERN (WEBM)</button>' +
      '<button class="ss-btn" id="vs-close" data-testid="video-close-btn">SCHLIESSEN</button>' +
      '</div></div>';
    document.body.appendChild(ov);

    var busy = false;
    var status = ov.querySelector('#vs-status');
    var preview = ov.querySelector('#vs-preview');
    var pctx = preview.getContext('2d');
    function setStatus(t) { status.hidden = !t; status.textContent = t || ''; }
    function close() { if (busy) return; cancelAnimationFrame(raf); ov.remove(); }

    /* Live-Vorschau: läuft in Endlosschleife mit den aktuellen Optionen */
    var raf = 0;
    var t0 = performance.now();
    (function loop() {
      var o = collectOpts(ov);
      var size = FORMATS[o.format];
      if (preview.width !== size[0] / 2) { preview.width = size[0] / 2; preview.height = size[1] / 2; }
      var T = Math.round(o.seconds * FPS);
      var f = Math.round(((performance.now() - t0) / 1000) * FPS) % T;
      TEMPLATES[o.template].draw(pctx, preview.width, preview.height, f, T, o);
      raf = requestAnimationFrame(loop);
    })();

    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('#vs-close').addEventListener('click', close);
    ov.querySelector('#vs-go').addEventListener('click', function () {
      if (busy) return;
      busy = true;
      var o = collectOpts(ov);
      setStatus('Rendere ' + o.seconds + 's @ ' + FPS + ' fps (Echtzeit) …');
      render(o, function (p) { setStatus('Rendere … ' + Math.round(p * 100) + ' %'); })
        .then(function (result) {
          busy = false;
          cancelAnimationFrame(raf);
          ov.remove();
          var url = URL.createObjectURL(result.blob);
          var ui = window.Quantum.ui;
          if (ui) {
            ui.system('Video gerendert: ' + o.seconds + 's · ' + FORMATS[o.format].join('×') + ' · ' + result.frames + ' Frames · ' + (result.blob.size / 1048576).toFixed(1) + ' MB');
            ui.video(url, {
              alt: 'Video: ' + o.title,
              filename: o.title.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-+|-+$/g, '') + '-' + o.template + '.webm',
            });
            ui.reply('🎬 **' + o.title + '** ist fertig — Template `' + o.template + '`, Farben `' + o.schemeName + '`. Über den Link unterm Video speicherst du die WebM-Datei. Remotion-Prinzip: jeder Frame ist eine Funktion — gleiche Eingaben, gleiches Video (bis auf die Partikel 😄).');
          }
        })
        .catch(function (e) {
          busy = false;
          setStatus('⚠️ ' + e.message);
        });
    });
  }

  window.Quantum.skills.register({
    id: 'video',
    icon: '🎬',
    name: 'Video-Studio',
    desc: 'Rendert Neon-Videos als WebM (Remotion-Stil)',
    usage: '/skill video  (öffnet das Studio mit Live-Vorschau)',
    run() {
      openStudio();
      return '🎬 **Video-Studio geöffnet** — Template wählen (Neon-Intro, Text-Slides, Countdown), Titel eintippen, Live-Vorschau ansehen und **⚡ RENDERN** klicken. Das Video entsteht in Echtzeit auf einem Canvas und landet als WebM im Chat — nichts verlässt deinen Browser.';
    },
  });
})();
