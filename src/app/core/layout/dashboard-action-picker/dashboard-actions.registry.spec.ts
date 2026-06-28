import { TestBed } from '@angular/core/testing';
import { TenantPermissionService } from '../../auth/tenant-permission.service';
import { DashboardActionsRegistry } from './dashboard-actions.registry';

describe('DashboardActionsRegistry', () => {
  let granted: Set<string>;
  let registry: DashboardActionsRegistry;

  beforeEach(() => {
    granted = new Set(['tenant.students.view', 'tenant.students.manage']);
    TestBed.configureTestingModule({
      providers: [
        DashboardActionsRegistry,
        {
          provide: TenantPermissionService,
          useValue: {
            hasPermission: (permission?: string | null) => !permission || granted.has(permission),
            hasAllPermissions: (permissions?: readonly string[] | null) =>
              !permissions?.length || permissions.every((permission) => granted.has(permission)),
          },
        },
      ],
    });
    registry = TestBed.inject(DashboardActionsRegistry);
  });

  it('returns only actions allowed by permissions', () => {
    const actionIds = registry.availableActions().map((action) => action.id);

    expect(actionIds).toContain('overview');
    expect(actionIds).toContain('students');
    expect(actionIds).toContain('students.create');
    expect(actionIds).not.toContain('teachers.create');
  });

  it('searches actions by English and Arabic keywords', () => {
    expect(registry.availableActions('add student').map((action) => action.id)).toEqual(['students.create']);
    expect(registry.availableActions('طلاب').map((action) => action.id)).toEqual(['students']);
  });
});
