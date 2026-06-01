import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantCollege, TenantCollegeOption, TenantCollegePayload } from '../models/tenant-colleges.models';

export interface TenantCollegeListFilters {
  universityId?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantCollegesDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly collegesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/colleges`;

  async listColleges(filters: TenantCollegeListFilters = {}): Promise<TenantCollege[]> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams();
    if (filters.universityId) {
      params = params.set('universityId', filters.universityId);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantCollege[]>(this.collegesUrl, { params }));
    return response ?? [];
  }

  async listCollegeOptions(universityId = ''): Promise<TenantCollegeOption[]> {
    const colleges = await this.listColleges({ universityId });
    return colleges.map((college) => ({
      value: college.id,
      label: college.name,
      universityId: college.universityId,
    }));
  }

  async getCollege(id: string): Promise<TenantCollege> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.get<TenantCollege>(`${this.collegesUrl}/${id}`));
  }

  async createCollege(payload: TenantCollegePayload): Promise<TenantCollege> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.post<TenantCollege>(this.collegesUrl, this.normalizePayload(payload)));
  }

  async updateCollege(id: string, payload: TenantCollegePayload): Promise<TenantCollege> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.put<TenantCollege>(`${this.collegesUrl}/${id}`, this.normalizePayload(payload)));
  }

  async deleteCollege(id: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.collegesUrl}/${id}`));
  }

  toUserMessage(error: unknown, fallbackMessage = 'Unable to load colleges. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage colleges.';
      }
      if (error.status === 404) {
        return 'The selected college or university could not be found.';
      }
    }
    return fallbackMessage;
  }

  private normalizePayload(payload: TenantCollegePayload): TenantCollegePayload {
    return {
      universityId: payload.universityId,
      name: payload.name.trim(),
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
