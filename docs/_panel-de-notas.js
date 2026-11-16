/* ════════════════════════════════════════════════════════════════════════════
   PANEL DE NOTAS  ·  v2  ·  fuente única
   ════════════════════════════════════════════════════════════════════════════

   Qué es
   ──────
   Un panel plegable para leer un documento HTML e ir apuntando notas contra
   cada sección. Un botón deja las notas en el portapapeles con el formato
   listo para pegar en la terminal de Claude Code.

   Cómo se mete en un documento
   ────────────────────────────
   Una línea, al final del <body>:

       <script src="_panel-de-notas.js" defer></script>

   Y ya está. El script se trae su propio CSS y su propio HTML: no hay bloque
   que copiar, ni marcas que respetar. Arreglar un fallo aquí lo arregla en
   todos los documentos que lo cargan.

   Ajustes opcionales, como atributos de esa misma línea:

       data-secciones="section"    qué bloques se pueden anotar
                                   (por defecto <section>)
       data-documento="docs/x.html"  ruta que se escribe en el texto copiado
                                   (por defecto se deduce de la URL)
       data-titulo="…"             título que acompaña a la ruta
                                   (por defecto el <h1>, o el <title>)

   Funciona abriendo el HTML con doble clic desde el Finder: un <script src>
   clásico a un archivo vecino sí carga bajo file://  —comprobado en Chrome—,
   al contrario que fetch() o los módulos ES, que file:// bloquea por CORS.
   La única condición es que el .js viva en la misma carpeta que el documento.

   Sin CDN, sin fuentes externas, sin dependencias, sin build.

   Colores
   ───────
   Si el documento define --tinta / --tinta-2 / --tinta-3 / --papel / --caja /
   --linea / --linea-2 / --verde / --verde-s, el panel los hereda. Si no los
   define, usa equivalentes propios en claro y oscuro.

   Demo y documentación larga: _panel-de-notas.html (en esta misma carpeta).
   ════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── De dónde salen los ajustes ───────────────────────────────────────────
     document.currentScript apunta a la etiqueta que nos cargó, también con
     defer. Si algún día no estuviera, lo buscamos por el src.               */
  var etiqueta = document.currentScript ||
                 document.querySelector('script[src*="_panel-de-notas"]');
  var dato = function (nombre, porDefecto) {
    var v = etiqueta && etiqueta.getAttribute('data-' + nombre);
    return (v && v.trim()) || porDefecto;
  };
  var CONFIG = {
    selectorSecciones: dato('secciones', 'section'),
    documento: dato('documento', null),
    titulo: dato('titulo', null)
  };

  /* ── El lado: derecha o izquierda, elegido por el lector ──────────────────
     Es una preferencia de lectura, no del documento: se guarda una sola vez
     y vale para todos los documentos que llevan el panel.
     Se aplica ya mismo, antes de pintar nada, para que el tirador no dé un
     salto de un borde al otro al cargar la página.                          */
  var CLAVE_LADO = 'notas-html:lado';
  var lado = 'derecha';
  try {
    var guardado = window.localStorage.getItem(CLAVE_LADO);
    if (guardado === 'izquierda' || guardado === 'derecha') lado = guardado;
  } catch (e) { /* ventana privada: nos quedamos con la derecha */ }
  var raiz = document.documentElement;
  raiz.setAttribute('data-np-lado', lado);

  /* ── Estilos ────────────────────────────────────────────────────────────── */
  var CSS = [
    /* Todo lo del panel vive bajo .np y usa variables propias (--np-*) que
       heredan las del documento cuando existen. */
    ':root { --np-ancho: 380px; }',

    '.np {',
    '  --np-tinta:   var(--tinta,   #1c1917);',
    '  --np-tinta-2: var(--tinta-2, #57534e);',
    '  --np-tinta-3: var(--tinta-3, #8a827b);',
    '  --np-papel:   var(--papel,   #faf9f7);',
    '  --np-caja:    var(--caja,    #ffffff);',
    '  --np-linea:   var(--linea,   #e7e5e4);',
    '  --np-linea-2: var(--linea-2, #d6d3d1);',
    '  --np-acento:  var(--verde,   #006a4d);',
    '  --np-acento-s:var(--verde-s, #e8f1ee);',
    '  --np-sombra:  rgba(28, 25, 23, .16);',
    '  font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;',
    '}',
    '@media (prefers-color-scheme: dark) {',
    '  :root:not([data-theme="light"]) .np {',
    '    --np-tinta:   var(--tinta,   #f5f5f4);',
    '    --np-tinta-2: var(--tinta-2, #c4bfba);',
    '    --np-tinta-3: var(--tinta-3, #8a827b);',
    '    --np-papel:   var(--papel,   #14120f);',
    '    --np-caja:    var(--caja,    #1d1a17);',
    '    --np-linea:   var(--linea,   #2e2a26);',
    '    --np-linea-2: var(--linea-2, #423c36);',
    '    --np-acento:  var(--verde,   #5fbf9d);',
    '    --np-acento-s:var(--verde-s, #14302a);',
    '    --np-sombra:  rgba(0, 0, 0, .5);',
    '  }',
    '}',
    ':root[data-theme="dark"] .np {',
    '  --np-tinta:   var(--tinta,   #f5f5f4);',
    '  --np-tinta-2: var(--tinta-2, #c4bfba);',
    '  --np-tinta-3: var(--tinta-3, #8a827b);',
    '  --np-papel:   var(--papel,   #14120f);',
    '  --np-caja:    var(--caja,    #1d1a17);',
    '  --np-linea:   var(--linea,   #2e2a26);',
    '  --np-linea-2: var(--linea-2, #423c36);',
    '  --np-acento:  var(--verde,   #5fbf9d);',
    '  --np-acento-s:var(--verde-s, #14302a);',
    '  --np-sombra:  rgba(0, 0, 0, .5);',
    '}',

    '.np, .np *, .np *::before, .np *::after { box-sizing: border-box; }',
    '.np button { font: inherit; cursor: pointer; }',

    /* ── Tirador: lo único visible con el panel cerrado ──────────────────── */
    '.np-tirador {',
    '  position: fixed; z-index: 60; right: 0; top: 50%;',
    '  transform: translateY(-50%);',
    '  display: flex; align-items: center; gap: 8px;',
    '  width: 40px; min-height: 128px; padding: 16px 0;',
    '  justify-content: center;',
    '  writing-mode: vertical-rl; text-orientation: mixed;',
    '  font-size: 12px; font-weight: 650; letter-spacing: .1em;',
    '  text-transform: uppercase;',
    '  color: var(--np-tinta-2); background: var(--np-caja);',
    '  border: 1px solid var(--np-linea); border-right: 0;',
    '  border-radius: 12px 0 0 12px;',
    '  box-shadow: -2px 0 14px -8px var(--np-sombra);',
    '  transition: color .12s ease, border-color .12s ease, background-color .12s ease;',
    '}',
    '.np-tirador:hover { color: var(--np-tinta); border-color: var(--np-linea-2); }',
    '.np-tirador:focus-visible { outline: 0; border-color: var(--np-tinta-2); color: var(--np-tinta); }',
    '.np[data-abierto="true"] .np-tirador { opacity: 0; pointer-events: none; }',
    '.np-cuenta {',
    '  writing-mode: horizontal-tb;',
    '  min-width: 20px; height: 20px; padding: 0 6px;',
    '  display: inline-flex; align-items: center; justify-content: center;',
    '  border-radius: 999px; font-size: 11px; font-weight: 650; letter-spacing: 0;',
    '  background: var(--np-acento-s); color: var(--np-acento);',
    '}',
    '.np-cuenta[hidden] { display: none; }',

    /* ── Velo (solo en móvil, cuando el panel es hoja inferior) ──────────── */
    '.np-velo {',
    '  position: fixed; inset: 0; z-index: 60; border: 0; padding: 0;',
    '  background: rgba(0,0,0,.38); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);',
    '  opacity: 0; pointer-events: none;',
    '  transition: opacity .2s ease;',
    '  display: none;',
    '}',

    /* ── Panel ──────────────────────────────────────────────────────────── */
    '.np-panel {',
    '  position: fixed; z-index: 61; top: 0; right: 0; bottom: 0;',
    '  width: var(--np-ancho); max-width: 100%;',
    '  display: flex; flex-direction: column;',
    '  background: var(--np-caja);',
    '  border-left: 1px solid var(--np-linea);',
    '  box-shadow: -10px 0 40px -24px var(--np-sombra);',
    '  transform: translateX(101%);',
    '  visibility: hidden;',
    '  transition: transform .24s cubic-bezier(.4,0,.2,1), visibility 0s linear .24s;',
    '}',
    '.np[data-abierto="true"] .np-panel {',
    '  transform: none; visibility: visible;',
    '  transition: transform .24s cubic-bezier(.4,0,.2,1), visibility 0s;',
    '}',
    '@media (min-width: 1100px) {',
    /* Con el panel abierto la lectura se estrecha y se recentra;
       cerrado no roba ni un píxel. */
    '  html.np-abierto body { padding-right: var(--np-ancho); }',
    '}',

    /* ── El otro lado ─────────────────────────────────────────────────────
       El atributo vive en <html> y no en .np porque los botones «Anotar»
       se insertan dentro de las secciones del documento, fuera del panel. */
    ':root[data-np-lado="izquierda"] .np-tirador {',
    '  right: auto; left: 0;',
    '  border-right: 1px solid var(--np-linea); border-left: 0;',
    '  border-radius: 0 12px 12px 0;',
    '  box-shadow: 2px 0 14px -8px var(--np-sombra);',
    '}',
    ':root[data-np-lado="izquierda"] .np-panel {',
    '  right: auto; left: 0;',
    '  border-left: 0; border-right: 1px solid var(--np-linea);',
    '  box-shadow: 10px 0 40px -24px var(--np-sombra);',
    '  transform: translateX(-101%);',
    '}',
    ':root[data-np-lado="izquierda"] .np[data-abierto="true"] .np-panel { transform: none; }',
    '@media (min-width: 1100px) {',
    '  html.np-abierto[data-np-lado="izquierda"] body {',
    '    padding-right: 0; padding-left: var(--np-ancho);',
    '  }',
    '}',
    /* Al cambiar de lado el panel no puede deslizarse de un borde al otro
       —left y right no se animan—, así que aterriza con un gesto corto. */
    '@keyframes np-llega-der { from { transform: translateX(18px); opacity: 0 } to { transform: none; opacity: 1 } }',
    '@keyframes np-llega-izq { from { transform: translateX(-18px); opacity: 0 } to { transform: none; opacity: 1 } }',
    ':root[data-np-lado="derecha"]   .np-panel.np-aterriza { animation: np-llega-der .26s cubic-bezier(.2,.7,.3,1); }',
    ':root[data-np-lado="izquierda"] .np-panel.np-aterriza { animation: np-llega-izq .26s cubic-bezier(.2,.7,.3,1); }',

    /* ── Cabecera ───────────────────────────────────────────────────────── */
    '.np-cab {',
    '  display: flex; align-items: center; justify-content: space-between; gap: 12px;',
    '  padding: 18px 16px 14px 22px;',
    '  border-bottom: 1px solid var(--np-linea);',
    '}',
    '.np-titulo {',
    '  margin: 0; font-size: 16px; font-weight: 640; letter-spacing: -0.01em;',
    '  color: var(--np-tinta);',
    '}',
    '.np-cab .np-cuenta { writing-mode: horizontal-tb; margin-left: 2px; }',
    '.np-cab-izq { display: flex; align-items: center; gap: 10px; min-width: 0; }',
    '.np-cab-der { display: flex; align-items: center; gap: 2px; flex: none; }',
    '.np-lado, .np-cerrar {',
    '  position: relative;',
    '  width: 36px; height: 36px; flex: none;',
    '  display: grid; place-items: center;',
    '  background: transparent; color: var(--np-tinta-3);',
    '  border: 1px solid transparent; border-radius: 9px;',
    '  transition: color .12s ease, background-color .12s ease, border-color .12s ease;',
    '}',
    /* El dibujo mide 36; el objetivo táctil, 44. */
    '.np-lado::after, .np-cerrar::after { content: ""; position: absolute; inset: -4px; }',
    '.np-lado:hover, .np-cerrar:hover { color: var(--np-tinta); background: var(--np-papel); }',
    '.np-lado:focus-visible, .np-cerrar:focus-visible {',
    '  outline: 0; border-color: var(--np-tinta-2); color: var(--np-tinta);',
    '}',
    '.np-cerrar svg { width: 17px; height: 17px; }',
    '.np-lado svg { width: 19px; height: 19px; transition: transform .22s cubic-bezier(.2,.7,.3,1); }',
    ':root[data-np-lado="izquierda"] .np-lado svg { transform: scaleX(-1); }',

    /* ── Compositor ─────────────────────────────────────────────────────── */
    '.np-compositor { padding: 16px 18px 14px; border-bottom: 1px solid var(--np-linea); }',
    '.np-sobre { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }',
    '.np-sobre-et {',
    '  font-size: 11px; font-weight: 650; letter-spacing: .1em; text-transform: uppercase;',
    '  color: var(--np-tinta-3); flex: none;',
    '}',

    /* Select propio: nunca <select> nativo */
    '.np-sel { position: relative; flex: 1; min-width: 0; }',
    '.np-sel-btn {',
    '  width: 100%; min-height: 36px; padding: 6px 10px;',
    '  display: flex; align-items: center; gap: 8px; justify-content: space-between;',
    '  text-align: left; color: var(--np-tinta); background: var(--np-papel);',
    '  border: 1px solid var(--np-linea-2); border-radius: 9px;',
    '  font-size: 13px;',
    '  transition: border-color .12s ease, background-color .12s ease;',
    '}',
    '.np-sel-btn:hover { border-color: var(--np-tinta-3); }',
    '.np-sel-btn:focus-visible { outline: 0; border-color: var(--np-tinta-2); }',
    '.np-sel-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.np-sel-btn svg { width: 13px; height: 13px; flex: none; color: var(--np-tinta-3);',
    '                  transition: transform .15s ease; }',
    '.np-sel-btn[aria-expanded="true"] svg { transform: rotate(180deg); }',
    '.np-sel-lista {',
    '  position: absolute; z-index: 5; top: calc(100% + 6px); left: 0; right: 0;',
    '  max-height: 246px; overflow-y: auto; padding: 5px;',
    '  background: var(--np-caja); border: 1px solid var(--np-linea-2);',
    '  border-radius: 11px; box-shadow: 0 14px 34px -16px var(--np-sombra);',
    '}',
    '.np-sel-op {',
    '  display: flex; align-items: center; gap: 8px; width: 100%;',
    '  min-height: 34px; padding: 7px 9px; text-align: left;',
    '  font-size: 13px; line-height: 1.35; color: var(--np-tinta-2);',
    '  background: transparent; border: 0; border-radius: 8px;',
    '  transition: background-color .1s ease, color .1s ease;',
    '}',
    '.np-sel-op:hover { background: var(--np-papel); color: var(--np-tinta); }',
    '.np-sel-op:focus-visible { outline: 0; background: var(--np-papel); color: var(--np-tinta); }',
    '.np-sel-op[aria-selected="true"] { color: var(--np-tinta); font-weight: 620; }',
    '.np-sel-op i {',
    '  flex: none; width: 14px; font-style: normal; color: var(--np-acento);',
    '  opacity: 0; font-size: 12px;',
    '}',
    '.np-sel-op[aria-selected="true"] i { opacity: 1; }',

    '.np-texto {',
    '  display: block; width: 100%;',
    '  min-height: 76px; max-height: 40vh; padding: 11px 12px;',
    '  font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;',
    '  color: var(--np-tinta); background: var(--np-papel);',
    '  border: 1px solid var(--np-linea-2); border-radius: 11px;',
    '  resize: none; overflow-y: auto;',
    '  transition: border-color .12s ease;',
    '}',
    '.np-texto::placeholder { color: var(--np-tinta-3); }',
    '.np-texto:focus { outline: 0; border-color: var(--np-tinta-2); }',

    '.np-acciones-comp {',
    '  display: flex; align-items: center; justify-content: space-between; gap: 12px;',
    '  margin-top: 10px;',
    '}',
    '.np-pista { font-size: 12px; color: var(--np-tinta-3); display: flex; align-items: center; gap: 4px; }',
    '.np-pista kbd {',
    '  font: inherit; font-size: 11px; padding: 1px 5px; border-radius: 5px;',
    '  background: var(--np-papel); border: 1px solid var(--np-linea-2); color: var(--np-tinta-2);',
    '}',
    '.np-add {',
    '  min-height: 36px; padding: 0 16px;',
    '  font-size: 13px; font-weight: 620;',
    /* El acento es oscuro en tema claro y claro en tema oscuro:
       el texto del botón hace el camino contrario. */
    '  color: #ffffff; background: var(--np-acento);',
    '  border: 1px solid var(--np-acento); border-radius: 9px;',
    '  transition: opacity .12s ease, filter .12s ease;',
    '}',
    '@media (prefers-color-scheme: dark) {',
    '  :root:not([data-theme="light"]) .np-add { color: #0c1a15; }',
    '}',
    ':root[data-theme="dark"] .np-add { color: #0c1a15; }',
    '.np-add:hover:not(:disabled) { filter: brightness(1.08); }',
    '.np-add:focus-visible { outline: 0; filter: brightness(1.12); }',
    '.np-add:disabled { opacity: .35; cursor: default; }',

    /* ── Lista de notas ─────────────────────────────────────────────────── */
    '.np-lista { flex: 1; overflow-y: auto; padding: 8px 18px 20px; }',
    '.np-lista:focus { outline: 0; }',
    '.np-vacio {',
    '  margin: 26px 2px 0; font-size: 14px; line-height: 1.6; color: var(--np-tinta-3);',
    '}',
    '.np-grupo { margin-top: 16px; }',
    '.np-grupo-tit {',
    '  margin: 0 0 8px; font-size: 11px; font-weight: 650;',
    '  letter-spacing: .09em; text-transform: uppercase; color: var(--np-tinta-3);',
    '}',
    /* Capturas pegadas: el chip del compositor y la miniatura de la nota. */
    '.np-capturas { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }',
    '.np-destino {',
    '  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;',
    '  margin-top: 8px; font-size: 11px; color: var(--np-tinta-3);',
    '}',
    '.np-destino b { font-weight: 600; color: var(--np-tinta-2); }',
    '.np-destino button {',
    '  border: 1px solid var(--np-linea-2); background: none; cursor: pointer;',
    '  border-radius: 999px; padding: 2px 9px; font: inherit;',
    '  color: var(--np-tinta-2);',
    '}',
    '.np-destino button:hover { border-color: var(--np-tinta-3); color: var(--np-tinta-1); }',
    '.np-destino button:focus-visible { outline: 0; border-color: var(--np-tinta-2); }',
    '.np-cap {',
    '  display: inline-flex; align-items: center; gap: 6px;',
    '  border: 1px solid var(--np-linea-2); border-radius: 999px;',
    '  padding: 3px 4px 3px 8px; font-size: 11px; color: var(--np-tinta-2);',
    '  background: var(--np-fondo-2); max-width: 100%;',
    '}',
    '.np-cap img { width: 22px; height: 22px; object-fit: cover; border-radius: 4px; display: block; }',
    '.np-cap b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.np-cap-x {',
    '  border: 0; background: none; cursor: pointer; color: var(--np-tinta-3);',
    '  line-height: 1; padding: 2px; border-radius: 4px; font-size: 13px;',
    '}',
    '.np-cap-x:hover { color: var(--np-tinta-1); }',
    '.np-nota-caps { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }',
    '.np-nota-caps img {',
    '  width: 54px; height: 40px; object-fit: cover; border-radius: 6px;',
    '  border: 1px solid var(--np-linea-2); display: block;',
    '}',
    '.np-nota {',
    '  display: flex; align-items: flex-start; gap: 8px;',
    '  padding: 10px 10px 10px 12px; margin-bottom: 7px;',
    '  background: var(--np-papel); border: 1px solid var(--np-linea);',
    '  border-radius: 11px;',
    '  transition: border-color .12s ease;',
    '}',
    '.np-nota:hover { border-color: var(--np-linea-2); }',
    '.np-nota p {',
    '  flex: 1; margin: 0; font-size: 14px; line-height: 1.5;',
    '  color: var(--np-tinta); white-space: pre-wrap; overflow-wrap: anywhere;',
    '}',
    '.np-borrar {',
    '  flex: none; width: 26px; height: 26px; margin-top: -1px;',
    '  display: grid; place-items: center;',
    '  background: transparent; color: var(--np-tinta-3);',
    '  border: 1px solid transparent; border-radius: 7px;',
    '  transition: color .12s ease, background-color .12s ease, border-color .12s ease;',
    '}',
    '.np-borrar:hover { color: var(--np-tinta); background: var(--np-caja); border-color: var(--np-linea-2); }',
    '.np-borrar:focus-visible { outline: 0; color: var(--np-tinta); border-color: var(--np-tinta-2); }',
    '.np-borrar svg { width: 13px; height: 13px; }',

    /* ── Pie ────────────────────────────────────────────────────────────── */
    '.np-pie { padding: 14px 18px; border-top: 1px solid var(--np-linea); background: var(--np-caja); }',
    '.np-pie-normal { display: flex; align-items: center; gap: 10px; }',
    '.np-pie-normal[hidden] { display: none; }',
    '.np-copiar {',
    '  flex: 1; min-height: 44px; padding: 0 14px;',
    '  font-size: 14px; font-weight: 620;',
    '  color: var(--np-tinta); background: var(--np-papel);',
    '  border: 1px solid var(--np-linea-2); border-radius: 11px;',
    '  transition: border-color .12s ease, background-color .12s ease, color .12s ease;',
    '}',
    '.np-copiar:hover:not(:disabled) { border-color: var(--np-tinta-3); }',
    '.np-copiar:focus-visible { outline: 0; border-color: var(--np-tinta-2); }',
    '.np-copiar:disabled { opacity: .4; cursor: default; }',
    '.np-copiar[data-hecho="si"] {',
    '  color: var(--np-acento); border-color: var(--np-acento); background: var(--np-acento-s);',
    '}',
    '.np-vaciar {',
    '  min-height: 44px; padding: 0 14px;',
    '  font-size: 14px; color: var(--np-tinta-3);',
    '  background: transparent; border: 1px solid transparent; border-radius: 11px;',
    '  transition: color .12s ease, border-color .12s ease;',
    '}',
    '.np-vaciar:hover:not(:disabled) { color: var(--np-tinta); border-color: var(--np-linea-2); }',
    '.np-vaciar:focus-visible { outline: 0; color: var(--np-tinta); border-color: var(--np-tinta-2); }',
    '.np-vaciar:disabled { opacity: .35; cursor: default; }',

    '.np-confirmar-txt { margin: 0 0 10px; font-size: 14px; color: var(--np-tinta); }',
    '.np-confirmar-btns { display: flex; gap: 10px; }',
    '.np-confirmar-btns button {',
    '  flex: 1; min-height: 44px; border-radius: 11px; font-size: 14px; font-weight: 620;',
    '  transition: border-color .12s ease, background-color .12s ease, color .12s ease;',
    '}',
    '.np-btn-sec {',
    '  color: var(--np-tinta-2); background: var(--np-papel);',
    '  border: 1px solid var(--np-linea-2);',
    '}',
    '.np-btn-sec:hover { color: var(--np-tinta); border-color: var(--np-tinta-3); }',
    '.np-btn-sec:focus-visible { outline: 0; border-color: var(--np-tinta-2); }',
    '.np-btn-peligro {',
    '  color: #fff; background: #a3341f; border: 1px solid #a3341f;',
    '}',
    '.np-btn-peligro:hover { filter: brightness(1.1); }',
    '.np-btn-peligro:focus-visible { outline: 0; filter: brightness(1.15); }',

    /* ── Botón «anotar» que aparece en cada sección al pasar por encima ─── */
    '.np-anclable { position: relative; }',
    '.np-marca {',
    '  position: absolute; top: -4px; right: 0; z-index: 2;',
    '  min-height: 26px; padding: 3px 10px;',
    '  font: 600 11px/1 system-ui, -apple-system, "Segoe UI", sans-serif;',
    '  letter-spacing: .06em; text-transform: uppercase;',
    '  color: var(--np-tinta-3, #8a827b);',
    '  background: var(--np-caja, #fff);',
    '  border: 1px solid var(--np-linea, #e7e5e4); border-radius: 999px;',
    '  opacity: 0; cursor: pointer;',
    '  transition: opacity .14s ease, color .12s ease, border-color .12s ease;',
    '}',
    /* No se mueve con el panel: a la izquierda de la sección viven los
       epígrafes del documento y la chapa se les echaría encima. */
    '.np-anclable:hover > .np-marca,',
    '.np-marca:focus-visible { opacity: 1; }',
    '.np-marca:hover { color: var(--np-tinta, #1c1917); border-color: var(--np-linea-2, #d6d3d1); }',
    '.np-marca:focus-visible { outline: 0; border-color: var(--np-tinta-2, #57534e); }',

    /* ── Móvil: hoja inferior, no una columna estrecha ──────────────────── */
    '@media (max-width: 899px) {',
    '  .np-tirador,',
    '  :root[data-np-lado="izquierda"] .np-tirador {',
    '    top: auto; bottom: 18px; right: 18px; left: auto; transform: none;',
    '    writing-mode: horizontal-tb; width: auto; min-height: 48px; min-width: 48px;',
    '    padding: 0 20px; gap: 9px;',
    '    border-radius: 999px; border: 1px solid var(--np-linea);',
    '    box-shadow: 0 8px 26px -10px var(--np-sombra);',
    '  }',
    '  .np-velo { display: block; }',
    '  .np[data-abierto="true"] .np-velo { opacity: 1; pointer-events: auto; }',
    '  .np-panel,',
    '  :root[data-np-lado="izquierda"] .np-panel {',
    '    top: auto; left: 0; right: 0; bottom: 0; width: 100%; height: 86vh;',
    '    border-left: 0; border-right: 0; border-top: 1px solid var(--np-linea);',
    '    border-radius: 20px 20px 0 0;',
    '    transform: translateY(101%);',
    '    box-shadow: 0 -12px 40px -22px var(--np-sombra);',
    '  }',
    '  .np[data-abierto="true"] .np-panel,',
    '  :root[data-np-lado="izquierda"] .np[data-abierto="true"] .np-panel { transform: none; }',
    /* Aquí izquierda y derecha no significan nada: el control sobra. */
    '  .np-lado { display: none; }',
    '  .np-panel.np-aterriza { animation: none; }',
    '  .np-marca { display: none; }',
    '}',
    '@media (hover: none) {',
    '  .np-marca { display: none; }',
    '  .np-borrar { width: 44px; height: 44px; margin: -9px -9px -9px 0; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .np-panel, .np-velo, .np-marca, .np-sel-btn svg, .np-lado svg { transition-duration: .01ms; }',
    '  .np-panel.np-aterriza { animation: none; }',
    '}',
    '@media print {',
    '  .np { display: none; }',
    '  html.np-abierto body { padding-right: 0; padding-left: 0; }',
    '}'
  ].join('\n');

  var hoja = document.createElement('style');
  hoja.setAttribute('data-np', 'panel-de-notas');
  hoja.textContent = CSS;
  (document.head || document.documentElement).appendChild(hoja);

  /* ── Marcado ────────────────────────────────────────────────────────────── */
  var ICONO_X = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>';

  var HTML = [
    '<button class="np-velo" id="np-velo" type="button" tabindex="-1" aria-hidden="true"></button>',

    '<button class="np-tirador" id="np-tirador" type="button" aria-expanded="false" aria-controls="np-panel">',
    '  <span>Notas</span>',
    '  <span class="np-cuenta" id="np-cuenta-tirador" hidden>0</span>',
    '</button>',

    '<aside class="np-panel" id="np-panel" role="complementary" aria-label="Mis notas sobre este documento">',

    '  <header class="np-cab">',
    '    <div class="np-cab-izq">',
    '      <h2 class="np-titulo">Mis notas</h2>',
    '      <span class="np-cuenta" id="np-cuenta" hidden>0</span>',
    '    </div>',
    '    <div class="np-cab-der">',
    '      <button class="np-lado" id="np-lado" type="button">',
    /* Un panel acoplado a un borde: el borde relleno es a dónde va a ir. */
    '        <svg viewBox="0 0 20 20" aria-hidden="true">',
    '          <rect x="2.6" y="4.4" width="14.8" height="11.2" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
    '          <path d="M7.4 4.4v11.2" stroke="currentColor" stroke-width="1.5"/>',
    '          <path d="M2.6 7c0-1.44 1.16-2.6 2.6-2.6h2.2v11.2H5.2A2.6 2.6 0 0 1 2.6 13z" fill="currentColor" opacity=".5"/>',
    '        </svg>',
    '      </button>',
    '      <button class="np-cerrar" id="np-cerrar" type="button" aria-label="Cerrar el panel de notas">' + ICONO_X + '</button>',
    '    </div>',
    '  </header>',

    '  <div class="np-compositor">',
    '    <div class="np-sobre">',
    '      <span class="np-sobre-et" id="np-sobre-et">Sobre</span>',
    '      <div class="np-sel">',
    '        <button class="np-sel-btn" id="np-sel-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="np-sobre-et np-sel-txt">',
    '          <span id="np-sel-txt">Todo el documento</span>',
    '          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5"/></svg>',
    '        </button>',
    '        <div class="np-sel-lista" id="np-sel-lista" role="listbox" aria-label="Sección del documento" hidden></div>',
    '      </div>',
    '    </div>',

    '    <textarea class="np-texto" id="np-texto" rows="3" placeholder="Lo que quieras corregir, preguntar o pedir…" aria-label="Texto de la nota"></textarea>',

    '    <div class="np-capturas" id="np-capturas" hidden></div>',
    '    <p class="np-destino" id="np-destino"></p>',
    '    <div class="np-acciones-comp">',
    '      <span class="np-pista" id="np-pista"></span>',
    '      <button class="np-add" id="np-add" type="button" disabled>Añadir</button>',
    '    </div>',
    '  </div>',

    '  <div class="np-lista" id="np-lista" tabindex="-1" aria-live="polite"></div>',

    '  <footer class="np-pie">',
    '    <div class="np-pie-normal" id="np-pie-normal">',
    '      <button class="np-copiar" id="np-copiar" type="button" disabled>Copiar para la terminal</button>',
    '      <button class="np-vaciar" id="np-vaciar" type="button" disabled>Vaciar</button>',
    '    </div>',
    '    <div id="np-pie-confirmar" hidden>',
    '      <p class="np-confirmar-txt" id="np-confirmar-txt">¿Borrar todas las notas?</p>',
    '      <div class="np-confirmar-btns">',
    '        <button class="np-btn-sec" id="np-cancelar" type="button">Cancelar</button>',
    '        <button class="np-btn-peligro" id="np-confirmar" type="button">Sí, borrar</button>',
    '      </div>',
    '    </div>',
    '  </footer>',

    '</aside>'
  ].join('\n');

  /* ── Todo lo demás espera a tener <body> y documento parseado ───────────── */
  function montar() {
    if (document.getElementById('np')) return;      // cargado dos veces: uno basta

    var host = document.createElement('div');
    host.className = 'np';
    host.id = 'np';
    host.setAttribute('data-abierto', 'false');
    host.innerHTML = HTML;
    document.body.appendChild(host);

    var $ = function (id) { return document.getElementById(id); };

    var elPanel    = $('np-panel'),
        elTirador  = $('np-tirador'),
        elVelo     = $('np-velo'),
        elLado     = $('np-lado'),
        elCerrar   = $('np-cerrar'),
        elSelBtn   = $('np-sel-btn'),
        elSelTxt   = $('np-sel-txt'),
        elSelLista = $('np-sel-lista'),
        elTexto    = $('np-texto'),
        elAdd      = $('np-add'),
        elPista    = $('np-pista'),
        elCaps     = $('np-capturas'),
        elDestino  = $('np-destino'),
        elLista    = $('np-lista'),
        elCuenta   = $('np-cuenta'),
        elCuentaT  = $('np-cuenta-tirador'),
        elCopiar   = $('np-copiar'),
        elVaciar   = $('np-vaciar'),
        elPieN     = $('np-pie-normal'),
        elPieC     = $('np-pie-confirmar'),
        elConfTxt  = $('np-confirmar-txt'),
        elCancelar = $('np-cancelar'),
        elConfirmar= $('np-confirmar');

    /* ── Lado: el control ─────────────────────────────────────────────────── */
    function etiquetaLado() {
      elLado.setAttribute('aria-label', lado === 'derecha'
        ? 'Mover el panel a la izquierda'
        : 'Mover el panel a la derecha');
    }
    etiquetaLado();

    elLado.addEventListener('click', function () {
      lado = (lado === 'derecha') ? 'izquierda' : 'derecha';
      raiz.setAttribute('data-np-lado', lado);
      etiquetaLado();
      try { window.localStorage.setItem(CLAVE_LADO, lado); }
      catch (e) { /* sin memoria: vale para esta sesión */ }

      elPanel.classList.remove('np-aterriza');
      void elPanel.offsetWidth;                     // reinicia la animación
      elPanel.classList.add('np-aterriza');
    });
    elPanel.addEventListener('animationend', function (ev) {
      if (ev.target === elPanel) elPanel.classList.remove('np-aterriza');
    });

    /* ── Secciones del documento ──────────────────────────────────────────── */
    var GENERAL = { id: '', etiqueta: 'Todo el documento', el: null };
    var secciones = [GENERAL];

    function escanearSecciones() {
      Array.prototype.forEach.call(document.querySelectorAll(CONFIG.selectorSecciones), function (el, i) {
        if (host.contains(el)) return;                   // no anotar el propio panel
        var t = el.querySelector('h2, h3, h4');
        if (!t) t = el.querySelector('[class*="paso"], [class*="epigrafe"]');
        var etiqueta = (t && t.textContent.trim()) || ('Sección ' + (i + 1));
        el.id = el.id || ('np-sec-' + (i + 1));
        el.classList.add('np-anclable');
        secciones.push({ id: el.id, etiqueta: etiqueta, el: el });

        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'np-marca';
        b.textContent = 'Anotar';
        b.setAttribute('aria-label', 'Anotar sobre «' + etiqueta + '»');
        b.addEventListener('click', function () {
          fijarSeccion(el.id, true);
          abrir();
          elTexto.focus();
        });
        el.appendChild(b);
      });
    }

    function seccionPorId(id) {
      for (var i = 0; i < secciones.length; i++) if (secciones[i].id === id) return secciones[i];
      return null;
    }

    /* ── Identidad del documento ──────────────────────────────────────────── */
    var partes = window.location.pathname.split('/').filter(Boolean);
    var ruta = CONFIG.documento || decodeURIComponent(partes.slice(-2).join('/')) || 'documento.html';
    var h1 = document.querySelector('h1');
    var titulo = CONFIG.titulo || (h1 && h1.textContent.trim()) || document.title || '';

    /* ── Persistencia (puede fallar en ventana privada) ───────────────────── */
    var CLAVE = 'notas-html:' + ruta;
    var notas = [];
    try {
      var crudo = window.localStorage.getItem(CLAVE);
      if (crudo) { var p = JSON.parse(crudo); if (Array.isArray(p)) notas = p; }
    } catch (e) { /* sin memoria: el panel sigue funcionando en esta sesión */ }

    function guardar() {
      try { window.localStorage.setItem(CLAVE, JSON.stringify(notas)); }
      catch (e) { /* ídem */ }
    }

    /* ── Abrir y cerrar ───────────────────────────────────────────────────── */
    function abrir() {
      host.dataset.abierto = 'true';
      elTirador.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('np-abierto');
    }
    function cerrar() {
      cerrarSelect();
      cancelarVaciado();
      host.dataset.abierto = 'false';
      elTirador.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('np-abierto');
      elTirador.focus();
    }
    elTirador.addEventListener('click', function () {
      abrir();
      elTexto.focus();
    });
    elCerrar.addEventListener('click', cerrar);
    elVelo.addEventListener('click', cerrar);

    /* ── Select propio de sección ─────────────────────────────────────────── */
    var seleccion = GENERAL.id;
    var fijadaAMano = false;

    function pintarSelect() {
      var s = seccionPorId(seleccion) || GENERAL;
      elSelTxt.textContent = s.etiqueta;
    }
    function fijarSeccion(id, aMano) {
      seleccion = id;
      fijadaAMano = !!aMano;
      pintarSelect();
    }
    function construirLista() {
      elSelLista.textContent = '';
      secciones.forEach(function (s) {
        var op = document.createElement('button');
        op.type = 'button';
        op.className = 'np-sel-op';
        op.setAttribute('role', 'option');
        op.setAttribute('aria-selected', String(s.id === seleccion));
        var check = document.createElement('i');
        check.textContent = '✓';
        check.setAttribute('aria-hidden', 'true');
        var txt = document.createElement('span');
        txt.textContent = s.etiqueta;
        op.appendChild(check);
        op.appendChild(txt);
        op.addEventListener('click', function () {
          fijarSeccion(s.id, true);
          cerrarSelect();
          elSelBtn.focus();
        });
        elSelLista.appendChild(op);
      });
    }
    function abrirSelect() {
      construirLista();
      elSelLista.hidden = false;
      elSelBtn.setAttribute('aria-expanded', 'true');
      var act = elSelLista.querySelector('[aria-selected="true"]');
      if (act) act.focus();
    }
    function cerrarSelect() {
      elSelLista.hidden = true;
      elSelBtn.setAttribute('aria-expanded', 'false');
    }
    elSelBtn.addEventListener('click', function () {
      if (elSelLista.hidden) abrirSelect(); else cerrarSelect();
    });
    document.addEventListener('click', function (ev) {
      if (!elSelLista.hidden && !ev.target.closest('.np-sel')) cerrarSelect();
    });

    /* ── La sección se deduce sola mientras no haya texto escrito ─────────── */
    function seccionEnPantalla() {
      var y = window.pageYOffset + 150, encontrada = null;
      for (var i = 1; i < secciones.length; i++) {
        var top = secciones[i].el.getBoundingClientRect().top + window.pageYOffset;
        if (top <= y) encontrada = secciones[i];
      }
      return encontrada;
    }
    var pendiente = false;
    function alRodar() {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(function () {
        pendiente = false;
        if (fijadaAMano || elTexto.value.trim()) return;
        var s = seccionEnPantalla();
        if (s && s.id !== seleccion) { seleccion = s.id; pintarSelect(); }
      });
    }
    window.addEventListener('scroll', alRodar, { passive: true });

    /* ── Escribir ─────────────────────────────────────────────────────────── */
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    elPista.innerHTML = '<kbd>' + (mac ? '⌘' : 'Ctrl') + '</kbd><kbd>↵</kbd> añadir';

    function ajustarAlto() {
      elTexto.style.height = 'auto';
      elTexto.style.height = Math.min(elTexto.scrollHeight, window.innerHeight * 0.4) + 'px';
    }
    elTexto.addEventListener('input', function () {
      ajustarAlto();
      elAdd.disabled = !elTexto.value.trim() && !capturasPendientes.length;
    });
    elTexto.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); anadir(); }
    });
    elAdd.addEventListener('click', anadir);

    /* ── CAPTURAS PEGADAS ──────────────────────────────────────────────────
     *
     * El navegador NO entrega la ruta del archivo que pegas: el portapapeles
     * viaja con los BYTES de la imagen, nunca con su sitio en el disco. Es una
     * frontera de seguridad del navegador, no un hueco de este panel — y no
     * hay forma de rodearla desde una página.
     *
     * Así que se hace al revés: la imagen se GUARDA con un nombre que la nota
     * menciona, y el texto que se copia a la terminal lleva ese nombre. Quien
     * lea la nota sabe exactamente qué archivo abrir, y el archivo está donde
     * el navegador deja las descargas.
     *
     * En la nota se guarda solo una MINIATURA (160px, JPEG) — sirve para
     * reconocer de un vistazo qué se adjuntó, y pesa unos pocos KB: meter la
     * imagen entera reventaría el localStorage a la tercera captura.
     */
    /* Dónde caen las capturas. La carpeta la elige el dueño UNA vez y queda
     * recordada; dentro se abre una subcarpeta por documento, con el nombre
     * del archivo HTML. Sin carpeta elegida se cae a la descarga normal, que
     * respeta la misma estructura de subcarpetas. */
    var CARPETA_RAIZ = 'capturas-ideas';
    var capturasPendientes = [];
    var nCaptura = 0;

    /** El nombre del HTML, sin extensión: es la subcarpeta de este documento. */
    var SUBCARPETA = (ruta.split('/').pop() || 'documento')
      .replace(/\.html?$/i, '')
      .replace(/[^\w\u00C0-\u024F.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'documento';

    /* ── Recordar la carpeta entre sesiones ────────────────────────────────
     * El handle de carpeta se puede guardar en IndexedDB —localStorage solo
     * guarda texto— y al volver se le pregunta al navegador si el permiso
     * sigue en pie. Bajo file:// el permiso no siempre sobrevive al cierre:
     * cuando no sobrevive, la línea de abajo lo dice y basta un clic. */
    var carpeta = null;             // FileSystemDirectoryHandle o null
    var carpetaListaParaEscribir = false;

    function conBaseDeDatos(hacer) {
      try {
        var req = window.indexedDB.open('panel-de-notas', 1);
        req.onupgradeneeded = function () {
          req.result.createObjectStore('handles');
        };
        req.onsuccess = function () { hacer(req.result); };
        req.onerror = function () { hacer(null); };
      } catch (e) { hacer(null); }
    }

    function leerCarpetaGuardada(listo) {
      conBaseDeDatos(function (db) {
        if (!db) return listo(null);
        try {
          var op = db.transaction('handles', 'readonly').objectStore('handles').get('carpeta');
          op.onsuccess = function () { listo(op.result || null); };
          op.onerror = function () { listo(null); };
        } catch (e) { listo(null); }
      });
    }

    function recordarCarpeta(handle) {
      conBaseDeDatos(function (db) {
        if (!db) return;
        try { db.transaction('handles', 'readwrite').objectStore('handles').put(handle, 'carpeta'); }
        catch (e) { /* sin memoria: se vuelve a elegir la próxima vez */ }
      });
    }

    function permisoDeEscritura(handle, pedirlo, listo) {
      if (!handle || !handle.queryPermission) return listo(false);
      handle.queryPermission({ mode: 'readwrite' }).then(function (estado) {
        if (estado === 'granted') return listo(true);
        if (!pedirlo) return listo(false);
        handle.requestPermission({ mode: 'readwrite' })
          .then(function (e2) { listo(e2 === 'granted'); })
          .catch(function () { listo(false); });
      }).catch(function () { listo(false); });
    }

    function pintarDestino() {
      elDestino.textContent = '';
      var txt = document.createElement('span');
      if (carpeta && carpetaListaParaEscribir) {
        txt.innerHTML = 'Capturas → <b>' + carpeta.name + ' / ' + SUBCARPETA + '</b>';
      } else if (carpeta) {
        txt.innerHTML = 'Capturas → <b>' + carpeta.name + '</b> · falta dar permiso';
      } else {
        txt.innerHTML = 'Capturas → <b>Descargas</b> · elige carpeta para ordenarlas en ' +
                        CARPETA_RAIZ + '/' + SUBCARPETA;
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = carpeta
        ? (carpetaListaParaEscribir ? 'Cambiar' : 'Dar permiso')
        : 'Elegir carpeta';
      btn.addEventListener('click', function () {
        if (carpeta && !carpetaListaParaEscribir) {
          permisoDeEscritura(carpeta, true, function (ok) {
            carpetaListaParaEscribir = ok;
            pintarDestino();
          });
          return;
        }
        elegirCarpeta();
      });
      elDestino.appendChild(txt);
      elDestino.appendChild(btn);
    }

    function elegirCarpeta() {
      if (!window.showDirectoryPicker) {
        elPista.textContent = 'Este navegador no deja elegir carpeta; las capturas van a Descargas.';
        return;
      }
      window.showDirectoryPicker({ mode: 'readwrite', id: 'capturas-ideas' })
        .then(function (handle) {
          carpeta = handle;
          recordarCarpeta(handle);
          permisoDeEscritura(handle, true, function (ok) {
            carpetaListaParaEscribir = ok;
            pintarDestino();
          });
        })
        .catch(function () { /* cerró el diálogo: se queda como estaba */ });
    }

    leerCarpetaGuardada(function (handle) {
      if (!handle) return pintarDestino();
      carpeta = handle;
      permisoDeEscritura(handle, false, function (ok) {
        carpetaListaParaEscribir = ok;
        pintarDestino();
      });
    });

    /** Dónde decir que quedaron, en el texto que se pega en la terminal. */
    function dondeQuedan() {
      return carpeta && carpetaListaParaEscribir
        ? 'la carpeta ' + carpeta.name + '/' + SUBCARPETA + ' que elegí'
        : 'la carpeta de descargas, con el nombre ' + SUBCARPETA + '--<archivo>';
    }


    function dos(n) { return (n < 10 ? '0' : '') + n; }

    function nombreDeCaptura() {
      var d = new Date();
      nCaptura++;
      return 'nota-' + d.getFullYear() + dos(d.getMonth() + 1) + dos(d.getDate()) +
             '-' + dos(d.getHours()) + dos(d.getMinutes()) + '-' + dos(nCaptura) + '.png';
    }

    /**
     * Guarda la captura. Dos caminos, y el bueno primero:
     *
     *  1. Si hay carpeta elegida y con permiso, se escribe DIRECTO en
     *     `<carpeta>/<documento>/`, creando la subcarpeta si no existe.
     *  2. Si no, descarga normal — el navegador la deja en Descargas, y el
     *     nombre lleva la misma estructura de subcarpetas (Chrome las crea).
     *
     * El respaldo importa: el permiso de carpeta puede no sobrevivir al
     * cierre del navegador, y una captura que no se guarda es una nota que
     * después no se entiende.
     */
    function guardarCaptura(blob, nombre) {
      if (carpeta && carpetaListaParaEscribir) {
        carpeta.getDirectoryHandle(SUBCARPETA, { create: true })
          .then(function (sub) { return sub.getFileHandle(nombre, { create: true }); })
          .then(function (archivo) { return archivo.createWritable(); })
          .then(function (flujo) {
            return flujo.write(blob).then(function () { return flujo.close(); });
          })
          .catch(function () {
            // Permiso revocado o carpeta movida: no se pierde la captura.
            carpetaListaParaEscribir = false;
            pintarDestino();
            descargar(blob, nombre);
          });
        return;
      }
      descargar(blob, nombre);
    }

    /**
     * El respaldo: descarga normal. OJO — Chrome NO acepta subcarpetas en el
     * nombre de descarga (convierte `a/b/foto.png` en `a_b_foto.png`), así que
     * acá no se promete una carpeta que no va a existir: se antepone el nombre
     * del documento al archivo, que es lo que de verdad se puede garantizar.
     */
    function descargar(blob, nombre) {
      var rutaRelativa = SUBCARPETA + '--' + nombre;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = rutaRelativa;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    }

    /** Miniatura chica para reconocerla; el archivo de verdad ya se bajó. */
    function miniatura(blob, listo) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        try {
          var ancho = Math.min(160, img.width) || 160;
          var alto = Math.round(img.height * (ancho / img.width)) || 120;
          var c = document.createElement('canvas');
          c.width = ancho; c.height = alto;
          c.getContext('2d').drawImage(img, 0, 0, ancho, alto);
          listo(c.toDataURL('image/jpeg', 0.6));
        } catch (e) { listo(null); }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { listo(null); URL.revokeObjectURL(url); };
      img.src = url;
    }

    function pintarCapturas() {
      elCaps.textContent = '';
      elCaps.hidden = capturasPendientes.length === 0;
      capturasPendientes.forEach(function (cap, i) {
        var chip = document.createElement('span');
        chip.className = 'np-cap';
        if (cap.mini) {
          var im = document.createElement('img');
          im.src = cap.mini;
          im.alt = '';
          chip.appendChild(im);
        }
        var nb = document.createElement('b');
        nb.textContent = cap.nombre;
        var x = document.createElement('button');
        x.type = 'button';
        x.className = 'np-cap-x';
        x.textContent = '×';
        x.setAttribute('aria-label', 'Quitar ' + cap.nombre + ' de esta nota');
        x.addEventListener('click', function () {
          capturasPendientes.splice(i, 1);
          pintarCapturas();
          elAdd.disabled = !elTexto.value.trim() && capturasPendientes.length === 0;
        });
        chip.appendChild(nb);
        chip.appendChild(x);
        elCaps.appendChild(chip);
      });
    }

    elTexto.addEventListener('paste', function (ev) {
      var items = (ev.clipboardData && ev.clipboardData.items) || [];
      var imagenes = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
          var f = items[i].getAsFile();
          if (f) imagenes.push(f);
        }
      }
      if (!imagenes.length) return;      // texto normal: que pegue como siempre
      ev.preventDefault();
      imagenes.forEach(function (blob) {
        var nombre = nombreDeCaptura();
        guardarCaptura(blob, nombre);
        var cap = { nombre: nombre, mini: null };
        capturasPendientes.push(cap);
        pintarCapturas();
        miniatura(blob, function (mini) { cap.mini = mini; pintarCapturas(); });
      });
      elAdd.disabled = false;
      elPista.textContent = imagenes.length === 1
        ? 'Captura guardada como ' + capturasPendientes[capturasPendientes.length - 1].nombre
        : imagenes.length + ' capturas guardadas';
    });

    function anadir() {
      var t = elTexto.value.trim();
      // Una captura sola ya es una nota: «mira esto» con la imagen al lado.
      if (!t && !capturasPendientes.length) return;
      var s = seccionPorId(seleccion) || GENERAL;
      notas.push({
        id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
        texto: t,
        secId: s.id,
        secEtiqueta: s.etiqueta,
        capturas: capturasPendientes.map(function (c) {
          return { nombre: c.nombre, mini: c.mini };
        }),
        cuando: new Date().toISOString()
      });
      guardar();
      capturasPendientes = [];
      pintarCapturas();
      elPista.textContent = '';
      elTexto.value = '';
      elAdd.disabled = true;
      fijadaAMano = false;
      ajustarAlto();
      pintar();
      elTexto.focus();
    }

    function borrar(id) {
      notas = notas.filter(function (n) { return n.id !== id; });
      guardar();
      pintar();
    }

    /* ── Pintar la lista, agrupada por sección y en el orden del documento ── */
    function grupos() {
      var orden = [], mapa = {};
      function bucket(id, etiqueta) {
        var clave = id || '@general';
        if (!mapa[clave]) { mapa[clave] = { etiqueta: etiqueta, notas: [] }; orden.push(clave); }
        return mapa[clave];
      }
      secciones.forEach(function (s) {
        var hay = notas.some(function (n) { return (n.secId || '') === s.id; });
        if (hay) bucket(s.id, s.etiqueta);
      });
      notas.forEach(function (n) {
        var clave = n.secId || '@general';
        if (!mapa[clave]) bucket(n.secId, n.secEtiqueta || 'Todo el documento');
        mapa[clave].notas.push(n);
      });
      return orden.map(function (k) { return mapa[k]; });
    }

    function pintar() {
      var n = notas.length;
      elCuenta.hidden = elCuentaT.hidden = (n === 0);
      elCuenta.textContent = elCuentaT.textContent = String(n);
      elCopiar.disabled = elVaciar.disabled = (n === 0);
      elCopiar.removeAttribute('data-hecho');
      elCopiar.textContent = 'Copiar para la terminal';

      elLista.textContent = '';
      if (!n) {
        var v = document.createElement('p');
        v.className = 'np-vacio';
        v.textContent = 'Aún no hay notas. Lo que escribas se guarda en este navegador y sigue aquí si recargas la página.';
        elLista.appendChild(v);
        return;
      }
      grupos().forEach(function (g) {
        var caja = document.createElement('div');
        caja.className = 'np-grupo';
        var tit = document.createElement('p');
        tit.className = 'np-grupo-tit';
        tit.textContent = g.etiqueta;
        caja.appendChild(tit);
        g.notas.forEach(function (nota) {
          var fila = document.createElement('div');
          fila.className = 'np-nota';
          var p = document.createElement('p');
          p.textContent = nota.texto;
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'np-borrar';
          b.setAttribute('aria-label', 'Borrar esta nota');
          b.innerHTML = ICONO_X;
          b.addEventListener('click', function () { borrar(nota.id); });
          fila.appendChild(p);
          fila.appendChild(b);
          if (nota.capturas && nota.capturas.length) {
            var tira = document.createElement('div');
            tira.className = 'np-nota-caps';
            nota.capturas.forEach(function (c) {
              if (c.mini) {
                var im = document.createElement('img');
                im.src = c.mini;
                im.alt = c.nombre;
                im.title = c.nombre;
                tira.appendChild(im);
              } else {
                var et = document.createElement('span');
                et.className = 'np-cap';
                et.textContent = c.nombre;
                tira.appendChild(et);
              }
            });
            fila.appendChild(tira);
          }
          caja.appendChild(fila);
        });
        elLista.appendChild(caja);
      });
    }

    /* ── El texto que se pega en la terminal ──────────────────────────────── */
    function componer() {
      var fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      var cab = 'Notas sobre ' + ruta + (titulo ? ' («' + titulo + '»)' : '') + ', ' + fecha + '.';
      var lineas = [cab, 'Van agrupadas por la sección del documento sobre la que escribí cada una.', ''];
      var hayCapturas = false;
      grupos().forEach(function (g) {
        lineas.push('## ' + g.etiqueta);
        g.notas.forEach(function (n) {
          var txt = (n.texto || '').replace(/\n+/g, ' ');
          var caps = (n.capturas || []).map(function (c) { return c.nombre; });
          if (caps.length) {
            hayCapturas = true;
            txt = (txt ? txt + ' ' : '') + '[captura: ' + caps.join(', ') + ']';
          }
          lineas.push('- ' + txt);
        });
        lineas.push('');
      });
      if (hayCapturas) {
        lineas.push('Las capturas nombradas arriba están, con ese mismo nombre, en ' + dondeQuedan() + '.');
      }
      return lineas.join('\n').trim() + '\n';
    }

    function alPortapapeles(txt) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(txt);
      }
      return new Promise(function (ok, mal) {
        try {
          var ta = document.createElement('textarea');
          ta.value = txt;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          var bien = document.execCommand('copy');
          document.body.removeChild(ta);
          bien ? ok() : mal(new Error('sin permiso'));
        } catch (e) { mal(e); }
      });
    }

    var tempo = null;
    elCopiar.addEventListener('click', function () {
      var txt = componer();
      alPortapapeles(txt).then(function () {
        elCopiar.setAttribute('data-hecho', 'si');
        elCopiar.textContent = 'Copiado ✓  pégalo en la terminal';
      })['catch'](function () {
        elCopiar.textContent = 'No se pudo copiar — selecciónalo a mano';
      }).then(function () {
        window.clearTimeout(tempo);
        tempo = window.setTimeout(function () {
          elCopiar.removeAttribute('data-hecho');
          elCopiar.textContent = 'Copiar para la terminal';
        }, 1900);
      });
    });

    /* ── Vaciar, con confirmación propia (nunca confirm() del navegador) ──── */
    function pedirVaciado() {
      elConfTxt.textContent = notas.length === 1
        ? '¿Borrar la nota?'
        : '¿Borrar las ' + notas.length + ' notas?';
      elPieN.hidden = true;
      elPieC.hidden = false;
      elCancelar.focus();
    }
    function cancelarVaciado() {
      elPieC.hidden = true;
      elPieN.hidden = false;
    }
    elVaciar.addEventListener('click', pedirVaciado);
    elCancelar.addEventListener('click', function () { cancelarVaciado(); elVaciar.focus(); });
    elConfirmar.addEventListener('click', function () {
      notas = [];
      guardar();
      cancelarVaciado();
      pintar();
      elTexto.focus();
    });

    /* ── Teclado ──────────────────────────────────────────────────────────── */
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (!elSelLista.hidden) { cerrarSelect(); elSelBtn.focus(); return; }
      if (!elPieC.hidden) { cancelarVaciado(); elVaciar.focus(); return; }
      if (host.dataset.abierto === 'true') cerrar();
    });

    /* ── Arranque ─────────────────────────────────────────────────────────── */
    escanearSecciones();
    pintarSelect();
    pintar();
    alRodar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }
})();
