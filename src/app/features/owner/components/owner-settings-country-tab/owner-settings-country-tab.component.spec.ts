import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OwnerSettingsCountryTabComponent } from './owner-settings-country-tab.component';
import { LocationSettingsService } from '../../../../core/services/location-settings.service';

const country = { id: 1, code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', active: true, sortOrder: 1 };
const city = { id: 10, countryId: 1, nameEn: 'Cairo', nameAr: 'القاهرة', active: true, sortOrder: 1 };

const locationSettingsMock = {
  listCountries: vi.fn(),
  createCountry: vi.fn(),
  updateCountry: vi.fn(),
  deleteCountry: vi.fn(),
  getCities: vi.fn(),
  listCities: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
};

describe('OwnerSettingsCountryTabComponent', () => {
  let fixture: ComponentFixture<OwnerSettingsCountryTabComponent>;
  let component: OwnerSettingsCountryTabComponent;

  beforeEach(async () => {
    locationSettingsMock.listCountries.mockResolvedValue([country]);
    locationSettingsMock.createCountry.mockResolvedValue(country);
    locationSettingsMock.updateCountry.mockResolvedValue(country);
    locationSettingsMock.deleteCountry.mockResolvedValue(undefined);
    locationSettingsMock.getCities.mockResolvedValue([city]);
    locationSettingsMock.listCities.mockResolvedValue([city]);
    locationSettingsMock.createCity.mockResolvedValue(city);
    locationSettingsMock.updateCity.mockResolvedValue(city);
    locationSettingsMock.deleteCity.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [OwnerSettingsCountryTabComponent],
      providers: [{ provide: LocationSettingsService, useValue: locationSettingsMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerSettingsCountryTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('translate', (key: string) => key);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders countries', async () => {
    await component.loadCountries();
    fixture.detectChanges();

    expect(locationSettingsMock.listCountries).toHaveBeenCalledWith(false);
    expect(component.countries()).toEqual([country]);
    expect(component.selectedCountryId()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Egypt');
    expect(fixture.nativeElement.textContent).toContain('EG');
    expect(fixture.nativeElement.textContent).toContain('Cities in Egypt');
  });

  it('creates a country from form values and reloads the list', async () => {
    component.countryForm.setValue({
      code: ' sa ',
      nameEn: ' Saudi Arabia ',
      nameAr: '',
      sortOrder: 3,
      active: true,
    });

    await component.saveCountry();

    expect(locationSettingsMock.createCountry).toHaveBeenCalledWith({
      code: 'sa',
      nameEn: 'Saudi Arabia',
      nameAr: null,
      active: true,
      sortOrder: 3,
    });
    expect(locationSettingsMock.listCountries).toHaveBeenCalledTimes(2);
  });

  it('updates and deactivates an existing country', async () => {
    component.editCountry(country);
    component.countryForm.patchValue({ nameEn: 'Egypt Updated', active: false });

    await component.saveCountry();
    await component.deleteCountry(country);

    expect(locationSettingsMock.updateCountry).toHaveBeenCalledWith(1, expect.objectContaining({
      code: 'EG',
      nameEn: 'Egypt Updated',
      active: false,
    }));
    expect(locationSettingsMock.deleteCountry).toHaveBeenCalledWith(1);
  });

  it('selects a country and loads its cities', async () => {
    await component.selectCountry(country);
    fixture.detectChanges();

    expect(component.selectedCountry()).toEqual(country);
    expect(locationSettingsMock.getCities).toHaveBeenCalledWith(1, false);
    expect(component.cities()).toEqual([city]);
    expect(fixture.nativeElement.textContent).toContain('Cairo');
  });

  it('creates a city for the selected country from form values and reloads cities', async () => {
    await component.selectCountry(country);
    locationSettingsMock.getCities.mockClear();
    component.cityForm.setValue({
      nameEn: ' Alexandria ',
      nameAr: '',
      sortOrder: 2,
      active: true,
    });

    await component.saveCity();

    expect(locationSettingsMock.createCity).toHaveBeenCalledWith(1, {
      countryId: 1,
      nameEn: 'Alexandria',
      nameAr: null,
      active: true,
      sortOrder: 2,
    });
    expect(locationSettingsMock.getCities).toHaveBeenCalledWith(1, false);
  });

  it('updates and deactivates an existing city', async () => {
    await component.selectCountry(country);
    component.editCity(city);
    component.cityForm.patchValue({ nameEn: 'Cairo Updated', active: false });

    await component.saveCity();
    await component.deleteCity(city);

    expect(locationSettingsMock.updateCity).toHaveBeenCalledWith(10, expect.objectContaining({
      countryId: 1,
      nameEn: 'Cairo Updated',
      active: false,
    }));
    expect(locationSettingsMock.deleteCity).toHaveBeenCalledWith(10);
  });
});
