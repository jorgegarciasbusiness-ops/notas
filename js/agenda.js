/* Sector Agenda: vistas de mes, semana y tablero por ámbito */
const Agenda = (() => {
  // Mismas opciones que el Calendario de Notion, para poder migrar sin pérdidas
  const AMBITOS = ['Trabajo', 'Kok$', 'Amor', 'Salud', 'Finanzas', 'Curros', 'Viajes', 'Personal'];
  const TIPOS = ['Tarea', 'Evento Personal', 'Cita', 'Reunión', 'Recordatorio', 'Music', 'content', 'ALMOALB', 'Meta'];
  const PRIORIDADES = ['Alta', 'Media', 'Baja'];
  const ESTADOS = ['Sin empezar', 'En progreso', 'Listo', 'Cancelado'];

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const PESO = { Alta: 0, Media: 1, Baja: 2 };
  // Avisos: minutos antes del inicio ('' = sin aviso). Por defecto, 1 h antes (decisión de Koke, 2026-10-28)
  const AVISOS = [['', 'Sin aviso'], [0, 'A la hora'], [15, '15 min antes'], [30, '30 min antes'], [60, '1 h antes'], [120, '2 h antes'], [1440, '1 día antes']];
  const AVISO_POR_DEFECTO = 60;

  // ---------- Utilidades de fechas y texto ----------
  const pad = n => String(n).padStart(2, '0');
  const aISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const deISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const hoyISO = () => aISO(new Date());
  const sumarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const lunesDe = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const slug = a => 'amb-' + a.toLowerCase().replace('$', 's');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fechaCorta = iso => { const d = deISO(iso); return `${DIAS_CORTOS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`; };
  const terminada = e => e.estado === 'Listo' || e.estado === 'Cancelado';

  const ordenar = lista => [...lista].sort((a, b) =>
    a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(b.hora || '') || PESO[a.prioridad] - PESO[b.prioridad]);

  // Último día del evento (si no tiene fin, el mismo día)
  const finDe = e => (e.fecha_fin && e.fecha_fin > e.fecha ? e.fecha_fin : e.fecha);

  // Cuándo: "18:00–20:00" el mismo día, o "lun 27 oct 18:00 → jue 30 oct" si dura varios días
  function horario(e) {
    if (finDe(e) !== e.fecha) {
      return `${fechaCorta(e.fecha)}${e.hora ? ' ' + e.hora : ''} → ${fechaCorta(finDe(e))}${e.hora_fin ? ' ' + e.hora_fin : ''}`;
    }
    if (e.hora && e.hora_fin) return `${e.hora}–${e.hora_fin}`;
    return e.hora || (e.hora_fin ? `hasta ${e.hora_fin}` : '');
  }

  // El evento de varios días que tiñe ese día con el color de su ámbito (el primero, si hay varios)
  const deVariosDias = items => items.find(e => finDe(e) !== e.fecha && e.estado !== 'Cancelado');

  // Cada evento sale en todos los días que dura (máximo 2 meses, para no colgar la pantalla)
  function porDia(lista) {
    const mapa = new Map();
    for (const e of ordenar(lista)) {
      let d = deISO(e.fecha);
      const fin = finDe(e);
      for (let i = 0; i < 62 && aISO(d) <= fin; i++, d = sumarDias(d, 1)) {
        const iso = aISO(d);
        if (!mapa.has(iso)) mapa.set(iso, []);
        mapa.get(iso).push(e);
      }
    }
    return mapa;
  }

  function recordar(clave, valor) {
    try {
      if (valor === undefined) return localStorage.getItem('notas.agenda.' + clave);
      localStorage.setItem('notas.agenda.' + clave, valor);
    } catch { return null; }
  }

  // ---------- Estado de la pantalla ----------
  let raiz, dlg, todas = [];
  // ocultarPasadas: no enseña lo de días anteriores a hoy (se recuerda en cada aparato)
  const estado = { vista: recordar('vista') || 'mes', ref: new Date(), dia: hoyISO(), ocultos: new Set(), ocultarPasadas: recordar('pasadas') !== 'ver' };

  // ---------- Piezas de la pantalla ----------
  function tarjeta(e, { conFecha = false } = {}) {
    const hecha = e.estado === 'Listo';
    const atrasada = !terminada(e) && finDe(e) < hoyISO();
    const varios = finDe(e) !== e.fecha;
    const cuando = horario(e);
    const meta = [
      conFecha && !varios ? `<span>${fechaCorta(e.fecha)}</span>` : '',
      cuando ? `<span>${esc(cuando)}</span>` : '',
      e.aviso_min !== '' && e.aviso_min != null && !terminada(e) ? '<span class="t-aviso" title="Con aviso"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg></span>' : '',
      `<span>${esc(e.tipo)}</span>`,
      e.estado === 'En progreso' ? '<span class="etq progreso">En progreso</span>' : '',
      e.estado === 'Cancelado' ? '<span>Cancelado</span>' : '',
      e.prioridad === 'Alta' && !terminada(e) ? '<span class="etq alta">Alta</span>' : '',
      atrasada ? '<span class="etq atrasada">Atrasada</span>' : '',
    ].join('');
    return `<div class="tarjeta ${slug(e.ambito)} ${hecha ? 'hecha' : ''} ${e.estado === 'Cancelado' ? 'cancelada' : ''}">
      <button class="check" data-accion="check" data-id="${e.id}" aria-label="${hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}">${hecha ? '✓' : ''}</button>
      <button class="tarjeta-cuerpo" data-accion="editar" data-id="${e.id}">
        <span class="t-nombre">${esc(e.nombre)}</span>
        <span class="t-meta">${meta}</span>
      </button>
    </div>`;
  }

  function titulo() {
    if (estado.vista === 'mes') return cap(`${MESES[estado.ref.getMonth()]} ${estado.ref.getFullYear()}`);
    if (estado.vista === 'semana') {
      const a = lunesDe(estado.ref), b = sumarDias(a, 6);
      const mesA = MESES[a.getMonth()].slice(0, 3), mesB = MESES[b.getMonth()].slice(0, 3);
      return `${a.getDate()} ${mesA === mesB ? '' : mesA + ' '}– ${b.getDate()} ${mesB} ${b.getFullYear()}`;
    }
    return 'Por ámbito';
  }

  function cabecera() {
    const boton = (v, texto) => `<button class="${estado.vista === v ? 'activo' : ''}" data-accion="vista" data-vista="${v}">${texto}</button>`;
    const nav = estado.vista === 'tablero' ? '' : `<div class="ag-nav">
        <button class="btn" data-accion="ant" aria-label="Anterior">‹</button>
        <button class="btn" data-accion="hoy">Hoy</button>
        <button class="btn" data-accion="sig" aria-label="Siguiente">›</button>
      </div>`;
    return `<header class="ag-cab">
      <h1>${titulo()}</h1>
      ${nav}
      <div class="segmentado">${boton('mes', 'Mes')}${boton('semana', 'Semana')}${boton('tablero', 'Tablero')}</div>
      <button class="btn primario nueva" data-accion="nueva" aria-label="Nueva entrada"><b>+</b> <span>Nueva</span></button>
    </header>`;
  }

  function filtros() {
    const pasadas = todas.filter(e => finDe(e) < hoyISO()).length;
    const interruptor = `<button class="chip interruptor ${estado.ocultarPasadas ? 'activo' : ''}" data-accion="pasadas" aria-pressed="${estado.ocultarPasadas}">
        ${estado.ocultarPasadas ? `Pasadas ocultas (${pasadas})` : 'Ocultar pasadas'}</button>`;
    return `<div class="filtros">${interruptor}${AMBITOS.map(a => `<button class="chip ${slug(a)} ${estado.ocultos.has(a) ? 'apagado' : ''}" data-accion="filtro" data-ambito="${esc(a)}"><i></i>${esc(a)}</button>`).join('')}</div>`;
  }

  function panelDia(iso, items) {
    const d = deISO(iso);
    const nombre = cap(`${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`);
    return `<section class="panel">
      <h2>${nombre}</h2>
      <div class="lista">${items.length ? items.map(e => tarjeta(e)).join('') : '<p class="vacio">Nada este día.</p>'}</div>
      <button class="anadir" data-accion="nueva" data-fecha="${iso}">+ Añadir este día</button>
    </section>`;
  }

  function vistaMes(lista) {
    const y = estado.ref.getFullYear(), m = estado.ref.getMonth();
    const inicio = lunesDe(new Date(y, m, 1));
    const fin = sumarDias(lunesDe(new Date(y, m + 1, 0)), 6);
    const dias = porDia(lista), hoy = hoyISO();
    let celdas = '';
    for (let d = inicio; d <= fin; d = sumarDias(d, 1)) {
      const iso = aISO(d), items = dias.get(iso) || [];
      const largo = deVariosDias(items);
      const clases = ['dia', d.getMonth() !== m && 'fuera', iso === hoy && 'hoy', iso === estado.dia && 'sel', largo && `dia-evento ${slug(largo.ambito)}`].filter(Boolean).join(' ');
      const pildoras = items.slice(0, 3).map(e => `<span class="pildora ${slug(e.ambito)} ${terminada(e) ? 'hecha' : ''}">${esc(e.nombre)}</span>`).join('');
      const mas = items.length > 3 ? `<span class="mas">+${items.length - 3} más</span>` : '';
      celdas += `<button class="${clases}" data-accion="dia" data-fecha="${iso}"><span class="num">${d.getDate()}</span><span class="pildoras">${pildoras}${mas}</span></button>`;
    }
    return `<div class="mes-layout">
      <div class="mes">
        <div class="mes-cab">${DIAS_CORTOS.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="mes-grid">${celdas}</div>
      </div>
      ${panelDia(estado.dia, dias.get(estado.dia) || [])}
    </div>`;
  }

  function vistaSemana(lista) {
    const lunes = lunesDe(estado.ref), dias = porDia(lista), hoy = hoyISO();
    let html = '';
    for (let i = 0; i < 7; i++) {
      const d = sumarDias(lunes, i), iso = aISO(d), items = dias.get(iso) || [];
      const largo = deVariosDias(items);
      html += `<section class="sem-dia ${iso === hoy ? 'hoy' : ''} ${largo ? `dia-evento ${slug(largo.ambito)}` : ''}">
        <header><span>${DIAS_CORTOS[i]}</span><b>${d.getDate()}</b></header>
        ${items.map(e => tarjeta(e)).join('')}
        <button class="anadir" data-accion="nueva" data-fecha="${iso}">+ Añadir</button>
      </section>`;
    }
    return `<div class="semana">${html}</div>`;
  }

  function vistaTablero(lista) {
    const columnas = AMBITOS.filter(a => !estado.ocultos.has(a)).map(a => {
      const items = ordenar(lista.filter(e => e.ambito === a && !terminada(e)));
      return `<section class="columna ${slug(a)}">
        <h3><i></i>${esc(a)} <span class="cuenta">${items.length}</span></h3>
        <div class="lista">${items.length ? items.map(e => tarjeta(e, { conFecha: true })).join('') : '<p class="vacio">Nada pendiente.</p>'}</div>
        <button class="anadir" data-accion="nueva" data-ambito="${esc(a)}">+ Añadir</button>
      </section>`;
    });
    return `<div class="tablero">${columnas.join('')}</div>`;
  }

  async function render() {
    try {
      todas = await Datos.agenda.listar();
    } catch {
      avisar('No se ha podido cargar la agenda. Revisa la conexión.');
    }
    const hoy = hoyISO();
    const visibles = todas.filter(e => !estado.ocultos.has(e.ambito) && !(estado.ocultarPasadas && finDe(e) < hoy));
    const cuerpo = { mes: vistaMes, semana: vistaSemana, tablero: vistaTablero }[estado.vista] || vistaMes;
    raiz.innerHTML = cabecera() + filtros() + cuerpo(visibles);
  }

  // ---------- Formulario de crear / editar ----------
  function abrirFormulario(e) {
    const nueva = !e.id;
    const opciones = (lista, actual) => lista.map(v => `<option${v === actual ? ' selected' : ''}>${esc(v)}</option>`).join('');
    const ambito = e.ambito || 'Personal';
    const aviso = nueva ? AVISO_POR_DEFECTO : (e.aviso_min ?? '');
    dlg.innerHTML = `<form class="formulario">
      <h2>${nueva ? 'Nueva entrada' : 'Editar entrada'}</h2>
      <label>Nombre<input name="nombre" required autocomplete="off"></label>
      <div class="fila">
        <label>Empieza<input type="date" name="fecha" required></label>
        <label>Hora <small>(opcional)</small><input type="time" name="hora"></label>
      </div>
      <div class="fila">
        <label>Termina <small>(opcional)</small><input type="date" name="fecha_fin"></label>
        <label>Hora de fin <small>(opcional)</small><input type="time" name="hora_fin"></label>
      </div>
      <fieldset><legend>Ámbito</legend>
        <div class="chips-sel">${AMBITOS.map(a => `<label class="chip ${slug(a)}"><input type="radio" name="ambito" value="${esc(a)}"${a === ambito ? ' checked' : ''}><i></i>${esc(a)}</label>`).join('')}</div>
      </fieldset>
      <div class="fila">
        <label>Tipo<select name="tipo">${opciones(TIPOS, e.tipo || 'Tarea')}</select></label>
        <label>Prioridad<select name="prioridad">${opciones(PRIORIDADES, e.prioridad || 'Media')}</select></label>
      </div>
      <div class="fila">
        <label>Estado<select name="estado">${opciones(ESTADOS, e.estado || 'Sin empezar')}</select></label>
        <label>Avísame<select name="aviso_min">${AVISOS.map(([v, t]) => `<option value="${v}"${String(v) === String(aviso) ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      </div>
      <p class="ayuda">Si no tiene hora, el aviso cuenta desde las 9:00 de ese día.</p>
      <label>Notas<textarea name="notas" rows="3"></textarea></label>
      <div class="acciones">
        ${nueva ? '' : '<button type="button" class="btn peligro" data-f="borrar">Borrar</button>'}
        <span class="hueco"></span>
        <button type="button" class="btn" data-f="cancelar">Cancelar</button>
        <button type="submit" class="btn primario">Guardar</button>
      </div>
    </form>`;

    const f = dlg.querySelector('form');
    f.elements.nombre.value = e.nombre || '';
    f.elements.fecha.value = e.fecha || hoyISO();
    f.elements.hora.value = e.hora || '';
    f.elements.fecha_fin.value = e.fecha_fin || '';
    f.elements.hora_fin.value = e.hora_fin || '';
    f.elements.notas.value = e.notas || '';
    // El fin no puede ser antes del inicio
    const ajustarMin = () => { f.elements.fecha_fin.min = f.elements.fecha.value; };
    f.elements.fecha.addEventListener('change', ajustarMin);
    ajustarMin();

    f.onsubmit = async ev => {
      ev.preventDefault();
      const datos = Object.fromEntries(new FormData(f));
      datos.nombre = datos.nombre.trim();
      // Si cambia cuándo es o el aviso, el aviso vuelve a quedar pendiente
      if (nueva || datos.fecha !== e.fecha || datos.hora !== (e.hora || '') || String(datos.aviso_min) !== String(e.aviso_min ?? '')) {
        datos.avisado_en = null;
      }
      if (!datos.nombre) return;
      // Un fin el mismo día que el inicio es un evento de un solo día
      if (datos.fecha_fin && datos.fecha_fin <= datos.fecha) datos.fecha_fin = '';
      if (!datos.fecha_fin && datos.hora && datos.hora_fin && datos.hora_fin < datos.hora) {
        return avisar('La hora de fin es antes de la de inicio. Si acaba otro día, pon la fecha en "Termina".');
      }
      try {
        if (nueva) await Datos.agenda.crear(datos);
        else await Datos.agenda.actualizar(e.id, datos);
      } catch {
        return avisar('No se ha podido guardar. Revisa la conexión y vuelve a probar.');
      }
      estado.dia = datos.fecha;
      dlg.close();
      render();
    };
    f.querySelector('[data-f=cancelar]').onclick = () => dlg.close();
    const borrar = f.querySelector('[data-f=borrar]');
    if (borrar) borrar.onclick = async () => {
      if (!confirm(`¿Borrar «${e.nombre}»?`)) return;
      try {
        await Datos.agenda.borrar(e.id);
      } catch {
        return avisar('No se ha podido borrar. Revisa la conexión.');
      }
      dlg.close();
      render();
    };

    dlg.showModal();
    if (nueva) f.elements.nombre.focus();
  }

  // ---------- Qué pasa al pulsar ----------
  function mover(paso) {
    const r = estado.ref;
    estado.ref = estado.vista === 'mes' ? new Date(r.getFullYear(), r.getMonth() + paso, 1) : sumarDias(r, 7 * paso);
  }

  async function alPulsar(ev) {
    const b = ev.target.closest('[data-accion]');
    if (!b || !raiz.contains(b)) return;
    const { accion, id, fecha, vista, ambito } = b.dataset;
    switch (accion) {
      case 'vista': estado.vista = vista; recordar('vista', vista); break;
      case 'ant': mover(-1); break;
      case 'sig': mover(1); break;
      case 'hoy': estado.ref = new Date(); estado.dia = hoyISO(); break;
      case 'dia':
        estado.dia = fecha;
        if (deISO(fecha).getMonth() !== estado.ref.getMonth()) estado.ref = deISO(fecha);
        break;
      case 'filtro':
        if (estado.ocultos.has(ambito)) estado.ocultos.delete(ambito); else estado.ocultos.add(ambito);
        break;
      case 'pasadas':
        estado.ocultarPasadas = !estado.ocultarPasadas;
        recordar('pasadas', estado.ocultarPasadas ? 'ocultar' : 'ver');
        break;
      case 'check': {
        const e = todas.find(x => x.id === id);
        try {
          await Datos.agenda.actualizar(id, { estado: e.estado === 'Listo' ? 'Sin empezar' : 'Listo' });
        } catch {
          return avisar('No se ha podido guardar. Revisa la conexión.');
        }
        break;
      }
      case 'editar': return abrirFormulario(todas.find(x => x.id === id));
      case 'nueva': return abrirFormulario({ fecha: fecha || (estado.vista === 'mes' ? estado.dia : hoyISO()), ambito });
      default: return;
    }
    render();
  }

  function montar(contenedor) {
    raiz = contenedor;
    dlg = document.getElementById('dialogo');
    raiz.onclick = alPulsar;
    dlg.onclick = ev => { if (ev.target === dlg) dlg.close(); };
    render();
  }

  // Vuelve a leer los datos (al volver a la app, por si cambiaste algo en otro aparato)
  function refrescar() { if (raiz && !dlg.open) render(); }

  return { montar, refrescar };
})();
