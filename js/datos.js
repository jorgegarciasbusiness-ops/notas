/*
 * Capa de datos de la app. Los sectores solo hablan con "Datos".
 * - Si js/config.js tiene los datos de Supabase: guarda en la nube y pide entrar con tu correo.
 * - Si no: modo prueba, guarda en este navegador con datos de ejemplo.
 */
const Datos = (() => {
  const pad = n => String(n).padStart(2, '0');
  const aISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2));

  const hayNube = typeof CONFIG !== 'undefined' && CONFIG.supabaseUrl && CONFIG.supabaseClave;
  return hayNube ? nube() : local();

  // ---------- Nube (Supabase) ----------
  function nube() {
    if (!window.supabase) {
      // No ha cargado la pieza de Supabase (sin internet): se pide entrar y avisa del fallo
      const sinConexion = async () => { throw new Error('sin conexión'); };
      return { modo: 'nube', agenda: {}, sesion: sinConexion, entrar: sinConexion, salir: async () => {} };
    }
    const sb = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseClave);
    const comprobar = ({ data, error }) => { if (error) throw error; return data; };
    // En la nube la hora y las notas vacías se guardan como "nada"; la app las quiere como texto vacío
    const limpiar = f => ({ ...f, hora: f.hora ? f.hora.slice(0, 5) : '', notas: f.notas || '' });
    const preparar = d => {
      const x = { ...d };
      if ('hora' in x) x.hora = x.hora || null;
      delete x.id; delete x.creado; delete x.actualizado; delete x.user_id;
      return x;
    };

    const agenda = {
      async listar() {
        return comprobar(await sb.from('agenda').select('*').order('fecha')).map(limpiar);
      },
      async crear(datos) {
        return limpiar(comprobar(await sb.from('agenda').insert(preparar(datos)).select().single()));
      },
      async actualizar(id, cambios) {
        const fila = { ...preparar(cambios), actualizado: new Date().toISOString() };
        return limpiar(comprobar(await sb.from('agenda').update(fila).eq('id', id).select().single()));
      },
      async borrar(id) {
        comprobar(await sb.from('agenda').delete().eq('id', id));
      },
    };

    return {
      modo: 'nube',
      agenda,
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
    const CLAVE = 'notas.agenda.v1';

    function leer() {
      try {
        const texto = localStorage.getItem(CLAVE);
        return texto ? JSON.parse(texto) : null;
      } catch { return null; }
    }
    function escribir(lista) {
      try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin espacio o bloqueado */ }
    }

    // Datos de prueba, colocados alrededor de hoy
    function ejemplos() {
      const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return aISO(d); };
      const filas = [
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
      ];
      const ahora = new Date().toISOString();
      return filas.map(([nombre, ambito, tipo, prioridad, estado, n, hora]) => ({
        id: nuevoId(), nombre, fecha: dia(n), hora, tipo, prioridad, estado, ambito, notas: '',
        creado: ahora, actualizado: ahora,
      }));
    }

    let entradas = leer();
    if (!entradas) { entradas = ejemplos(); escribir(entradas); }

    const agenda = {
      async listar() { return entradas.map(e => ({ ...e })); },
      async crear(datos) {
        const ahora = new Date().toISOString();
        const nueva = { id: nuevoId(), notas: '', hora: '', ...datos, creado: ahora, actualizado: ahora };
        entradas.push(nueva);
        escribir(entradas);
        return { ...nueva };
      },
      async actualizar(id, cambios) {
        const e = entradas.find(x => x.id === id);
        if (!e) return null;
        Object.assign(e, cambios, { id, actualizado: new Date().toISOString() });
        escribir(entradas);
        return { ...e };
      },
      async borrar(id) {
        entradas = entradas.filter(x => x.id !== id);
        escribir(entradas);
      },
    };

    return {
      modo: 'local',
      agenda,
      async sesion() { return { local: true }; },
      async entrar() {},
      async salir() {},
    };
  }
})();
