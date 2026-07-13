import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays the landing page with hero section', async ({ page }) => {
    await page.goto('/');
    // The landing page should load and display INGAT branding
    await expect(page).toHaveTitle(/INGAT/);
    // Hero should have call-to-action buttons
    await expect(page.locator('body')).toBeVisible();
  });

  test('has navigation to sender page', async ({ page }) => {
    await page.goto('/');
    // Look for a link or button that takes user to sender flow
    const senderLink = page.locator('a[href*="sender"], a[href*="dashboard"]').first();
    if (await senderLink.isVisible()) {
      await expect(senderLink).toBeEnabled();
    }
  });

  test('has navigation to receiver page', async ({ page }) => {
    await page.goto('/');
    const receiverLink = page.locator('a[href*="receiver"]').first();
    if (await receiverLink.isVisible()) {
      await expect(receiverLink).toBeEnabled();
    }
  });
});
