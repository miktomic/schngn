const SCHNGN_CACHE_PREFIX = 'schngn-';
const SCHNGN_STATIC_CACHE = 'schngn-static-v5';
const SCHNGN_RUNTIME_CACHE = 'schngn-runtime-v5';

const SAFE_NAVIGATION_PATHS = new Set(['/', '/app', '/accuracy']);
const LOCALE_PREFIXES = ['fr', 'de', 'es', 'it', 'ru', 'tr', 'he', 'ar'];
const SAFE_STATIC_PATHS = new Set([
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/robots.txt',
  '/sitemap.xml',
  '/service-worker.js'
]);
const SAFE_STATIC_PREFIXES = ['/_app/', '/brand/', '/icons/'];
const SAFE_LOCAL_DEV_STATIC_PREFIXES = [
  '/@vite/',
  '/@id/',
  '/@fs/',
  '/.svelte-kit/',
  '/node_modules/.vite/',
  '/src/'
];

const BASE_APP_SHELL_URLS = [
  '/',
  '/app',
  '/accuracy',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/brand/schngn-wordmark.png',
  '/brand/schngn-social.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png'
];
const APP_SHELL_URLS = [
  ...BASE_APP_SHELL_URLS,
  ...LOCALE_PREFIXES.flatMap((locale) => [`/${locale}`, `/${locale}/app`, `/${locale}/accuracy`])
];

function isApiPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function isSafeNavigationPath(pathname) {
  if (SAFE_NAVIGATION_PATHS.has(pathname)) return true;
  const segments = pathname.split('/').filter(Boolean);
  if (!LOCALE_PREFIXES.includes(segments[0])) return false;
  const basePath = segments.length === 1 ? '/' : `/${segments.slice(1).join('/')}`;
  return SAFE_NAVIGATION_PATHS.has(basePath);
}

function localizedAppPath(pathname) {
  const locale = pathname.split('/').filter(Boolean)[0];
  return LOCALE_PREFIXES.includes(locale) ? `/${locale}/app` : '/app';
}

function isSafeStaticPath(pathname) {
  return (
    SAFE_STATIC_PATHS.has(pathname) || SAFE_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isLocalDevelopmentOrigin() {
  const hostname = new URL(self.location.origin).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isSafeLocalDevStaticPath(pathname) {
  return (
    isLocalDevelopmentOrigin() &&
    SAFE_LOCAL_DEV_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isSafeLocalDevSearch(search) {
  return (
    search === '' ||
    /^\?v=[a-z0-9_-]+$/i.test(search) ||
    /^\?t=\d+$/.test(search) ||
    search === '?svelte&type=style&lang.css'
  );
}

function isSafeStaticUrl(url) {
  if (isSafeStaticPath(url.pathname)) return url.search === '';
  if (isSafeLocalDevStaticPath(url.pathname)) return isSafeLocalDevSearch(url.search);
  return false;
}

function toSafeCacheUrl(candidate) {
  if (typeof candidate !== 'string') return null;

  try {
    const url = new URL(candidate, self.location.origin);
    if (url.origin !== self.location.origin) return null;
    if (url.hash || isApiPath(url.pathname)) return null;
    if (isSafeNavigationPath(url.pathname) && url.search === '') return url.pathname;
    if (!isSafeStaticUrl(url)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function isSafeRuntimeRequest(request, url) {
  if (isApiPath(url.pathname) || url.hash) return false;
  if (request.mode === 'navigate') return url.search === '' && isSafeNavigationPath(url.pathname);
  return isSafeStaticUrl(url);
}

function isCacheEligibleResponse(response) {
  if (!response || !response.ok || response.status !== 200 || response.redirected) return false;
  if (!['basic', 'default'].includes(response.type)) return false;

  const cacheControl = response.headers.get('cache-control')?.toLowerCase() ?? '';
  if (cacheControl.includes('no-store') || cacheControl.includes('private')) return false;
  if (response.headers.get('vary')?.trim() === '*') return false;

  return true;
}

async function cacheEligibleUrls(cache, candidates) {
  const urls = [...new Set(candidates.map(toSafeCacheUrl).filter(Boolean))];
  const cached = await Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' });
      if (!isCacheEligibleResponse(response)) return false;
      await cache.put(url, response.clone());
      return true;
    })
  );

  return cached.filter(Boolean).length;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SCHNGN_STATIC_CACHE)
      .then((cache) => cacheEligibleUrls(cache, APP_SHELL_URLS))
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
            .filter(
              (key) =>
                key.startsWith(SCHNGN_CACHE_PREFIX) &&
                ![SCHNGN_STATIC_CACHE, SCHNGN_RUNTIME_CACHE].includes(key)
            )
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
      .then((cache) => cacheEligibleUrls(cache, urls))
      .then((cached) => port?.postMessage({ ok: true, cached }))
      .catch(() => port?.postMessage({ ok: false }))
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isApiPath(url.pathname)) return;
  if (!isSafeRuntimeRequest(request, url)) return;

  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (isCacheEligibleResponse(response)) {
          try {
            const cache = await caches.open(SCHNGN_RUNTIME_CACHE);
            await cache.put(request, response.clone());
          } catch {
            // A cache write must never turn a successful network response into a failure.
          }
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') return (await caches.match(localizedAppPath(url.pathname))) ?? (await caches.match('/app')) ?? Response.error();
        return Response.error();
      })
  );
});
