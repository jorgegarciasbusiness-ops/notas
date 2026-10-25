/* Sector Páginas: documentos con títulos, listas, casillas y tablas, agrupados por sección */
const Paginas = (() => {
  // Secciones que salen primero y como sugerencia al escribir; se puede usar cualquier otra
  const SECCIONES = ['Finanzas', 'Kok$', 'Trabajo', 'Amor', 'Salud', 'Personal', 'General'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const movil = matchMedia('(max-width: 760px)');

  let raiz, paginas = [];
  const estado = { actual: null, editando: false, nueva: false };

  // ---------- Texto con formato ----------
  function aHTML(texto) {
    if (window.marked && window.DOMPurify) return DOMPurify.sanitize(marked.parse(texto || '', { gfm: true, breaks: true }));
    return `<p>${esc(texto).replace(/\n/g, '<br>')}</p>`;
  }

  // Marca o desmarca la casilla número n del texto ("- [ ]" ↔ "- [x]")
  function alternarCasilla(texto, n) {
    let i = -1;
    return texto.replace(/^(\s*(?:[-*+]|\d+\.)\s+\[)([ xX])(\])/gm, (m, a, x, b) => (++i === n ? a + (x === ' ' ? 'x' : ' ') + b : m));
  }

  function editada(iso) {
    const d = new Date(iso);
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ---------- Piezas de la pantalla ----------
  function grupos() {
    const mapa = new Map();
    for (const p of paginas) {
      const s = p.seccion || 'General';
      if (!mapa.has(s)) mapa.set(s, []);
      mapa.get(s).push(p);
    }
    const peso = s => (SECCIONES.includes(s) ? SECCIONES.indexOf(s) : SECCIONES.length);
    return [...mapa.entries()].sort(([a], [b]) => peso(a) - peso(b) || a.localeCompare(b));
  }

  function lista() {
    const html = grupos().map(([seccion, ps]) => `<div class="pag-grupo">
        <h3>${esc(seccion)}</h3>
        ${ps.map(p => `<button class="pag-enlace ${p.id === estado.actual ? 'activa' : ''}" data-accion="abrir" data-id="${p.id}">${esc(p.titulo)}</button>`).join('')}
      </div>`).join('');
    return `<header class="ag-cab"><h1>Páginas</h1>
        <button class="btn primario nueva" data-accion="nueva" aria-label="Nueva página"><b>+</b> <span>Nueva</span></button>
      </header>
      ${html || '<p class="vacio">Aún no hay páginas.</p>'}`;
  }

  function vista(p) {
    return `<div class="pag-cab">
        <button class="btn volver" data-accion="volver">‹ Páginas</button>
        <span class="pag-seccion">${esc(p.seccion)}</span>
        <span class="hueco"></span>
        <button class="btn" data-accion="editar">Editar</button>
      </div>
      <h1 class="pag-titulo">${esc(p.titulo)}</h1>
      <article class="md">${aHTML(p.contenido)}</article>
      <p class="pag-fecha">Editada el ${editada(p.actualizado)}</p>`;
  }

  function editor() {
    return `<form class="pag-editor">
        <div class="pag-cab">
          <button type="button" class="btn" data-accion="cancelar">Cancelar</button>
          <span class="hueco"></span>
          ${estado.nueva ? '' : '<button type="button" class="btn peligro" data-accion="borrar">Borrar</button>'}
          <button type="submit" class="btn primario">Guardar</button>
        </div>
        <input name="titulo" class="pag-titulo-campo" placeholder="Título" required autocomplete="off">
        <label class="pag-seccion-campo">Sección
          <input name="seccion" list="lista-secciones" placeholder="General" autocomplete="off">
        </label>
        <datalist id="lista-secciones">${[...new Set([...SECCIONES, ...paginas.map(p => p.seccion)])].map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        <div class="herramientas" role="toolbar" aria-label="Formato">
          <button type="button" data-formato="h2">Título</button>
          <button type="button" data-formato="negrita"><b>N</b></button>
          <button type="button" data-formato="lista">• Lista</button>
          <button type="button" data-formato="casilla">☐ Casilla</button>
          <button type="button" data-formato="tabla">Tabla</button>
        </div>
        <textarea name="contenido" placeholder="Escribe aquí…"></textarea>
        <p class="ayuda">Los botones de arriba ponen el formato. También puedes escribirlo: <code>##</code> título, <code>-</code> lista, <code>- [ ]</code> casilla, <code>**texto**</code> negrita.</p>
      </form>`;
  }

  async function render() {
    try {
      paginas = await Datos.paginas.listar();
    } catch {
      avisar('No se han podido cargar las páginas. Revisa la conexión.');
    }
    if (estado.actual && !paginas.some(p => p.id === estado.actual)) estado.actual = null;
    // En el PC se abre la primera página; en el móvil se empieza por la lista
    if (!estado.actual && !estado.editando && !movil.matches) estado.actual = grupos()[0]?.[1][0]?.id || null;
    const sel = paginas.find(p => p.id === estado.actual);
    const derecha = estado.editando ? editor() : sel ? vista(sel) : '<p class="vacio">Elige una página o crea una nueva.</p>';
    raiz.innerHTML = `<div class="pag-layout ${estado.editando || (sel && movil.matches) ? 'con-pagina' : ''}">
        <aside class="pag-lista">${lista()}</aside>
        <section class="pag-vista">${derecha}</section>
      </div>`;

    if (estado.editando) {
      const f = raiz.querySelector('.pag-editor');
      const p = estado.nueva ? {} : sel;
      f.elements.titulo.value = p.titulo || '';
      f.elements.seccion.value = p.seccion || '';
      f.elements.contenido.value = p.contenido || '';
      if (estado.nueva) f.elements.titulo.focus();
    } else {
      raiz.querySelectorAll('.md input[type=checkbox]').forEach((c, i) => { c.disabled = false; c.dataset.casilla = i; });
    }
  }

  // ---------- Botones de formato del editor ----------
  function insertar(area, tipo) {
    const { selectionStart: a, selectionEnd: b, value: v } = area;
    const sel = v.slice(a, b);
    const inicioLinea = v.lastIndexOf('\n', a - 1) + 1;
    let nuevo, desde, hasta;
    if (tipo === 'negrita') {
      const t = sel || 'texto';
      nuevo = `${v.slice(0, a)}**${t}**${v.slice(b)}`;
      desde = a + 2; hasta = desde + t.length;
    } else if (tipo === 'tabla') {
      // Se mete al final de la línea donde estás, sin borrar nada de lo escrito
      let fin = v.indexOf('\n', b);
      if (fin === -1) fin = v.length;
      const t = `${fin ? '\n' : ''}\n| Columna | Columna |\n| --- | --- |\n|  |  |\n`;
      nuevo = v.slice(0, fin) + t + v.slice(fin);
      desde = hasta = fin + t.length;
    } else {
      const prefijo = { h2: '## ', lista: '- ', casilla: '- [ ] ' }[tipo];
      nuevo = v.slice(0, inicioLinea) + prefijo + v.slice(inicioLinea);
      desde = a + prefijo.length; hasta = b + prefijo.length;
    }
    area.value = nuevo;
    area.focus();
    area.setSelectionRange(desde, hasta);
  }

  // ---------- Qué pasa al pulsar ----------
  async function guardar(cambios, id = estado.actual) {
    try {
      return await (id ? Datos.paginas.actualizar(id, cambios) : Datos.paginas.crear(cambios));
    } catch {
      avisar('No se ha podido guardar. Revisa la conexión y vuelve a probar.');
      return null;
    }
  }

  async function alPulsar(ev) {
    const formato = ev.target.closest('[data-formato]');
    if (formato) return insertar(raiz.querySelector('.pag-editor textarea'), formato.dataset.formato);

    const casilla = ev.target.closest('input[data-casilla]');
    if (casilla) {
      const p = paginas.find(x => x.id === estado.actual);
      if (p && await guardar({ contenido: alternarCasilla(p.contenido, Number(casilla.dataset.casilla)) })) render();
      return;
    }

    const b = ev.target.closest('[data-accion]');
    if (!b) return;
    switch (b.dataset.accion) {
      case 'abrir': Object.assign(estado, { actual: b.dataset.id, editando: false, nueva: false }); break;
      case 'volver': estado.actual = null; break;
      case 'nueva': Object.assign(estado, { editando: true, nueva: true }); break;
      case 'editar': Object.assign(estado, { editando: true, nueva: false }); break;
      case 'cancelar': Object.assign(estado, { editando: false, nueva: false }); break;
      case 'borrar': {
        const p = paginas.find(x => x.id === estado.actual);
        if (!p || !confirm(`¿Borrar la página «${p.titulo}»?`)) return;
        try {
          await Datos.paginas.borrar(p.id);
        } catch {
          return avisar('No se ha podido borrar. Revisa la conexión.');
        }
        Object.assign(estado, { actual: null, editando: false, nueva: false });
        break;
      }
      default: return;
    }
    render();
  }

  async function alEnviar(ev) {
    ev.preventDefault();
    const f = ev.target;
    const datos = {
      titulo: f.elements.titulo.value.trim(),
      seccion: f.elements.seccion.value.trim() || 'General',
      contenido: f.elements.contenido.value,
    };
    if (!datos.titulo) return;
    const hecha = await guardar(datos, estado.nueva ? null : estado.actual);
    if (!hecha) return;
    Object.assign(estado, { actual: hecha.id, editando: false, nueva: false });
    render();
  }

  function montar(contenedor) {
    raiz = contenedor;
    raiz.onclick = alPulsar;
    raiz.onsubmit = alEnviar;
    // Que los botones de formato no quiten el cursor del texto
    raiz.onmousedown = ev => { if (ev.target.closest('[data-formato]')) ev.preventDefault(); };
    render();
  }

  // No recarga mientras editas, para no perder lo escrito
  function refrescar() { if (raiz && !estado.editando) render(); }

  // Para abrir una página concreta desde otro sector (p. ej., el plan desde Finanzas)
  function elegir(id) { Object.assign(estado, { actual: id, editando: false, nueva: false }); }

  return { montar, refrescar, elegir, aHTML };
})();
