import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Omnivara web app.
 * Tests run against the local dev server (or CI build).
 *
 * Run:  cd apps/web && npx playwright test
 * UI:   cd apps/web && npx playwright test --ui
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter */
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  /* Start Next.js dev server for local E2E runs */
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'pnpm dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true as const,
          timeout: 120_000,
        },
      }),
});
