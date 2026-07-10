import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 }
      }
    }
  ],
  webServer: {
    command: `bun run dev -- --host 127.0.0.1 --port ${port}`,
    env: {
      // Browser tests inject a deterministic Clerk client before app code runs.
      // A non-secret public key keeps the production path enabled without
      // contacting Clerk or relying on a real test tenant.
      PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_schngn_playwright'
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
