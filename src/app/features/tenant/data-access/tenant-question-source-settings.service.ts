import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

export type TenantQuestionSourceEducationCategory = 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';

export interface TenantQuestionSource {
  id: string;
  source: string;
  educationCategory?: TenantQuestionSourceEducationCategory | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantQuestionSourcePayload {
  source: string;
  educationCategory: TenantQuestionSourceEducationCategory;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantQuestionSourceSettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly questionSourcesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/question-sources`;

  async listQuestionSources(educationCategory?: TenantQuestionSourceEducationCategory | null): Promise<TenantQuestionSource[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantQuestionSource[]>(
      this.questionSourcesUrl,
      { params: educationCategory ? { educationCategory } : undefined },
    ));
    return response ?? [];
  }

  async createQuestionSource(payload: TenantQuestionSourcePayload): Promise<TenantQuestionSource> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<TenantQuestionSource>(this.questionSourcesUrl, this.toRequest(payload)));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage question sources.';
      }
    }
    return 'Unable to save question source. Please try again.';
  }

  private toRequest(payload: TenantQuestionSourcePayload): TenantQuestionSourcePayload {
    return {
      source: payload.source.trim(),
      educationCategory: payload.educationCategory,
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
