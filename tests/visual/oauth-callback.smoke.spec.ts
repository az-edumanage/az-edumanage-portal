import { test, expect } from '@playwright/test';

const TOKEN_STORAGE_KEY = 'beedu.auth.token';

test.describe('OAuth callback smoke', () => {
  test('handles oauth success callback and redirects with clean URL', async ({ page }) => {
    let meCalled = false;

    await page.route('**/api/v1/auth/me', async (route) => {
      meCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'oauth.user',
          roles: ['OWNER'],
          primaryRole: 'OWNER',
          tenantId: null,
        }),
      });
    });

    const oauthToken = 'oauth-token-smoke';
    await page.goto(
      `/owner/login?oauth=success&accessToken=${encodeURIComponent(oauthToken)}&username=oauth.user&provider=GOOGLE`,
      { waitUntil: 'networkidle' },
    );

    await page.waitForURL('**/owner/overview');
    expect(meCalled).toBe(true);

    const storedToken = await page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY);
    expect(storedToken).toBe(oauthToken);

    const finalUrl = page.url();
    expect(finalUrl).not.toContain('oauth=');
    expect(finalUrl).not.toContain('accessToken=');
    expect(finalUrl).not.toContain('provider=');
    expect(finalUrl).not.toContain('reason=');
  });

  test('handles oauth error callback and keeps user on login with clean URL', async ({ page }) => {
    let meCalled = false;

    await page.route('**/api/v1/auth/me', async (route) => {
      meCalled = true;
      await route.abort();
    });

    await page.goto('/owner/login?oauth=error&reason=access_denied', {
      waitUntil: 'networkidle',
    });

    await expect(page).toHaveURL(/\/owner\/login(?:\?.*)?$/);
    await expect(page.getByText('OAuth login was cancelled or denied.')).toBeVisible();
    expect(meCalled).toBe(false);

    const finalUrl = page.url();
    expect(finalUrl).not.toContain('oauth=');
    expect(finalUrl).not.toContain('accessToken=');
    expect(finalUrl).not.toContain('provider=');
    expect(finalUrl).not.toContain('reason=');
  });
});

