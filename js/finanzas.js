/* Sector Finanzas: resumen, gasto semanal contra el límite y horas trabajadas por mes */
const Finanzas = (() => {
  const LIMITE_SEMANA = 50;  // € por semana (plan de finanzas, 2026-10-19)
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
  let raiz, dlg, gastos = [], horas = [], paginas = [];
  const estado = { vista: 'resumen', lunes: lunesDe(new Date()), mes: new Date(new Date().getFullYear(), new Date().getMonth(), 1) };

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

  async function render() {
    try {
      [gastos, horas, paginas] = await Promise.all([Datos.gastos.listar(), Datos.horas.listar(), Datos.paginas.listar()]);
    } catch {
      avisar('No se han podido cargar las finanzas. Revisa la conexión.');
    }
    const boton = (v, t) => `<button class="${estado.vista === v ? 'activo' : ''}" data-accion="vista" data-vista="${v}">${t}</button>`;
    const cuerpo = { resumen: vistaResumen, gastos: vistaGastos, horas: vistaHoras }[estado.vista]();
    raiz.innerHTML = `<header class="ag-cab"><h1>Finanzas</h1>
        <div class="segmentado">${boton('gastos', 'Gastos')}${boton('horas', 'Horas')}${boton('resumen', 'Resumen')}</div>
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

  function preparar(f, tabla, fila, leer, nombre) {
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
      const d = deISO(datos.fecha);
      if (tabla === 'gastos') Object.assign(estado, { vista: 'gastos', lunes: lunesDe(d) });
      else Object.assign(estado, { vista: 'horas', mes: new Date(d.getFullYear(), d.getMonth(), 1) });
      dlg.close();
      render();
    };
    const borrar = f.querySelector('[data-f=borrar]');
    if (borrar) borrar.onclick = async () => {
      if (!confirm(`¿Borrar ${nombre}?`)) return;
      try {
        await Datos[tabla].borrar(fila.id);
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
