import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { Grade } from '../models/tenant-grades.models';
import { EducationalStage } from '../models/tenant-educational-stages.models';
import {
  TenantSubject,
  TenantSubjectCreateForm,
  TenantSubjectGradeOption,
  TenantSubjectGroupRow,
  TenantSubjectStageOption,
} from '../models/tenant-subjects.models';

type TenantSubjectResponse = Omit<TenantSubject, 'groups'> & {
  groups?: TenantSubjectGroupRow[] | null;
};

export interface TenantSubjectListFilters {
  stageId?: string;
  gradeId?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantSubjectsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly subjectsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/subjects`;
  private readonly stagesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/stages`;
  private readonly gradesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/grades`;

  async listSubjects(filters: TenantSubjectListFilters = {}): Promise<TenantSubject[]> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams();
    if (filters.stageId) {
      params = params.set('stageId', filters.stageId);
    }
    if (filters.gradeId) {
      params = params.set('gradeId', filters.gradeId);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantSubjectResponse[]>(this.subjectsUrl, { params }));
    return (response ?? []).map((subject) => this.normalizeSubject(subject));
  }

  async createSubject(payload: TenantSubjectCreateForm): Promise<TenantSubject> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantSubjectResponse>(this.subjectsUrl, {
      name: payload.name.trim(),
      stageId: payload.stageId,
      gradeId: payload.gradeId,
    }));
    return this.normalizeSubject(response);
  }

  async getSubjectDetails(id: string): Promise<TenantSubject> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantSubjectResponse>(`${this.subjectsUrl}/${id}`));
    return this.normalizeSubject(response);
  }

  async listStageOptions(): Promise<TenantSubjectStageOption[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<EducationalStage[]>(this.stagesUrl));
    return (response ?? []).map((stage) => ({
      value: stage.id,
      label: stage.name,
    }));
  }

  async listGradeOptions(): Promise<TenantSubjectGradeOption[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<Grade[]>(this.gradesUrl));
    return (response ?? []).map((grade) => ({
      value: grade.id,
      label: grade.name,
      stageId: grade.stageId,
    }));
  }

  toUserMessage(error: unknown, fallbackMessage = 'Unable to load subjects. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage tenant subjects.';
      }
      if (error.status === 404) {
        return 'The selected subject, academic level, or grade could not be found.';
      }
    }
    return fallbackMessage;
  }

  private normalizeSubject(subject: TenantSubjectResponse): TenantSubject {
    return {
      ...subject,
      assignedGroupsCount: subject.assignedGroupsCount ?? 0,
      totalStudentsCount: subject.totalStudentsCount ?? 0,
      groups: subject.groups ?? [],
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
