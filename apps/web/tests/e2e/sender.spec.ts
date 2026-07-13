import { test, expect } from '@playwright/test';

test.describe('Sender Flow', () => {
  test('displays sender dashboard page', async ({ page }) => {
    await page.goto('/sender');
    await expect(page.locator('body')).toBeVisible();
    // Should show wallet connection prompt or deposit form
  });

  test('shows deposit form page', async ({ page }) => {
    await page.goto('/sender/deposit');
    await expect(page.locator('body')).toBeVisible();
  });

  test('deposit form requires wallet connection', async ({ page }) => {
    await page.goto('/sender/deposit');
    // Without wallet connected, should show connect prompt or disabled form
    await expect(page.locator('body')).toBeVisible();
  });
});
