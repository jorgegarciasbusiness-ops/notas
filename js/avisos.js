/* Avisos: activar o quitar las notificaciones de la agenda en este aparato */
const Avisos = (() => {
  const CAMPANA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  const soportado = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  let registro = null, boton = null;

  // La clave pública llega como texto (base64url); el navegador la quiere en bytes
  function aBytes(b64) {
    const relleno = '='.repeat((4 - b64.length % 4) % 4);
    const crudo = atob((b64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(crudo, c => c.charCodeAt(0));
  }

  async function estado() {
    if (!registro) return 'apagado';
    if (Notification.permission === 'denied') return 'bloqueado';
    const s = await registro.pushManager.getSubscription();
    return s && Notification.permission === 'granted' ? 'activo' : 'apagado';
  }

  async function pintar() {
    if (!boton) return;
    const e = await estado();
    const textos = { activo: 'Avisos activados', apagado: 'Activar avisos', bloqueado: 'Avisos bloqueados' };
    boton.querySelector('.tema-texto').textContent = textos[e];
    boton.classList.toggle('activo', e === 'activo');
    boton.setAttribute('aria-label', textos[e]);
  }

  async function activar() {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      return avisar('Sin permiso no puedo avisarte. Puedes darlo en los ajustes del iPhone o del navegador.');
    }
    try {
      const clave = await Datos.push.clavePublica();
      const sus = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clave) });
      const j = sus.toJSON();
      const aparato = /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'PC';
      await Datos.push.guardar({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, aparato });
      await Datos.push.probar(j.endpoint);
      avisar('Avisos activados. Te acaba de llegar uno de prueba.');
    } catch {
      avisar('No se han podido activar los avisos. Revisa la conexión y vuelve a probar.');
    }
  }

  async function desactivar() {
    if (!confirm('¿Dejar de recibir avisos en este aparato?')) return;
    const s = await registro.pushManager.getSubscription();
    if (s) {
      try { await Datos.push.borrar(s.endpoint); } catch { /* si falla, la nube lo borrará sola al ver que ya no existe */ }
      await s.unsubscribe();
    }
    avisar('Avisos quitados en este aparato.');
  }

  async function alPulsar() {
    const e = await estado();
    if (e === 'bloqueado') {
      return avisar('Los avisos están bloqueados. Actívalos en los ajustes del iPhone (Notificaciones → Notas) o del navegador.');
    }
    if (e === 'activo') await desactivar();
    else await activar();
    pintar();
  }

  async function iniciar() {
    boton = document.getElementById('avisos');
    // Solo con la nube y en aparatos que pueden recibirlos (en el iPhone, con la app en la pantalla de inicio)
    if (!boton || !soportado || Datos.modo !== 'nube') return;
    try {
      registro = await navigator.serviceWorker.register('sw.js');
    } catch {
      return;
    }
    boton.querySelector('.icono').innerHTML = CAMPANA;
    boton.hidden = false;
    boton.addEventListener('click', alPulsar);
    pintar();
  }

  return { iniciar };
})();
