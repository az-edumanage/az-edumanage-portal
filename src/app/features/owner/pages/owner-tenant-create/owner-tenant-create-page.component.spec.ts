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
      subdomain: [''],
      domain: ['.remix.com'],
      industry: [''],
      contactName: [''],
      contactEmail: [''],
      contactPhone: [''],
      address: [''],
      city: [''],
      country: [''],
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
    showIndustryDropdown: signal(false),
    industrySearchQuery: signal(''),
    showPlanDropdown: signal(false),
    planSearchQuery: signal(''),
    showDomainDropdown: signal(false),
    showCityDropdown: signal(false),
    citySearchQuery: signal(''),
    showCountryDropdown: signal(false),
    countrySearchQuery: signal(''),
    showCustomizationMenu: signal(false),
    subscriptionTemplates: signal([]),
    tenantTypes: ['Center', 'Teacher'],
    industries: [],
    domains: ['.remix.com', '.beedu.app'],
    cities: [],
    countries: [],
    selectedPlanName: signal(''),
    initialize: () => Promise.resolve(),
    onDestroy: () => {},
    onCancel: () => {},
    onReset: () => {},
    onSubmit: () => {},
    toggleTenantTypeDropdown: () => {},
    closeTenantTypeDropdown: () => {},
    selectTenantType: (_type: string) => {},
    toggleIndustryDropdown: () => {},
    closeIndustryDropdown: () => {},
    selectIndustry: (_industry: string) => {},
    toggleDomainDropdown: () => {},
    closeDomainDropdown: () => {},
    selectDomain: (_domain: string) => {},
    toggleCityDropdown: () => {},
    closeCityDropdown: () => {},
    selectCity: (_city: string) => {},
    toggleCountryDropdown: () => {},
    closeCountryDropdown: () => {},
    selectCountry: (_country: string) => {},
    togglePlanDropdown: () => {},
    closePlanDropdown: () => {},
    selectPlan: (_planId: string) => {},
    openCustomizationMenu: (_event: Event) => {},
    closeCustomizationMenu: () => {},
    setTenantTypeSearchQuery: (_value: string) => {},
    setIndustrySearchQuery: (_value: string) => {},
    setCitySearchQuery: (_value: string) => {},
    setCountrySearchQuery: (_value: string) => {},
    setPlanSearchQuery: (_value: string) => {},
  };

  const mockI18nService = {
    t: (key: string) => key,
    isRtl: signal(false),
    language: signal('en'),
    setLanguage: () => {},
    initLanguage: () => {},
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

    const subdomainInput = fixture.nativeElement.querySelector('#subdomain');
    expect(subdomainInput).toBeTruthy();

    const contactNameInput = fixture.nativeElement.querySelector('#contactName');
    expect(contactNameInput).toBeTruthy();

    const contactEmailInput = fixture.nativeElement.querySelector('#contactEmail');
    expect(contactEmailInput).toBeTruthy();

    const regionSelect = fixture.nativeElement.querySelector('#region');
    expect(regionSelect).toBeTruthy();
  });
});
