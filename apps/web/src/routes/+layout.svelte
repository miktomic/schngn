<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import '../app.css';

  let { children } = $props();

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
    const urls = new Set(['/', '/app', '/accuracy', '/manifest.json', '/favicon.svg', location.pathname]);

    for (const entry of performance.getEntriesByType('resource')) {
      const resource = entry as PerformanceResourceTiming;
      const url = new URL(resource.name);
      if (url.origin === location.origin) urls.add(`${url.pathname}${url.search}`);
    }

    return [...urls];
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
