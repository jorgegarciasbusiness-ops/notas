/* Aviso corto abajo de la pantalla (errores de conexión, etc.) */
function avisar(texto) {
  let caja = document.getElementById('aviso');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'aviso';
    caja.setAttribute('role', 'status');
    document.body.appendChild(caja);
  }
  caja.textContent = texto;
  caja.classList.add('visible');
  clearTimeout(avisar.temporizador);
  avisar.temporizador = setTimeout(() => caja.classList.remove('visible'), 4000);
}

/* Arranque: entrar con tu correo (si hay nube), cambiar de sector y montar cada uno */
(() => {
  const contenido = document.getElementById('contenido');
  const sectores = { agenda: Agenda, bandeja: Bandeja, paginas: Paginas, finanzas: Finanzas };
  let actual = null;

  function abrir(nombre) {
    actual = nombre;
    try { localStorage.setItem('notas.sector', nombre); } catch { /* sin memoria */ }
    document.querySelectorAll('.sector').forEach(b => b.classList.toggle('activo', b.dataset.sector === nombre));
    // Cada sector pone sus propios manejadores; se quitan los del anterior
    contenido.onclick = contenido.onsubmit = contenido.onmousedown = null;
    sectores[nombre].montar(contenido);
  }

  function ultimoSector() {
    let s = null;
    try { s = localStorage.getItem('notas.sector'); } catch { /* sin memoria */ }
    return sectores[s] ? s : 'agenda';
  }

  document.querySelector('.sectores').addEventListener('click', ev => {
    const b = ev.target.closest('.sector');
    if (b && !b.disabled && sectores[b.dataset.sector]) abrir(b.dataset.sector);
  });

  // Si hay una versión nueva publicada, se carga sola (el iPhone guarda la vieja un rato si no)
  async function comprobarVersion() {
    try {
      const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      const { v } = await r.json();
      if (!v || typeof VERSION === 'undefined' || v === VERSION) return;
      // Un solo intento por versión, para no entrar en bucle si internet aún sirve la vieja
      if (sessionStorage.getItem('notas.intentoVersion') === v) return;
      sessionStorage.setItem('notas.intentoVersion', v);
      location.replace(`./?v=${encodeURIComponent(v)}`);
    } catch { /* sin conexión o en modo prueba: se queda como está */ }
  }
  comprobarVersion();

  // Al volver a la app (por ejemplo, desde otra en el iPhone), recarga por si cambiaste algo en el PC
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    comprobarVersion();
    if (actual) sectores[actual].refrescar?.();
  });

  // ---------- Modo claro / oscuro: sigue al sistema hasta que lo cambias con el botón ----------
  const raizHtml = document.documentElement;
  const botonTema = document.getElementById('tema');
  const oscuroSistema = matchMedia('(prefers-color-scheme: dark)');
  const temaActual = () => raizHtml.dataset.tema || (oscuroSistema.matches ? 'oscuro' : 'claro');
  const SOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
  const LUNA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';

  function pintarBotonTema() {
    const oscuro = temaActual() === 'oscuro';
    botonTema.querySelector('.icono').innerHTML = oscuro ? SOL : LUNA;
    botonTema.querySelector('.tema-texto').textContent = oscuro ? 'Modo claro' : 'Modo oscuro';
    botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }
  botonTema.addEventListener('click', () => {
    const nuevo = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
    raizHtml.dataset.tema = nuevo;
    try { localStorage.setItem('notas.tema', nuevo); } catch { /* sin memoria: vale solo para esta visita */ }
    pintarBotonTema();
  });
  oscuroSistema.addEventListener('change', pintarBotonTema);
  pintarBotonTema();

  // ---------- Entrar y salir ----------
  const botonSalir = document.getElementById('salir');
  botonSalir.hidden = Datos.modo !== 'nube';
  botonSalir.addEventListener('click', async () => {
    if (!confirm('¿Cerrar sesión en este aparato?')) return;
    await Datos.salir();
    pantallaEntrar();
  });

  function pantallaEntrar() {
    actual = null;
    document.body.classList.add('sin-sesion');
    contenido.innerHTML = `<form class="entrar">
      <h1>Notas</h1>
      <p>Entra con tu correo para ver tu agenda.</p>
      <label>Correo<input type="email" name="email" autocomplete="username" required></label>
      <label>Contraseña<input type="password" name="clave" autocomplete="current-password" required></label>
      <p class="error" hidden></p>
      <button class="btn primario" type="submit">Entrar</button>
    </form>`;
    const f = contenido.querySelector('form');
    f.onsubmit = async ev => {
      ev.preventDefault();
      const boton = f.querySelector('button');
      const error = f.querySelector('.error');
      boton.disabled = true;
      error.hidden = true;
      try {
        await Datos.entrar(f.elements.email.value.trim(), f.elements.clave.value);
        document.body.classList.remove('sin-sesion');
        abrir(ultimoSector());
      } catch (e) {
        error.textContent = /invalid/i.test(e.message || '') ? 'Correo o contraseña incorrectos.' : 'No se ha podido entrar. Revisa la conexión.';
        error.hidden = false;
      } finally {
        boton.disabled = false;
      }
    };
  }

  (async () => {
    let sesion = null;
    try { sesion = await Datos.sesion(); } catch { /* sin conexión: se pide entrar */ }
    if (sesion) abrir(ultimoSector());
    else pantallaEntrar();
  })();
})();
