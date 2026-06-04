import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApiService } from '../auth/auth-api.service';

export interface CountryLocationOption {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string | null;
  active: boolean;
  sortOrder: number;
}

export interface CityLocationOption {
  id: number;
  countryId: number;
  nameEn: string;
  nameAr: string | null;
  active: boolean;
  sortOrder: number;
}

export interface CountryLocationPayload {
  code: string;
  nameEn: string;
  nameAr: string | null;
  active: boolean;
  sortOrder: number;
}

export interface CityLocationPayload {
  countryId: number;
  nameEn: string;
  nameAr: string | null;
  active: boolean;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class LocationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  async listCountries(activeOnly = false): Promise<CountryLocationOption[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.get<CountryLocationOption[]>(`${environment.apiBaseUrl}/platform-settings/countries`, {
        params: { activeOnly },
      }),
    );
    return response ?? [];
  }

  async createCountry(payload: CountryLocationPayload): Promise<CountryLocationOption> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(
      this.http.post<CountryLocationOption>(`${environment.apiBaseUrl}/platform-settings/countries`, payload),
    );
  }

  async updateCountry(countryId: number, payload: CountryLocationPayload): Promise<CountryLocationOption> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(
      this.http.put<CountryLocationOption>(`${environment.apiBaseUrl}/platform-settings/countries/${countryId}`, payload),
    );
  }

  async deleteCountry(countryId: number): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${environment.apiBaseUrl}/platform-settings/countries/${countryId}`));
  }

  async getCities(countryId: number, activeOnly = false): Promise<CityLocationOption[]> {
    return await this.listCities(countryId, activeOnly);
  }

  async listCities(countryId: number, activeOnly = false): Promise<CityLocationOption[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.get<CityLocationOption[]>(`${environment.apiBaseUrl}/platform-settings/countries/${countryId}/cities`, {
        params: { activeOnly },
      }),
    );
    return response ?? [];
  }

  async createCity(countryId: number, payload: CityLocationPayload): Promise<CityLocationOption> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(
      this.http.post<CityLocationOption>(`${environment.apiBaseUrl}/platform-settings/countries/${countryId}/cities`, payload),
    );
  }

  async updateCity(cityId: number, payload: CityLocationPayload): Promise<CityLocationOption> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(
      this.http.put<CityLocationOption>(`${environment.apiBaseUrl}/platform-settings/cities/${cityId}`, payload),
    );
  }

  async deleteCity(cityId: number): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${environment.apiBaseUrl}/platform-settings/cities/${cityId}`));
  }
}
