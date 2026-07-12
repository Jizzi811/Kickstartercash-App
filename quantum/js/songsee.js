/* ═══════════════════════════════════════════════════════════════
   QUANTUM — SongSee (Audio-Visualizer)
   Browser-Adaption des songsee-Skills (github.com/steipete/songsee):
   Spektrogramm + Feature-Panels aus Audiodateien. Dekodierung über
   die Web-Audio-API, STFT mit eigener FFT — alles lokal, kein Upload.
   ═══════════════════════════════════════════════════════════════ */

window.Quantum = window.Quantum || {};

(function () {
  'use strict';

  var MAX_SEC = 480;            /* längere Stücke werden abgeschnitten */
  var PLOT_W = 840, PAD = 18, HEAD_H = 22;
  var FMIN = 20;                /* untere Grenze der log-Frequenzachse */

  /* ── Farbpaletten (Stops, linear interpoliert) — wie songsee ── */

  var PALETTES = {
    classic: [[0, 0, 20], [30, 10, 120], [122, 31, 162], [229, 57, 53], [255, 152, 0], [255, 241, 118]],
    magma:   [[0, 0, 4], [81, 18, 124], [183, 55, 121], [252, 137, 97], [252, 253, 191]],
    inferno: [[0, 0, 4], [87, 16, 110], [188, 55, 84], [249, 142, 9], [252, 255, 164]],
    viridis: [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]],
    gray:    [[0, 0, 0], [255, 255, 255]],
  };

  function colorAt(stops, t) {
    var pos = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    var i = Math.min(stops.length - 2, Math.floor(pos));
    var f = pos - i, a = stops[i], b = stops[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  /* ── FFT (radix-2, in-place) ─────────────────────────────────── */

  function fft(re, im) {
    var n = re.length, i, j, bit, len, half;
    for (i = 1, j = 0; i < n; i++) {
      for (bit = n >> 1; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (len = 2; len <= n; len <<= 1) {
      half = len >> 1;
      var ang = -2 * Math.PI / len;
      var wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (var k = 0; k < half; k++) {
          var ur = re[i + k], ui = im[i + k];
          var xr = re[i + k + half], xi = im[i + k + half];
          var vr = xr * cr - xi * ci, vi = xr * ci + xi * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi;
          re[i + k + half] = ur - vr; im[i + k + half] = ui - vi;
          var ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
  }

  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  /* ── STFT: Frames aus dem Mono-Signal ────────────────────────── */

  async function computeStft(samples, N, targetCols, onProgress) {
    var hop = Math.max(1, Math.floor((samples.length - N) / Math.max(1, targetCols - 1)));
    var cols = Math.min(targetCols, Math.floor((samples.length - N) / hop) + 1);
    var win = new Float32Array(N);
    for (var i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
    var re = new Float32Array(N), im = new Float32Array(N);
    var nBins = N >> 1;
    var frames = new Array(cols);
    var rms = new Float32Array(cols);
    var maxMag = 1e-12;
    for (var c = 0; c < cols; c++) {
      var off = c * hop, acc = 0;
      for (i = 0; i < N; i++) {
        var s = samples[off + i] || 0;
        re[i] = s * win[i];
        im[i] = 0;
        acc += s * s;
      }
      rms[c] = Math.sqrt(acc / N);
      fft(re, im);
      var mag = new Float32Array(nBins);
      for (var j = 0; j < nBins; j++) {
        var m = Math.sqrt(re[j] * re[j] + im[j] * im[j]);
        mag[j] = m;
        if (m > maxMag) maxMag = m;
      }
      frames[c] = mag;
      if (c % 120 === 0) { onProgress(c / cols); await tick(); }
    }
    return { frames: frames, rms: rms, hop: hop, cols: cols, nBins: nBins, maxMag: maxMag };
  }

  /* ── Feature-Ableitungen aus dem STFT ────────────────────────── */

  function melSpectrum(st, sr, nMels) {
    var mel = function (f) { return 2595 * Math.log10(1 + f / 700); };
    var imel = function (m) { return 700 * (Math.pow(10, m / 2595) - 1); };
    var mLo = mel(FMIN), mHi = mel(sr / 2);
    var pts = [];
    for (var i = 0; i < nMels + 2; i++) {
      pts.push(imel(mLo + (mHi - mLo) * i / (nMels + 1)) / (sr / 2) * (st.nBins - 1));
    }
    var out = new Array(st.cols);
    var max = 1e-12;
    for (var c = 0; c < st.cols; c++) {
      var mag = st.frames[c];
      var bands = new Float32Array(nMels);
      for (var m = 0; m < nMels; m++) {
        var lo = pts[m], mid = pts[m + 1], hi = pts[m + 2], acc = 0;
        for (var b = Math.max(0, Math.floor(lo)); b <= Math.min(st.nBins - 1, Math.ceil(hi)); b++) {
          var w = b <= mid ? (b - lo) / Math.max(1e-6, mid - lo) : (hi - b) / Math.max(1e-6, hi - mid);
          if (w > 0) acc += mag[b] * w;
        }
        bands[m] = acc;
        if (acc > max) max = acc;
      }
      out[c] = bands;
    }
    return { bands: out, max: max, n: nMels };
  }

  function chromaSpectrum(st, sr) {
    var out = new Array(st.cols);
    var binHz = (sr / 2) / (st.nBins - 1);
    for (var c = 0; c < st.cols; c++) {
      var acc = new Float32Array(12), mag = st.frames[c];
      for (var b = 1; b < st.nBins; b++) {
        var f = b * binHz;
        if (f < 27.5 || f > 8000) continue;
        var midi = Math.round(69 + 12 * Math.log2(f / 440));
        acc[((midi % 12) + 12) % 12] += mag[b];
      }
      var max = 1e-12;
      for (var p = 0; p < 12; p++) if (acc[p] > max) max = acc[p];
      for (p = 0; p < 12; p++) acc[p] /= max;
      out[c] = acc;
    }
    return out;
  }

  function spectralFlux(st) {
    var flux = new Float32Array(st.cols), max = 1e-12;
    for (var c = 1; c < st.cols; c++) {
      var s = 0, cur = st.frames[c], prev = st.frames[c - 1];
      for (var b = 0; b < st.nBins; b++) { var d = cur[b] - prev[b]; if (d > 0) s += d; }
      flux[c] = s;
      if (s > max) max = s;
    }
    for (c = 0; c < st.cols; c++) flux[c] /= max;
    return flux;
  }

  function estimateBpm(flux, frameRate) {
    var minLag = Math.max(2, Math.round(frameRate * 60 / 200));
    var maxLag = Math.min(flux.length - 2, Math.round(frameRate * 60 / 60));
    if (maxLag <= minLag || flux.length < maxLag * 2) return null;
    var best = 0, bestLag = 0;
    for (var lag = minLag; lag <= maxLag; lag++) {
      var s = 0;
      for (var i = 0; i + lag < flux.length; i++) s += flux[i] * flux[i + lag];
      s /= (flux.length - lag);
      if (s > best) { best = s; bestLag = lag; }
    }
    return bestLag ? Math.round(60 * frameRate / bestLag) : null;
  }

  var NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  function noteName(f) {
    var midi = f > 0 ? Math.round(69 + 12 * Math.log2(f / 440)) : -1;
    return (midi >= 0 && midi <= 127) ? NOTES[midi % 12] + (Math.floor(midi / 12) - 1) : '–';
  }

  /* ── Zeichen-Helfer ──────────────────────────────────────────── */

  function drawHeat(ctx, x, y, w, h, cols, valueAt, palette) {
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for (var px = 0; px < w; px++) {
      var c = Math.min(cols - 1, Math.floor(px * cols / w));
      for (var py = 0; py < h; py++) {
        var rgb = colorAt(palette, valueAt(c, py / (h - 1)));
        var idx = (py * w + px) * 4;
        d[idx] = rgb[0]; d[idx + 1] = rgb[1]; d[idx + 2] = rgb[2]; d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, x, y);
  }

  function drawCurve(ctx, x, y, w, h, values, color) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    for (var px = 0; px < w; px++) {
      var v = values[Math.min(values.length - 1, Math.floor(px * values.length / w))];
      ctx.lineTo(x + px, y + h - Math.max(0, Math.min(1, v)) * (h - 2));
    }
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = color.fill;
    ctx.fill();
    ctx.strokeStyle = color.line;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawWave(ctx, x, y, w, h, samples) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
    var mid = y + h / 2, spc = samples.length / w;
    ctx.strokeStyle = 'rgba(0,245,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var px = 0; px < w; px++) {
      var mn = 1, mx = -1;
      var s1 = Math.min(samples.length, Math.floor((px + 1) * spc) + 1);
      for (var i = Math.floor(px * spc); i < s1; i++) { var v = samples[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
      ctx.moveTo(x + px + 0.5, mid - mx * (h / 2) * 0.95);
      ctx.lineTo(x + px + 0.5, mid - mn * (h / 2) * 0.95 + 0.5);
    }
    ctx.stroke();
  }

  function panelHead(ctx, x, y, text) {
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.75)';
    ctx.fillText('▸ ' + text, x, y + 14);
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    return m + ':' + String(Math.round(sec - m * 60)).padStart(2, '0');
  }

  /* ── Analyse + Rendern ───────────────────────────────────────── */

  async function analyze(buffer, opts, onStatus) {
    var sr = buffer.sampleRate;
    var mono = new Float32Array(buffer.length);
    for (var ch = 0; ch < buffer.numberOfChannels; ch++) {
      var data = buffer.getChannelData(ch);
      for (var i = 0; i < buffer.length; i++) mono[i] += data[i] / buffer.numberOfChannels;
    }

    var start = Math.max(0, Math.min(opts.start || 0, buffer.duration - 0.5));
    var dur = Math.min(opts.duration || buffer.duration, buffer.duration - start, MAX_SEC);
    var slice = mono.subarray(Math.floor(start * sr), Math.floor((start + dur) * sr));
    if (slice.length < 4096) throw new Error('Audio(-Ausschnitt) ist zu kurz — mindestens ~0,5 Sekunden nötig.');

    var N = 2048;
    while (N > 256 && N * 2 > slice.length) N >>= 1;

    onStatus('Rechne STFT (0 %) …');
    var st = await computeStft(slice, N, PLOT_W, function (p) {
      onStatus('Rechne STFT (' + Math.round(p * 100) + ' %) …');
    });
    onStatus('Zeichne Panels …');
    await tick();

    var palette = PALETTES[opts.palette] || PALETTES.classic;
    var val01 = function (m) {
      return Math.max(0, Math.min(1, 1 + (20 * Math.log10(m / st.maxMag + 1e-12)) / 80));
    };
    var binHz = (sr / 2) / (st.nBins - 1);
    var logSpan = Math.log(sr / 2 / FMIN);

    var HEIGHTS = { wave: 100, spec: 240, mel: 160, chroma: 132, loud: 80, flux: 80 };
    var order = ['wave', 'spec', 'mel', 'chroma', 'loud', 'flux'].filter(function (p) { return opts.panels.indexOf(p) > -1; });
    var totalH = PAD + 26;
    order.forEach(function (p) { totalH += HEAD_H + HEIGHTS[p] + 10; });

    var canvas = document.createElement('canvas');
    canvas.width = PLOT_W + PAD * 2;
    canvas.height = totalH;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#05011a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var mel = order.indexOf('mel') > -1 ? melSpectrum(st, sr, 64) : null;
    var chroma = order.indexOf('chroma') > -1 ? chromaSpectrum(st, sr) : null;
    var flux = spectralFlux(st);

    var y = PAD;
    order.forEach(function (p) {
      var h = HEIGHTS[p], x = PAD;
      if (p === 'wave') {
        panelHead(ctx, x, y, 'WELLENFORM');
        drawWave(ctx, x, y + HEAD_H, PLOT_W, h, slice);
      } else if (p === 'spec') {
        panelHead(ctx, x, y, 'SPEKTROGRAMM · ' + FMIN + ' Hz – ' + Math.round(sr / 2000) + ' kHz (log) · 80 dB · FFT ' + N);
        drawHeat(ctx, x, y + HEAD_H, PLOT_W, h, st.cols, function (c, yf) {
          var freq = FMIN * Math.exp((1 - yf) * logSpan);
          var bp = freq / (sr / 2) * (st.nBins - 1);
          var b0 = Math.min(st.nBins - 1, Math.floor(bp));
          var b1 = Math.min(st.nBins - 1, b0 + 1);
          var f = bp - b0;
          return val01(st.frames[c][b0] * (1 - f) + st.frames[c][b1] * f);
        }, palette);
        ctx.font = '9px "JetBrains Mono", monospace';
        [100, 1000, 10000].forEach(function (fq) {
          if (fq >= sr / 2) return;
          var py = y + HEAD_H + (1 - Math.log(fq / FMIN) / logSpan) * h;
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(x, py, PLOT_W, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillText(fq >= 1000 ? (fq / 1000) + ' kHz' : fq + ' Hz', x + 4, py - 3);
        });
      } else if (p === 'mel') {
        panelHead(ctx, x, y, 'MEL-SPEKTROGRAMM · 64 BÄNDER');
        drawHeat(ctx, x, y + HEAD_H, PLOT_W, h, st.cols, function (c, yf) {
          var band = Math.round((1 - yf) * (mel.n - 1));
          return Math.max(0, Math.min(1, 1 + (20 * Math.log10(mel.bands[c][band] / mel.max + 1e-12)) / 80));
        }, palette);
      } else if (p === 'chroma') {
        panelHead(ctx, x, y, 'CHROMA · 12 PITCH-KLASSEN');
        drawHeat(ctx, x, y + HEAD_H, PLOT_W, h, st.cols, function (c, yf) {
          return chroma[c][11 - Math.min(11, Math.floor(yf * 12))];
        }, palette);
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (var pc = 0; pc < 12; pc++) {
          ctx.fillText(NOTES[11 - pc], x + 3, y + HEAD_H + (pc + 0.7) * (h / 12));
        }
      } else if (p === 'loud') {
        panelHead(ctx, x, y, 'LAUTHEIT (RMS) · −60…0 dB');
        var loud = new Float32Array(st.cols);
        for (var c = 0; c < st.cols; c++) {
          loud[c] = Math.max(0, Math.min(1, (20 * Math.log10(st.rms[c] + 1e-12) + 60) / 60));
        }
        drawCurve(ctx, x, y + HEAD_H, PLOT_W, h, loud, { fill: 'rgba(0,245,255,0.25)', line: 'rgba(0,245,255,0.9)' });
      } else if (p === 'flux') {
        panelHead(ctx, x, y, 'SPECTRAL FLUX · ONSETS');
        drawCurve(ctx, x, y + HEAD_H, PLOT_W, h, flux, { fill: 'rgba(255,45,247,0.22)', line: 'rgba(255,45,247,0.9)' });
      }
      ctx.strokeStyle = 'rgba(0,245,255,0.25)';
      ctx.strokeRect(x - 0.5, y + HEAD_H - 0.5, PLOT_W + 1, h + 1);
      y += HEAD_H + h + 10;
    });

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(154,147,201,0.9)';
    ctx.fillText('QUANTUM ⚛ SONGSEE · ' + opts.name + ' · Palette: ' + opts.palette +
      ' · ' + fmtTime(start) + '–' + fmtTime(start + dur) + ' von ' + fmtTime(buffer.duration), PAD, y + 12);

    /* Statistik für die Chat-Antwort */
    var peak = 0, rmsAll = 0;
    for (i = 0; i < slice.length; i++) { var a = Math.abs(slice[i]); if (a > peak) peak = a; }
    for (i = 0; i < st.cols; i++) rmsAll += st.rms[i] * st.rms[i];
    rmsAll = Math.sqrt(rmsAll / st.cols);
    var sumMag = new Float32Array(st.nBins);
    st.frames.forEach(function (fr) { for (var b = 1; b < st.nBins; b++) sumMag[b] += fr[b]; });
    var domBin = 1;
    for (i = 2; i < st.nBins; i++) if (sumMag[i] > sumMag[domBin]) domBin = i;
    var domFreq = domBin * binHz;
    var bpm = estimateBpm(flux, sr / st.hop);

    var stats = [
      '🌊 **SONGSEE-ANALYSE** — ' + opts.name,
      '· Dauer: ' + fmtTime(buffer.duration) + ' min' +
        (dur < buffer.duration - 0.5 ? ' (analysiert: ' + fmtTime(start) + '–' + fmtTime(start + dur) + ')' : '') +
        ' · ' + (sr / 1000).toLocaleString('de-DE') + ' kHz · ' +
        (buffer.numberOfChannels === 1 ? 'Mono' : buffer.numberOfChannels === 2 ? 'Stereo' : buffer.numberOfChannels + ' Kanäle'),
      '· Peak: ' + (20 * Math.log10(peak + 1e-12)).toFixed(1) + ' dBFS · RMS: ' + (20 * Math.log10(rmsAll + 1e-12)).toFixed(1) + ' dB',
      '· Dominante Frequenz: ' + Math.round(domFreq) + ' Hz (≈ ' + noteName(domFreq) + ')',
      bpm ? '· Tempo-Schätzung: ≈ ' + bpm + ' BPM' : '',
      'Über den Link unter der Grafik kannst du das Bild als PNG speichern.',
    ].filter(Boolean).join('\n');

    return { dataUrl: canvas.toDataURL('image/png'), stats: stats };
  }

  /* ── Studio-Overlay ──────────────────────────────────────────── */

  var PANEL_DEFS = [
    ['wave', 'Wellenform', true], ['spec', 'Spektrogramm', true], ['mel', 'Mel', false],
    ['chroma', 'Chroma', false], ['loud', 'Lautheit', true], ['flux', 'Flux', false],
  ];

  function openStudio(presetPalette) {
    if (document.getElementById('ss-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'ss-overlay';
    ov.className = 'ss-overlay';
    var paletteOpts = Object.keys(PALETTES).map(function (p) {
      return '<option value="' + p + '"' + (p === presetPalette ? ' selected' : '') + '>' + p + '</option>';
    }).join('');
    var panelChecks = PANEL_DEFS.map(function (p) {
      return '<label class="ss-check"><input type="checkbox" value="' + p[0] + '"' + (p[2] ? ' checked' : '') + ' /> ' + p[1] + '</label>';
    }).join('');
    ov.innerHTML =
      '<div class="ss-box" role="dialog" aria-label="SongSee Audio-Studio">' +
      '<div class="ss-box__head">🌊 SONGSEE — AUDIO-VISUALIZER</div>' +
      '<label class="ss-drop" id="ss-drop" data-testid="songsee-drop">' +
      '<input type="file" id="ss-file" accept="audio/*" data-testid="songsee-file" hidden />' +
      '<span id="ss-drop-label">Audiodatei wählen oder hierher ziehen<br><small>MP3 &amp; WAV überall, OGG/M4A/FLAC je nach Browser</small></span></label>' +
      '<div class="ss-row">' +
      '<label class="ss-field">Palette <select id="ss-palette" data-testid="songsee-palette">' + paletteOpts + '</select></label>' +
      '<label class="ss-field">Start (s) <input type="number" id="ss-start" min="0" step="1" placeholder="0" /></label>' +
      '<label class="ss-field">Dauer (s) <input type="number" id="ss-dur" min="1" step="1" placeholder="alles" /></label></div>' +
      '<div class="ss-panels">' + panelChecks + '</div>' +
      '<div class="ss-status" id="ss-status" hidden></div>' +
      '<div class="ss-actions">' +
      '<button class="ss-btn ss-btn--go" id="ss-go" data-testid="songsee-analyze-btn" disabled>⚡ VISUALISIEREN</button>' +
      '<button class="ss-btn" id="ss-close" data-testid="songsee-close-btn">SCHLIESSEN</button>' +
      '</div></div>';
    document.body.appendChild(ov);

    var file = null, busy = false;
    var drop = document.getElementById('ss-drop');
    var input = document.getElementById('ss-file');
    var go = document.getElementById('ss-go');
    var status = document.getElementById('ss-status');

    function setFile(f) {
      if (!f) return;
      file = f;
      document.getElementById('ss-drop-label').innerHTML =
        '🎵 ' + f.name.replace(/[&<>"']/g, '') + ' <small>(' + (f.size / 1048576).toFixed(1) + ' MB)</small>';
      go.disabled = false;
    }

    function setStatus(text) { status.hidden = !text; status.textContent = text || ''; }
    function close() { if (!busy) ov.remove(); }

    input.addEventListener('change', function () { setFile(input.files[0]); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('ss-drop--hot'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('ss-drop--hot'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('ss-drop--hot');
      setFile(e.dataTransfer.files[0]);
    });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.getElementById('ss-close').addEventListener('click', close);

    go.addEventListener('click', async function () {
      if (!file || busy) return;
      busy = true;
      go.disabled = true;
      var panels = Array.prototype.map.call(ov.querySelectorAll('.ss-check input:checked'), function (c) { return c.value; });
      if (!panels.length) panels = ['spec'];
      var opts = {
        name: file.name,
        palette: document.getElementById('ss-palette').value,
        start: parseFloat(document.getElementById('ss-start').value) || 0,
        duration: parseFloat(document.getElementById('ss-dur').value) || 0,
        panels: panels,
      };
      try {
        setStatus('Dekodiere ' + file.name + ' …');
        var raw = await file.arrayBuffer();
        var actx = new (window.AudioContext || window.webkitAudioContext)();
        var buffer;
        try { buffer = await actx.decodeAudioData(raw); }
        finally { actx.close(); }
        var result = await analyze(buffer, opts, setStatus);
        busy = false;
        ov.remove();
        var ui = window.Quantum.ui;
        if (ui) {
          ui.system('SongSee: „' + file.name + '“ analysiert (' + panels.length + ' Panels, Palette ' + opts.palette + ').');
          ui.image(result.dataUrl, {
            alt: 'SongSee-Visualisierung von ' + file.name,
            filename: file.name.replace(/\.[^.]+$/, '') + '-songsee.png',
          });
          ui.reply(result.stats);
        }
      } catch (e) {
        busy = false;
        go.disabled = false;
        setStatus('⚠️ ' + (e && e.message ? e.message : 'Datei konnte nicht dekodiert werden — Format nicht unterstützt?'));
      }
    });
  }

  window.Quantum.skills.register({
    id: 'songsee',
    icon: '🌊',
    name: 'SongSee-Visualizer',
    desc: 'Spektrogramm & Audio-Analyse aus deiner Musik',
    usage: '/skill songsee [palette]  (öffnet das Audio-Studio)',
    run(input) {
      var arg = input.trim().toLowerCase();
      openStudio(PALETTES[arg] ? arg : 'classic');
      return [
        '🌊 **SongSee-Studio geöffnet** — wähle eine Audiodatei und klick **⚡ VISUALISIEREN**.',
        'Panels: Wellenform, Spektrogramm (log-Frequenz), Mel, Chroma, Lautheit, Spectral Flux — dazu Peak/RMS, dominante Note und eine BPM-Schätzung.',
        'Paletten: classic, magma, inferno, viridis, gray — direkt vorwählbar mit `/skill songsee magma`.',
        'Alles läuft lokal in deinem Browser, deine Musik wird nirgendwohin hochgeladen.',
      ].join('\n');
    },
  });
})();
