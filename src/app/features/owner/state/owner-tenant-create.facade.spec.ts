import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OwnerTenantCreateFacade } from './owner-tenant-create.facade';
import { TaskService } from '../../../core/services/task.service';

describe('OwnerTenantCreateFacade', () => {
  let facade: OwnerTenantCreateFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) },
        },
        {
          provide: TaskService,
          useValue: {
            getTask: () => undefined,
            removeTask: () => undefined,
            addTask: () => undefined,
          },
        },
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

  it('should reset form to default values', () => {
    facade.tenantForm.patchValue({
      centerName: 'ABC Center',
      planId: 'pro',
      domain: '.edu.com',
      isTrial: false,
      trialDays: 30,
    });

    facade.onReset();

    expect(facade.tenantForm.get('centerName')?.value).toBeNull();
    expect(facade.tenantForm.get('domain')?.value).toBe('.remix.com');
    expect(facade.tenantForm.get('isTrial')?.value).toBe(true);
    expect(facade.tenantForm.get('trialDays')?.value).toBe(14);
  });
});
