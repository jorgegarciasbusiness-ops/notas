/* Sector Finanzas: gasto semanal contra el límite, horas por mes, ahorro con su objetivo y reparto de la nómina */
const Finanzas = (() => {
  const LIMITE_SEMANA = 50;  // € por semana (plan de finanzas, 2026-10-19)
  const OBJETIVO_AHORRO = 10000;  // € (petición de Koke, 2026-10-25)
  const PARTIDAS = ['Ahorro', 'Gastos fijos', 'Gastos variables', 'Libre'];
  const COLORES = ['var(--verde)', 'var(--azul)', 'var(--naranja)', 'var(--morado)', 'var(--rosa)', 'var(--amarillo)', 'var(--gris)'];
  const CATEGORIAS = ['Comida', 'Ocio', 'Ropa', 'Transporte', 'Música', 'Salud', 'Otros'];
  const TRABAJOS = ['Catering (Interim)', 'Hipódromo', 'Led&Go'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  // ---------- Utilidades ----------
  const pad = n => String(n).padStart(2, '0');
  const aISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const deISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const hoyISO = () => aISO(new Date());
  const sumarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const lunesDe = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euros = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const horasTxt = n => `${String(Math.round((n || 0) * 100) / 100).replace('.', ',')} h`;
  const diaCorto = iso => { const d = deISO(iso); return `${cap(DIAS[d.getDay()])} ${d.getDate()}/${d.getMonth() + 1}`; };
  const suma = (lista, campo) => lista.reduce((t, x) => t + (Number(x[campo]) || 0), 0);

  function semana(lunes) {
    const fin = sumarDias(lunes, 6);
    const desde = aISO(lunes), hasta = aISO(fin);
    const ma = MESES[lunes.getMonth()].slice(0, 3), mb = MESES[fin.getMonth()].slice(0, 3);
    return { desde, hasta, texto: `${lunes.getDate()} ${ma === mb ? '' : ma + ' '}– ${fin.getDate()} ${mb}` };
  }

  // Horas entre dos horas "08:00" y "14:30" (si sale de madrugada, cuenta el día siguiente)
  function calcularHoras(entrada, salida) {
    if (!entrada || !salida) return 0;
    const min = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
    let d = min(salida) - min(entrada);
    if (d < 0) d += 24 * 60;
    return Math.round(d / 60 * 100) / 100;
  }

  // ---------- Estado ----------
  let raiz, dlg, gastos = [], horas = [], paginas = [], ahorros = [], nominas = [], partidas = [];
  const mesActual = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const estado = { vista: 'resumen', lunes: lunesDe(new Date()), mes: mesActual(), mesNomina: mesActual() };

  // ---------- Piezas ----------
  function barra(gastado) {
    const pct = Math.min(100, gastado / LIMITE_SEMANA * 100);
    const clase = gastado > LIMITE_SEMANA ? 'pasado' : gastado >= LIMITE_SEMANA * 0.8 ? 'cerca' : 'bien';
    const resto = LIMITE_SEMANA - gastado;
    return `<p class="fin-cifra"><b>${euros(gastado)}</b> de ${euros(LIMITE_SEMANA)}</p>
      <div class="fin-barra ${clase}"><span style="width:${pct}%"></span></div>
      <p class="fin-resto ${clase}">${resto >= 0 ? `Te quedan ${euros(resto)}` : `Te has pasado ${euros(-resto)}`}</p>`;
  }

  function filaGasto(g) {
    const previsto = g.fecha > hoyISO() ? ' · <span class="fin-previsto">Previsto</span>' : '';
    return `<button class="fin-fila" data-accion="editar-gasto" data-id="${g.id}">
      <span class="fin-fila-txt"><b>${esc(g.concepto || g.categoria)}</b><small>${diaCorto(g.fecha)} · ${esc(g.categoria)}${previsto}</small></span>
      <span class="fin-importe">${euros(g.importe)}</span>
    </button>`;
  }

  function filaTurno(t) {
    const tramo = t.entrada && t.salida ? `${t.entrada}–${t.salida}` : 'Sin hora';
    return `<button class="fin-fila" data-accion="editar-turno" data-id="${t.id}">
      <span class="fin-fila-txt"><b>${diaCorto(t.fecha)} · ${tramo}</b><small>${esc(t.trabajo)}${t.nota ? ' · ' + esc(t.nota) : ''}</small></span>
      <span class="fin-importe">${horasTxt(t.horas)}</span>
    </button>`;
  }

  const delMes = mes => horas.filter(t => deISO(t.fecha).getFullYear() === mes.getFullYear() && deISO(t.fecha).getMonth() === mes.getMonth());
  const deLaSemana = lunes => { const s = semana(lunes); return gastos.filter(g => g.fecha >= s.desde && g.fecha <= s.hasta); };
  const planPagina = () => paginas.find(p => p.seccion === 'Finanzas' && /^plan/i.test(p.titulo));

  function vistaResumen() {
    const lunes = lunesDe(new Date());
    const mes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const turnos = delMes(mes);
    const plan = planPagina();
    const siguiente = sumarDias(lunes, 7);
    const previsto = suma(deLaSemana(siguiente), 'importe');
    return `<div class="fin-tarjetas">
        <section class="panel">
          <h2>Esta semana <small>${semana(lunes).texto}</small></h2>
          ${barra(suma(deLaSemana(lunes), 'importe'))}
          ${previsto ? `<button class="fin-enlace" data-accion="ir-semana" data-fecha="${aISO(siguiente)}">Semana que viene: ${euros(previsto)} ya previstos ›</button>` : ''}
          <button class="btn primario" data-accion="nuevo-gasto">+ Gasto</button>
        </section>
        <section class="panel">
          <h2>Horas de ${MESES[mes.getMonth()]}</h2>
          <p class="fin-cifra"><b>${horasTxt(suma(turnos, 'horas'))}</b> en ${turnos.length} ${turnos.length === 1 ? 'turno' : 'turnos'}</p>
          <button class="btn primario" data-accion="nuevo-turno">+ Turno</button>
        </section>
      </div>
      ${plan ? `<section class="panel fin-plan">
        <div class="pag-cab"><h2>${esc(plan.titulo)}</h2><span class="hueco"></span><button class="btn" data-accion="ver-plan" data-id="${plan.id}">Editar en Páginas</button></div>
        <article class="md">${Paginas.aHTML(plan.contenido)}</article>
      </section>` : ''}`;
  }

  function vistaGastos() {
    const s = semana(estado.lunes);
    const lista = deLaSemana(estado.lunes).sort((a, b) => b.fecha.localeCompare(a.fecha));
    // Semanas que vienen con gastos ya previstos (hasta 8), y las últimas 8, para ver en qué se va el dinero
    const historial = [];
    for (let i = -8; i < 8; i++) {
      const l = sumarDias(lunesDe(new Date()), -7 * i);
      const total = suma(deLaSemana(l), 'importe');
      if (i < 0 && !total) continue;
      historial.push(`<button class="fin-semana ${aISO(l) === aISO(estado.lunes) ? 'activa' : ''}" data-accion="ir-semana" data-fecha="${aISO(l)}">
        <span>${semana(l).texto}${i < 0 ? ' <small class="fin-previsto">Prevista</small>' : i === 0 ? ' <small>Esta</small>' : ''}</span>
        <span class="fin-mini ${total > LIMITE_SEMANA ? 'pasado' : ''}"><i style="width:${Math.min(100, total / LIMITE_SEMANA * 100)}%"></i></span>
        <b>${euros(total)}</b>
      </button>`);
    }
    const porCategoria = CATEGORIAS.map(c => [c, suma(lista.filter(g => g.categoria === c), 'importe')]).filter(([, t]) => t > 0);
    return `<div class="fin-nav">
        <button class="btn" data-accion="semana-ant" aria-label="Semana anterior">‹</button>
        <b>${s.texto}</b>
        <button class="btn" data-accion="semana-sig" aria-label="Semana siguiente">›</button>
        <span class="hueco"></span>
        <button class="btn primario" data-accion="nuevo-gasto">+ Gasto</button>
      </div>
      <div class="fin-columnas">
        <section class="panel">
          ${barra(suma(lista, 'importe'))}
          ${porCategoria.length ? `<p class="fin-cats">${porCategoria.map(([c, t]) => `<span>${esc(c)} ${euros(t)}</span>`).join('')}</p>` : ''}
          <div class="lista">${lista.length ? lista.map(filaGasto).join('') : '<p class="vacio">Sin gastos esta semana.</p>'}</div>
        </section>
        <section class="panel">
          <h2>Semanas</h2>
          <div class="fin-historial">${historial.join('')}</div>
        </section>
      </div>`;
  }

  function vistaHoras() {
    const lista = delMes(estado.mes).sort((a, b) => a.fecha.localeCompare(b.fecha));
    return `<div class="fin-nav">
        <button class="btn" data-accion="mes-ant" aria-label="Mes anterior">‹</button>
        <b>${cap(MESES[estado.mes.getMonth()])} ${estado.mes.getFullYear()}</b>
        <button class="btn" data-accion="mes-sig" aria-label="Mes siguiente">›</button>
        <span class="hueco"></span>
        <button class="btn primario" data-accion="nuevo-turno">+ Turno</button>
      </div>
      <section class="panel fin-horas">
        <p class="fin-cifra"><b>${horasTxt(suma(lista, 'horas'))}</b> en ${lista.length} ${lista.length === 1 ? 'turno' : 'turnos'}</p>
        <div class="lista">${lista.length ? lista.map(filaTurno).join('') : '<p class="vacio">Sin turnos este mes.</p>'}</div>
      </section>`;
  }

  // ---------- Ahorro y nómina ----------
  const isoMes = d => aISO(new Date(d.getFullYear(), d.getMonth(), 1));
  const nombreMes = d => `${MESES[d.getMonth()]} ${d.getFullYear()}`;
  const nominaDe = mes => nominas.find(n => n.mes === isoMes(mes));
  const partidasDe = mes => partidas.filter(p => p.mes === isoMes(mes));
  const mesAnterior = mes => new Date(mes.getFullYear(), mes.getMonth() - 1, 1);

  function anillo(total) {
    const pct = Math.max(0, Math.min(1, total / OBJETIVO_AHORRO));
    const r = 52, c = 2 * Math.PI * r;
    return `<svg class="fin-anillo" viewBox="0 0 120 120" role="img" aria-label="${Math.round(pct * 100)} % del objetivo">
      <circle cx="60" cy="60" r="${r}" class="fondo"/>
      <circle cx="60" cy="60" r="${r}" class="valor" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/>
      <text x="60" y="62" text-anchor="middle" class="pct">${Math.floor(pct * 100)} %</text>
      <text x="60" y="80" text-anchor="middle" class="sub">del objetivo</text>
    </svg>`;
  }

  function vistaAhorro() {
    const total = suma(ahorros, 'importe');
    const faltan = OBJETIVO_AHORRO - total;
    const lista = [...ahorros].sort((a, b) => b.fecha.localeCompare(a.fecha));
    const fila = a => `<button class="fin-fila" data-accion="editar-ahorro" data-id="${a.id}">
        <span class="fin-fila-txt"><b>${esc(a.nota || 'Ingreso')}</b><small>${diaCorto(a.fecha)}</small></span>
        <span class="fin-importe">${euros(a.importe)}</span>
      </button>`;

    const mes = estado.mesNomina, nomina = nominaDe(mes), ps = partidasDe(mes);
    let reparto;
    if (nomina) {
      const asignado = suma(ps, 'importe');
      const libre = nomina.neto - asignado;
      const ancho = x => (nomina.neto > 0 ? Math.max(0, x / Math.max(nomina.neto, asignado) * 100) : 0);
      reparto = `<button class="fin-enlace fin-neto" data-accion="editar-nomina"><b>${euros(nomina.neto)}</b> netos</button>
        <div class="fin-reparto">${ps.map((p, i) => `<span style="width:${ancho(p.importe)}%;background:${COLORES[i % COLORES.length]}" title="${esc(p.concepto)}"></span>`).join('')}</div>
        <div class="lista">${ps.map((p, i) => `<button class="fin-fila" data-accion="editar-partida" data-id="${p.id}">
            <i class="fin-punto" style="background:${COLORES[i % COLORES.length]}"></i>
            <span class="fin-fila-txt"><b>${esc(p.concepto)}</b><small>${nomina.neto ? Math.round(p.importe / nomina.neto * 100) : 0} %</small></span>
            <span class="fin-importe">${euros(p.importe)}</span>
          </button>`).join('') || '<p class="vacio">Aún no has repartido la nómina.</p>'}</div>
        ${libre !== 0 ? `<p class="fin-resto ${libre < 0 ? 'pasado' : ''}">${libre > 0 ? `Sin repartir: ${euros(libre)}` : `Repartes ${euros(-libre)} más de lo que cobras`}</p>` : ''}
        <button class="btn primario" data-accion="nueva-partida">+ Partida</button>`;
    } else {
      const anterior = nominaDe(mesAnterior(mes));
      reparto = `<p class="vacio">Sin nómina apuntada en ${nombreMes(mes)}.</p>
        <div class="fin-botones">
          <button class="btn primario" data-accion="nueva-nomina">Apuntar nómina</button>
          ${anterior ? `<button class="btn" data-accion="copiar-nomina">Copiar el reparto de ${MESES[mesAnterior(mes).getMonth()]}</button>` : ''}
        </div>`;
    }

    return `<div class="fin-columnas">
        <section class="panel fin-ahorro">
          <h2>Hucha</h2>
          <div class="fin-ahorro-cab">
            ${anillo(total)}
            <div>
              <p class="fin-cifra"><b>${euros(total)}</b> de ${euros(OBJETIVO_AHORRO)}</p>
              <p class="fin-resto">${faltan > 0 ? `Faltan ${euros(faltan)}` : '¡Objetivo cumplido!'}</p>
              <button class="btn primario" data-accion="nuevo-ahorro">+ Ingreso</button>
            </div>
          </div>
          <div class="lista">${lista.length ? lista.map(fila).join('') : '<p class="vacio">Aún no has apuntado ningún ingreso.</p>'}</div>
        </section>
        <section class="panel">
          <div class="fin-nav">
            <button class="btn" data-accion="nomina-ant" aria-label="Mes anterior">‹</button>
            <b>Nómina de ${nombreMes(mes)}</b>
            <button class="btn" data-accion="nomina-sig" aria-label="Mes siguiente">›</button>
          </div>
          ${reparto}
        </section>
      </div>`;
  }

  async function render() {
    try {
      [gastos, horas, paginas, ahorros, nominas, partidas] = await Promise.all([
        Datos.gastos.listar(), Datos.horas.listar(), Datos.paginas.listar(),
        Datos.ahorros.listar(), Datos.nominas.listar(), Datos.nomina_partidas.listar(),
      ]);
    } catch {
      avisar('No se han podido cargar las finanzas. Revisa la conexión.');
    }
    const boton = (v, t) => `<button class="${estado.vista === v ? 'activo' : ''}" data-accion="vista" data-vista="${v}">${t}</button>`;
    const cuerpo = { resumen: vistaResumen, gastos: vistaGastos, horas: vistaHoras, ahorro: vistaAhorro }[estado.vista]();
    raiz.innerHTML = `<header class="ag-cab"><h1>Finanzas</h1>
        <div class="segmentado">${boton('gastos', 'Gastos')}${boton('horas', 'Horas')}${boton('ahorro', 'Ahorro')}${boton('resumen', 'Resumen')}</div>
      </header>${cuerpo}`;
  }

  // ---------- Formularios ----------
  function formulario(titulo, campos, existe) {
    dlg.innerHTML = `<form class="formulario">
      <h2>${titulo}</h2>
      ${campos}
      <div class="acciones">
        ${existe ? '<button type="button" class="btn peligro" data-f="borrar">Borrar</button>' : ''}
        <span class="hueco"></span>
        <button type="button" class="btn" data-f="cancelar">Cancelar</button>
        <button type="submit" class="btn primario">Guardar</button>
      </div>
    </form>`;
    const f = dlg.querySelector('form');
    f.querySelector('[data-f=cancelar]').onclick = () => dlg.close();
    dlg.onclick = ev => { if (ev.target === dlg) dlg.close(); };
    return f;
  }

  function preparar(f, tabla, fila, leer, nombre, borrarTodo = () => Datos[tabla].borrar(fila.id)) {
    f.onsubmit = async ev => {
      ev.preventDefault();
      const datos = leer(f);
      if (!datos) return;
      try {
        if (fila.id) await Datos[tabla].actualizar(fila.id, datos);
        else await Datos[tabla].crear(datos);
      } catch {
        return avisar('No se ha podido guardar. Revisa la conexión y vuelve a probar.');
      }
      // Lleva a la semana (o al mes) de lo que acabas de apuntar, aunque sea en el futuro
      if (tabla === 'gastos') Object.assign(estado, { vista: 'gastos', lunes: lunesDe(deISO(datos.fecha)) });
      if (tabla === 'horas') { const d = deISO(datos.fecha); Object.assign(estado, { vista: 'horas', mes: new Date(d.getFullYear(), d.getMonth(), 1) }); }
      dlg.close();
      render();
    };
    const borrar = f.querySelector('[data-f=borrar]');
    if (borrar) borrar.onclick = async () => {
      if (!confirm(`¿Borrar ${nombre}?`)) return;
      try {
        await borrarTodo();
      } catch {
        return avisar('No se ha podido borrar. Revisa la conexión.');
      }
      dlg.close();
      render();
    };
    dlg.showModal();
  }

  function abrirGasto(g = {}) {
    const f = formulario(g.id ? 'Editar gasto' : 'Nuevo gasto', `
      <div class="fila">
        <label>Importe (€)<input name="importe" type="number" inputmode="decimal" step="0.01" min="0" required></label>
        <label>Fecha<input name="fecha" type="date" required></label>
      </div>
      <label>Concepto<input name="concepto" autocomplete="off" placeholder="Ej.: cena con amigos"></label>
      <label>Categoría<select name="categoria">${CATEGORIAS.map(c => `<option${c === (g.categoria || 'Comida') ? ' selected' : ''}>${c}</option>`).join('')}</select></label>`, !!g.id);
    f.elements.importe.value = g.importe ?? '';
    f.elements.fecha.value = g.fecha || hoyISO();
    f.elements.concepto.value = g.concepto || '';
    preparar(f, 'gastos', g, form => {
      const importe = Number(String(form.elements.importe.value).replace(',', '.'));
      if (!(importe >= 0)) return null;
      return { importe, fecha: form.elements.fecha.value, concepto: form.elements.concepto.value.trim(), categoria: form.elements.categoria.value };
    }, `el gasto de ${euros(g.importe)}`);
    if (!g.id) f.elements.importe.focus();
  }

  function abrirTurno(t = {}) {
    const f = formulario(t.id ? 'Editar turno' : 'Nuevo turno', `
      <label>Fecha<input name="fecha" type="date" required></label>
      <div class="fila">
        <label>Entrada<input name="entrada" type="time"></label>
        <label>Salida<input name="salida" type="time"></label>
      </div>
      <div class="fila">
        <label>Horas<input name="horas" type="number" inputmode="decimal" step="0.25" min="0" required></label>
        <label>Trabajo<input name="trabajo" list="lista-trabajos" autocomplete="off"></label>
      </div>
      <datalist id="lista-trabajos">${TRABAJOS.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <label>Nota<input name="nota" autocomplete="off"></label>`, !!t.id);
    const e = f.elements;
    e.fecha.value = t.fecha || hoyISO();
    e.entrada.value = t.entrada || '';
    e.salida.value = t.salida || '';
    e.horas.value = t.horas ?? '';
    e.trabajo.value = t.trabajo || TRABAJOS[0];
    e.nota.value = t.nota || '';
    // Las horas se calculan solas con la entrada y la salida (se pueden cambiar a mano)
    const recalcular = () => { const h = calcularHoras(e.entrada.value, e.salida.value); if (h) e.horas.value = h; };
    e.entrada.onchange = e.salida.onchange = recalcular;
    preparar(f, 'horas', t, form => {
      const x = form.elements;
      const h = Number(String(x.horas.value).replace(',', '.'));
      if (!(h >= 0)) return null;
      return { fecha: x.fecha.value, entrada: x.entrada.value, salida: x.salida.value, horas: h, trabajo: x.trabajo.value.trim() || TRABAJOS[0], nota: x.nota.value.trim() };
    }, `el turno del ${diaCorto(t.fecha || hoyISO())}`);
  }

  function abrirAhorro(a = {}) {
    const f = formulario(a.id ? 'Editar ingreso' : 'Ingreso al ahorro', `
      <div class="fila">
        <label>Importe (€)<input name="importe" type="number" inputmode="decimal" step="0.01" required></label>
        <label>Fecha<input name="fecha" type="date" required></label>
      </div>
      <label>Nota <small>(opcional)</small><input name="nota" autocomplete="off" placeholder="Ej.: nómina de noviembre"></label>
      <p class="ayuda">Si sacas dinero de la hucha, pon el importe en negativo.</p>`, !!a.id);
    f.elements.importe.value = a.importe ?? '';
    f.elements.fecha.value = a.fecha || hoyISO();
    f.elements.nota.value = a.nota || '';
    preparar(f, 'ahorros', a, form => {
      const importe = Number(String(form.elements.importe.value).replace(',', '.'));
      if (!importe) return null;
      return { importe, fecha: form.elements.fecha.value, nota: form.elements.nota.value.trim() };
    }, `el ingreso de ${euros(a.importe)}`);
    if (!a.id) f.elements.importe.focus();
  }

  function abrirNomina() {
    const mes = estado.mesNomina, n = nominaDe(mes) || {};
    const f = formulario(`Nómina de ${nombreMes(mes)}`, `
      <label>Lo que cobras (neto, €)<input name="neto" type="number" inputmode="decimal" step="0.01" min="0" required></label>`, !!n.id);
    f.elements.neto.value = n.neto ?? '';
    preparar(f, 'nominas', n, form => {
      const neto = Number(String(form.elements.neto.value).replace(',', '.'));
      if (!(neto >= 0)) return null;
      return { mes: isoMes(mes), neto };
    }, `la nómina de ${nombreMes(mes)} y su reparto`, async () => {
      for (const p of partidasDe(mes)) await Datos.nomina_partidas.borrar(p.id);
      await Datos.nominas.borrar(n.id);
    });
    f.elements.neto.focus();
  }

  function abrirPartida(p = {}) {
    const mes = estado.mesNomina;
    const f = formulario(p.id ? 'Editar partida' : 'Nueva partida', `
      <label>A dónde va<input name="concepto" list="lista-partidas" autocomplete="off" required placeholder="Ej.: Ahorro"></label>
      <datalist id="lista-partidas">${[...new Set([...PARTIDAS, ...partidas.map(x => x.concepto)])].map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <label>Importe (€)<input name="importe" type="number" inputmode="decimal" step="0.01" min="0" required></label>`, !!p.id);
    f.elements.concepto.value = p.concepto || '';
    f.elements.importe.value = p.importe ?? '';
    preparar(f, 'nomina_partidas', p, form => {
      const importe = Number(String(form.elements.importe.value).replace(',', '.'));
      const concepto = form.elements.concepto.value.trim();
      if (!concepto || !(importe >= 0)) return null;
      return { mes: isoMes(mes), concepto, importe };
    }, `la partida «${p.concepto}»`);
    if (!p.id) f.elements.concepto.focus();
  }

  // Copia la nómina y el reparto del mes anterior (luego se retoca lo que cambie)
  async function copiarNomina() {
    const mes = estado.mesNomina, antes = mesAnterior(mes), n = nominaDe(antes);
    if (!n) return;
    try {
      await Datos.nominas.crear({ mes: isoMes(mes), neto: n.neto });
      for (const p of partidasDe(antes)) await Datos.nomina_partidas.crear({ mes: isoMes(mes), concepto: p.concepto, importe: p.importe });
    } catch {
      avisar('No se ha podido copiar. Revisa la conexión.');
    }
    render();
  }

  // ---------- Qué pasa al pulsar ----------
  function alPulsar(ev) {
    const b = ev.target.closest('[data-accion]');
    if (!b || !raiz.contains(b)) return;
    const { accion, id, vista, fecha } = b.dataset;
    switch (accion) {
      case 'vista': estado.vista = vista; break;
      case 'nuevo-gasto': return abrirGasto();
      case 'nuevo-turno': return abrirTurno();
      case 'editar-gasto': return abrirGasto(gastos.find(g => g.id === id));
      case 'editar-turno': return abrirTurno(horas.find(t => t.id === id));
      case 'semana-ant': estado.lunes = sumarDias(estado.lunes, -7); break;
      case 'semana-sig': estado.lunes = sumarDias(estado.lunes, 7); break;
      case 'ir-semana': Object.assign(estado, { vista: 'gastos', lunes: deISO(fecha) }); break;
      case 'mes-ant': estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() - 1, 1); break;
      case 'mes-sig': estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + 1, 1); break;
      case 'nuevo-ahorro': return abrirAhorro();
      case 'editar-ahorro': return abrirAhorro(ahorros.find(a => a.id === id));
      case 'nueva-nomina': case 'editar-nomina': return abrirNomina();
      case 'nueva-partida': return abrirPartida();
      case 'editar-partida': return abrirPartida(partidas.find(p => p.id === id));
      case 'copiar-nomina': return copiarNomina();
      case 'nomina-ant': estado.mesNomina = mesAnterior(estado.mesNomina); break;
      case 'nomina-sig': estado.mesNomina = new Date(estado.mesNomina.getFullYear(), estado.mesNomina.getMonth() + 1, 1); break;
      case 'ver-plan': Paginas.elegir(id); document.querySelector('.sector[data-sector="paginas"]').click(); return;
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
