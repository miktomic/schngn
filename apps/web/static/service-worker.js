const SCHNGN_STATIC_CACHE = 'schngn-static-v1';
const SCHNGN_RUNTIME_CACHE = 'schngn-runtime-v1';

const APP_SHELL_URLS = [
  '/',
  '/app',
  '/accuracy',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SCHNGN_STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SCHNGN_STATIC_CACHE, SCHNGN_RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SCHNGN_CACHE_URLS') return;

  const port = event.ports[0];
  const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
  event.waitUntil(
    caches
      .open(SCHNGN_STATIC_CACHE)
      .then((cache) => cache.addAll(urls.filter((url) => typeof url === 'string' && url.startsWith('/'))))
      .then(() => port?.postMessage({ ok: true }))
      .catch(() => port?.postMessage({ ok: false }))
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(SCHNGN_RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('/app');
          return Response.error();
        })
      )
  );
});
