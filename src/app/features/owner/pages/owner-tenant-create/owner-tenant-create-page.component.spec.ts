import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { OwnerTenantCreatePageComponent } from './owner-tenant-create-page.component';
import { OwnerTenantCreateFacade } from '../../state/owner-tenant-create.facade';
import { I18nService } from '../../../../core/services/i18n.service';

describe('OwnerTenantCreatePageComponent', () => {
  const fb = new FormBuilder();

  const mockFacade = {
    tenantForm: fb.group({
      centerName: [''],
      tenantType: [''],
      tenantUsername: [''],
      temporaryPassword: [''],
      subdomain: [''],
      domain: ['.az-edumanage.com'],
      contactName: [''],
      contactEmail: [''],
      contactPhone: [''],
      address: [''],
      countryId: [null],
      cityId: [null],
      planId: [''],
      isTrial: [true],
      trialDays: [14],
      region: ['me-south-1'],
      autoProvision: [true],
      sendInvite: [true],
      onboardingLink: [false],
      sendOnboardingWhatsapp: [false],
      sendOnboardingEmail: [false],
    }),
    isSubmitting: signal(false),
    showTenantTypeDropdown: signal(false),
    tenantTypeSearchQuery: signal(''),
    showPlanDropdown: signal(false),
    planSearchQuery: signal(''),
    showDomainDropdown: signal(false),
    showCityDropdown: signal(false),
    citySearchQuery: signal(''),
    showCountryDropdown: signal(false),
    countrySearchQuery: signal(''),
    showCustomizationMenu: signal(false),
    submitAttempted: signal(false),
    submitStatus: signal<{ success: boolean; message: string } | null>(null),
    showSuccessModal: signal(false),
    subscriptionTemplates: signal([]),
    planLoadError: signal(null),
    tenantTypes: ['Center', 'Teacher'],
    domains: ['.az-edumanage.com'],
    cities: signal([{ value: '10', label: 'Cairo' }]),
    countries: signal([{ value: '1', label: 'Egypt' }]),
    selectedPlanName: signal(''),
    selectedCountryName: signal(''),
    selectedCityName: signal(''),
    selectedCountryValue: signal(''),
    selectedCityValue: signal(''),
    initialize: vi.fn().mockResolvedValue(undefined),
    onDestroy: vi.fn(),
    onCancel: vi.fn(),
    onReset: vi.fn(),
    onSubmit: vi.fn(),
    setTenantTypeDropdownOpen: vi.fn(),
    setDomainDropdownOpen: vi.fn(),
    setCityDropdownOpen: vi.fn(),
    setCountryDropdownOpen: vi.fn(),
    setPlanDropdownOpen: vi.fn(),
    toggleTenantTypeDropdown: vi.fn(),
    closeTenantTypeDropdown: vi.fn(),
    selectTenantType: vi.fn(),
    toggleDomainDropdown: vi.fn(),
    closeDomainDropdown: vi.fn(),
    selectDomain: vi.fn(),
    toggleCityDropdown: vi.fn(),
    closeCityDropdown: vi.fn(),
    selectCity: vi.fn(),
    toggleCountryDropdown: vi.fn(),
    closeCountryDropdown: vi.fn(),
    selectCountry: vi.fn(),
    togglePlanDropdown: vi.fn(),
    closePlanDropdown: vi.fn(),
    selectPlan: vi.fn(),
    openCustomizationMenu: vi.fn(),
    closeCustomizationMenu: vi.fn(),
    setTenantTypeSearchQuery: vi.fn(),
    setCitySearchQuery: vi.fn(),
    setCountrySearchQuery: vi.fn(),
    setPlanSearchQuery: vi.fn(),
  };

  const mockI18nService = {
    t: (key: string) => key,
    isRtl: signal(false),
    language: signal('en'),
    setLanguage: vi.fn(),
    initLanguage: vi.fn(),
  };

  const mockActivatedRoute = {
    snapshot: {
      queryParamMap: {
        get: () => null,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerTenantCreatePageComponent],
      providers: [
        provideRouter([]),
        { provide: OwnerTenantCreateFacade, useValue: mockFacade },
        { provide: I18nService, useValue: mockI18nService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(OwnerTenantCreatePageComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('has the expected form fields visible', () => {
    const fixture = TestBed.createComponent(OwnerTenantCreatePageComponent);
    fixture.detectChanges();

    const centerNameInput = fixture.nativeElement.querySelector('#centerName');
    expect(centerNameInput).toBeTruthy();

    const tenantUsernameInput = fixture.nativeElement.querySelector('#tenantUsername') as HTMLInputElement;
    expect(tenantUsernameInput).toBeTruthy();
    expect(tenantUsernameInput.getAttribute('formControlName')).toBe('tenantUsername');

    const temporaryPasswordInput = fixture.nativeElement.querySelector('#temporaryPassword') as HTMLInputElement;

    expect(temporaryPasswordInput).toBeTruthy();
    expect(temporaryPasswordInput.type).toBe('password');
    expect(temporaryPasswordInput.getAttribute('formControlName')).toBe('temporaryPassword');

    const subdomainInput = fixture.nativeElement.querySelector('#subdomain');
    expect(subdomainInput).toBeTruthy();

    const contactNameInput = fixture.nativeElement.querySelector('#contactName');
    expect(contactNameInput).toBeTruthy();

    const contactEmailInput = fixture.nativeElement.querySelector('#contactEmail');
    expect(contactEmailInput).toBeTruthy();

    const regionSelect = fixture.nativeElement.querySelector('#region');
    expect(regionSelect).toBeTruthy();
  });

  it('exposes provisioning status from the facade', () => {
    mockFacade.submitStatus.set({ success: true, message: 'Tenant provisioning verified successfully.' });
    const fixture = TestBed.createComponent(OwnerTenantCreatePageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.submitStatus()?.message).toContain('provisioning');
  });

  it('binds country and city dropdowns to managed location controls', () => {
    const fixture = TestBed.createComponent(OwnerTenantCreatePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.countries()).toEqual([{ value: '1', label: 'Egypt' }]);
    expect(component.cities()).toEqual([{ value: '10', label: 'Cairo' }]);
    expect(component.tenantForm.get('countryId')).toBeTruthy();
    expect(component.tenantForm.get('cityId')).toBeTruthy();

    component.toggleCityDropdown();
    expect(mockFacade.setCityDropdownOpen).toHaveBeenCalledWith(false);

    component.tenantForm.patchValue({ countryId: 1 });
    component.selectCountry('1');
    component.selectCity('10');
    expect(mockFacade.selectCountry).toHaveBeenCalledWith('1');
    expect(mockFacade.selectCity).toHaveBeenCalledWith('10');
  });

  it('renders the temporary password field inside tenant information before subdomain', () => {
    const fixture = TestBed.createComponent(OwnerTenantCreatePageComponent);
    fixture.detectChanges();

    const temporaryPasswordInput = fixture.nativeElement.querySelector('#temporaryPassword') as HTMLInputElement;
    const subdomainInput = fixture.nativeElement.querySelector('#subdomain') as HTMLInputElement;
    const labels = Array.from(fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>).map((label) => label.getAttribute('for'));

    expect(temporaryPasswordInput).toBeTruthy();
    expect(temporaryPasswordInput.type).toBe('password');
    expect(temporaryPasswordInput.placeholder).toBe('owner.tenantCreate.placeholder.temporaryPassword');
    expect(labels.indexOf('temporaryPassword')).toBeGreaterThan(-1);
    expect(labels.indexOf('temporaryPassword')).toBeLessThan(labels.indexOf('subdomain'));
    expect(temporaryPasswordInput.compareDocumentPosition(subdomainInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the tenant provisioned success modal', () => {
    mockFacade.showSuccessModal.set(true);
    const fixture = TestBed.createComponent(OwnerTenantCreatePageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('owner.tenantCreate.successModal.title');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    mockFacade.showSuccessModal.set(false);
  });

});
