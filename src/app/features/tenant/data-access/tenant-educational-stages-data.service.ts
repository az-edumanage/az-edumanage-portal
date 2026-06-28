import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { EducationalStage, EducationalStageCountryOption } from '../models/tenant-educational-stages.models';
import { TenantCountrySettingsService } from './tenant-country-settings.service';

export interface TenantStagePayload {
  name: string;
  description: string;
  countryId: string;
}

@Injectable({ providedIn: 'root' })
export class TenantEducationalStagesDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly countryService = inject(TenantCountrySettingsService);
  private readonly stagesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/stages`;
  readonly stages = signal<EducationalStage[]>([]);
  readonly countryOptions: EducationalStageCountryOption[] = [];

  async listStages(): Promise<EducationalStage[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<EducationalStage[]>(this.stagesUrl));
    const stages = response ?? [];
    this.stages.set(stages);
    return stages;
  }

  async listCountryOptions(): Promise<EducationalStageCountryOption[]> {
    const countries = await this.countryService.listCountries();
    const options = countries.map((country) => ({
      value: country.id,
      label: country.name,
      code: country.code,
    }));
    this.countryOptions.splice(0, this.countryOptions.length, ...options);
    return options;
  }

  async createCountryOption(name: string): Promise<EducationalStageCountryOption> {
    const country = await this.countryService.createCountry(name);
    const option = {
      value: country.id,
      label: country.name,
      code: country.code,
    };
    this.countryOptions.push(option);
    return option;
  }

  async createStage(payload: TenantStagePayload): Promise<EducationalStage> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<EducationalStage>(this.stagesUrl, this.toPayload(payload)));
  }

  async updateStage(stageId: string, payload: TenantStagePayload): Promise<EducationalStage> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.put<EducationalStage>(`${this.stagesUrl}/${stageId}`, this.toPayload(payload)));
  }

  async deleteStage(stageId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.stagesUrl}/${stageId}`));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage tenant educational stages.';
      }
      if (error.status === 404) {
        return 'The selected stage or country could not be found.';
      }
    }
    return 'Unable to save educational stages. Please try again.';
  }

  toCountryUserMessage(error: unknown): string {
    return this.countryService.toUserMessage(error);
  }

  private toPayload(payload: TenantStagePayload): TenantStagePayload {
    return {
      name: payload.name.trim(),
      description: payload.description.trim(),
      countryId: payload.countryId,
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
