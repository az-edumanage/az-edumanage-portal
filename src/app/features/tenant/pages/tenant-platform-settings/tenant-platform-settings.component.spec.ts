import { TestBed } from '@angular/core/testing';
import { TenantCountrySettingsService } from '../../data-access/tenant-country-settings.service';
import { TenantPlatformSettingsComponent } from './tenant-platform-settings.component';

describe('TenantPlatformSettingsComponent', () => {
  let countrySettings: {
    listCountries: ReturnType<typeof vi.fn>;
    createCountry: ReturnType<typeof vi.fn>;
    updateCountry: ReturnType<typeof vi.fn>;
    deleteCountry: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    countrySettings = {
      listCountries: vi.fn().mockResolvedValue([
        { id: 'country-1', name: 'Brazil', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      ]),
      createCountry: vi.fn().mockResolvedValue({
        id: 'country-2',
        name: 'Morocco',
        code: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      updateCountry: vi.fn().mockResolvedValue({
        id: 'country-1',
        name: 'Jordan',
        code: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }),
      deleteCountry: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Country name already exists'),
    };

    await TestBed.configureTestingModule({
      imports: [TenantPlatformSettingsComponent],
      providers: [
        { provide: TenantCountrySettingsService, useValue: countrySettings },
      ],
    }).compileComponents();
  });

  it('loads backend countries when the country tab is selected and does not show placeholders', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('country');
    fixture.detectChanges();

    expect(countrySettings.listCountries).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Brazil');
    expect(fixture.nativeElement.textContent).not.toContain('You do not have permission to manage tenant countries.');
    expect(fixture.nativeElement.textContent).not.toContain('Saudi Arabia');
    expect(fixture.nativeElement.textContent).not.toContain('United Arab Emirates');
  });

  it('opens the add modal and saves a new country through the backend', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await component.selectTab('country');

    component.openCountryModal();
    component.newCountryName.set(' Morocco ');
    await component.saveCountry();
    fixture.detectChanges();

    expect(countrySettings.createCountry).toHaveBeenCalledWith('Morocco');
    expect(component.showCountryModal()).toBe(false);
    expect(component.newCountryName()).toBe('');
    expect(component.countries().map((country) => country.name)).toContain('Morocco');
  });

  it('keeps the modal open for blank and backend-failed saves', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.openCountryModal();
    component.newCountryName.set('   ');
    await component.saveCountry();

    expect(component.showCountryModal()).toBe(true);
    expect(component.countryNameError()).toBe('Country name is required.');
    expect(countrySettings.createCountry).not.toHaveBeenCalled();

    countrySettings.createCountry.mockRejectedValueOnce(new Error('duplicate'));
    component.newCountryName.set('Brazil');
    await component.saveCountry();

    expect(component.showCountryModal()).toBe(true);
    expect(component.countrySaveError()).toBe('Country name already exists');
  });

  it('opens the edit modal with existing country data and saves updates through the backend', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('country');
    component.openEditCountryModal(component.countries()[0]);
    fixture.detectChanges();

    expect(component.showCountryModal()).toBe(true);
    expect(component.newCountryName()).toBe('Brazil');
    expect(fixture.nativeElement.textContent).toContain('Edit Country');

    component.newCountryName.set(' Jordan ');
    await component.saveCountry();
    fixture.detectChanges();

    expect(countrySettings.updateCountry).toHaveBeenCalledWith('country-1', 'Jordan');
    expect(component.showCountryModal()).toBe(false);
    expect(component.countries().map((country) => country.name)).toContain('Jordan');
  });

  it('renders country edit and delete actions and removes deleted countries', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('country');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[title="Edit country"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[title="Delete country"]')).toBeTruthy();

    await component.deleteCountry(component.countries()[0]);
    fixture.detectChanges();

    expect(countrySettings.deleteCountry).toHaveBeenCalledWith('country-1');
    expect(component.countries()).toEqual([]);
  });
});
