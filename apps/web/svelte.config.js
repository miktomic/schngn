import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createCspDirectives } from './csp.config.js';

const development = process.env.NODE_ENV === 'development';

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
    }
  }
};

export default config;
