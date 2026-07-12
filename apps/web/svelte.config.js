import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createCspDirectives } from './csp.config.js';

const development = process.env.NODE_ENV === 'development';
const localizedPrerenderEntries = ['fr', 'de', 'es', 'it', 'pt-br', 'ru', 'uk', 'tr', 'sr', 'sq', 'ka', 'zh-cn', 'ja', 'ko', 'he', 'ar']
  .flatMap((locale) => [`/${locale}`, `/${locale}/app`, `/${locale}/accuracy`, `/${locale}/explainer`, `/${locale}/faq`, `/${locale}/contact`]);

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
      entries: ['*', ...localizedPrerenderEntries]
    }
  }
};

export default config;
