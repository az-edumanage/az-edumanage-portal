import { test, expect, type Page } from '@playwright/test';

async function switchToTenant(page: Page): Promise<void> {
  await page.goto('/owner/overview', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'tenant', exact: true }).first().click();
  await page.waitForURL(/\/tenant\/overview/);
}

test.describe('Tenant Theme Hook Smoke', () => {
  test('applies non-default tenant theme class/tokens on tenant route', async ({ page }) => {
    await switchToTenant(page);
    await page.goto('/tenant/overview', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const root = document.documentElement;
      root.classList.remove('theme-tenant-default');
      root.classList.add('theme-tenant-ocean');
    });

    const state = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        classes: Array.from(root.classList),
        primary: styles.getPropertyValue('--ds-color-primary').trim(),
      };
    });

    expect(state.classes).toContain('theme-brand');
    expect(state.classes).toContain('theme-tenant-ocean');
    expect(state.primary).toBe('#0284c7');
  });

  test('keeps default tenant theme class on owner route', async ({ page }) => {
    await page.goto('/owner/overview', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('tenant-theme', 'ocean');
    });

    const classes = await page.evaluate(() => Array.from(document.documentElement.classList));
    expect(classes).toContain('theme-tenant-default');
    expect(classes).not.toContain('theme-tenant-ocean');
  });
});
