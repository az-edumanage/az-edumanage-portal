import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

export interface TenantCountry {
  id: string;
  name: string;
  code: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCountryCreatePayload {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TenantCountrySettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly countriesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/countries`;

  async listCountries(): Promise<TenantCountry[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCountry[]>(this.countriesUrl));
    return response ?? [];
  }

  async createCountry(name: string): Promise<TenantCountry> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<TenantCountry>(this.countriesUrl, { name: name.trim() }));
  }

  async updateCountry(countryId: string, name: string): Promise<TenantCountry> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.put<TenantCountry>(`${this.countriesUrl}/${countryId}`, { name: name.trim() }));
  }

  async deleteCountry(countryId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.countriesUrl}/${countryId}`));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage tenant countries.';
      }
    }
    return 'Unable to save country. Please try again.';
  }

  private extractApiMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }
    const apiError = error as { message?: unknown; details?: unknown };
    if (Array.isArray(apiError.details)) {
      const first = apiError.details.find((detail): detail is string => typeof detail === 'string' && detail.trim().length > 0);
      if (first) {
        return first.trim();
      }
    }
    if (typeof apiError.message === 'string' && apiError.message.trim()) {
      return apiError.message.trim();
    }
    return null;
  }
}
