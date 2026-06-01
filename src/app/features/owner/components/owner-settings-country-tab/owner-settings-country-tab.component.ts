import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CityLocationOption,
  CityLocationPayload,
  CountryLocationOption,
  CountryLocationPayload,
  LocationSettingsService,
} from '../../../../core/services/location-settings.service';

@Component({
  selector: 'app-owner-settings-country-tab',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './owner-settings-country-tab.component.html',
  styleUrl: './owner-settings-country-tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerSettingsCountryTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly locationSettings = inject(LocationSettingsService);

  readonly translate = input.required<(key: string) => string>();
  readonly countries = signal<CountryLocationOption[]>([]);
  readonly cities = signal<CityLocationOption[]>([]);
  readonly isLoading = signal(false);
  readonly isCityLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly cityErrorMessage = signal<string | null>(null);
  readonly editingCountry = signal<CountryLocationOption | null>(null);
  readonly selectedCountryId = signal<number | null>(null);
  readonly selectedCountry = signal<CountryLocationOption | null>(null);
  readonly editingCity = signal<CityLocationOption | null>(null);
  readonly formTitle = computed(() =>
    this.editingCountry() === null
      ? this.translate()('owner.settings.country.newTitle')
      : this.translate()('owner.settings.country.editTitle'),
  );
  readonly cityFormTitle = computed(() =>
    this.editingCity() === null
      ? this.translate()('owner.settings.country.cityNewTitle')
      : this.translate()('owner.settings.country.cityEditTitle'),
  );

  readonly countryForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(16)]],
    nameEn: ['', [Validators.required, Validators.maxLength(160)]],
    nameAr: ['', [Validators.maxLength(160)]],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    active: [true],
  });

  readonly cityForm = this.fb.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(160)]],
    nameAr: ['', [Validators.maxLength(160)]],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    active: [true],
  });

  ngOnInit(): void {
    void this.loadCountries();
  }

  async loadCountries(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const countries = await this.locationSettings.listCountries(false);
      this.countries.set(countries);
      await this.reconcileSelectedCountry(countries);
    } catch (error) {
      this.errorMessage.set(this.resolveError(error, 'owner.settings.country.error'));
    } finally {
      this.isLoading.set(false);
    }
  }

  editCountry(country: CountryLocationOption): void {
    this.editingCountry.set(country);
    this.countryForm.setValue({
      code: country.code,
      nameEn: country.nameEn,
      nameAr: country.nameAr ?? '',
      sortOrder: country.sortOrder,
      active: country.active,
    });
  }

  resetForm(): void {
    this.editingCountry.set(null);
    this.errorMessage.set(null);
    this.countryForm.reset({
      code: '',
      nameEn: '',
      nameAr: '',
      sortOrder: 0,
      active: true,
    });
  }

  async saveCountry(): Promise<void> {
    if (this.countryForm.invalid || this.isSaving()) {
      this.countryForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const payload = this.countryPayload();
      const editing = this.editingCountry();
      const savedCountry = editing === null
        ? await this.locationSettings.createCountry(payload)
        : await this.locationSettings.updateCountry(editing.id, payload);
      this.selectedCountryId.set(savedCountry.id);
      await this.loadCountries();
      this.resetForm();
    } catch (error) {
      this.errorMessage.set(this.resolveError(error, 'owner.settings.country.error'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteCountry(country: CountryLocationOption): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.locationSettings.deleteCountry(country.id);
      await this.loadCountries();
      if (this.editingCountry()?.id === country.id) {
        this.resetForm();
      }
      if (this.selectedCountryId() === country.id) {
        this.clearSelectedCountry();
      }
    } catch (error) {
      this.errorMessage.set(this.resolveError(error, 'owner.settings.country.error'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async selectCountry(country: CountryLocationOption): Promise<void> {
    if (this.selectedCountryId() === country.id) {
      return;
    }
    this.selectedCountryId.set(country.id);
    this.selectedCountry.set(country);
    this.resetCityForm();
    await this.loadCities();
  }

  async loadCities(): Promise<void> {
    const selected = this.selectedCountry();
    if (selected === null) {
      this.cities.set([]);
      return;
    }

    this.isCityLoading.set(true);
    this.cityErrorMessage.set(null);
    try {
      this.cities.set(await this.locationSettings.getCities(selected.id, false));
    } catch (error) {
      this.cityErrorMessage.set(this.resolveError(error, 'owner.settings.country.cityError'));
    } finally {
      this.isCityLoading.set(false);
    }
  }

  editCity(city: CityLocationOption): void {
    this.editingCity.set(city);
    this.cityForm.setValue({
      nameEn: city.nameEn,
      nameAr: city.nameAr ?? '',
      sortOrder: city.sortOrder,
      active: city.active,
    });
  }

  resetCityForm(): void {
    this.editingCity.set(null);
    this.cityErrorMessage.set(null);
    this.cityForm.reset({
      nameEn: '',
      nameAr: '',
      sortOrder: 0,
      active: true,
    });
  }

  async saveCity(): Promise<void> {
    const selected = this.selectedCountry();
    if (selected === null || this.cityForm.invalid || this.isSaving()) {
      this.cityForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.cityErrorMessage.set(null);
    try {
      const payload = this.cityPayload(selected.id);
      const editing = this.editingCity();
      if (editing === null) {
        await this.locationSettings.createCity(selected.id, payload);
      } else {
        await this.locationSettings.updateCity(editing.id, payload);
      }
      await this.loadCities();
      this.resetCityForm();
    } catch (error) {
      this.cityErrorMessage.set(this.resolveError(error, 'owner.settings.country.cityError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteCity(city: CityLocationOption): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.cityErrorMessage.set(null);
    try {
      await this.locationSettings.deleteCity(city.id);
      await this.loadCities();
      if (this.editingCity()?.id === city.id) {
        this.resetCityForm();
      }
    } catch (error) {
      this.cityErrorMessage.set(this.resolveError(error, 'owner.settings.country.cityError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  private countryPayload(): CountryLocationPayload {
    const value = this.countryForm.getRawValue();
    const nameAr = value.nameAr.trim();
    return {
      code: value.code.trim(),
      nameEn: value.nameEn.trim(),
      nameAr: nameAr.length > 0 ? nameAr : null,
      active: value.active,
      sortOrder: value.sortOrder,
    };
  }

  private cityPayload(countryId: number): CityLocationPayload {
    const value = this.cityForm.getRawValue();
    const nameAr = value.nameAr.trim();
    return {
      countryId,
      nameEn: value.nameEn.trim(),
      nameAr: nameAr.length > 0 ? nameAr : null,
      active: value.active,
      sortOrder: value.sortOrder,
    };
  }

  private async reconcileSelectedCountry(countries: CountryLocationOption[]): Promise<void> {
    const selectedId = this.selectedCountryId();
    const selected = selectedId === null
      ? countries[0] ?? null
      : countries.find((country) => country.id === selectedId) ?? null;

    if (selected === null) {
      this.clearSelectedCountry();
      return;
    }

    this.selectedCountryId.set(selected.id);
    this.selectedCountry.set(selected);
    await this.loadCities();
  }

  private clearSelectedCountry(): void {
    this.selectedCountryId.set(null);
    this.selectedCountry.set(null);
    this.cities.set([]);
    this.resetCityForm();
  }

  private resolveError(error: unknown, fallbackKey: string): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return this.translate()(fallbackKey);
  }
}
