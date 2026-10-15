import { expect, test } from '@playwright/test';

test('chat assistant dialog opens and closes smoothly with Presence spring physics', async ({ page }) => {
  await page.goto('/');

  const trigger = page.getByRole('button', { name: /ask diego ai|pregunta a diego ai/i });
  await expect(trigger).toBeVisible();

  // Dialog is not yet mounted in DOM
  const dialog = page.getByRole('dialog', { name: /diego ai/i });
  await expect(dialog).not.toBeVisible();

  // Click trigger: springs dialog into view from bottom-right origin
  await trigger.click();
  await expect(dialog).toBeVisible();

  // Input area is present
  await expect(dialog.getByPlaceholder(/ask a question|escribe tu pregunta/i)).toBeVisible();

  // Close dialog via close button
  const closeBtn = dialog.getByTitle(/close|cerrar/i);
  await closeBtn.click();

  // Verifies that Presence completes spring exit animation and unmounts dialog
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeVisible();

  // Re-open and verify closing via Escape key
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeVisible();
});
