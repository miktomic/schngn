import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createCspDirectives } from './csp.config.js';

const development = process.env.NODE_ENV === 'development';
const prerenderedLocales = ['fr', 'de', 'es', 'it', 'pt-br', 'ru', 'uk', 'tr', 'sr', 'sq', 'ka', 'zh-cn', 'ja', 'ko', 'he', 'ar'];
const localizedPrerenderEntries = prerenderedLocales
  .flatMap((locale) => [`/${locale}`, `/${locale}/app`, `/${locale}/accuracy`, `/${locale}/explainer`, `/${locale}/faq`, `/${locale}/agents`, `/${locale}/contact`, `/${locale}/privacy`, `/${locale}/terms`]);
const clientOnlyAppPaths = new Set(['/app', ...prerenderedLocales.map((locale) => `/${locale}/app`)]);

/** @type {import('@sveltejs/kit').PrerenderMissingIdHandler} */
export const handleMissingClientOnlyAnchor = ({ path, id, message }) => {
  // `/app` is intentionally client-rendered, so its conditional Account target
  // exists only after hydration. Every other missing anchor remains a build error.
  if (id === 'account' && clientOnlyAppPaths.has(path)) return;
  throw new Error(message);
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<build>', '<files>']
      }
    }),
    csp: {
      // Dynamic pages receive nonces; prerendered pages receive build-time hashes.
      mode: 'auto',
      directives: createCspDirectives({ development })
    },
    prerender: {
      entries: ['*', ...localizedPrerenderEntries],
      handleMissingId: handleMissingClientOnlyAnchor
    }
  }
};

export default config;
