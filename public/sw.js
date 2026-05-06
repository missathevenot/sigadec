// Service Worker SIGADEC — requis pour l'installation PWA
const CACHE_NAME = 'sigadec-v1';
const STATIC_ASSETS = ['/sigadec/', '/sigadec/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Stratégie : réseau en priorité, cache en secours (Network First)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Met à jour le cache pour les requêtes GET réussies
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
