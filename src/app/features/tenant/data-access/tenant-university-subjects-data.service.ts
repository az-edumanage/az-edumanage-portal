import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantUniversitySubject, TenantUniversitySubjectPayload } from '../models/tenant-university-subjects.models';

export interface TenantUniversitySubjectListFilters {
  universityId?: string;
  collegeId?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantUniversitySubjectsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly subjectsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/university-subjects`;

  async listSubjects(filters: TenantUniversitySubjectListFilters = {}): Promise<TenantUniversitySubject[]> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams();
    if (filters.universityId) {
      params = params.set('universityId', filters.universityId);
    }
    if (filters.collegeId) {
      params = params.set('collegeId', filters.collegeId);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantUniversitySubject[]>(this.subjectsUrl, { params }));
    return response ?? [];
  }

  async getSubject(id: string): Promise<TenantUniversitySubject> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.get<TenantUniversitySubject>(`${this.subjectsUrl}/${id}`));
  }

  async createSubject(payload: TenantUniversitySubjectPayload): Promise<TenantUniversitySubject> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.post<TenantUniversitySubject>(this.subjectsUrl, this.normalizePayload(payload)));
  }

  async updateSubject(id: string, payload: TenantUniversitySubjectPayload): Promise<TenantUniversitySubject> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.put<TenantUniversitySubject>(`${this.subjectsUrl}/${id}`, this.normalizePayload(payload)));
  }

  async deleteSubject(id: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.subjectsUrl}/${id}`));
  }

  toUserMessage(error: unknown, fallbackMessage = 'Unable to load university subjects. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage university subjects.';
      }
      if (error.status === 404) {
        return 'The selected university subject, college, or university could not be found.';
      }
    }
    return fallbackMessage;
  }

  private normalizePayload(payload: TenantUniversitySubjectPayload): TenantUniversitySubjectPayload {
    return {
      universityId: payload.universityId,
      collegeId: payload.collegeId,
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
