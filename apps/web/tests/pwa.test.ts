import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('apps/web/static/manifest.json', 'utf8')) as {
  name: string;
  short_name: string;
  start_url: string;
  scope?: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons?: { src: string; sizes: string; type: string; purpose?: string }[];
};

const layoutSource = readFileSync('apps/web/src/routes/+layout.svelte', 'utf8');
const serviceWorkerSource = readFileSync('apps/web/static/service-worker.js', 'utf8');
const TEST_ORIGIN = 'https://schngn.test';

function readPngDimensions(path: string): { width: number; height: number } {
  const image = readFileSync(path);
  expect(image.subarray(1, 4).toString('ascii')).toBe('PNG');
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20)
  };
}

type ServiceWorkerEventType = 'install' | 'activate' | 'message' | 'fetch';
type ServiceWorkerListener = (event: Record<string, unknown>) => void;

function cacheKey(input: unknown, origin = TEST_ORIGIN): string {
  const value =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : ((input as { url?: string })?.url ?? String(input));
  const url = new URL(value, origin);
  return `${url.pathname}${url.search}`;
}

function createServiceWorkerHarness(options?: {
  origin?: string;
  cacheNames?: string[];
  fetcher?: (input: unknown, init?: unknown) => Promise<Response>;
  match?: (input: unknown) => Promise<Response | undefined>;
}) {
  const origin = options?.origin ?? TEST_ORIGIN;
  const listeners = new Map<ServiceWorkerEventType, ServiceWorkerListener>();
  const cacheNames = new Set(options?.cacheNames ?? []);
  const cachePuts = new Map<string, string[]>();
  const deletedCaches: string[] = [];
  const fetchCalls: string[] = [];
  let claimed = false;

  const cacheStorage = {
    open: async (name: string) => {
      cacheNames.add(name);
      return {
        put: async (input: unknown) => {
          const puts = cachePuts.get(name) ?? [];
          puts.push(cacheKey(input, origin));
          cachePuts.set(name, puts);
        }
      };
    },
    keys: async () => [...cacheNames],
    delete: async (name: string) => {
      deletedCaches.push(name);
      return cacheNames.delete(name);
    },
    match: async (input: unknown) => options?.match?.(input)
  };

  const fetcher = async (input: unknown, init?: unknown): Promise<Response> => {
    fetchCalls.push(cacheKey(input, origin));
    if (options?.fetcher) return options.fetcher(input, init);
    return new Response('network', { status: 200 });
  };

  const serviceWorkerGlobal = {
    location: { origin },
    addEventListener: (type: ServiceWorkerEventType, listener: ServiceWorkerListener) => {
      listeners.set(type, listener);
    },
    skipWaiting: async () => undefined,
    clients: {
      claim: async () => {
        claimed = true;
      }
    }
  };

  const evaluate = new Function('self', 'caches', 'fetch', 'URL', 'Response', serviceWorkerSource);
  evaluate(serviceWorkerGlobal, cacheStorage, fetcher, URL, Response);

  return {
    dispatch(type: ServiceWorkerEventType, event: Record<string, unknown>) {
      const listener = listeners.get(type);
      if (!listener) throw new Error(`Missing ${type} listener`);
      listener(event);
    },
    cachePuts,
    deletedCaches,
    fetchCalls,
    get claimed() {
      return claimed;
    }
  };
}

describe('installable offline PWA shell', () => {
  test('manifest has installable app metadata and separate any and maskable icons', () => {
    expect(manifest.name).toBe('SCHNGN — Schengen 90/180 Calculator');
    expect(manifest.short_name).toBe('SCHNGN');
    expect(manifest.start_url).toBe('/app');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#10231f');
    expect(manifest.background_color).toBe('#f7f5ef');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({ src: '/icons/icon-maskable-192.png', sizes: '192x192', purpose: 'maskable' }),
        expect.objectContaining({ src: '/icons/icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' })
      ])
    );
    expect(readPngDimensions('apps/web/static/icons/icon-192.png')).toEqual({ width: 192, height: 192 });
    expect(readPngDimensions('apps/web/static/icons/icon-512.png')).toEqual({ width: 512, height: 512 });
    expect(readPngDimensions('apps/web/static/icons/icon-maskable-192.png')).toEqual({ width: 192, height: 192 });
    expect(readPngDimensions('apps/web/static/icons/icon-maskable-512.png')).toEqual({ width: 512, height: 512 });
  });

  test('layout registers the offline service worker only in browsers', () => {
    expect(layoutSource).toContain("import { browser } from '$app/environment'");
    expect(layoutSource).toContain('navigator.serviceWorker.register');
    expect(layoutSource).toContain('/service-worker.js');
  });

  test('layout only sends explicit shell and static URLs to the service worker', () => {
    expect(layoutSource).toContain('isSafeShellUrl(url)');
    expect(layoutSource).toContain("url.pathname === '/api'");
    expect(layoutSource).toContain("url.pathname.startsWith('/api/')");
    expect(layoutSource).toContain("url.pathname.startsWith('/_app/')");
    expect(layoutSource).toContain("isLocalDevelopment && safeLocalDevPrefixes.some");
    expect(layoutSource).toContain('urls.add(`${url.pathname}${url.search}`)');
  });

  test('HTML shell uses the new favicon family and production wordmark', () => {
    const appHtml = readFileSync('apps/web/src/app.html', 'utf8');
    expect(appHtml).toContain('<meta name="theme-color" content="#10231f" />');
    expect(appHtml).toContain('<link rel="icon" href="/favicon.ico" sizes="any" />');
    expect(appHtml).toContain('<link rel="icon" href="/favicon.png" type="image/png" sizes="64x64" />');
    expect(appHtml).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />');
    expect(existsSync('apps/web/static/favicon.ico')).toBe(true);
    expect(readPngDimensions('apps/web/static/favicon.png')).toEqual({ width: 64, height: 64 });
    expect(readPngDimensions('apps/web/static/icons/apple-touch-icon.png')).toEqual({ width: 180, height: 180 });
    expect(readPngDimensions('apps/web/static/brand/schngn-wordmark.png')).toEqual({ width: 864, height: 156 });
  });

  test('service worker caches the calculator shell and uses runtime cache fallback', () => {
    const source = serviceWorkerSource;

    expect(source).toContain("'/app'");
    expect(source).toContain("'/manifest.json'");
    expect(source).toContain('SCHNGN_STATIC_CACHE');
    expect(source).toContain('SCHNGN_RUNTIME_CACHE');
    expect(source).toContain('event.respondWith');
    expect(source).toContain('caches.match(request)');
  });

  test('authenticated API fetches bypass every service-worker cache path', () => {
    const harness = createServiceWorkerHarness();
    let responsePromise: Promise<Response> | undefined;

    harness.dispatch('fetch', {
      request: {
        method: 'GET',
        mode: 'cors',
        url: `${TEST_ORIGIN}/api/account/trips`
      },
      respondWith: (response: Promise<Response>) => {
        responsePromise = response;
      }
    });

    expect(responsePromise).toBeUndefined();
    expect(harness.fetchCalls).toEqual([]);
    expect([...harness.cachePuts.values()].flat()).toEqual([]);
  });

  test('precache messages cannot place authenticated API responses in a cache', async () => {
    const harness = createServiceWorkerHarness();
    const replies: unknown[] = [];
    let completion: Promise<unknown> | undefined;

    harness.dispatch('message', {
      data: {
        type: 'SCHNGN_CACHE_URLS',
        urls: ['/api/account/trips', `${TEST_ORIGIN}/api/account/trips`, '/favicon.png']
      },
      ports: [{ postMessage: (message: unknown) => replies.push(message) }],
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      }
    });

    await completion;
    expect(harness.fetchCalls).toEqual(['/favicon.png']);
    expect([...harness.cachePuts.values()].flat()).toEqual(['/favicon.png']);
    expect(replies).toEqual([{ ok: true, cached: 1 }]);
  });

  test('loopback development caches only explicit Vite dependencies and safe cache-busting queries', async () => {
    const origin = 'http://127.0.0.1:4173';
    const harness = createServiceWorkerHarness({ origin });
    const replies: unknown[] = [];
    let completion: Promise<unknown> | undefined;

    harness.dispatch('message', {
      data: {
        type: 'SCHNGN_CACHE_URLS',
        urls: [
          '/src/routes/app/+page.svelte?svelte&type=style&lang.css',
          '/@fs/Users/example/packages/engine/src/index.ts?v=6ca8cddd',
          '/api/account/trips',
          '/src/private.ts?token=not-a-static-version',
          'https://example.com/src/routes/app/+page.svelte'
        ]
      },
      ports: [{ postMessage: (message: unknown) => replies.push(message) }],
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      }
    });

    await completion;
    expect(harness.fetchCalls.sort()).toEqual([
      '/@fs/Users/example/packages/engine/src/index.ts?v=6ca8cddd',
      '/src/routes/app/+page.svelte?svelte&type=style&lang.css'
    ]);
    expect([...harness.cachePuts.values()].flat().sort()).toEqual(harness.fetchCalls);
    expect(replies).toEqual([{ ok: true, cached: 2 }]);
  });

  test('development source paths remain ineligible away from loopback', async () => {
    const harness = createServiceWorkerHarness();
    const replies: unknown[] = [];
    let completion: Promise<unknown> | undefined;

    harness.dispatch('message', {
      data: { type: 'SCHNGN_CACHE_URLS', urls: ['/src/routes/app/+page.svelte'] },
      ports: [{ postMessage: (message: unknown) => replies.push(message) }],
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      }
    });

    await completion;
    expect(harness.fetchCalls).toEqual([]);
    expect([...harness.cachePuts.values()].flat()).toEqual([]);
    expect(replies).toEqual([{ ok: true, cached: 0 }]);
  });

  test('runtime caching rejects private and no-store responses', async () => {
    const harness = createServiceWorkerHarness({
      fetcher: async () =>
        new Response('private', {
          status: 200,
          headers: { 'cache-control': 'private, no-store' }
        })
    });
    let responsePromise: Promise<Response> | undefined;

    harness.dispatch('fetch', {
      request: {
        method: 'GET',
        mode: 'cors',
        url: `${TEST_ORIGIN}/_app/immutable/entry/app.js`
      },
      respondWith: (response: Promise<Response>) => {
        responsePromise = response;
      }
    });

    expect(await responsePromise).toBeInstanceOf(Response);
    expect([...harness.cachePuts.values()].flat()).toEqual([]);
  });

  test('message precaching also rejects an otherwise safe no-store response', async () => {
    const harness = createServiceWorkerHarness({
      fetcher: async () =>
        new Response('do not cache', {
          status: 200,
          headers: { 'cache-control': 'no-store' }
        })
    });
    const replies: unknown[] = [];
    let completion: Promise<unknown> | undefined;

    harness.dispatch('message', {
      data: { type: 'SCHNGN_CACHE_URLS', urls: ['/favicon.png'] },
      ports: [{ postMessage: (message: unknown) => replies.push(message) }],
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      }
    });

    await completion;
    expect([...harness.cachePuts.values()].flat()).toEqual([]);
    expect(replies).toEqual([{ ok: true, cached: 0 }]);
  });

  test('activation purges legacy SCHNGN caches without deleting unrelated caches', async () => {
    const harness = createServiceWorkerHarness({
      cacheNames: [
        'schngn-static-v1',
        'schngn-runtime-v1',
        'schngn-static-v2',
        'schngn-runtime-v2',
        'schngn-static-v5',
        'schngn-runtime-v5',
        'schngn-static-v6',
        'schngn-runtime-v6',
        'schngn-static-v7',
        'schngn-runtime-v7',
        'other-origin-tool-cache'
      ]
    });
    let completion: Promise<unknown> | undefined;

    harness.dispatch('activate', {
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      }
    });

    await completion;
    expect(harness.deletedCaches.sort()).toEqual([
      'schngn-runtime-v1',
      'schngn-runtime-v2',
      'schngn-runtime-v5',
      'schngn-runtime-v6',
      'schngn-static-v1',
      'schngn-static-v2',
      'schngn-static-v5',
      'schngn-static-v6'
    ]);
    expect(harness.claimed).toBe(true);
  });

  test('the explicit app shell still falls back offline', async () => {
    const offlineShell = new Response('offline app shell', { status: 200 });
    const harness = createServiceWorkerHarness({
      fetcher: async () => {
        throw new Error('offline');
      },
      match: async (input) => (cacheKey(input) === '/app' ? offlineShell.clone() : undefined)
    });
    let responsePromise: Promise<Response> | undefined;

    harness.dispatch('fetch', {
      request: {
        method: 'GET',
        mode: 'navigate',
        url: `${TEST_ORIGIN}/app`
      },
      respondWith: (response: Promise<Response>) => {
        responsePromise = response;
      }
    });

    expect(await (await responsePromise)?.text()).toBe('offline app shell');
  });
});
