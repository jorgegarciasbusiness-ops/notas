/*
 * Receptor de avisos de la app (service worker).
 * Solo enseña las notificaciones que manda la nube y abre la app al pulsarlas.
 * No guarda copias de la app: así cada versión nueva llega sin problemas.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', ev => ev.waitUntil(self.clients.claim()));

self.addEventListener('push', ev => {
  let d = {};
  try { d = ev.data ? ev.data.json() : {}; } catch { d = { texto: ev.data ? ev.data.text() : '' }; }
  ev.waitUntil(self.registration.showNotification(d.titulo || 'Notas', {
    body: d.texto || '',
    icon: 'iconos/icono-192.png',
    badge: 'iconos/icono-192.png',
    tag: d.tag,
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', ev => {
  ev.notification.close();
  ev.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ventanas => {
    for (const v of ventanas) if ('focus' in v) return v.focus();
    return self.clients.openWindow(ev.notification.data?.url || './');
  }));
});
