import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import type {
  TenantPermissionGroup,
  TenantRoleDetail,
  TenantRoleStatus,
  TenantRoleSummary,
  TenantRoleWriteRequest,
} from '../../models/tenant-access-management.models';
import { TenantAccessManagementFacade } from '../../state/tenant-access-management.facade';
import { TenantRoleFormComponent } from './tenant-role-form.component';

describe('TenantRoleFormComponent', () => {
  async function createComponent(options: {
    roleId?: string | null;
    selectedRole?: TenantRoleDetail | null;
  } = {}): Promise<{
    fixture: ComponentFixture<TenantRoleFormComponent>;
    facade: FacadeStub;
    router: { navigate: ReturnType<typeof vi.fn> };
  }> {
    TestBed.resetTestingModule();

    const facade = createFacadeStub({
      selectedRole: options.selectedRole ?? roleDetail(),
      permissionGroups: permissionGroups(),
    });
    const router = { navigate: vi.fn(async () => true) };

    await TestBed.configureTestingModule({
      imports: [TenantRoleFormComponent],
      providers: [
        { provide: TenantAccessManagementFacade, useValue: facade },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(options.roleId ? { id: options.roleId } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TenantRoleFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await settle();
    fixture.detectChanges();

    return { fixture, facade, router };
  }

  it('opens create mode with an empty form', async () => {
    const { fixture, facade } = await createComponent({ roleId: null });

    expect(facade.clearSelection).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Create Role');
    expect(roleNameInput(fixture).value).toBe('');
    expect(descriptionInput(fixture).value).toBe('');
    expect(permissionCheckboxes(fixture).every((input) => !input.checked)).toBe(true);
  });

  it('loads the selected role into edit mode', async () => {
    const { fixture, facade } = await createComponent({ roleId: 'role-admin' });

    expect(facade.selectRole).toHaveBeenCalledWith('role-admin');
    expect(fixture.nativeElement.textContent).toContain('Edit Role');
    expect(roleNameInput(fixture).value).toBe('Admin');
    expect(descriptionInput(fixture).value).toBe('Full dashboard access');
    expect(permissionCheckboxes(fixture).some((input) => input.checked)).toBe(true);
  });

  it('shows validation without losing entered draft values', async () => {
    const { fixture, facade } = await createComponent({ roleId: null });

    descriptionInput(fixture).value = 'Role draft notes';
    descriptionInput(fixture).dispatchEvent(new Event('input'));
    fixture.detectChanges();

    clickButton(fixture, 'Create Role');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Role name is required.');
    expect(fixture.nativeElement.textContent).toContain('Select at least one permission.');
    expect(descriptionInput(fixture).value).toBe('Role draft notes');
    expect(facade.saveRole).not.toHaveBeenCalled();
  });

  it('preserves draft inputs after a save failure', async () => {
    const { fixture, facade, router } = await createComponent({ roleId: null });
    facade.saveRole.mockImplementation(async () => {
      facade.error.set('Unable to save role.');
      return null;
    });

    roleNameInput(fixture).value = 'Finance Reviewer';
    roleNameInput(fixture).dispatchEvent(new Event('input', { bubbles: true }));
    permissionCheckboxes(fixture)[0].click();
    fixture.detectChanges();

    clickButton(fixture, 'Create Role');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to save role.');
    expect(roleNameInput(fixture).value).toBe('Finance Reviewer');
    expect(permissionCheckboxes(fixture)[0].checked).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('renders required dashboard permission groups with counts and selected states', async () => {
    const { fixture } = await createComponent({ roleId: null });

    for (const label of [
      'Rooms',
      'Basic Education',
      'University Education',
      'Attendance',
      'Grades',
      'Reports',
      'Platform Settings',
    ]) {
      expect(fixture.nativeElement.textContent).toContain(label);
    }

    const roomsSection = permissionGroup(fixture, 'Rooms');
    expect(roomsSection?.textContent).toContain('0 / 2');

    const roomsCheckbox = roomsSection?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    roomsCheckbox.click();
    fixture.detectChanges();

    expect(permissionGroup(fixture, 'Rooms')?.textContent).toContain('1 / 2');
    expect(roomsCheckbox.checked).toBe(true);
  });

  it('saves and returns to the roles list after success', async () => {
    const { fixture, facade, router } = await createComponent({ roleId: null });

    roleNameInput(fixture).value = 'Finance Reviewer';
    roleNameInput(fixture).dispatchEvent(new Event('input', { bubbles: true }));
    permissionCheckboxes(fixture)[0].click();
    fixture.detectChanges();

    clickButton(fixture, 'Create Role');
    await fixture.whenStable();

    expect(facade.saveRole).toHaveBeenCalledWith(
      {
        name: 'Finance Reviewer',
        description: '',
        permissionKeys: ['tenant.users.manage'],
      },
      null,
    );
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/users/roles-permissions']);
  });
});

interface FacadeStub {
  permissionGroups: WritableSignal<TenantPermissionGroup[]>;
  roles: WritableSignal<TenantRoleSummary[]>;
  selectedRole: WritableSignal<TenantRoleDetail | null>;
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

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createFacadeStub(options: {
  selectedRole: TenantRoleDetail | null;
  permissionGroups: TenantPermissionGroup[];
}): FacadeStub {
  return {
    permissionGroups: signal(options.permissionGroups),
    roles: signal([]),
    selectedRole: signal(options.selectedRole),
    searchQuery: signal(''),
    statusFilter: signal('ALL'),
    loading: signal(false),
    saving: signal(false),
    error: signal(null),
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

function roleDetail(): TenantRoleDetail {
  return {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full dashboard access',
    status: 'ACTIVE',
    permissions: ['tenant.users.manage', 'tenant.billing.view'],
    userAssignmentCount: 0,
    protectedRole: true,
  };
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
    group('rooms', 'Rooms', ['tenant.rooms.view', 'tenant.rooms.manage']),
    group('basicEducation', 'Basic Education', ['tenant.basicEducation.view', 'tenant.basicEducation.manage']),
    group('universityEducation', 'University Education', ['tenant.universityEducation.view', 'tenant.universityEducation.manage']),
    group('attendance', 'Attendance', ['tenant.attendance.view', 'tenant.attendance.manage']),
    group('grades', 'Grades', ['tenant.grades.view', 'tenant.grades.manage']),
    group('reports', 'Reports', ['tenant.reports.view']),
    group('platformSettings', 'Platform Settings', ['tenant.settings.view', 'tenant.settings.manage']),
  ];
}

function group(key: string, label: string, permissionKeys: string[]): TenantPermissionGroup {
  return {
    key,
    label,
    permissions: permissionKeys.map((permissionKey) => ({
      key: permissionKey,
      label: permissionKey.endsWith('.view') ? `View ${label.toLowerCase()}` : `Manage ${label.toLowerCase()}`,
      description: `Open ${label.toLowerCase()} dashboard area.`,
      actionType: permissionKey.endsWith('.view') ? 'VIEW' : 'MANAGE',
      sensitive: permissionKey.endsWith('.manage'),
    })),
  };
}

function roleNameInput(fixture: ComponentFixture<TenantRoleFormComponent>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input[placeholder="Role name"]');
}

function descriptionInput(fixture: ComponentFixture<TenantRoleFormComponent>): HTMLTextAreaElement {
  return fixture.nativeElement.querySelector('textarea');
}

function permissionCheckboxes(fixture: ComponentFixture<TenantRoleFormComponent>): HTMLInputElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('input[type="checkbox"]'));
}

function permissionGroup(
    fixture: ComponentFixture<TenantRoleFormComponent>,
    label: string,
): HTMLElement | null {
  return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.tenant-role-form-permission-group'))
    .find((section: Element) => section.textContent?.includes(label)) as HTMLElement | undefined ?? null;
}

function clickButton(
    fixture: ComponentFixture<TenantRoleFormComponent>,
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
