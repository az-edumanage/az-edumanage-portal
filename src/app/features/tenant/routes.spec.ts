import { TENANT_ROUTES } from './routes';
import { TenantAttendanceComponent } from './pages/tenant-attendance/tenant-attendance.component';
import { TenantPlatformSettingsComponent } from './pages/tenant-platform-settings/tenant-platform-settings.component';
import { TenantStudentBarcodePrintComponent } from './pages/tenant-student-barcode-print/tenant-student-barcode-print.component';

describe('TENANT_ROUTES', () => {
  it('does not include the standalone change-password route inside tenant layout routes', () => {
    const topLevelPaths = TENANT_ROUTES.map((route) => route.path);
    const nestedPaths = TENANT_ROUTES.flatMap((route) => route.children?.map((child) => child.path) ?? []);

    expect(topLevelPaths).not.toContain('change-password');
    expect(nestedPaths).not.toContain('change-password');
  });

  it('keeps normal tenant dashboard pages inside the tenant child route tree', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const childPaths = tenantShell?.children?.map((child) => child.path) ?? [];

    expect(childPaths).toContain('overview');
    expect(childPaths).toContain('students');
    expect(childPaths).toContain('students/:id');
    expect(childPaths).toContain('students/:id/barcode/print');
    expect(childPaths).toContain('educational-stages');
    expect(childPaths).toContain('subjects');
    expect(childPaths).toContain('subjects/create');
    expect(childPaths).toContain('subjects/:id');
    expect(childPaths).toContain('universities');
    expect(childPaths).toContain('universities/:id/edit');
    expect(childPaths).toContain('universities/:id');
    expect(childPaths).toContain('colleges');
    expect(childPaths).toContain('colleges/create');
    expect(childPaths).toContain('colleges/:id/edit');
    expect(childPaths).toContain('colleges/:id');
    expect(childPaths).toContain('university-subjects');
    expect(childPaths).toContain('university-subjects/create');
    expect(childPaths).toContain('university-subjects/:id/edit');
    expect(childPaths).toContain('university-subjects/:id');
    expect(childPaths).toContain('groups/create');
    expect(childPaths).toContain('settings');
    expect(childPaths).toContain('web-settings');
  });

  it('routes platform settings to a real tenant settings page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const settingsRoute = tenantShell?.children?.find((child) => child.path === 'settings');

    expect(settingsRoute?.component).toBe(TenantPlatformSettingsComponent);
  });

  it('routes tenant attendance to the dedicated attendance page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const attendanceRoute = tenantShell?.children?.find((child) => child.path === 'attendance');

    expect(attendanceRoute?.component).toBe(TenantAttendanceComponent);
  });

  it('routes student barcode print to the dedicated print page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const printRoute = tenantShell?.children?.find((child) => child.path === 'students/:id/barcode/print');

    expect(printRoute?.component).toBe(TenantStudentBarcodePrintComponent);
  });
});
