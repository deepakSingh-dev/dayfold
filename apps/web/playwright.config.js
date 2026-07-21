import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright smoke config. Uses the system Chrome (channel 'chrome') so no
 * browser download is needed. Assumes the stack is already running:
 *   docker compose up -d && npm run dev
 * (with DEV_AUTH_BYPASS=false so the real signup/login flow is exercised).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
