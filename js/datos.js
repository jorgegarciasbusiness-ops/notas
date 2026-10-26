/*
 * Capa de datos de la app. Los sectores solo hablan con "Datos".
 * - Si js/config.js tiene los datos de Supabase: guarda en la nube y pide entrar con tu correo.
 * - Si no: modo prueba, guarda en este navegador con datos de ejemplo.
 * Cada tabla ofrece lo mismo: listar(), crear(datos), actualizar(id, cambios), borrar(id).
 */
const Datos = (() => {
  const pad = n => String(n).padStart(2, '0');
  const aISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2));

  // Cómo es cada tabla: por qué campo se ordena y si lleva fecha de "actualizado"
  const TABLAS = {
    agenda: { orden: 'fecha', actualizado: true },
    bandeja: { orden: 'creado', actualizado: false },
    paginas: { orden: 'titulo', actualizado: true },
    gastos: { orden: 'fecha', actualizado: true },
    horas: { orden: 'fecha', actualizado: true },
    ahorros: { orden: 'fecha', actualizado: true },
    nominas: { orden: 'mes', actualizado: true },
    nomina_partidas: { orden: 'creado', actualizado: true },
    objetivos: { orden: 'creado', actualizado: true },
    contenido: { orden: 'fecha', actualizado: true },
  };
  // Horas tipo "08:00" o vacío; en la nube vacío es "nada"
  const hhmm = h => (h ? String(h).slice(0, 5) : '');
  const horaONada = (d, campos) => {
    const x = { ...d };
    for (const c of campos) if (c in x) x[c] = x[c] || null;
    return x;
  };

  const hayNube = typeof CONFIG !== 'undefined' && CONFIG.supabaseUrl && CONFIG.supabaseClave;
  return hayNube ? nube() : local();

  // ---------- Nube (Supabase) ----------
  function nube() {
    if (!window.supabase) {
      // No ha cargado la pieza de Supabase (sin internet): se pide entrar y avisa del fallo
      const sinConexion = async () => { throw new Error('sin conexión'); };
      const vacia = { listar: sinConexion, crear: sinConexion, actualizar: sinConexion, borrar: sinConexion };
      return { modo: 'nube', agenda: vacia, bandeja: vacia, paginas: vacia, gastos: vacia, horas: vacia, ahorros: vacia, nominas: vacia, nomina_partidas: vacia, objetivos: vacia, contenido: vacia, sesion: sinConexion, entrar: sinConexion, salir: async () => {} };
    }
    const sb = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseClave);
    const comprobar = ({ data, error }) => { if (error) throw error; return data; };
    const quitarSistema = d => {
      const x = { ...d };
      delete x.id; delete x.creado; delete x.actualizado; delete x.user_id;
      return x;
    };

    function tabla(nombre, { limpiar = f => f, preparar = d => d } = {}) {
      const { orden, actualizado } = TABLAS[nombre];
      return {
        async listar() {
          return comprobar(await sb.from(nombre).select('*').order(orden)).map(limpiar);
        },
        async crear(datos) {
          return limpiar(comprobar(await sb.from(nombre).insert(quitarSistema(preparar(datos))).select().single()));
        },
        async actualizar(id, cambios) {
          const fila = quitarSistema(preparar(cambios));
          if (actualizado) fila.actualizado = new Date().toISOString();
          return limpiar(comprobar(await sb.from(nombre).update(fila).eq('id', id).select().single()));
        },
        async borrar(id) {
          comprobar(await sb.from(nombre).delete().eq('id', id));
        },
      };
    }

    return {
      modo: 'nube',
      // En la nube la hora y las notas vacías se guardan como "nada"; la app las quiere como texto vacío
      agenda: tabla('agenda', {
        limpiar: f => ({ ...f, hora: hhmm(f.hora), notas: f.notas || '' }),
        preparar: d => horaONada(d, ['hora']),
      }),
      bandeja: tabla('bandeja'),
      paginas: tabla('paginas'),
      gastos: tabla('gastos', { limpiar: f => ({ ...f, importe: Number(f.importe) }) }),
      horas: tabla('horas', {
        limpiar: f => ({ ...f, entrada: hhmm(f.entrada), salida: hhmm(f.salida), horas: Number(f.horas) }),
        preparar: d => horaONada(d, ['entrada', 'salida']),
      }),
      ahorros: tabla('ahorros', {
        limpiar: f => ({ ...f, importe: Number(f.importe), objetivo_id: f.objetivo_id || '' }),
        preparar: d => ('objetivo_id' in d ? { ...d, objetivo_id: d.objetivo_id || null } : d),
      }),
      objetivos: tabla('objetivos', {
        limpiar: f => ({ ...f, importe: Number(f.importe), fecha_limite: f.fecha_limite || '' }),
        preparar: d => ('fecha_limite' in d ? { ...d, fecha_limite: d.fecha_limite || null } : d),
      }),
      nominas: tabla('nominas', { limpiar: f => ({ ...f, neto: Number(f.neto) }) }),
      contenido: tabla('contenido', {
        limpiar: f => ({ ...f, fecha: f.fecha || '', redes: f.redes || [], vistas: f.vistas ?? '' }),
        preparar: d => {
          const x = { ...d };
          if ('fecha' in x) x.fecha = x.fecha || null;
          if ('vistas' in x) x.vistas = x.vistas === '' || x.vistas == null ? null : Number(x.vistas);
          return x;
        },
      }),
      nomina_partidas: tabla('nomina_partidas', { limpiar: f => ({ ...f, importe: Number(f.importe) }) }),
      async sesion() { const { data } = await sb.auth.getSession(); return data.session; },
      async entrar(email, clave) {
        const { error } = await sb.auth.signInWithPassword({ email, password: clave });
        if (error) throw error;
      },
      async salir() { await sb.auth.signOut(); },
    };
  }

  // ---------- Modo prueba (este navegador) ----------
  function local() {
    const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return aISO(d); };
    const ahora = () => new Date().toISOString();

    // Datos de prueba, colocados alrededor de hoy
    const EJEMPLOS = {
      agenda: () => [
        ['Revisar el contrato', 'Trabajo', 'Tarea', 'Alta', 'Sin empezar', 0, '18:00'],
        ['Primer día de trabajo', 'Trabajo', 'Evento Personal', 'Alta', 'Sin empezar', 2, '09:00'],
        ['Entreno: pierna', 'Salud', 'Tarea', 'Media', 'Listo', -1, '10:00'],
        ['Entreno: torso', 'Salud', 'Tarea', 'Media', 'Sin empezar', 1, '19:30'],
        ['Elegir portada del próximo single', 'Kok$', 'Tarea', 'Alta', 'Sin empezar', -2, ''],
        ['Grabar reel del álbum', 'Kok$', 'content', 'Media', 'En progreso', 3, '17:00'],
        ['Ensayo con el grupo', 'Amor', 'Reunión', 'Media', 'Sin empezar', 4, '20:00'],
        ['Cerrar las horas del mes', 'Finanzas', 'Tarea', 'Alta', 'Sin empezar', 4, ''],
        ['Turno de tarde', 'Curros', 'Evento Personal', 'Media', 'Sin empezar', 5, '12:00'],
        ['Cena con amigos', 'Personal', 'Cita', 'Baja', 'Sin empezar', 6, '21:00'],
        ['Turno de mañana', 'Curros', 'Evento Personal', 'Media', 'Sin empezar', 7, '10:00'],
        ['Apuntar el gasto de la semana', 'Finanzas', 'Recordatorio', 'Baja', 'Sin empezar', 7, ''],
        ['Comprar zapatillas', 'Personal', 'Tarea', 'Baja', 'Sin empezar', 9, ''],
        ['Próximo lanzamiento', 'Kok$', 'Meta', 'Alta', 'Sin empezar', 33, ''],
        ['Mixtape lista', 'Amor', 'Meta', 'Media', 'Sin empezar', 70, ''],
      ].map(([nombre, ambito, tipo, prioridad, estado, n, hora]) => ({
        id: nuevoId(), nombre, fecha: dia(n), hora, tipo, prioridad, estado, ambito, notas: '',
        creado: ahora(), actualizado: ahora(),
      })),
      bandeja: () => [
        'Idea: grabar el gancho en el metro',
        'Mirar precio de unos auriculares de estudio',
      ].map(texto => ({ id: nuevoId(), texto, creado: ahora() })),
      paginas: () => [
        { titulo: 'Plan de prueba', seccion: 'Finanzas', contenido: '## Resumen\n\n| Partida | Importe |\n| --- | --- |\n| Fijos | 50 € |\n| Ahorro | 100 € |\n\n- [x] Abrir la app\n- [ ] Probar a editar esta página' },
        { titulo: 'Ideas de contenido', seccion: 'Kok$', contenido: '## Formatos\n\n- **Gancho en 10 sitios**\n- Detrás de cámaras\n\n> Lo que funciona se repite.' },
      ].map(p => ({ id: nuevoId(), orden: 0, creado: ahora(), actualizado: ahora(), ...p })),
      gastos: () => [
        [0, 12.5, 'Comida fuera', 'Comida'], [-1, 8, 'Cine', 'Ocio'], [-2, 4.2, 'Café y bollo', 'Comida'],
        [-8, 22, 'Camiseta', 'Ropa'], [-9, 15, 'Cena', 'Comida'], [-10, 20, 'Concierto', 'Ocio'],
      ].map(([n, importe, concepto, categoria]) => ({ id: nuevoId(), fecha: dia(n), importe, concepto, categoria, creado: ahora(), actualizado: ahora() })),
      horas: () => [
        [-6, '08:00', '14:00', 6], [-4, '07:00', '15:00', 8], [-1, '10:00', '15:00', 5],
      ].map(([n, entrada, salida, horas]) => ({ id: nuevoId(), fecha: dia(n), entrada, salida, horas, trabajo: 'Catering (Interim)', nota: '', creado: ahora(), actualizado: ahora() })),
      ahorros: () => [
        [-40, 70, 'Primer ingreso'], [-10, 500, 'Nómina'],
      ].map(([n, importe, nota]) => ({ id: nuevoId(), fecha: dia(n), importe, nota, creado: ahora(), actualizado: ahora() })),
      nominas: () => [],
      nomina_partidas: () => [],
      objetivos: () => [{ id: nuevoId(), nombre: 'Viaje de verano', importe: 1200, fecha_limite: dia(240), creado: ahora(), actualizado: ahora() }],
      contenido: () => [
        ['Gancho en 10 sitios #1', -3, ['TikTok'], 'Gancho en 10 sitios', 'Publicado', 1250],
        ['Nota del iPhone → la maceta', -1, ['TikTok'], 'Nota del iPhone a canción', 'Editado', ''],
        ['Detrás de cámaras · estudio', 1, ['TikTok', 'Instagram'], 'Detrás de cámaras', 'Por grabar', ''],
        ['Fragmento nuevo · tema de amor', 3, ['TikTok'], 'Fragmento nuevo', 'Idea', ''],
        ['Reel de la semana', 5, ['Instagram'], 'Otro', 'Programado', ''],
      ].map(([pieza, n, redes, formato, estado, vistas]) => ({ id: nuevoId(), pieza, fecha: dia(n), redes, formato, tema: '', estado, enlace: '', vistas, notas: '', creado: ahora(), actualizado: ahora() })),
    };

    function tabla(nombre) {
      const CLAVE = `notas.${nombre}.v1`;
      let filas = null;
      try { const t = localStorage.getItem(CLAVE); filas = t ? JSON.parse(t) : null; } catch { /* sin memoria */ }
      const escribir = () => { try { localStorage.setItem(CLAVE, JSON.stringify(filas)); } catch { /* sin espacio */ } };
      if (!filas) { filas = EJEMPLOS[nombre](); escribir(); }
      const { orden, actualizado } = TABLAS[nombre];
      return {
        async listar() {
          return filas.map(f => ({ ...f })).sort((a, b) => String(a[orden]).localeCompare(String(b[orden])));
        },
        async crear(datos) {
          const nueva = { id: nuevoId(), ...datos, creado: ahora() };
          if (actualizado) nueva.actualizado = ahora();
          filas.push(nueva);
          escribir();
          return { ...nueva };
        },
        async actualizar(id, cambios) {
          const f = filas.find(x => x.id === id);
          if (!f) return null;
          Object.assign(f, cambios, { id });
          if (actualizado) f.actualizado = ahora();
          escribir();
          return { ...f };
        },
        async borrar(id) {
          filas = filas.filter(x => x.id !== id);
          escribir();
        },
      };
    }

    return {
      modo: 'local',
      agenda: tabla('agenda'),
      bandeja: tabla('bandeja'),
      paginas: tabla('paginas'),
      gastos: tabla('gastos'),
      horas: tabla('horas'),
      ahorros: tabla('ahorros'),
      nominas: tabla('nominas'),
      nomina_partidas: tabla('nomina_partidas'),
      objetivos: tabla('objetivos'),
      contenido: tabla('contenido'),
      async sesion() { return { local: true }; },
      async entrar() {},
      async salir() {},
    };
  }
})();
