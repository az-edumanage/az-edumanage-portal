import { test, expect } from '@playwright/test';

test.describe('OAuth start buttons', () => {
  test('Google button navigates to backend OAuth start URL', async ({ page }) => {
    await page.goto('/owner/login', { waitUntil: 'networkidle' });

    const navPromise = page.waitForURL(/http:\/\/localhost:18080\/auth\/oauth2\/authorization\/google\?redirect_uri=.*/);
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await navPromise;

    expect(page.url()).toContain('/auth/oauth2/authorization/google');
    expect(page.url()).toContain('redirect_uri=');
  });

  test('Microsoft button navigates to backend OAuth start URL', async ({ page }) => {
    await page.goto('/owner/login', { waitUntil: 'networkidle' });

    const navPromise = page.waitForURL(/http:\/\/localhost:18080\/auth\/oauth2\/authorization\/microsoft\?redirect_uri=.*/);
    await page.getByRole('button', { name: 'Continue with Microsoft' }).click();
    await navPromise;

    expect(page.url()).toContain('/auth/oauth2/authorization/microsoft');
    expect(page.url()).toContain('redirect_uri=');
  });
});

