import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantUniversity, TenantUniversityOption, TenantUniversityPayload } from '../models/tenant-universities.models';

export interface TenantUniversityListFilters {
  countryId?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantUniversitiesDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly universitiesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/universities`;

  async listUniversities(filters: TenantUniversityListFilters = {}): Promise<TenantUniversity[]> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams();
    if (filters.countryId) {
      params = params.set('countryId', filters.countryId);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantUniversity[]>(this.universitiesUrl, { params }));
    return response ?? [];
  }

  async listUniversityOptions(): Promise<TenantUniversityOption[]> {
    const universities = await this.listUniversities();
    return universities.map((university) => ({
      value: university.id,
      label: university.name,
    }));
  }

  async getUniversity(id: string): Promise<TenantUniversity> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.get<TenantUniversity>(`${this.universitiesUrl}/${id}`));
  }

  async createUniversity(payload: TenantUniversityPayload): Promise<TenantUniversity> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.post<TenantUniversity>(this.universitiesUrl, this.normalizePayload(payload)));
  }

  async updateUniversity(id: string, payload: TenantUniversityPayload): Promise<TenantUniversity> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.put<TenantUniversity>(`${this.universitiesUrl}/${id}`, this.normalizePayload(payload)));
  }

  async deleteUniversity(id: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.universitiesUrl}/${id}`));
  }

  toUserMessage(error: unknown, fallbackMessage = 'Unable to load universities. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage universities.';
      }
      if (error.status === 404) {
        return 'The selected university could not be found.';
      }
    }
    return fallbackMessage;
  }

  private normalizePayload(payload: TenantUniversityPayload): TenantUniversityPayload {
    return {
      name: payload.name.trim(),
      countryId: payload.countryId.trim(),
      description: payload.description?.trim() || null,
    };
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
