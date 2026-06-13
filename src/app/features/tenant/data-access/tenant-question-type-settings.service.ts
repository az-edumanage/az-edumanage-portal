import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

export interface TenantQuestionType {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TenantQuestionTypeSettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly questionTypesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/question-types`;

  async listQuestionTypes(): Promise<TenantQuestionType[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantQuestionType[]>(this.questionTypesUrl));
    return response ?? [];
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to load question types.';
      }
    }
    return 'Unable to load question types. Please try again.';
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
