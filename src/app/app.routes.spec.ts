import { routes } from './app.routes';
import { OWNER_ROUTES } from './features/owner/routes';
import { TENANT_ROUTES } from './features/tenant/routes';
import { TEACHER_ROUTES } from './features/teacher/routes';
import { STUDENT_ROUTES } from './features/student/routes';
import { PARENT_ROUTES } from './features/parent/routes';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

function tenantChildPaths(): string[] {
  return TENANT_ROUTES.flatMap((route) => route.children?.map((child) => child.path ?? '') ?? [route.path ?? '']);
}

describe('Route Deep Link Matrix', () => {
  it('should keep root lazy route entries for owner/tenant/teacher/student/parent', () => {
    const root = routes.find((r) => r.path === '' && r.component !== undefined);
    expect(root).toBeDefined();

    const children = root?.children ?? [];
    expect(children.some((c) => c.path === 'owner')).toBe(true);
    expect(children.some((c) => c.path === 'tenant')).toBe(true);
    expect(children.some((c) => c.path === 'teacher')).toBe(true);
    expect(children.some((c) => c.path === 'student')).toBe(true);
    expect(children.some((c) => c.path === 'parent')).toBe(true);
  });

  it('uses the root route as the login entry so tenant subdomains do not need /tenant/login', () => {
    const rootLogin = routes.find((route) => route.path === '' && route.pathMatch === 'full');
    expect(rootLogin?.loadComponent).toBeDefined();
    expect(rootLogin?.redirectTo).toBeUndefined();
  });

  it('keeps tenant change password outside the main layout branch', () => {
    const changePasswordRoute = routes.find((route) => route.path === 'tenant/change-password');
    const layoutRoute = routes.find((route) => route.component === MainLayoutComponent);

    expect(changePasswordRoute).toBeDefined();
    expect(changePasswordRoute?.data).toMatchObject({ workspace: 'tenant', layout: 'auth', fullScreen: true });
    expect(layoutRoute?.children?.some((child) => child.path === 'tenant/change-password')).toBe(false);
    expect(routes.indexOf(changePasswordRoute!)).toBeLessThan(routes.indexOf(layoutRoute!));
  });

  it('should include major owner deep links', () => {
    const paths = OWNER_ROUTES.map((r) => r.path);
    expect(paths).toContain('overview');
    expect(paths).toContain('tenants/create');
    expect(paths).toContain('billing');
    expect(paths).toContain('subscriptions/orders');
  });

  it('should include major tenant deep links', () => {
    const paths = tenantChildPaths();
    expect(paths).toContain('overview');
    expect(paths).toContain('groups/create');
    expect(paths).toContain('groups/:id/edit');
    expect(paths).toContain('subjects/:id/curriculum');
    expect(paths).toContain('university-subjects/:id/curriculum');
  });

  it('should include major teacher deep links', () => {
    const paths = TEACHER_ROUTES.map((r) => r.path);
    expect(paths).toContain('overview');
    expect(paths).toContain('media');
  });

  it('should include student dashboard routes', () => {
    const paths = STUDENT_ROUTES.map((r) => r.path);
    expect(paths).toContain('overview');
    expect(paths).toContain('schedule');
    expect(paths).toContain('schedule/calendar');
    expect(paths).toContain('my-courses');
    expect(paths).toContain('my-groups');
    expect(paths).toContain('exams');
    expect(paths).toContain('home-work');
    expect(paths).toContain('billing');
  });

  it('should include parent overview routes', () => {
    expect(PARENT_ROUTES.map((r) => r.path)).toContain('overview');
  });
});
