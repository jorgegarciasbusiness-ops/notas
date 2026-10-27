/* Sector Kok$: calendario de contenido (tablero por estado y lista por fechas) y acceso a sus páginas */
const Koks = (() => {
  const ESTADOS = ['Idea', 'Por grabar', 'Grabado', 'Editado', 'Programado', 'Publicado'];
  const REDES = ['TikTok', 'Instagram', 'YouTube'];
  const FORMATOS = ['Nota del iPhone a canción', 'Gancho en 10 sitios', 'Detrás de cámaras', 'Fragmento nuevo', 'Otro'];
  const TEMAS = ['la maceta', 'lohagopormi', 'BLAZIKEN', 'deja de hacerte el rapero', 'O-KEY', 'enxoxao con el juego', 'SUPER$TAR 2', 'wife', 'zarpar', 'Tema nuevo'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const pad = n => String(n).padStart(2, '0');
  const aISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const deISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const hoyISO = () => aISO(new Date());
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fechaCorta = iso => { if (!iso) return 'Sin fecha'; const d = deISO(iso); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
  const miles = n => new Intl.NumberFormat('es-ES').format(n);
  const retrasada = p => p.fecha && p.fecha < hoyISO() && p.estado !== 'Publicado';
  const ordenar = l => [...l].sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));

  let raiz, dlg, todas = [], piezas = [], paginas = [];
  let vista = 'tablero';
  // Ocultar las piezas de días anteriores a hoy (se recuerda en cada aparato; por defecto, ocultas)
  let ocultarPasadas = true;
  try { ocultarPasadas = localStorage.getItem('notas.koks.pasadas') !== 'ver'; } catch { /* sin memoria */ }

  // ---------- Piezas de la pantalla ----------
  function tarjeta(p, { siguiente = false } = {}) {
    const etiquetas = [
      p.redes.length ? `<span>${p.redes.map(esc).join(' · ')}</span>` : '',
      p.formato && p.formato !== 'Otro' ? `<span>${esc(p.formato)}</span>` : '',
      p.vistas !== '' && p.vistas != null ? `<span class="etq progreso">${miles(p.vistas)} vistas</span>` : '',
      retrasada(p) ? '<span class="etq atrasada">Retrasada</span>' : '',
    ].join('');
    const i = ESTADOS.indexOf(p.estado);
    const avanzar = siguiente && i >= 0 && i < ESTADOS.length - 1
      ? `<button class="kk-avanzar" data-accion="avanzar" data-id="${p.id}" title="Pasar a «${ESTADOS[i + 1]}»" aria-label="Pasar a ${ESTADOS[i + 1]}">›</button>` : '';
    return `<div class="tarjeta amb-koks kk-tarjeta">
      <button class="tarjeta-cuerpo" data-accion="editar" data-id="${p.id}">
        <span class="t-nombre">${esc(p.pieza)}</span>
        <span class="t-meta"><span>${fechaCorta(p.fecha)}</span>${etiquetas}</span>
      </button>
      ${avanzar}
    </div>`;
  }

  function vistaTablero() {
    const columnas = ESTADOS.map(e => {
      const lista = ordenar(piezas.filter(p => p.estado === e));
      // En "Publicado", solo las 10 últimas para no hacer la columna eterna
      const mostrar = e === 'Publicado' ? lista.slice(-10).reverse() : lista;
      return `<section class="columna amb-koks">
        <h3>${esc(e)} <span class="cuenta">${lista.length}</span></h3>
        <div class="lista">${mostrar.length ? mostrar.map(p => tarjeta(p, { siguiente: true })).join('') : '<p class="vacio">Nada.</p>'}</div>
      </section>`;
    });
    return `<div class="tablero">${columnas.join('')}</div>`;
  }

  function vistaLista() {
    const proximas = ordenar(piezas.filter(p => p.estado !== 'Publicado' && !retrasada(p)));
    const tarde = ordenar(piezas.filter(retrasada));
    const publicadas = ordenar(piezas.filter(p => p.estado === 'Publicado')).reverse();
    const bloque = (titulo, lista, vacio) => `<section class="panel kk-bloque">
        <h2>${titulo} <small>${lista.length}</small></h2>
        <div class="lista">${lista.length ? lista.map(p => tarjeta(p)).join('') : `<p class="vacio">${vacio}</p>`}</div>
      </section>`;
    return `<div class="kk-lista">
        ${bloque('Próximas', proximas, 'Nada programado.')}
        ${tarde.length ? bloque('Retrasadas', tarde, '') : ''}
        ${bloque('Publicadas', publicadas, 'Aún no hay nada publicado.')}
      </div>`;
  }

  function vistaPaginas() {
    const mias = paginas.filter(p => p.seccion === 'Kok$');
    return `<section class="panel kk-paginas">
        <div class="lista">${mias.map(p => `<button class="fin-fila" data-accion="pagina" data-id="${p.id}">
            <span class="fin-fila-txt"><b>${esc(p.titulo)}</b></span><span aria-hidden="true">›</span>
          </button>`).join('') || '<p class="vacio">No hay páginas de Kok$.</p>'}</div>
        <p class="ayuda">Se editan en Páginas (sección Kok$). Ahí puedes crear una nueva, por ejemplo una por lanzamiento.</p>
      </section>`;
  }

  async function render() {
    try {
      [todas, paginas] = await Promise.all([Datos.contenido.listar(), Datos.paginas.listar()]);
    } catch {
      avisar('No se ha podido cargar Kok$. Revisa la conexión.');
    }
    const hoy = hoyISO();
    const pasadas = todas.filter(p => p.fecha && p.fecha < hoy).length;
    piezas = ocultarPasadas ? todas.filter(p => !p.fecha || p.fecha >= hoy) : todas;
    const boton = (v, t) => `<button class="${vista === v ? 'activo' : ''}" data-accion="vista" data-vista="${v}">${t}</button>`;
    const cuerpo = { tablero: vistaTablero, lista: vistaLista, paginas: vistaPaginas }[vista]();
    const filtro = vista === 'paginas' ? '' : `<div class="filtros">
        <button class="chip interruptor ${ocultarPasadas ? 'activo' : ''}" data-accion="pasadas" aria-pressed="${ocultarPasadas}">${ocultarPasadas ? `Pasadas ocultas (${pasadas})` : 'Ocultar pasadas'}</button>
      </div>`;
    raiz.innerHTML = `<header class="ag-cab"><h1>Kok$</h1>
        <div class="segmentado">${boton('tablero', 'Tablero')}${boton('lista', 'Lista')}${boton('paginas', 'Páginas')}</div>
        <button class="btn primario nueva" data-accion="nueva" aria-label="Nueva pieza"><b>+</b> <span>Pieza</span></button>
      </header>${filtro}${cuerpo}`;
  }

  // ---------- Formulario ----------
  function abrir(p = {}) {
    const nueva = !p.id;
    const opciones = (lista, actual) => lista.map(v => `<option${v === actual ? ' selected' : ''}>${esc(v)}</option>`).join('');
    const redes = p.redes || ['TikTok'];
    dlg.innerHTML = `<form class="formulario">
      <h2>${nueva ? 'Nueva pieza' : 'Editar pieza'}</h2>
      <label>Pieza<input name="pieza" required autocomplete="off" placeholder="Ej.: Gancho en 10 sitios #6"></label>
      <div class="fila">
        <label>Fecha<input type="date" name="fecha"></label>
        <label>Estado<select name="estado">${opciones(ESTADOS, p.estado || 'Idea')}</select></label>
      </div>
      <fieldset><legend>Redes</legend>
        <div class="chips-sel">${REDES.map(r => `<label class="chip amb-koks"><input type="checkbox" name="redes" value="${r}"${redes.includes(r) ? ' checked' : ''}><i></i>${r}</label>`).join('')}</div>
      </fieldset>
      <div class="fila">
        <label>Formato<input name="formato" list="kk-formatos" autocomplete="off"></label>
        <label>Tema<input name="tema" list="kk-temas" autocomplete="off"></label>
      </div>
      <datalist id="kk-formatos">${FORMATOS.map(f => `<option value="${esc(f)}">`).join('')}</datalist>
      <datalist id="kk-temas">${TEMAS.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
      <div class="fila">
        <label>Vistas<input name="vistas" type="number" inputmode="numeric" min="0" step="1"></label>
        <label>Enlace<input name="enlace" type="url" inputmode="url" autocomplete="off" placeholder="https://…"></label>
      </div>
      <label>Notas<textarea name="notas" rows="3"></textarea></label>
      <div class="acciones">
        ${nueva ? '' : '<button type="button" class="btn peligro" data-f="borrar">Borrar</button>'}
        <span class="hueco"></span>
        <button type="button" class="btn" data-f="cancelar">Cancelar</button>
        <button type="submit" class="btn primario">Guardar</button>
      </div>
    </form>`;
    const f = dlg.querySelector('form'), e = f.elements;
    e.pieza.value = p.pieza || '';
    e.fecha.value = p.fecha || '';
    e.formato.value = p.formato || '';
    e.tema.value = p.tema || '';
    e.vistas.value = p.vistas ?? '';
    e.enlace.value = p.enlace || '';
    e.notas.value = p.notas || '';

    f.onsubmit = async ev => {
      ev.preventDefault();
      const datos = {
        pieza: e.pieza.value.trim(),
        fecha: e.fecha.value,
        estado: e.estado.value,
        redes: [...f.querySelectorAll('input[name=redes]:checked')].map(x => x.value),
        formato: e.formato.value.trim() || 'Otro',
        tema: e.tema.value.trim(),
        vistas: e.vistas.value,
        enlace: e.enlace.value.trim(),
        notas: e.notas.value,
      };
      if (!datos.pieza) return;
      try {
        if (nueva) await Datos.contenido.crear(datos);
        else await Datos.contenido.actualizar(p.id, datos);
      } catch {
        return avisar('No se ha podido guardar. Revisa la conexión y vuelve a probar.');
      }
      dlg.close();
      render();
    };
    f.querySelector('[data-f=cancelar]').onclick = () => dlg.close();
    const borrar = f.querySelector('[data-f=borrar]');
    if (borrar) borrar.onclick = async () => {
      if (!confirm(`¿Borrar «${p.pieza}»?`)) return;
      try {
        await Datos.contenido.borrar(p.id);
      } catch {
        return avisar('No se ha podido borrar. Revisa la conexión.');
      }
      dlg.close();
      render();
    };
    dlg.onclick = ev => { if (ev.target === dlg) dlg.close(); };
    dlg.showModal();
    if (nueva) e.pieza.focus();
  }

  // ---------- Qué pasa al pulsar ----------
  async function alPulsar(ev) {
    const b = ev.target.closest('[data-accion]');
    if (!b || !raiz.contains(b)) return;
    const { accion, id } = b.dataset;
    switch (accion) {
      case 'vista': vista = b.dataset.vista; break;
      case 'pasadas':
        ocultarPasadas = !ocultarPasadas;
        try { localStorage.setItem('notas.koks.pasadas', ocultarPasadas ? 'ocultar' : 'ver'); } catch { /* sin memoria */ }
        break;
      case 'nueva': return abrir();
      case 'editar': return abrir(piezas.find(p => p.id === id));
      case 'avanzar': {
        const p = piezas.find(x => x.id === id);
        const siguiente = ESTADOS[ESTADOS.indexOf(p.estado) + 1];
        if (!siguiente) return;
        try {
          await Datos.contenido.actualizar(id, { estado: siguiente });
        } catch {
          return avisar('No se ha podido guardar. Revisa la conexión.');
        }
        if (siguiente === 'Publicado') avisar('¡Publicada! Cuando tengas las vistas, apúntalas en la pieza.');
        break;
      }
      case 'pagina': Paginas.elegir(id); document.querySelector('.sector[data-sector="paginas"]').click(); return;
      default: return;
    }
    render();
  }

  function montar(contenedor) {
    raiz = contenedor;
    dlg = document.getElementById('dialogo');
    raiz.onclick = alPulsar;
    render();
  }

  function refrescar() { if (raiz && !dlg.open) render(); }

  return { montar, refrescar };
})();
