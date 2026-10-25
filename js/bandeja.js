/* Sector Bandeja: apuntar algo rápido (sobre todo desde el móvil). Claude la vacía en cada sesión. */
const Bandeja = (() => {
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function cuando(iso) {
    const d = new Date(iso), hoy = new Date();
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (d.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`;
    if (d.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
    return `${d.getDate()} ${MESES[d.getMonth()]}, ${hora}`;
  }

  let raiz, notas = [];

  async function render() {
    try {
      notas = await Datos.bandeja.listar();
    } catch {
      avisar('No se ha podido cargar la bandeja. Revisa la conexión.');
    }
    const lista = [...notas].reverse();  // lo último, arriba
    raiz.innerHTML = `<header class="ag-cab"><h1>Bandeja</h1></header>
      <p class="subtitulo">Apunta lo que se te ocurra. Claude lo ordena en cada sesión.</p>
      <form class="bandeja-nueva">
        <input name="texto" placeholder="Apunta algo…" autocomplete="off" enterkeyhint="send" aria-label="Nueva nota">
        <button class="btn primario" type="submit">Apuntar</button>
      </form>
      <div class="bandeja-lista">
        ${lista.length ? lista.map(n => `<div class="nota">
          <div class="nota-cuerpo"><p>${esc(n.texto)}</p><span>${cuando(n.creado)}</span></div>
          <button class="nota-borrar" data-accion="borrar" data-id="${n.id}" aria-label="Borrar">×</button>
        </div>`).join('') : '<p class="vacio">Bandeja vacía.</p>'}
      </div>`;
  }

  async function alEnviar(ev) {
    ev.preventDefault();
    const campo = ev.target.elements.texto;
    const texto = campo.value.trim();
    if (!texto) return;
    try {
      await Datos.bandeja.crear({ texto });
    } catch {
      return avisar('No se ha podido apuntar. Revisa la conexión y vuelve a probar.');
    }
    await render();
    raiz.querySelector('.bandeja-nueva input').focus();
  }

  async function alPulsar(ev) {
    const b = ev.target.closest('[data-accion="borrar"]');
    if (!b) return;
    const nota = notas.find(n => n.id === b.dataset.id);
    if (!nota || !confirm(`¿Borrar «${nota.texto}»?`)) return;
    try {
      await Datos.bandeja.borrar(nota.id);
    } catch {
      return avisar('No se ha podido borrar. Revisa la conexión.');
    }
    render();
  }

  function montar(contenedor) {
    raiz = contenedor;
    raiz.onclick = alPulsar;
    raiz.onsubmit = alEnviar;
    render();
  }

  // No recarga si estás escribiendo algo, para no perderlo
  function refrescar() {
    const campo = raiz && raiz.querySelector('.bandeja-nueva input');
    if (campo && !campo.value) render();
  }

  return { montar, refrescar };
})();
