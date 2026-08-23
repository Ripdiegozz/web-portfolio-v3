import { defineConfig } from '@playwright/test';

// Local runs against an external Astro daemon (pre-started because bunx
// wrapping through Playwright's process spawn is flaky on Windows); CI
// (ubuntu) spawns the dev server itself via webServer.command.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'bunx astro dev',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      E2E_MOCKS: '1',
      PUBLIC_E2E_MOCKS: '1',
      KEYSTATIC_DEV_LOCAL: '1',
    },
  },
});
