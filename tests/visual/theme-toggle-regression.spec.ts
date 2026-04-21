import { test, expect, type Page } from '@playwright/test';

type UserRole = 'owner' | 'tenant' | 'teacher';

const CORE_ROUTES: Array<{ role: UserRole; path: string }> = [
  { role: 'owner', path: '/owner/overview' },
  { role: 'tenant', path: '/tenant/overview' },
  { role: 'teacher', path: '/teacher/overview' },
];

async function ensureRole(page: Page, role: UserRole): Promise<void> {
  await page.goto('/owner/overview', { waitUntil: 'networkidle' });
  if (role === 'owner') return;

  await page.getByRole('button', { name: role, exact: true }).first().click();
  await page.waitForURL(new RegExp(`/${role}/overview`));
}

test.describe('Theme Toggle Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
  });

  for (const route of CORE_ROUTES) {
    test(`applies and persists classes on ${route.role} shell route`, async ({ page }) => {
      await ensureRole(page, route.role);
      await page.goto(route.path, { waitUntil: 'networkidle' });

      await expect(page.getByTitle('Switch to Light Mode')).toBeVisible();

      const darkState = await page.evaluate(() => ({
        theme: localStorage.getItem('theme'),
        classes: Array.from(document.documentElement.classList),
        colorScheme: document.documentElement.style.colorScheme,
      }));

      expect(darkState.theme).toBe('dark');
      expect(darkState.classes).toContain('theme-brand');
      expect(darkState.classes).toContain('theme-dark');
      expect(darkState.classes).toContain('dark');
      expect(darkState.classes).not.toContain('theme-light');
      expect(darkState.colorScheme).toBe('dark');

      await page.getByTitle('Switch to Light Mode').click();
      await expect(page.getByTitle('Switch to Dark Mode')).toBeVisible();

      const lightState = await page.evaluate(() => ({
        theme: localStorage.getItem('theme'),
        classes: Array.from(document.documentElement.classList),
        colorScheme: document.documentElement.style.colorScheme,
      }));

      expect(lightState.theme).toBe('light');
      expect(lightState.classes).toContain('theme-brand');
      expect(lightState.classes).toContain('theme-light');
      expect(lightState.classes).not.toContain('theme-dark');
      expect(lightState.classes).not.toContain('dark');
      expect(lightState.colorScheme).toBe('light');
    });
  }
});
