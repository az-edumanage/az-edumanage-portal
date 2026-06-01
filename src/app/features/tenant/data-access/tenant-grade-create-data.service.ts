import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import {
  TenantGradeAcademicLevelOption,
  TenantGradeCountryOption,
  TenantGradeCreateForm,
} from '../models/tenant-grade-create.models';
import { Grade, GradeGroupRow } from '../models/tenant-grades.models';
import { EducationalStage } from '../models/tenant-educational-stages.models';
import { TenantCountrySettingsService } from './tenant-country-settings.service';

type GradeResponse = Omit<Grade, 'groups'> & {
  groups?: GradeGroupRow[] | null;
};

@Injectable({ providedIn: 'root' })
export class TenantGradeCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly countryService = inject(TenantCountrySettingsService);
  private readonly gradesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/grades`;
  private readonly stagesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/stages`;

  async listCountryOptions(): Promise<TenantGradeCountryOption[]> {
    const countries = await this.countryService.listCountries();
    return countries.map((country) => ({
      value: country.id,
      label: country.name,
      code: country.code,
    }));
  }

  async listAcademicLevelOptions(countryId: string): Promise<TenantGradeAcademicLevelOption[]> {
    if (!countryId) {
      return [];
    }
    await this.authApi.ensureLoggedIn();
    const params = new HttpParams().set('countryId', countryId);
    const stages = await firstValueFrom(this.http.get<EducationalStage[]>(this.stagesUrl, { params }));
    return (stages ?? []).map((stage) => ({
      value: stage.id,
      label: stage.name,
      countryId: stage.countryId,
    }));
  }

  async createGrade(payload: TenantGradeCreateForm): Promise<Grade> {
    await this.authApi.ensureLoggedIn();
    return this.normalizeGrade(await firstValueFrom(this.http.post<GradeResponse>(this.gradesUrl, this.toPayload(payload))));
  }

  async getGrade(id: string): Promise<Grade> {
    await this.authApi.ensureLoggedIn();
    return this.normalizeGrade(await firstValueFrom(this.http.get<GradeResponse>(`${this.gradesUrl}/${id}`)));
  }

  async updateGrade(id: string, payload: TenantGradeCreateForm): Promise<Grade> {
    await this.authApi.ensureLoggedIn();
    return this.normalizeGrade(await firstValueFrom(this.http.put<GradeResponse>(`${this.gradesUrl}/${id}`, this.toPayload(payload))));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage tenant grades.';
      }
      if (error.status === 404) {
        return 'The selected country or academic level could not be found.';
      }
    }
    return 'Unable to save grade. Please try again.';
  }

  private toPayload(payload: TenantGradeCreateForm): TenantGradeCreateForm {
    return {
      name: payload.name.trim(),
      countryId: payload.countryId,
      stageId: payload.stageId,
      description: payload.description?.trim() || null,
    };
  }

  private normalizeGrade(grade: GradeResponse): Grade {
    return {
      ...grade,
      groups: grade.groups ?? [],
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
