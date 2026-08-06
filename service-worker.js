/* ERP Municipal San Pedro — Service Worker de recuperación V31 */
const CACHE_PREFIX = 'erp-san-pedro-';
const CACHE_VERSION = `${CACHE_PREFIX}v31`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

/* Sin controlador fetch: la aplicación siempre usa la versión publicada. */
