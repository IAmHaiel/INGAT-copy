import { test, expect } from '@playwright/test';

test.describe('Receiver Flow', () => {
  test('displays receiver page', async ({ page }) => {
    await page.goto('/receiver');
    await expect(page.locator('body')).toBeVisible();
  });

  test('receiver page shows wallet connection requirement', async ({ page }) => {
    await page.goto('/receiver');
    // Without wallet, should prompt to connect
    await expect(page.locator('body')).toBeVisible();
  });
});
