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
  const REPITE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a7 7 0 0 1 12-4.9L19 9M19 4v5h-5M20 13a7 7 0 0 1-12 4.9L5 15M5 20v-5h5"/></svg>';

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

  // Lo que tiñe el día con el color de su ámbito: rutinas y eventos de varios días.
  // Si coinciden varios, gana el que se creó antes.
  const creadoDe = e => (e.rutina ? e.rutina.creado : e.creado) || '';
  const deVariosDias = items => items
    .filter(e => e.rutina || (finDe(e) !== e.fecha && e.estado !== 'Cancelado'))
    .sort((a, b) => creadoDe(a).localeCompare(creadoDe(b)))[0];

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
  let raiz, dlg, todas = [], rutinas = [];

  // Las rutinas no se guardan día a día: se dibujan en cada día que toca dentro de lo que se ve
  function deRutinas(desde, hasta) {
    const salida = [];
    for (const r of rutinas) {
      for (let d = deISO(desde); aISO(d) <= hasta; d = sumarDias(d, 1)) {
        const iso = aISO(d);
        const diaSemana = (d.getDay() + 6) % 7 + 1;  // 1 = lunes … 7 = domingo
        if (!(r.dias || []).map(Number).includes(diaSemana) || iso < r.desde || (r.hasta && iso > r.hasta) || (r.excepciones || []).includes(iso)) continue;
        salida.push({
          id: `r:${r.id}:${iso}`, rutina: r, nombre: r.nombre, fecha: iso, fecha_fin: '', hora: r.hora, hora_fin: r.hora_fin,
          ambito: r.ambito, tipo: r.tipo, prioridad: 'Media', estado: 'Sin empezar', notas: r.notas, aviso_min: '',
        });
      }
    }
    return salida;
  }

  // Días que se ven en pantalla (el tablero no enseña rutinas: llenarían las columnas)
  function rangoVisible() {
    if (estado.vista === 'mes') {
      const y = estado.ref.getFullYear(), m = estado.ref.getMonth();
      return [aISO(lunesDe(new Date(y, m, 1))), aISO(sumarDias(lunesDe(new Date(y, m + 1, 0)), 6))];
    }
    if (estado.vista === 'semana') {
      const l = lunesDe(estado.ref);
      return [aISO(l), aISO(sumarDias(l, 6))];
    }
    return null;
  }
  // ocultarPasadas: no enseña lo de días anteriores a hoy (se recuerda en cada aparato)
  const estado = { vista: recordar('vista') || 'mes', ref: new Date(), dia: hoyISO(), ocultos: new Set(), ocultarPasadas: recordar('pasadas') !== 'ver' };

  // ---------- Piezas de la pantalla ----------
  function tarjeta(e, { conFecha = false } = {}) {
    const hecha = e.estado === 'Listo';
    const atrasada = !e.rutina && !terminada(e) && finDe(e) < hoyISO();
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
    // Las rutinas no se arrastran: se repiten solas
    return `<div class="tarjeta ${slug(e.ambito)} ${hecha ? 'hecha' : ''} ${e.estado === 'Cancelado' ? 'cancelada' : ''}"${e.rutina ? '' : ` data-arrastre="${e.id}"`}>
      ${e.rutina
        ? `<span class="check rutina-icono" title="Se repite cada semana">${REPITE}</span>`
        : `<button class="check" data-accion="check" data-id="${e.id}" aria-label="${hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}">${hecha ? '✓' : ''}</button>`}
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
      // Las rutinas no llevan punto ni etiqueta en el mes: solo tiñen el día
      const puntuales = items.filter(e => !e.rutina);
      const pildoras = puntuales.slice(0, 3).map(e => `<span class="pildora ${slug(e.ambito)} ${terminada(e) ? 'hecha' : ''}" data-arrastre="${e.id}">${esc(e.nombre)}</span>`).join('');
      const mas = puntuales.length > 3 ? `<span class="mas">+${puntuales.length - 3} más</span>` : '';
      celdas += `<button class="${clases}" data-accion="dia" data-fecha="${iso}" data-soltar="${iso}"><span class="num">${d.getDate()}</span><span class="pildoras">${pildoras}${mas}</span></button>`;
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
      html += `<section class="sem-dia ${iso === hoy ? 'hoy' : ''} ${largo ? `dia-evento ${slug(largo.ambito)}` : ''}" data-soltar="${iso}">
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
      [todas, rutinas] = await Promise.all([Datos.agenda.listar(), Datos.rutinas.listar()]);
    } catch {
      avisar('No se ha podido cargar la agenda. Revisa la conexión.');
    }
    const hoy = hoyISO();
    const rango = rangoVisible();
    const lista = rango ? todas.concat(deRutinas(...rango)) : todas;
    const visibles = lista.filter(e =>!estado.ocultos.has(e.ambito) && !(estado.ocultarPasadas && finDe(e) < hoy));
    const cuerpo = { mes: vistaMes, semana: vistaSemana, tablero: vistaTablero }[estado.vista] || vistaMes;
    raiz.innerHTML = cabecera() + filtros() + cuerpo(visibles);
  }

  // ---------- Formulario de crear / editar ----------
  // e puede ser una entrada normal, una nueva ({fecha, ambito}) o una rutina ({esRutina: true, …, diaPulsado})
  function abrirFormulario(e) {
    const nueva = !e.id;
    const esRutina = !!e.esRutina;
    const opciones = (lista, actual) => lista.map(v => `<option${v === actual ? ' selected' : ''}>${esc(v)}</option>`).join('');
    const ambito = e.ambito || 'Personal';
    const aviso = nueva ? AVISO_POR_DEFECTO : (e.aviso_min ?? '');
    // Por defecto, una rutina nueva se repite el mismo día de la semana que la fecha elegida
    const dias = esRutina ? e.dias.map(Number) : [(deISO(e.fecha || hoyISO()).getDay() + 6) % 7 + 1];
    const titulo = esRutina ? 'Editar rutina' : nueva ? 'Nueva entrada' : 'Editar entrada';
    dlg.innerHTML = `<form class="formulario ${esRutina ? 'es-rutina' : ''}">
      <h2>${titulo}</h2>
      <label>Nombre<input name="nombre" required autocomplete="off"></label>
      ${nueva || esRutina ? `<label class="interruptor-repite"><input type="checkbox" name="repite"${esRutina ? ' checked disabled' : ''}> ${REPITE} Se repite cada semana</label>
      <div class="solo-rutina">
        <div class="dias-sel" role="group" aria-label="Días">${DIAS_CORTOS.map((d, i) => `<label class="chip"><input type="checkbox" name="dias" value="${i + 1}"${dias.includes(i + 1) ? ' checked' : ''}>${d}</label>`).join('')}</div>
      </div>` : ''}
      <div class="fila">
        <label><span class="solo-evento">Empieza</span><span class="solo-rutina">Desde</span><input type="date" name="fecha" required></label>
        <label>Hora <small>(opcional)</small><input type="time" name="hora"></label>
      </div>
      <div class="fila">
        <label class="solo-evento">Termina <small>(opcional)</small><input type="date" name="fecha_fin"></label>
        <label class="solo-rutina">Hasta <small>(vacío = siempre)</small><input type="date" name="hasta"></label>
        <label>Hora de fin <small>(opcional)</small><input type="time" name="hora_fin"></label>
      </div>
      <fieldset><legend>Ámbito</legend>
        <div class="chips-sel">${AMBITOS.map(a => `<label class="chip ${slug(a)}"><input type="radio" name="ambito" value="${esc(a)}"${a === ambito ? ' checked' : ''}><i></i>${esc(a)}</label>`).join('')}</div>
      </fieldset>
      <div class="fila">
        <label>Tipo<select name="tipo">${opciones(TIPOS, e.tipo || (esRutina ? 'Evento Personal' : 'Tarea'))}</select></label>
        <label class="solo-evento">Prioridad<select name="prioridad">${opciones(PRIORIDADES, e.prioridad || 'Media')}</select></label>
      </div>
      <div class="fila solo-evento">
        <label>Estado<select name="estado">${opciones(ESTADOS, e.estado || 'Sin empezar')}</select></label>
        <label>Avísame<select name="aviso_min">${AVISOS.map(([v, t]) => `<option value="${v}"${String(v) === String(aviso) ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      </div>
      <p class="ayuda solo-evento">Si no tiene hora, el aviso cuenta desde las 9:00 de ese día.</p>
      <label>Notas<textarea name="notas" rows="3"></textarea></label>
      ${esRutina && e.diaPulsado ? `<button type="button" class="btn" data-f="saltar">Quitar solo el ${fechaCorta(e.diaPulsado)}</button>` : ''}
      <div class="acciones">
        ${nueva ? '' : `<button type="button" class="btn peligro" data-f="borrar">${esRutina ? 'Borrar rutina' : 'Borrar'}</button>`}
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
    f.elements.hasta.value = e.hasta || '';
    f.elements.notas.value = e.notas || '';
    // El fin no puede ser antes del inicio
    const ajustarMin = () => { f.elements.fecha_fin.min = f.elements.hasta.min = f.elements.fecha.value; };
    f.elements.fecha.addEventListener('change', ajustarMin);
    ajustarMin();
    // "Se repite" cambia el formulario de entrada a rutina
    if (f.elements.repite) f.elements.repite.onchange = () => f.classList.toggle('es-rutina', f.elements.repite.checked);

    f.onsubmit = async ev => {
      ev.preventDefault();
      if (f.classList.contains('es-rutina')) return guardarRutina(f, e);
      const datos = Object.fromEntries(new FormData(f));
      delete datos.repite; delete datos.dias; delete datos.hasta;
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
      const pregunta = esRutina ? `¿Borrar la rutina «${e.nombre}» entera (todos los días)?` : `¿Borrar «${e.nombre}»?`;
      if (!confirm(pregunta)) return;
      try {
        await (esRutina ? Datos.rutinas : Datos.agenda).borrar(e.id);
      } catch {
        return avisar('No se ha podido borrar. Revisa la conexión.');
      }
      dlg.close();
      render();
    };
    // Rutina: saltarse un día suelto (festivo, vacaciones…) sin tocar los demás
    const saltar = f.querySelector('[data-f=saltar]');
    if (saltar) saltar.onclick = async () => {
      try {
        await Datos.rutinas.actualizar(e.id, { excepciones: [...(e.excepciones || []), e.diaPulsado] });
      } catch {
        return avisar('No se ha podido guardar. Revisa la conexión.');
      }
      dlg.close();
      render();
    };

    dlg.showModal();
    if (nueva) f.elements.nombre.focus();
  }

  async function guardarRutina(f, e) {
    const x = f.elements;
    const datos = {
      nombre: x.nombre.value.trim(),
      ambito: f.querySelector('input[name=ambito]:checked')?.value || 'Personal',
      tipo: x.tipo.value,
      dias: [...f.querySelectorAll('input[name=dias]:checked')].map(c => Number(c.value)),
      hora: x.hora.value,
      hora_fin: x.hora_fin.value,
      desde: x.fecha.value,
      hasta: x.hasta.value,
      notas: x.notas.value,
    };
    if (!datos.nombre) return;
    if (!datos.dias.length) return avisar('Elige al menos un día de la semana.');
    if (datos.hora && datos.hora_fin && datos.hora_fin < datos.hora) return avisar('La hora de fin es antes de la de inicio.');
    if (datos.hasta && datos.hasta < datos.desde) return avisar('"Hasta" no puede ser antes de "Desde".');
    try {
      if (e.esRutina) await Datos.rutinas.actualizar(e.id, datos);
      else await Datos.rutinas.crear(datos);
    } catch {
      return avisar('No se ha podido guardar. Revisa la conexión y vuelve a probar.');
    }
    dlg.close();
    render();
  }

  // ---------- Qué pasa al pulsar ----------
  function mover(paso) {
    const r = estado.ref;
    estado.ref = estado.vista === 'mes' ? new Date(r.getFullYear(), r.getMonth() + paso, 1) : sumarDias(r, 7 * paso);
  }

  async function alPulsar(ev) {
    const b = ev.target.closest('[data-accion]');
    if (!b || !raiz.contains(b) || Date.now() < ignorarClicHasta) return;  // soltar lo arrastrado no cuenta como pulsar
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
      case 'editar': {
        if (id.startsWith('r:')) {
          const [, rutinaId, dia] = id.split(':');
          const r = rutinas.find(x => x.id === rutinaId);
          return abrirFormulario({ ...r, esRutina: true, fecha: r.desde, diaPulsado: dia });
        }
        return abrirFormulario(todas.find(x => x.id === id));
      }
      case 'nueva': return abrirFormulario({ fecha: fecha || (estado.vista === 'mes' ? estado.dia : hoyISO()), ambito });
      default: return;
    }
    render();
  }

  // ---------- Arrastrar a otro día (Mes y Semana) ----------
  // Ratón: se coge al moverlo un poco. Dedo: manteniendo pulsado medio segundo, para no estorbar al deslizar la pantalla.
  let arrastre = null, ignorarClicHasta = 0, escuchando = false;
  const destinoEn = (x, y) => document.elementFromPoint(x, y)?.closest('[data-soltar]');

  function coger(el, x, y, dedo) {
    if (!estado.vista || estado.vista === 'tablero') return;
    // Si se coge en un día concreto se mueve desde ese día (cuenta para los de varios días); si no, desde el día del panel
    const origen = el.closest('[data-soltar]')?.dataset.soltar || estado.dia;
    arrastre = { el, id: el.dataset.arrastre, origen, x0: x, y0: y, x, y, activo: false };
    if (dedo) arrastre.espera = setTimeout(activar, 450);
  }

  function activar() {
    const a = arrastre;
    if (!a) return;
    a.activo = true;
    const caja = a.el.getBoundingClientRect();
    a.fantasma = a.el.cloneNode(true);
    a.fantasma.className += ' fantasma';
    a.fantasma.style.width = Math.max(caja.width, 120) + 'px';
    document.body.appendChild(a.fantasma);
    a.el.classList.add('arrastrando');
    navigator.vibrate?.(15);
    seguir(a.x, a.y);
    // Si el dedo o el ratón se acercan al borde de arriba o de abajo, la pantalla se desliza sola
    const desplazar = () => {
      if (arrastre !== a || !a.activo) return;
      const margen = 70;
      if (a.y < margen) scrollBy(0, -12);
      else if (a.y > innerHeight - margen) scrollBy(0, 12);
      requestAnimationFrame(desplazar);
    };
    requestAnimationFrame(desplazar);
  }

  function seguir(x, y) {
    const a = arrastre;
    a.x = x; a.y = y;
    if (!a.activo) return;
    a.fantasma.style.transform = `translate(${x + 8}px, ${y + 8}px)`;
    const destino = destinoEn(x, y);
    if (destino !== a.destino) {
      a.destino?.classList.remove('destino');
      destino?.classList.add('destino');
      a.destino = destino;
    }
  }

  function terminarArrastre() {
    const a = arrastre;
    arrastre = null;
    if (!a) return null;
    clearTimeout(a.espera);
    a.fantasma?.remove();
    a.el.classList.remove('arrastrando');
    a.destino?.classList.remove('destino');
    return a.activo ? a : null;
  }

  async function soltar() {
    const a = terminarArrastre();
    if (!a) return;
    ignorarClicHasta = Date.now() + 400;
    const destino = a.destino?.dataset.soltar;
    const e = todas.find(x => x.id === a.id);
    if (!destino || !e || destino === a.origen) return;
    // Se mueve entero: mismo desplazamiento para el inicio y el fin, y misma hora
    const dias = Math.round((deISO(destino) - deISO(a.origen)) / 864e5);
    const cambios = { fecha: aISO(sumarDias(deISO(e.fecha), dias)), avisado_en: null };
    if (e.fecha_fin) cambios.fecha_fin = aISO(sumarDias(deISO(e.fecha_fin), dias));
    try {
      await Datos.agenda.actualizar(e.id, cambios);
    } catch {
      return avisar('No se ha podido mover. Revisa la conexión.');
    }
    estado.dia = destino;
    render();
  }

  function escucharArrastre() {
    if (escuchando) return;
    escuchando = true;
    // Ratón
    raiz.addEventListener('pointerdown', ev => {
      if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
      const el = ev.target.closest('[data-arrastre]');
      if (el && raiz.contains(el)) coger(el, ev.clientX, ev.clientY, false);
    });
    addEventListener('pointermove', ev => {
      if (!arrastre || ev.pointerType !== 'mouse') return;
      if (!arrastre.activo && Math.hypot(ev.clientX - arrastre.x0, ev.clientY - arrastre.y0) > 6) activar();
      if (arrastre) seguir(ev.clientX, ev.clientY);
    });
    addEventListener('pointerup', ev => { if (ev.pointerType === 'mouse') soltar(); });
    // Dedo
    raiz.addEventListener('touchstart', ev => {
      const el = ev.target.closest('[data-arrastre]');
      if (ev.touches.length !== 1 || !el || !raiz.contains(el)) return terminarArrastre();
      const t = ev.touches[0];
      coger(el, t.clientX, t.clientY, true);
    }, { passive: true });
    raiz.addEventListener('touchmove', ev => {
      if (!arrastre) return;
      const t = ev.touches[0];
      if (arrastre.activo) {
        ev.preventDefault();  // mientras se arrastra, la pantalla no se desliza
        seguir(t.clientX, t.clientY);
      } else if (Math.hypot(t.clientX - arrastre.x0, t.clientY - arrastre.y0) > 10) {
        terminarArrastre();  // estaba deslizando la pantalla, no arrastrando
      }
    }, { passive: false });
    raiz.addEventListener('touchend', ev => {
      if (arrastre?.activo) ev.preventDefault();  // que no cuente además como pulsar
      soltar();
    });
    raiz.addEventListener('touchcancel', terminarArrastre);
    raiz.addEventListener('contextmenu', ev => { if (arrastre) ev.preventDefault(); });
  }

  function montar(contenedor) {
    raiz = contenedor;
    dlg = document.getElementById('dialogo');
    escucharArrastre();
    raiz.onclick = alPulsar;
    dlg.onclick = ev => { if (ev.target === dlg) dlg.close(); };
    render();
  }

  // Vuelve a leer los datos (al volver a la app, por si cambiaste algo en otro aparato)
  function refrescar() { if (raiz && !dlg.open) render(); }

  return { montar, refrescar };
})();
