import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { Grade, GradeGroupRow } from '../models/tenant-grades.models';

type GradeResponse = Omit<Grade, 'groups'> & {
  groups?: GradeGroupRow[] | null;
};

@Injectable({ providedIn: 'root' })
export class TenantGradesDataService {
  private readonly loadFailureMessage = 'Unable to load grades. Please try again.';
  private readonly detailFailureMessage = 'Unable to load grade details. Please try again.';
  private readonly updateFailureMessage = 'Unable to save grade. Please try again.';
  private readonly deleteFailureMessage = 'Unable to delete grade. Please try again.';
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly gradesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/grades`;

  async listGrades(): Promise<Grade[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<GradeResponse[]>(this.gradesUrl));
    return (response ?? []).map((grade) => ({
      ...grade,
      groups: grade.groups ?? [],
    }));
  }

  async deleteGrade(id: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.gradesUrl}/${id}`));
  }

  toUserMessage(error: unknown, fallbackMessage = this.loadFailureMessage): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage tenant grades.';
      }
    }
    return fallbackMessage;
  }

  toDetailUserMessage(error: unknown): string {
    return this.toUserMessage(error, this.detailFailureMessage);
  }

  toUpdateUserMessage(error: unknown): string {
    return this.toUserMessage(error, this.updateFailureMessage);
  }

  toDeleteUserMessage(error: unknown): string {
    return this.toUserMessage(error, this.deleteFailureMessage);
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
