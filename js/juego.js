/* ================= PAREJAS QUE LEEN — LÓGICA DEL JUEGO ================= */
(function () {
  'use strict';

  var CONFIG = window.CONFIG;
  var TEMAS = window.TEMAS;
  var NOMBRES_TEMAS = Object.keys(TEMAS);
  var COLORES = ['#ff5468', '#ff9a1f', '#ffc61a', '#4fc94a', '#2fb0ff', '#9b63ff', '#ff6fb3'];
  var ASPECTO = 1.12; // ancho / alto de cada carta

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // ---------- estado ----------
  var E = {
    estrellas: 0, vidas: CONFIG.vidas, nivel: 1,
    tema: null, cartas: [], elegida: null, bloqueado: false,
    hechas: 0, total: 0, errores: 0, ultimaPareja: null,
    recientes: [], enPartida: false, timerSiguiente: null
  };

  // ---------- utilidades ----------
  function mezclar(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function leerRecord() { try { return parseInt(localStorage.getItem('pql_record') || '0', 10) || 0; } catch (e) { return 0; } }
  function guardarRecord(n) { try { localStorage.setItem('pql_record', String(n)); } catch (e) {} }

  function colorearTitulos(raiz) {
    (raiz ? [raiz] : $$('.titulo-burbuja')).forEach(function (t) {
      var i = 0;
      t.querySelectorAll('.linea').forEach(function (l) {
        var txt = l.textContent;
        l.textContent = '';
        Array.from(txt).forEach(function (ch) {
          var s = document.createElement('span');
          if (ch === ' ') { s.innerHTML = '&nbsp;'; s.style.width = '.3em'; s.style.display = 'inline-block'; }
          else { s.className = 'letra'; s.textContent = ch; s.style.setProperty('--c', COLORES[i++ % COLORES.length]); }
          l.appendChild(s);
        });
      });
    });
  }
  function ponerTitulo(el, texto) {
    el.innerHTML = '';
    var l = document.createElement('span'); l.className = 'linea'; l.textContent = texto;
    el.appendChild(l);
    colorearTitulos(el);
  }

  function mostrarPantalla(id) {
    $$('.pantalla').forEach(function (p) { p.classList.toggle('activa', p.id === id); });
  }
  function capa(id, visible) { $('#' + id).classList.toggle('activa', !!visible); }

  // ---------- selección de palabras ----------
  var ORDEN_GRUPOS = ['cortas', 'medianas', 'largas'];

  function todasLasPalabras(tema) {
    var t = TEMAS[tema], lista = [];
    ORDEN_GRUPOS.forEach(function (g) { (t[g] || []).forEach(function (p) { lista.push(p); }); });
    return lista;
  }

  function agregarSinRepetir(destino, candidatos, cuantos) {
    for (var i = 0; i < candidatos.length && destino.length < cuantos; i++) {
      var c = candidatos[i];
      var repetida = destino.some(function (d) { return d[1] === c[1] || d[0] === c[0]; });
      if (!repetida) destino.push(c);
    }
  }

  // Prioriza palabras que no salieron en el nivel anterior
  function priorizarNuevas(lista) {
    lista = mezclar(lista);
    var nuevas = lista.filter(function (p) { return E.recientes.indexOf(p[1]) < 0; });
    var viejas = lista.filter(function (p) { return E.recientes.indexOf(p[1]) >= 0; });
    return nuevas.concat(viejas);
  }

  function elegirParejas(tema, tipos, cuantos) {
    var t = TEMAS[tema];
    var elegidas = [];

    if (tipos.indexOf('parecidas') >= 0 && t.parecidas && t.parecidas.length) {
      // Toma grupos enteros de palabras que empiezan igual
      mezclar(t.parecidas).forEach(function (grupo) {
        var faltan = cuantos - elegidas.length;
        if (faltan < 2) return;
        var g = mezclar(grupo).filter(function (p) {
          return !elegidas.some(function (d) { return d[1] === p[1] || d[0] === p[0]; });
        });
        if (g.length >= 2) agregarSinRepetir(elegidas, g.slice(0, faltan), elegidas.length + Math.min(g.length, faltan));
      });
      // Si falta una, que empiece con la misma letra que alguna elegida
      if (elegidas.length < cuantos) {
        var iniciales = elegidas.map(function (p) { return p[1][0]; });
        var todas = mezclar(todasLasPalabras(tema));
        var mismaLetra = todas.filter(function (p) { return iniciales.indexOf(p[1][0]) >= 0; });
        agregarSinRepetir(elegidas, mismaLetra.concat(todas), cuantos);
      }
      return elegidas;
    }

    var base = [];
    tipos.forEach(function (g) { base = base.concat(t[g] || []); });
    agregarSinRepetir(elegidas, priorizarNuevas(base), cuantos);

    // Si no alcanza, completa con el grupo vecino (de más corto a más largo, después hacia atrás)
    if (elegidas.length < cuantos) {
      var ultimo = Math.max.apply(null, tipos.map(function (g) { return ORDEN_GRUPOS.indexOf(g); }));
      var vecinos = ORDEN_GRUPOS.slice(ultimo + 1).concat(ORDEN_GRUPOS.slice(0, ultimo + 1).reverse());
      vecinos.forEach(function (g) { agregarSinRepetir(elegidas, priorizarNuevas(t[g] || []), cuantos); });
    }
    return elegidas;
  }

  function temaAlAzar(evitar) {
    var opciones = NOMBRES_TEMAS.filter(function (n) { return n !== evitar; });
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  // ---------- partida ----------
  function nuevaPartida() {
    limpiarTimers();
    E.estrellas = 0; E.vidas = CONFIG.vidas; E.nivel = 1;
    E.tema = null; E.recientes = []; E.enPartida = true;
    $('#juego-estrellas').textContent = '0';
    dibujarVidas();
    ['capa-festejo', 'capa-pausa', 'capa-fin'].forEach(function (c) { capa(c, false); });
    mostrarPantalla('pantalla-juego');
    empezarNivel();
  }

  function configNivel(n) {
    var lista = CONFIG.niveles;
    return lista[Math.min(n - 1, lista.length - 1)];
  }

  function empezarNivel() {
    var cfg = configNivel(E.nivel);
    var cambia = !E.tema || (E.nivel - 1) % CONFIG.cambiarTemaCada === 0;
    if (cambia) {
      E.tema = temaAlAzar(E.tema);
      E.recientes = [];
    }
    pintarNivel();
    var parejas = elegirParejas(E.tema, cfg.tipo, cfg.parejas);
    E.recientes = parejas.map(function (p) { return p[1]; });
    E.total = parejas.length; E.hechas = 0; E.errores = 0;
    E.elegida = null; E.bloqueado = false;

    var cartas = [];
    parejas.forEach(function (p, i) {
      cartas.push({ par: i, tipo: 'emoji', emoji: p[0], palabra: p[1] });
      cartas.push({ par: i, tipo: 'palabra', emoji: p[0], palabra: p[1] });
    });
    E.cartas = mezclar(cartas);
    dibujarTablero();
    actualizarContador();
  }

  function pintarNivel() {
    $('#nivel-num').textContent = E.nivel;
    $('[data-accion=nivel-menos]').disabled = E.nivel <= 1;
    $('[data-accion=nivel-mas]').disabled = E.nivel >= CONFIG.niveles.length;
  }

  // Cambiar de nivel a mano: conserva estrellas y vidas, y arranca el nivel elegido con temática nueva
  function cambiarNivel(delta) {
    var n = Math.max(1, Math.min(CONFIG.niveles.length, E.nivel + delta));
    if (n === E.nivel || !E.enPartida) return;
    E.nivel = n; E.tema = null;
    empezarNivel();
  }

  // ---------- tablero ----------
  function dibujarTablero() {
    var tablero = $('#tablero');
    tablero.innerHTML = '';
    E.cartas.forEach(function (c) {
      var celda = document.createElement('div');
      celda.className = 'celda';
      celda.style.position = 'relative';
      celda.style.width = 'var(--cw)'; celda.style.height = 'var(--ch)';

      var hueco = document.createElement('div'); hueco.className = 'hueco';
      hueco.style.position = 'absolute'; hueco.style.inset = '0';
      celda.appendChild(hueco);

      var el = document.createElement('button');
      el.className = 'carta';
      el.style.position = 'absolute'; el.style.inset = '0';
      el.setAttribute('aria-label', c.tipo === 'emoji' ? 'dibujo' : c.palabra);
      if (c.tipo === 'emoji') {
        el.innerHTML = '<span class="contenido-emoji">' + c.emoji + '</span>';
      } else {
        el.innerHTML = '<span class="contenido-palabra">' + c.palabra + '</span>';
      }
      c.el = el; c.ida = false;
      engancharToques(el, c);
      celda.appendChild(el);
      tablero.appendChild(celda);
    });
    acomodar();
  }

  // Calcula columnas y tamaño de carta para que todo entre en pantalla, lo más grande posible
  function acomodar() {
    var zona = $('#tablero-zona');
    var tablero = $('#tablero');
    if (!E.cartas.length) return;
    var cs = getComputedStyle(zona);
    var W = zona.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var H = zona.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (W < 50 || H < 50) return;
    var n = E.cartas.length;
    var gap = Math.max(10, Math.min(W, H) * 0.025);
    var mejor = null;
    for (var cols = 2; cols <= 5; cols++) {
      var filas = Math.ceil(n / cols);
      var anchoMax = (W - gap * (cols - 1)) / cols;
      var altoMax = (H - gap * (filas - 1)) / filas;
      var cw = Math.min(anchoMax, altoMax * ASPECTO, W * 0.44, 340);
      var ch = Math.min(altoMax, cw * 1.3);   // si sobra lugar, las cartas se estiran a lo alto
      ch = Math.max(ch, Math.min(cw / ASPECTO, altoMax));
      var huecos = cols * filas - n;
      var puntaje = cw * ch * (1 - 0.05 * huecos);
      if (!mejor || puntaje > mejor.puntaje) mejor = { cw: cw, ch: ch, cols: cols, puntaje: puntaje };
    }
    var cwFinal = mejor.cw, chFinal = mejor.ch;
    tablero.style.setProperty('--cw', cwFinal + 'px');
    tablero.style.setProperty('--ch', chFinal + 'px');
    tablero.style.setProperty('--gap', gap + 'px');
    tablero.style.width = (mejor.cols * cwFinal + (mejor.cols - 1) * gap + 1) + 'px';

    E.cartas.forEach(function (c) {
      if (c.tipo !== 'palabra') return;
      var largo = Array.from(c.palabra).length;
      var fs = Math.min(chFinal * 0.34, cwFinal * 0.34, (cwFinal * 0.88) / (largo * 0.64));
      c.el.style.setProperty('--fs', fs + 'px');
    });
  }

  function actualizarContador() {
    $('#contador').textContent = E.hechas + ' DE ' + E.total;
  }

  function dibujarVidas() {
    var v = $('#vidas');
    v.innerHTML = '';
    for (var i = 0; i < CONFIG.vidas; i++) {
      var s = document.createElement('span');
      s.className = 'corazon' + (i >= E.vidas ? ' perdido' : '');
      s.innerHTML = '<svg viewBox="0 0 100 90"><use href="#svg-corazon"/></svg>';
      v.appendChild(s);
    }
  }

  // ---------- toques (tocar y mantener para leer) ----------
  function engancharToques(el, c) {
    var timer = null, leyo = false, x0 = 0, y0 = 0, activo = false;

    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    el.addEventListener('pointerdown', function (e) {
      if (c.ida || E.bloqueado) return;
      Sonidos.desbloquear();
      activo = true; leyo = false; x0 = e.clientX; y0 = e.clientY;
      if (c.tipo === 'palabra' && 'speechSynthesis' in window) {
        timer = setTimeout(function () { leyo = true; leer(c); }, CONFIG.mantenerParaLeer);
      }
    });
    el.addEventListener('pointermove', function (e) {
      if (!activo) return;
      if (Math.abs(e.clientX - x0) > 18 || Math.abs(e.clientY - y0) > 18) { clearTimeout(timer); activo = false; }
    });
    el.addEventListener('pointerup', function () {
      clearTimeout(timer);
      if (activo && !leyo) tocar(c);
      activo = false;
    });
    ['pointercancel', 'pointerleave'].forEach(function (ev) {
      el.addEventListener(ev, function () { clearTimeout(timer); activo = false; });
    });
  }

  // ---------- voz ----------
  var vozEs = null;
  function buscarVoz() {
    if (!('speechSynthesis' in window)) return;
    var voces = speechSynthesis.getVoices() || [];
    var pref = ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-ES', 'es'];
    for (var i = 0; i < pref.length; i++) {
      var v = voces.find(function (x) { return x.lang && x.lang.replace('_', '-').indexOf(pref[i]) === 0; });
      if (v) { vozEs = v; return; }
    }
  }
  if ('speechSynthesis' in window) {
    buscarVoz();
    speechSynthesis.onvoiceschanged = buscarVoz;
  }
  function leer(c) {
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(c.palabra.toLowerCase());
      u.lang = vozEs ? vozEs.lang : 'es-AR';
      if (vozEs) u.voice = vozEs;
      u.rate = 0.8; u.pitch = 1.05;
      c.el.classList.add('leyendo');
      var quitar = function () { c.el.classList.remove('leyendo'); };
      u.onend = quitar; u.onerror = quitar;
      setTimeout(quitar, 2500);
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- jugada ----------
  function tocar(c) {
    if (E.bloqueado || c.ida) return;
    if (E.elegida === c) {
      c.el.classList.remove('elegida'); E.elegida = null; return;
    }
    Sonidos.toque();
    c.el.classList.add('elegida');
    if (!E.elegida) { E.elegida = c; return; }

    var a = E.elegida, b = c;
    E.elegida = null;
    E.bloqueado = true;
    if (a.par === b.par && a.tipo !== b.tipo) parejaEncontrada(a, b);
    else noEsPareja(a, b);
  }

  function parejaEncontrada(a, b) {
    Sonidos.acierto();
    E.ultimaPareja = { emoji: a.emoji, palabra: a.palabra };
    var ra = a.el.getBoundingClientRect(), rb = b.el.getBoundingClientRect();
    var mx = (ra.left + ra.width / 2 + rb.left + rb.width / 2) / 2;
    var my = (ra.top + ra.height / 2 + rb.top + rb.height / 2) / 2;
    var izq = a.tipo === 'emoji' ? a : b, der = izq === a ? b : a;
    var ri = izq.el.getBoundingClientRect(), rd = der.el.getBoundingClientRect();
    var sep = ri.width * 0.52;

    [[izq, ri, -sep, -6], [der, rd, sep, 6]].forEach(function (x) {
      var c = x[0], r = x[1];
      var dx = mx + x[2] - (r.left + r.width / 2);
      var dy = my - (r.top + r.height / 2);
      c.el.classList.remove('elegida');
      c.el.classList.add('encontrada', 'ida');
      c.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.12) rotate(' + x[3] + 'deg)';
      c.ida = true;
    });
    setTimeout(function () { Confeti.explosion(mx, my, 40); }, 250);

    E.hechas++;
    actualizarContador();
    setTimeout(function () {
      E.bloqueado = false;
      if (E.hechas >= E.total) nivelCompleto();
    }, 950);
  }

  function noEsPareja(a, b) {
    E.errores++;
    setTimeout(function () {
      a.el.classList.add('error'); b.el.classList.add('error');
      Sonidos.error();
      perderVida();
    }, 220);
    setTimeout(function () {
      [a, b].forEach(function (c) { c.el.classList.remove('error', 'elegida'); });
      if (E.vidas <= 0) { setTimeout(finPartida, 250); return; }
      E.bloqueado = false;
    }, 800);
  }

  function perderVida() {
    E.vidas = Math.max(0, E.vidas - 1);
    var c = $('#vidas').children[E.vidas];
    if (c) { c.classList.add('perdido', 'rompiendo'); }
  }

  // ---------- festejo entre niveles ----------
  function estrellasDelNivel() {
    if (E.errores === 0) return 3;
    if (E.errores === 1) return 2;
    return 1;
  }

  function nivelCompleto() {
    var gano = estrellasDelNivel();
    E.estrellas += gano;
    var badge = $('.estrella-badge');
    $('#juego-estrellas').textContent = E.estrellas;
    badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');

    var p = E.ultimaPareja || { emoji: '⭐', palabra: '' };
    var largo = Array.from(p.palabra).length || 1;
    var fsf = Math.min(9, 23 / (largo * 0.64));
    $('#festejo-pareja').innerHTML =
      '<div class="fc e"><span>' + p.emoji + '</span></div>' +
      '<div class="fc p"><span style="--fsf: calc(var(--u) * ' + fsf.toFixed(2) + ')">' + p.palabra + '</span></div>';

    var est = '';
    for (var i = 0; i < 3; i++) {
      est += '<svg viewBox="0 0 100 100" class="' + (i < gano ? 'llena' : 'vacia') + '" style="animation-delay:' + (0.35 + i * 0.25) + 's"><use href="#svg-estrella"/></svg>';
    }
    $('#festejo-estrellas').innerHTML = est;

    capa('capa-festejo', true);
    Sonidos.nivel();
    Confeti.lluvia(1800);

    var relleno = $('#relleno-siguiente');
    relleno.classList.remove('corriendo'); void relleno.offsetWidth;
    if (CONFIG.avanceAutomatico > 0) {
      relleno.style.setProperty('--dur', (CONFIG.avanceAutomatico / 1000) + 's');
      relleno.classList.add('corriendo');
      E.timerSiguiente = setTimeout(siguienteNivel, CONFIG.avanceAutomatico);
    }
  }

  function siguienteNivel() {
    limpiarTimers();
    capa('capa-festejo', false);
    E.nivel++;
    empezarNivel();
  }

  function limpiarTimers() {
    clearTimeout(E.timerSiguiente); E.timerSiguiente = null;
    $('#relleno-siguiente').classList.remove('corriendo');
  }

  // ---------- fin de partida y récord ----------
  function registrarRecord() {
    var r = leerRecord();
    if (E.estrellas > r) { guardarRecord(E.estrellas); return true; }
    return false;
  }

  function finPartida() {
    E.enPartida = false;
    var nuevo = registrarRecord();
    var panel = $('#capa-fin .panel-madera');
    panel.classList.toggle('record', nuevo);
    ponerTitulo($('#fin-titulo'), nuevo ? '¡NUEVO RÉCORD!' : '¡BUEN JUEGO!');
    $('#fin-estrellas').textContent = E.estrellas;
    $('#fin-record').textContent = leerRecord();
    capa('capa-fin', true);
    if (nuevo) {
      Sonidos.record();
      Confeti.lluvia(3500);
    } else {
      Sonidos.fin();
    }
  }

  function irAlInicio() {
    limpiarTimers();
    if (E.enPartida) registrarRecord();
    E.enPartida = false;
    ['capa-festejo', 'capa-pausa', 'capa-fin'].forEach(function (c) { capa(c, false); });
    $('#inicio-record').textContent = leerRecord();
    mostrarPantalla('pantalla-inicio');
  }

  // ---------- sonido on/off ----------
  function pintarBotonSonido() {
    var icono = Sonidos.estaSilenciado() ? '🔇' : '🔊';
    $$('.btn-sonido').forEach(function (b) { b.textContent = icono; });
  }

  // ---------- botones ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-accion]');
    if (!b) return;
    Sonidos.desbloquear();
    switch (b.dataset.accion) {
      case 'jugar': Sonidos.toque(); nuevaPartida(); break;
      case 'pausa':
        if (!E.enPartida) return;
        Sonidos.toque(); capa('capa-pausa', true); break;
      case 'seguir': Sonidos.toque(); capa('capa-pausa', false); break;
      case 'otra-vez':
        Sonidos.toque();
        if (E.enPartida) registrarRecord();
        nuevaPartida(); break;
      case 'inicio': Sonidos.toque(); irAlInicio(); break;
      case 'siguiente': Sonidos.toque(); siguienteNivel(); break;
      case 'nivel-menos': Sonidos.toque(); cambiarNivel(-1); break;
      case 'nivel-mas': Sonidos.toque(); cambiarNivel(1); break;
      case 'sonido': Sonidos.alternar(); pintarBotonSonido(); break;
    }
  });

  // ---------- confeti ----------
  var Confeti = (function () {
    var cv = $('#confeti'), cx = cv.getContext('2d');
    var piezas = [], corriendo = false, dpr = 1, finLluvia = 0;
    var COL = ['#ff5468', '#ff9a1f', '#ffd23f', '#4fc94a', '#2fb0ff', '#9b63ff', '#ff6fb3', '#ffffff'];

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    }
    medir(); addEventListener('resize', medir);

    function pieza(x, y, vx, vy) {
      var forma = Math.random();
      return {
        x: x, y: y, vx: vx, vy: vy,
        r: (Math.random() * 6 + 5) * (innerWidth / 700 + .4),
        rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
        c: COL[Math.floor(Math.random() * COL.length)],
        f: forma < .45 ? 'tira' : forma < .8 ? 'punto' : 'estrella',
        vida: 1
      };
    }
    function estrella(r) {
      cx.beginPath();
      for (var i = 0; i < 10; i++) {
        var a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r;
        cx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      cx.closePath(); cx.fill();
    }
    function cuadro() {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, cv.width, cv.height);
      var ahora = performance.now();
      if (ahora < finLluvia && Math.random() < .7) {
        piezas.push(pieza(Math.random() * innerWidth, -20, (Math.random() - .5) * 2, Math.random() * 2 + 2));
      }
      piezas = piezas.filter(function (p) { return p.y < innerHeight + 40 && p.vida > 0; });
      piezas.forEach(function (p) {
        p.vy += .12; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.vy > 0) p.vida -= .004;
        cx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
        cx.rotate(p.rot);
        cx.globalAlpha = Math.max(0, Math.min(1, p.vida * 1.5));
        cx.fillStyle = p.c;
        if (p.f === 'tira') cx.fillRect(-p.r * .4, -p.r, p.r * .8, p.r * 2);
        else if (p.f === 'punto') { cx.beginPath(); cx.arc(0, 0, p.r * .6, 0, 7); cx.fill(); }
        else estrella(p.r);
      });
      cx.globalAlpha = 1;
      if (piezas.length || ahora < finLluvia) requestAnimationFrame(cuadro);
      else { corriendo = false; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); }
    }
    function arrancar() { if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); } }

    return {
      explosion: function (x, y, n) {
        for (var i = 0; i < n; i++) {
          var a = Math.random() * Math.PI * 2, v = Math.random() * 9 + 4;
          piezas.push(pieza(x, y, Math.cos(a) * v, Math.sin(a) * v - 4));
        }
        arrancar();
      },
      lluvia: function (ms) {
        finLluvia = performance.now() + ms;
        for (var i = 0; i < 50; i++) {
          piezas.push(pieza(Math.random() * innerWidth, -Math.random() * innerHeight * .4, (Math.random() - .5) * 3, Math.random() * 3 + 1));
        }
        arrancar();
      }
    };
  })();

  // ---------- arranque ----------
  colorearTitulos();
  pintarBotonSonido();
  $('#inicio-record').textContent = leerRecord();
  if ('ResizeObserver' in window) new ResizeObserver(acomodar).observe($('#tablero-zona'));
  else addEventListener('resize', acomodar);

  // Para probar desde la consola del navegador
  window.PQL = { estado: E, elegir: elegirParejas, irANivel: function (n) { E.nivel = n; E.tema = null; empezarNivel(); } };
})();
