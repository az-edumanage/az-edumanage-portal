import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OwnerSettingsComponent } from './owner-settings.component';
import { OwnerSettingsFacade } from '../../state/owner-settings.facade';
import { I18nService } from '../../../../core/services/i18n.service';
import { LocationSettingsService } from '../../../../core/services/location-settings.service';
import { OwnerSettingsTabId } from '../../models/owner-settings.models';
import { OwnerModuleFeaturesSettingsDataService } from '../../data-access/owner-module-features-settings-data.service';

const activeTab = signal<OwnerSettingsTabId>('country');

const facadeMock = {
  activeTab,
  subscriptionCycles: signal([]),
  paymentMethods: signal([]),
  tabs: [
    { id: 'general', label: 'owner.settings.tab.general' },
    { id: 'subject', label: 'owner.settings.tab.subjectTemplate' },
    { id: 'country', label: 'owner.settings.tab.country' },
    { id: 'presets', label: 'owner.settings.tab.presetsMethods' },
    { id: 'security', label: 'owner.settings.tab.security' },
    { id: 'roles', label: 'owner.settings.tab.roles' },
    { id: 'status', label: 'owner.settings.tab.status' },
    { id: 'modules-features', label: 'owner.settings.tab.modulesFeatures' },
    { id: 'billing', label: 'owner.settings.tab.billing' },
    { id: 'communication', label: 'owner.settings.tab.communication' },
    { id: 'storage', label: 'owner.settings.tab.storage' },
    { id: 'compliance', label: 'owner.settings.tab.auditCompliance' },
  ],
  subjectTemplates: signal([]),
  initializePresets: vi.fn().mockResolvedValue(undefined),
  setActiveTab: vi.fn((tabId: OwnerSettingsTabId) => activeTab.set(tabId)),
  addCycle: vi.fn(),
  removeCycle: vi.fn(),
  addPaymentMethod: vi.fn(),
  removePaymentMethod: vi.fn(),
  savePresets: vi.fn().mockResolvedValue(undefined),
  createSubjectTemplate: vi.fn(),
  updateSubjectTemplate: vi.fn(),
  deleteSubjectTemplate: vi.fn(),
  setDefaultSubjectTemplate: vi.fn(),
};

const i18nMock = {
  t: (key: string) => key,
  isRtl: signal(false),
};

const locationSettingsMock = {
  listCountries: vi.fn().mockResolvedValue([]),
  createCountry: vi.fn(),
  updateCountry: vi.fn(),
  deleteCountry: vi.fn(),
  listCities: vi.fn().mockResolvedValue([]),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
};

const moduleFeaturesSettingsMock = {
  features: signal([]),
  loading: signal(false),
  reload: vi.fn().mockResolvedValue(undefined),
  updateFeature: vi.fn().mockResolvedValue(undefined),
  toggleFeature: vi.fn().mockResolvedValue(undefined),
};

describe('OwnerSettingsComponent', () => {
  beforeEach(async () => {
    activeTab.set('country');
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [OwnerSettingsComponent],
      providers: [
        { provide: OwnerSettingsFacade, useValue: facadeMock },
        { provide: I18nService, useValue: i18nMock },
        { provide: LocationSettingsService, useValue: locationSettingsMock },
        { provide: OwnerModuleFeaturesSettingsDataService, useValue: moduleFeaturesSettingsMock },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('registers and renders the Country settings tab', async () => {
    const fixture = TestBed.createComponent(OwnerSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('owner.settings.tab.country');
    expect(fixture.nativeElement.querySelector('app-owner-settings-country-tab')).toBeTruthy();
  });

  it('keeps existing non-Country settings tabs registered and renderable', async () => {
    const fixture = TestBed.createComponent(OwnerSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const expectedTabs: OwnerSettingsTabId[] = [
      'general',
      'subject',
      'presets',
      'security',
      'roles',
      'status',
      'modules-features',
      'billing',
      'communication',
      'storage',
      'compliance',
    ];

    expect(facadeMock.tabs.map((tab) => tab.id)).toEqual([
      'general',
      'subject',
      'country',
      'presets',
      'security',
      'roles',
      'status',
      'modules-features',
      'billing',
      'communication',
      'storage',
      'compliance',
    ]);

    for (const tabId of expectedTabs) {
      activeTab.set(tabId);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-owner-settings-country-tab')).toBeFalsy();
    }
  });

});
