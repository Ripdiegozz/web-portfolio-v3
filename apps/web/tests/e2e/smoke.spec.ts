import { expect, test } from '@playwright/test';

test('blog post renders end to end', async ({ page }) => {
  await page.goto('/blog/');
  await page.getByRole('link').filter({ hasText: 'Hello, world' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hello, world/i);
});

test('contact happy path with mocked externals', async ({ page }) => {
  await page.goto('/');
  // On a cold dev server, Vite still has to transform the island's JS graph
  // on first request. Clicking submit before that hydration attaches makes
  // the browser fall back to a native form submission (full page reload).
  // Wait for the network to settle so the handler is attached first.
  await page.waitForLoadState('networkidle');
  const form = page.locator('form');
  await form.getByLabel(/name/i).fill('E2E Bot');
  await form.getByLabel(/email/i).fill('e2e@example.com');
  await form.getByLabel(/message/i).fill('Hello from the smoke suite.');
  await form.getByRole('button', { name: /send/i }).click();
  await expect(page.getByRole('status')).toContainText(/sent/i);
});
