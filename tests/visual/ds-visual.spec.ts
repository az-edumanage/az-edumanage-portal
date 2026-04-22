import { test, expect, type Page } from '@playwright/test';

type ThemeMode = 'brand' | 'light' | 'dark';
type UserRole = 'owner' | 'tenant' | 'teacher';

const THEMES: ThemeMode[] = ['brand', 'light', 'dark'];
const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900 },
  { key: 'mobile', width: 390, height: 844 },
] as const;

const P0_ROUTES: Array<{ key: string; path: string; role: UserRole }> = [
  { key: 'owner-overview', path: '/owner/overview', role: 'owner' },
  { key: 'owner-tenants', path: '/owner/tenants', role: 'owner' },
  { key: 'owner-tenants-create', path: '/owner/tenants/create', role: 'owner' },
  { key: 'owner-plans', path: '/owner/plans', role: 'owner' },
  { key: 'owner-plan-create', path: '/owner/plans/create', role: 'owner' },
  { key: 'owner-plans-details', path: '/owner/plans/plan-001', role: 'owner' },
  { key: 'owner-subscriptions', path: '/owner/subscriptions', role: 'owner' },
  { key: 'owner-subscriptions-templates', path: '/owner/subscriptions/templates', role: 'owner' },
  { key: 'owner-subscription-template-details', path: '/owner/subscriptions/templates/TMP_001', role: 'owner' },
  { key: 'owner-subscription-details', path: '/owner/subscriptions/sub-001', role: 'owner' },
  { key: 'owner-subscription-create', path: '/owner/subscriptions/create', role: 'owner' },
  { key: 'owner-subscriptions-orders', path: '/owner/subscriptions/orders', role: 'owner' },
  { key: 'owner-billing', path: '/owner/billing', role: 'owner' },
  { key: 'owner-analytics', path: '/owner/analytics', role: 'owner' },
  { key: 'owner-compliance', path: '/owner/compliance', role: 'owner' },
  { key: 'owner-users', path: '/owner/users', role: 'owner' },
  { key: 'owner-tenant-details', path: '/owner/tenants/tenant-001', role: 'owner' },
  { key: 'owner-tenant-edit', path: '/owner/tenants/tenant-001/edit', role: 'owner' },
  { key: 'owner-provisioning-settings', path: '/owner/provisioning/settings', role: 'owner' },
  { key: 'owner-settings', path: '/owner/settings', role: 'owner' },
  { key: 'tenant-overview', path: '/tenant/overview', role: 'tenant' },
  { key: 'tenant-students', path: '/tenant/students', role: 'tenant' },
  { key: 'tenant-students-create', path: '/tenant/students/create', role: 'tenant' },
  { key: 'tenant-groups', path: '/tenant/groups', role: 'tenant' },
  { key: 'tenant-groups-create', path: '/tenant/groups/create', role: 'tenant' },
  { key: 'tenant-groups-details', path: '/tenant/groups/group-001', role: 'tenant' },
  { key: 'tenant-group-attendance', path: '/tenant/groups/group-001/attendance', role: 'tenant' },
  { key: 'tenant-rooms', path: '/tenant/rooms', role: 'tenant' },
  { key: 'tenant-grade-details', path: '/tenant/grades/grade-001', role: 'tenant' },
  { key: 'teacher-overview', path: '/teacher/overview', role: 'teacher' },
  { key: 'teacher-media', path: '/teacher/media', role: 'teacher' },
  { key: 'design-system', path: '/design-system', role: 'tenant' },
];

async function applyTheme(page: Page, theme: ThemeMode): Promise<void> {
  await page.evaluate((mode) => {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add('theme-brand');

    // Brand parity currently maps to the existing default dark presentation.
    if (mode === 'brand') {
      localStorage.setItem('theme', 'dark');
      html.classList.add('dark');
      html.classList.add('theme-dark');
      html.style.colorScheme = 'dark';
      return;
    }

    localStorage.setItem('theme', mode);
    if (mode === 'dark') {
      html.classList.add('dark');
      html.classList.add('theme-dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.classList.add('theme-light');
      html.style.colorScheme = 'light';
    }
  }, theme);
}

async function ensureRole(page: Page, role: UserRole): Promise<void> {
  await page.goto('/owner/overview', { waitUntil: 'networkidle' });

  if (role === 'owner') {
    return;
  }

  const current = page.viewportSize() ?? { width: 1440, height: 900 };
  const needsDesktopToggle = current.width < 768;

  if (needsDesktopToggle) {
    await page.setViewportSize({ width: 1280, height: current.height });
  }

  await page.getByRole('button', { name: role, exact: true }).first().click();
  await page.waitForURL(new RegExp(`/${role}/overview`));

  if (needsDesktopToggle) {
    await page.setViewportSize(current);
  }
}

test.describe('DS P0 Visual Baseline Matrix', () => {
  for (const route of P0_ROUTES) {
    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        test(`${route.key} | ${theme} | ${viewport.key}`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await ensureRole(page, route.role);
          await applyTheme(page, theme);
          await page.goto(route.path, { waitUntil: 'networkidle' });
          await page.waitForTimeout(350);

          await expect(page).toHaveScreenshot(
            `${route.key}__${theme}__${viewport.key}.png`,
            {
              fullPage: true,
              animations: 'disabled',
              scale: 'css',
            }
          );
        });
      }
    }
  }
});
