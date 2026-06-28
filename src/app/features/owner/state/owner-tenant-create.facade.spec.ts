import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { OwnerTenantCreateDataService } from '../data-access/owner-tenant-create-data.service';
import { TenantCreatePayload, TenantLocationOption, TenantPlanOption } from '../models/owner-tenant-create.models';
import { OwnerTenantCreateFacade } from './owner-tenant-create.facade';
import { TaskService } from '../../../core/services/task.service';

describe('OwnerTenantCreateFacade', () => {
  let facade: OwnerTenantCreateFacade;
  let taskService: {
    getTask: ReturnType<typeof vi.fn>;
    removeTask: ReturnType<typeof vi.fn>;
    addTask: ReturnType<typeof vi.fn>;
  };
  let dataService: {
    subscriptionTemplates: WritableSignal<TenantPlanOption[]>;
    planLoadError: WritableSignal<string | null>;
    tenantTypes: string[];
    domains: string[];
    cityDropdownOptions: WritableSignal<{ value: string; label: string }[]>;
    countryDropdownOptions: WritableSignal<{ value: string; label: string }[]>;
    loadBootstrapData: ReturnType<typeof vi.fn>;
    loadCities: ReturnType<typeof vi.fn>;
    clearCities: ReturnType<typeof vi.fn>;
    findCountryByValue: ReturnType<typeof vi.fn>;
    findCityByValue: ReturnType<typeof vi.fn>;
    findCountryById: ReturnType<typeof vi.fn>;
    findCityById: ReturnType<typeof vi.fn>;
    findExisting: ReturnType<typeof vi.fn>;
    createTenant: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    taskService = {
      getTask: vi.fn().mockReturnValue(undefined),
      removeTask: vi.fn(),
      addTask: vi.fn(),
    };
    dataService = {
      subscriptionTemplates: signal<TenantPlanOption[]>([]),
      planLoadError: signal<string | null>(null),
      tenantTypes: ['Center', 'Teacher'],
      domains: ['.az-edumanage.com'],
      cityDropdownOptions: signal([{ value: '10', label: 'Cairo' }]),
      countryDropdownOptions: signal([{ value: '1', label: 'Egypt' }, { value: '2', label: 'Saudi Arabia' }]),
      loadBootstrapData: vi.fn().mockResolvedValue(undefined),
      loadCities: vi.fn().mockResolvedValue(undefined),
      clearCities: vi.fn(),
      findCountryByValue: vi.fn((value: string) => (value === '1' ? { id: 1, value: '1', label: 'Egypt' } : { id: 2, value, label: 'Saudi Arabia' })),
      findCityByValue: vi.fn((value: string) => (value === '10' ? { id: 10, value: '10', label: 'Cairo' } : null)),
      findCountryById: vi.fn((id: number | null | undefined) => (id === 1 ? { id: 1, value: '1', label: 'Egypt' } as TenantLocationOption : null)),
      findCityById: vi.fn((id: number | null | undefined) => (id === 10 ? { id: 10, value: '10', label: 'Cairo' } as TenantLocationOption : null)),
      findExisting: vi.fn().mockReturnValue(null),
      createTenant: vi.fn().mockReturnValue(of(void 0)),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { navigate: vi.fn().mockResolvedValue(true) },
        },
        { provide: TaskService, useValue: taskService },
        { provide: OwnerTenantCreateDataService, useValue: dataService },
      ],
    });

    facade = TestBed.inject(OwnerTenantCreateFacade);
  });

  it('should select tenant type and close dropdown', () => {
    facade.setTenantTypeDropdownOpen(true);

    facade.selectTenantType('School');

    expect(facade.tenantForm.get('tenantType')?.value).toBe('School');
    expect(facade.showTenantTypeDropdown()).toBe(false);
    expect(facade.tenantTypeSearchQuery()).toBe('');
  });

  it('should require a temporary password with minimum length eight', () => {
    const control = facade.tenantForm.get('temporaryPassword');

    control?.setValue('');
    expect(control?.hasError('required')).toBe(true);

    control?.setValue('short');
    expect(control?.hasError('minlength')).toBe(true);

    control?.setValue('TempPass123!');
    expect(control?.valid).toBe(true);
  });

  it('should reset form to default values and clear temporary password', () => {
    facade.tenantForm.patchValue({
      centerName: 'ABC Center',
      tenantUsername: 'abc-admin',
      temporaryPassword: 'TempPass123!',
      planId: 'pro',
      countryId: 1,
      cityId: 10,
      domain: '.edu.com',
      isTrial: false,
      trialDays: 30,
    });

    facade.onReset();

    expect(facade.tenantForm.get('centerName')?.value).toBeNull();
    expect(facade.tenantForm.get('tenantUsername')?.value).toBe('');
    expect(facade.tenantForm.get('temporaryPassword')?.value).toBe('');
    expect(facade.tenantForm.get('domain')?.value).toBe('.az-edumanage.com');
    expect(facade.tenantForm.get('countryId')?.value).toBeNull();
    expect(facade.tenantForm.get('cityId')?.value).toBeNull();
    expect(dataService.clearCities).toHaveBeenCalled();
    expect(facade.tenantForm.get('isTrial')?.value).toBe(true);
    expect(facade.tenantForm.get('trialDays')?.value).toBe(14);
  });

  it('should omit temporary password from saved draft task data', () => {
    facade.tenantForm.patchValue({
      centerName: 'ABC Center',
      tenantUsername: 'abc-admin',
      temporaryPassword: 'TempPass123!',
      subdomain: 'abc-center',
    });

    facade.onDestroy();

    expect(taskService.addTask).toHaveBeenCalled();
    const task = taskService.addTask.mock.calls.at(-1)?.[0];
    expect(task.data.temporaryPassword).toBeUndefined();
    expect(JSON.stringify(task.data)).not.toContain('TempPass123!');
  });

  it('should ignore persisted temporary password when initializing from draft task data', async () => {
    taskService.getTask.mockReturnValue({
      id: 'create-tenant-task',
      type: 'form',
      label: 'Provisioning: ABC Center',
      route: '/owner/tenants/create',
      data: {
        centerName: 'ABC Center',
      tenantUsername: 'abc-admin',
        temporaryPassword: 'PersistedTemp123!',
        subdomain: 'abc-center',
      },
    });

    await facade.initialize();

    expect(facade.tenantForm.get('centerName')?.value).toBe('ABC Center');
    expect(facade.tenantForm.get('subdomain')?.value).toBe('abc-center');
    expect(facade.tenantForm.get('temporaryPassword')?.value).toBe('');
    expect(taskService.removeTask).toHaveBeenCalledWith('create-tenant-task');
  });

  it('should clear city and load active cities when country changes', async () => {
    facade.tenantForm.patchValue({ cityId: 10 });

    facade.selectCountry('1');
    await Promise.resolve();

    expect(facade.tenantForm.get('countryId')?.value).toBe(1);
    expect(facade.tenantForm.get('cityId')?.value).toBeNull();
    expect(dataService.clearCities).toHaveBeenCalled();
    expect(dataService.loadCities).toHaveBeenCalledWith(1);
  });

  it('should require countryId and cityId', () => {
    expect(facade.tenantForm.get('countryId')?.hasError('required')).toBe(true);
    expect(facade.tenantForm.get('cityId')?.hasError('required')).toBe(true);

    facade.selectCountry('1');
    facade.selectCity('10');

    expect(facade.tenantForm.get('countryId')?.valid).toBe(true);
    expect(facade.tenantForm.get('cityId')?.valid).toBe(true);
  });

  it('should omit stale cityId from saved draft when country is empty', () => {
    facade.tenantForm.patchValue({
      centerName: 'ABC Center',
      tenantUsername: 'abc-admin',
      subdomain: 'abc-center',
      cityId: 10,
    });

    facade.onDestroy();

    const task = taskService.addTask.mock.calls.at(-1)?.[0];
    expect(task.data.cityId).toBeUndefined();
  });

  it('should submit temporary password in the create payload only', () => {
    const payload: TenantCreatePayload = {
      centerName: 'ABC Center',
      tenantType: 'Center',
      tenantUsername: 'abc-admin',
      temporaryPassword: 'TempPass123!',
      subdomain: 'abc-center',
      domain: '.az-edumanage.com',
      contactName: 'Tenant Admin',
      contactEmail: 'admin@example.com',
      contactPhone: '+1555012345',
      address: '123 Street',
      countryId: 1,
      cityId: 10,
      planId: 'plan-1',
      isTrial: true,
      trialDays: 14,
      region: 'me-south-1',
      autoProvision: true,
      sendInvite: true,
      onboardingLink: false,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: false,
    };
    facade.tenantForm.setValue({
      centerName: payload.centerName,
      tenantType: payload.tenantType,
      tenantUsername: payload.tenantUsername,
      temporaryPassword: payload.temporaryPassword,
      subdomain: payload.subdomain,
      domain: payload.domain,
      contactName: payload.contactName,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      address: payload.address,
      countryId: payload.countryId,
      cityId: payload.cityId,
      planId: payload.planId,
      isTrial: payload.isTrial,
      trialDays: payload.trialDays,
      region: payload.region,
      autoProvision: payload.autoProvision,
      sendInvite: payload.sendInvite,
      onboardingLink: payload.onboardingLink,
      sendOnboardingWhatsapp: payload.sendOnboardingWhatsapp,
      sendOnboardingEmail: payload.sendOnboardingEmail,
    });

    facade.onSubmit();

    expect(dataService.createTenant).toHaveBeenCalledWith(payload);
  });
});
