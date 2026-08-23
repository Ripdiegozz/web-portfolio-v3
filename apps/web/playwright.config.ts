import { defineConfig } from '@playwright/test';

// CI runs the webServer itself (bun run dev acts normally on Linux). On
// Windows, bunx wrapping through Playwright's process spawn exits early, so
// local runs reuse the Astro daemon started externally (see scripts/e2e-local).
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
