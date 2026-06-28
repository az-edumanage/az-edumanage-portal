import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, type WritableSignal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { TenantPermissionService } from '../../../../core/auth/tenant-permission.service';
import type {
  TenantPermissionGroup,
  TenantRoleStatus,
  TenantRoleSummary,
  TenantRoleWriteRequest,
} from '../../models/tenant-access-management.models';
import { TenantAccessManagementFacade } from '../../state/tenant-access-management.facade';
import { TenantRolesPermissionsComponent } from './tenant-roles-permissions.component';

describe('TenantRolesPermissionsComponent', () => {
  async function createComponent(options: {
    roles?: TenantRoleSummary[];
    permissionGroups?: TenantPermissionGroup[];
    canManage?: boolean;
    searchQuery?: string;
    statusFilter?: TenantRoleStatus | 'ALL';
    error?: string | null;
  } = {}): Promise<{
    fixture: ComponentFixture<TenantRolesPermissionsComponent>;
    facade: FacadeStub;
  }> {
    TestBed.resetTestingModule();

    const facade = createFacadeStub({
      roles: options.roles ?? roleSummaries(),
      permissionGroups: options.permissionGroups ?? permissionGroups(),
      searchQuery: options.searchQuery ?? '',
      statusFilter: options.statusFilter ?? 'ALL',
      error: options.error ?? null,
    });

    await TestBed.configureTestingModule({
      imports: [TenantRolesPermissionsComponent],
      providers: [
        { provide: TenantAccessManagementFacade, useValue: facade },
        {
          provide: TenantPermissionService,
          useValue: { hasPermission: vi.fn(() => options.canManage ?? true) },
        },
        provideRouter([
          { path: 'tenant/users/roles-permissions/create', component: DummyRouteComponent },
          { path: 'tenant/users/roles-permissions/:id/edit', component: DummyRouteComponent },
        ]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TenantRolesPermissionsComponent);
    fixture.detectChanges();

    return { fixture, facade };
  }

  it('navigates to the create role page from Create Role', async () => {
    const { fixture } = await createComponent();
    const router = TestBed.inject(Router);

    clickButton(fixture, 'Create Role');
    await fixture.whenStable();

    expect(router.url).toBe('/tenant/users/roles-permissions/create');
  });

  it('navigates to the edit role page from row edit', async () => {
    const { fixture } = await createComponent();
    const router = TestBed.inject(Router);

    clickFirstAction(fixture, 'Edit role');
    await fixture.whenStable();

    expect(router.url).toBe('/tenant/users/roles-permissions/role-admin/edit');
  });

  it('does not render a permanent create-role aside in the default list view', async () => {
    const { fixture } = await createComponent();

    expect(fixture.nativeElement.querySelector('.tenant-rbac-table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.tenant-rbac-drawer')).toBeNull();
    expect(fixture.nativeElement.querySelector('.tenant-rbac-permissions')).toBeNull();
  });

  it('shows distinct empty states for no roles and filtered roles', async () => {
    const empty = await createComponent({ roles: [] });
    expect(empty.fixture.nativeElement.textContent).toContain('No roles created yet.');

    const filtered = await createComponent({ roles: [], searchQuery: 'finance' });
    expect(filtered.fixture.nativeElement.textContent).toContain('No roles match these filters.');
  });

  it('hides create and row management controls when manage permission is missing', async () => {
    const { fixture } = await createComponent({ canManage: false });

    expect(buttons(fixture).some((button) => button.textContent?.includes('Create Role'))).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('View only');
    expect(fixture.nativeElement.querySelector('[title="Edit role"]')).toBeNull();
  });
});

@Component({ standalone: true, template: '' })
class DummyRouteComponent {}

interface FacadeStub {
  permissionGroups: WritableSignal<TenantPermissionGroup[]>;
  roles: WritableSignal<TenantRoleSummary[]>;
  selectedRole: WritableSignal<TenantRoleSummary | null>;
  searchQuery: WritableSignal<string>;
  statusFilter: WritableSignal<TenantRoleStatus | 'ALL'>;
  loading: WritableSignal<boolean>;
  saving: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  load: ReturnType<typeof vi.fn>;
  selectRole: ReturnType<typeof vi.fn>;
  clearSelection: ReturnType<typeof vi.fn>;
  saveRole: ReturnType<typeof vi.fn>;
  updateStatus: ReturnType<typeof vi.fn>;
  deleteRole: ReturnType<typeof vi.fn>;
}

function createFacadeStub(options: {
  roles: TenantRoleSummary[];
  permissionGroups: TenantPermissionGroup[];
  searchQuery: string;
  statusFilter: TenantRoleStatus | 'ALL';
  error: string | null;
}): FacadeStub {
  return {
    permissionGroups: signal(options.permissionGroups),
    roles: signal(options.roles),
    selectedRole: signal<TenantRoleSummary | null>(null),
    searchQuery: signal(options.searchQuery),
    statusFilter: signal(options.statusFilter),
    loading: signal(false),
    saving: signal(false),
    error: signal(options.error),
    load: vi.fn(async () => undefined),
    selectRole: vi.fn(async () => undefined),
    clearSelection: vi.fn(),
    saveRole: vi.fn(async (payload: TenantRoleWriteRequest, roleId: string | null) => ({
      id: roleId ?? 'role-new',
      name: payload.name,
      description: payload.description,
      status: 'ACTIVE',
      permissions: payload.permissionKeys,
      userAssignmentCount: 0,
      protectedRole: false,
    })),
    updateStatus: vi.fn(async () => undefined),
    deleteRole: vi.fn(async () => undefined),
  };
}

function roleSummaries(): TenantRoleSummary[] {
  return [
    {
      id: 'role-admin',
      name: 'Admin',
      description: 'Full dashboard access',
      status: 'ACTIVE',
      permissions: ['tenant.users.manage', 'tenant.billing.view'],
      userAssignmentCount: 0,
      protectedRole: true,
    },
    {
      id: 'role-billing',
      name: 'Billing Clerk',
      description: 'Billing access',
      status: 'INACTIVE',
      permissions: ['tenant.billing.view'],
      userAssignmentCount: 2,
      protectedRole: false,
    },
  ];
}

function permissionGroups(): TenantPermissionGroup[] {
  return [
    {
      key: 'users',
      label: 'Users',
      permissions: [
        {
          key: 'tenant.users.manage',
          label: 'Manage dashboard users',
          description: 'Create and edit dashboard users.',
          actionType: 'MANAGE',
          sensitive: true,
        },
        {
          key: 'tenant.roles.view',
          label: 'View roles and permissions',
          description: 'Open the roles and permissions page.',
          actionType: 'VIEW',
          sensitive: false,
        },
      ],
    },
    {
      key: 'billing',
      label: 'Billing',
      permissions: [
        {
          key: 'tenant.billing.view',
          label: 'View billing',
          description: 'Open tenant invoices and collection status.',
          actionType: 'VIEW',
          sensitive: false,
        },
      ],
    },
  ];
}

function buttons(fixture: ComponentFixture<TenantRolesPermissionsComponent>): HTMLButtonElement[] {
  const host = fixture.nativeElement as HTMLElement;
  return Array.from(host.querySelectorAll('button'));
}

function clickButton(
    fixture: ComponentFixture<TenantRolesPermissionsComponent>,
    label: string,
): void {
  const host = fixture.nativeElement as HTMLElement;
  const button = Array.from(host.querySelectorAll('button'))
    .find((candidate) => candidate.textContent?.includes(label)) as HTMLButtonElement | undefined;

  if (!button) {
    throw new Error(`Unable to find button "${label}"`);
  }

  button.click();
}

function clickFirstAction(
    fixture: ComponentFixture<TenantRolesPermissionsComponent>,
    title: string,
): void {
  const button = fixture.nativeElement.querySelector(`[title="${title}"]`) as HTMLButtonElement | null;
  if (!button) {
    throw new Error(`Unable to find action "${title}"`);
  }
  button.click();
}
