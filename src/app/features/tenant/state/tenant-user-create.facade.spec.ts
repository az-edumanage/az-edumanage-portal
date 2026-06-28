import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantUserCreateDataService } from '../data-access/tenant-user-create-data.service';
import { TenantUserCreateFacade } from './tenant-user-create.facade';
import { TenantUserCreateStore } from './tenant-user-create.store';

describe('TenantUserCreateFacade', () => {
  let facade: TenantUserCreateFacade;
  const dataServiceMock = {
    statuses: [
      { id: 'Active', label: 'Active', color: 'bg-emerald-500' },
      { id: 'Inactive', label: 'Inactive', color: 'bg-slate-400' },
    ],
    loadActiveRoles: vi.fn(),
    isDuplicateName: vi.fn(),
    isDuplicateEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    loadUser: vi.fn(),
  };
  const routerMock = { navigate: vi.fn() };
  const taskServiceMock = { getTask: vi.fn(), addTask: vi.fn(), removeTask: vi.fn() };

  beforeEach(() => {
    dataServiceMock.loadActiveRoles.mockReturnValue(of([
      { id: 'role-1', label: 'Admin', icon: 'security', description: '15 permissions' },
    ]));
    dataServiceMock.isDuplicateName.mockReturnValue(of(false));
    dataServiceMock.isDuplicateEmail.mockReturnValue(of(false));
    dataServiceMock.createUser.mockReturnValue(of({ userId: 'user-1' }));
    dataServiceMock.loadUser.mockReturnValue(of(null));
    taskServiceMock.getTask.mockReturnValue(null);

    TestBed.configureTestingModule({
      providers: [
        TenantUserCreateFacade,
        TenantUserCreateStore,
        { provide: TenantUserCreateDataService, useValue: dataServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: { back: vi.fn() } },
        { provide: TaskService, useValue: taskServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ],
    });

    facade = TestBed.inject(TenantUserCreateFacade);
    facade.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requires username and password in create mode before submit', () => {
    facade.userForm.patchValue({
      fullName: 'Tenant User',
      email: 'tenant.user@example.com',
      username: '',
      password: '',
      roleId: 'role-1',
    });

    facade.onSubmit();

    expect(facade.userForm.controls.username.invalid).toBe(true);
    expect(facade.userForm.controls.password.invalid).toBe(true);
    expect(dataServiceMock.createUser).not.toHaveBeenCalled();
  });

  it('sends username, password, and role in create payload then navigates to users list', () => {
    facade.userForm.patchValue(validFormValue());

    facade.onSubmit();

    expect(dataServiceMock.createUser).toHaveBeenCalledWith(expect.objectContaining({
      username: 'tenant.user',
      password: '12341234',
      roleId: 'role-1',
    }));
    expect(taskServiceMock.removeTask).toHaveBeenCalledWith('create-user-task');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/tenant/users']);
  });

  it('maps duplicate username save errors to the username field', () => {
    dataServiceMock.createUser.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { message: 'Username already exists' },
    })));
    facade.userForm.patchValue(validFormValue());

    facade.onSubmit();

    expect(facade.userForm.controls.username.errors?.['duplicateUsername']).toBe(true);
    expect(facade.userForm.controls.password.value).toBe('');
  });

  it('clears password from saved drafts on destroy', () => {
    facade.userForm.patchValue(validFormValue());

    facade.onDestroy();

    expect(taskServiceMock.addTask).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ password: '' }),
    }));
  });

  it('ignores repeated submit attempts while a save is in progress', () => {
    facade.userForm.patchValue(validFormValue());
    TestBed.inject(TenantUserCreateStore).setSubmitting(true);

    facade.onSubmit();

    expect(dataServiceMock.createUser).not.toHaveBeenCalled();
  });
});

function validFormValue() {
  return {
    fullName: 'Tenant User',
    email: 'tenant.user@example.com',
    username: 'tenant.user',
    roleId: 'role-1',
    enabled: true,
    sendInvite: true,
    password: '12341234',
  };
}
