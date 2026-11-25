/* Sonidos suaves generados en el momento (sin archivos de audio: funcionan offline). */
(function () {
  var ctx = null;
  var silencio = false;
  try { silencio = localStorage.getItem('pql_silencio') === '1'; } catch (e) {}

  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Una nota suave: tipo de onda, frecuencia, inicio (seg desde ahora), duración, volumen
  function nota(freq, inicio, dur, vol, tipo, deslizarA) {
    var c = audio(); if (!c || silencio) return;
    var t = c.currentTime + (inicio || 0);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (deslizarA) o.frequency.exponentialRampToValueAtTime(deslizarA, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  var DO = 523.25, MI = 659.25, SOL = 783.99, LA = 880, DO2 = 1046.5, MI2 = 1318.5, SOL2 = 1568;

  window.Sonidos = {
    desbloquear: function () { audio(); },
    estaSilenciado: function () { return silencio; },
    alternar: function () {
      silencio = !silencio;
      try { localStorage.setItem('pql_silencio', silencio ? '1' : '0'); } catch (e) {}
      if (!silencio) this.toque();
      return silencio;
    },
    toque: function () { nota(880, 0, 0.08, 0.06, 'sine'); },
    acierto: function () {
      nota(DO, 0, 0.18, 0.13, 'triangle');
      nota(MI, 0.08, 0.18, 0.13, 'triangle');
      nota(SOL, 0.16, 0.3, 0.13, 'triangle');
      nota(DO2, 0.16, 0.35, 0.05, 'sine');
    },
    error: function () {
      nota(330, 0, 0.22, 0.12, 'sine', 260);
      nota(247, 0.18, 0.32, 0.12, 'sine', 196);
    },
    nivel: function () {
      [DO, MI, SOL, DO2, SOL, DO2].forEach(function (f, i) {
        nota(f, i * 0.11, i === 5 ? 0.5 : 0.16, 0.12, 'triangle');
      });
      nota(MI2, 0.66, 0.5, 0.04, 'sine');
    },
    fin: function () {
      [SOL, MI, DO, MI, SOL].forEach(function (f, i) {
        nota(f, i * 0.16, 0.3, 0.1, 'triangle');
      });
    },
    record: function () {
      [DO, MI, SOL, DO2, MI2, SOL2].forEach(function (f, i) {
        nota(f, i * 0.09, 0.25, 0.1, 'triangle');
      });
      [DO2, MI2, SOL2].forEach(function (f, i) { nota(f, 0.6 + i * 0.02, 0.8, 0.05, 'sine'); });
    }
  };
})();
