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

  const MICRO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>';

  let raiz, notas = [];

  // ---------- Dictado: el navegador pasa la voz a texto mientras hablas ----------
  const Reconocedor = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;

  function campo() { return raiz.querySelector('.bandeja-nueva textarea'); }
  function ajustarAlto(t) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }

  function pararDictado() { if (rec) rec.stop(); }

  function dictar() {
    if (rec) return pararDictado();
    if (!Reconocedor) {
      return avisar('Aquí no se puede dictar. En el iPhone, usa el micro del teclado.');
    }
    const t = campo();
    const base = t.value ? `${t.value.trimEnd()} ` : '';
    let dicho = '';
    rec = new Reconocedor();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = ev => {
      let provisional = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) dicho += r[0].transcript;
        else provisional += r[0].transcript;
      }
      t.value = (base + dicho + provisional).replace(/\s+/g, ' ').trimStart();
      ajustarAlto(t);
    };
    rec.onerror = ev => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') avisar('Dale permiso al micrófono para poder dictar.');
      else if (ev.error !== 'no-speech' && ev.error !== 'aborted') avisar('No se ha podido dictar. Prueba otra vez.');
    };
    rec.onend = () => {
      rec = null;
      marcarDictado(false);
      // Primera letra en mayúscula
      if (t.value) t.value = t.value.charAt(0).toUpperCase() + t.value.slice(1);
    };
    try {
      rec.start();
      marcarDictado(true);
    } catch {
      rec = null;
      avisar('No se ha podido empezar a dictar. Prueba otra vez.');
    }
  }

  function marcarDictado(activo) {
    const b = raiz.querySelector('.mic');
    const aviso = raiz.querySelector('.mic-estado');
    if (b) b.classList.toggle('escuchando', activo);
    if (aviso) aviso.hidden = !activo;
  }

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
        <textarea name="texto" rows="1" placeholder="Escribe o dicta…" autocomplete="off" enterkeyhint="send" aria-label="Nueva nota"></textarea>
        <button class="btn mic" type="button" data-accion="dictar" aria-label="Dictar con la voz">${MICRO}</button>
        <button class="btn primario" type="submit">Apuntar</button>
      </form>
      <p class="mic-estado" hidden>Escuchando… habla y pulsa el micro otra vez para parar.</p>
      <div class="bandeja-lista">
        ${lista.length ? lista.map(n => `<div class="nota">
          <div class="nota-cuerpo"><p>${esc(n.texto)}</p><span>${cuando(n.creado)}</span></div>
          <button class="nota-borrar" data-accion="borrar" data-id="${n.id}" aria-label="Borrar">×</button>
        </div>`).join('') : '<p class="vacio">Bandeja vacía.</p>'}
      </div>`;
  }

  async function alEnviar(ev) {
    ev.preventDefault();
    pararDictado();
    const texto = ev.target.elements.texto.value.trim();
    if (!texto) return;
    try {
      await Datos.bandeja.crear({ texto });
    } catch {
      return avisar('No se ha podido apuntar. Revisa la conexión y vuelve a probar.');
    }
    await render();
    campo().focus();
  }

  async function alPulsar(ev) {
    if (ev.target.closest('[data-accion="dictar"]')) return dictar();
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
    // La caja crece al escribir; en el PC, Intro apunta y Mayús+Intro cambia de línea
    raiz.oninput = ev => { if (ev.target.matches('.bandeja-nueva textarea')) ajustarAlto(ev.target); };
    raiz.onkeydown = ev => {
      if (ev.target.matches('.bandeja-nueva textarea') && ev.key === 'Enter' && !ev.shiftKey && !matchMedia('(pointer: coarse)').matches) {
        ev.preventDefault();
        ev.target.form.requestSubmit();
      }
    };
    render();
  }

  // No recarga si estás escribiendo o dictando algo, para no perderlo
  function refrescar() {
    const t = raiz && raiz.querySelector('.bandeja-nueva textarea');
    if (t && !t.value && !rec) render();
  }

  return { montar, refrescar };
})();
