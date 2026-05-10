import { routes } from './app.routes';
import { OWNER_ROUTES } from './features/owner/routes';
import { TENANT_ROUTES } from './features/tenant/routes';
import { TEACHER_ROUTES } from './features/teacher/routes';

describe('Route Deep Link Matrix', () => {
  it('should keep root lazy route entries for owner/tenant/teacher', () => {
    const root = routes.find((r) => r.path === '' && r.component !== undefined);
    expect(root).toBeDefined();

    const children = root?.children ?? [];
    expect(children.some((c) => c.path === 'owner')).toBe(true);
    expect(children.some((c) => c.path === 'tenant')).toBe(true);
    expect(children.some((c) => c.path === 'teacher')).toBe(true);
  });

  it('should include major owner deep links', () => {
    const paths = OWNER_ROUTES.map((r) => r.path);
    expect(paths).toContain('overview');
    expect(paths).toContain('tenants/create');
    expect(paths).toContain('billing');
    expect(paths).toContain('subscriptions/orders');
  });

  it('should include major tenant deep links', () => {
    const paths = TENANT_ROUTES.map((r) => r.path);
    expect(paths).toContain('overview');
    expect(paths).toContain('groups/create');
    expect(paths).toContain('groups/:id/edit');
  });

  it('should include major teacher deep links', () => {
    const paths = TEACHER_ROUTES.map((r) => r.path);
    expect(paths).toContain('overview');
    expect(paths).toContain('media');
  });
});
