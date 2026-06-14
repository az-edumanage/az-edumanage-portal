import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

export type TenantSubscriptionPeriodDurationType = 'Month' | 'Day';

export interface TenantSubscriptionPeriod {
  id: string;
  name: string;
  durationType: TenantSubscriptionPeriodDurationType;
  durationValue: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscriptionPeriodPayload {
  name: string;
  durationType: TenantSubscriptionPeriodDurationType;
  durationValue: number;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantSubscriptionPeriodSettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly subscriptionPeriodsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/subscription-periods`;

  async listSubscriptionPeriods(): Promise<TenantSubscriptionPeriod[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantSubscriptionPeriod[]>(this.subscriptionPeriodsUrl));
    return response ?? [];
  }

  async createSubscriptionPeriod(payload: TenantSubscriptionPeriodPayload): Promise<TenantSubscriptionPeriod> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<TenantSubscriptionPeriod>(this.subscriptionPeriodsUrl, this.toRequest(payload)));
  }

  async updateSubscriptionPeriod(periodId: string, payload: TenantSubscriptionPeriodPayload): Promise<TenantSubscriptionPeriod> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.put<TenantSubscriptionPeriod>(`${this.subscriptionPeriodsUrl}/${periodId}`, this.toRequest(payload)));
  }

  async deleteSubscriptionPeriod(periodId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.subscriptionPeriodsUrl}/${periodId}`));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage subscription periods.';
      }
    }
    return 'Unable to save subscription period. Please try again.';
  }

  private toRequest(payload: TenantSubscriptionPeriodPayload): TenantSubscriptionPeriodPayload {
    return {
      name: payload.name.trim(),
      durationType: payload.durationType,
      durationValue: payload.durationValue,
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
