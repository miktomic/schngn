<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate } from '$app/navigation';
  import { initializePlausibleAnalytics } from '$lib/analytics/plausibleClient';
  import { trackAnalyticsEvent } from '$lib/analytics/privacyAnalytics';
  import { isLocalizedNavigationPath, stripLocalePrefix } from '$lib/i18n';
  import { onMount } from 'svelte';
  import '../app.css';

  let { children } = $props();

  if (browser) void initializePlausibleAnalytics(window);

  afterNavigate(({ to }) => {
    const pathname = to ? stripLocalePrefix(to.url.pathname) : '';
    if (pathname === '/') trackAnalyticsEvent('page_view', { source: 'landing' });
    if (pathname === '/accuracy') trackAnalyticsEvent('page_view', { source: 'accuracy' });
  });

  onMount(() => {
    if (!browser || !('serviceWorker' in navigator)) return;

    const offlineWindow = window as unknown as { __schngnOfflineReady?: Promise<boolean> };
    offlineWindow.__schngnOfflineReady = prepareOfflineShell();
  });

  async function prepareOfflineShell(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;
      await waitForController();

      const worker = navigator.serviceWorker.controller;
      if (!worker) return false;

      const urls = collectShellUrls();
      await cacheShellUrls(worker, urls);
      return true;
    } catch {
      return false;
    }
  }

  function waitForController(): Promise<void> {
    if (navigator.serviceWorker.controller) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        reject(new Error('Service worker controller timed out'));
      }, 5000);

      function onControllerChange(): void {
        window.clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        resolve();
      }

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    });
  }

  function collectShellUrls(): string[] {
    const urls = new Set<string>();
    const candidates = ['/', '/app', '/accuracy', '/explainer', '/faq', '/contact', '/manifest.json', '/favicon.ico', '/favicon.png', location.pathname];

    for (const candidate of candidates) {
      const url = new URL(candidate, location.origin);
      if (isSafeShellUrl(url)) urls.add(`${url.pathname}${url.search}`);
    }

    for (const entry of performance.getEntriesByType('resource')) {
      const resource = entry as PerformanceResourceTiming;
      const url = new URL(resource.name);
      if (isSafeShellUrl(url)) urls.add(`${url.pathname}${url.search}`);
    }

    return [...urls];
  }

  function isSafeShellUrl(url: URL): boolean {
    if (url.origin !== location.origin || url.hash) return false;
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return false;

    const safeStaticPaths = new Set([
      '/manifest.json',
      '/favicon.ico',
      '/favicon.png',
      '/robots.txt',
      '/sitemap.xml',
      '/service-worker.js'
    ]);

    const isProductionShellAsset =
      isLocalizedNavigationPath(url.pathname) ||
      safeStaticPaths.has(url.pathname) ||
      url.pathname.startsWith('/_app/') ||
      url.pathname.startsWith('/brand/') ||
      url.pathname.startsWith('/icons/');
    if (isProductionShellAsset) return url.search === '';

    const isLocalDevelopment = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const safeLocalDevPrefixes = [
      '/@vite/',
      '/@id/',
      '/@fs/',
      '/.svelte-kit/',
      '/node_modules/.vite/',
      '/src/'
    ];
    const isLocalDevAsset =
      isLocalDevelopment && safeLocalDevPrefixes.some((prefix) => url.pathname.startsWith(prefix));
    const hasSafeLocalDevSearch =
      url.search === '' ||
      url.search === '?import' ||
      /^\?v=[a-z0-9_-]+$/i.test(url.search) ||
      /^\?t=\d+$/.test(url.search) ||
      url.search === '?svelte&type=style&lang.css';

    return isLocalDevAsset && hasSafeLocalDevSearch;
  }

  function cacheShellUrls(worker: ServiceWorker, urls: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => reject(new Error('Offline shell cache timed out')), 5000);

      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout);
        if (event.data?.ok) resolve();
        else reject(new Error('Offline shell cache failed'));
      };

      worker.postMessage({ type: 'SCHNGN_CACHE_URLS', urls }, [channel.port2]);
    });
  }
</script>

{@render children()}
