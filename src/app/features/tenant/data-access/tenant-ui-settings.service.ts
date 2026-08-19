import { computed, Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

export interface TenantUiSettings {
  showUniversityEducationSidebar: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantUiSettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly settingsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/ui`;
  private loaded = false;

  readonly settings = signal<TenantUiSettings>({ showUniversityEducationSidebar: true });
  readonly showUniversityEducationSidebar = computed(() => this.settings().showUniversityEducationSidebar);

  async loadSettings(): Promise<TenantUiSettings> {
    if (this.loaded) {
      return this.settings();
    }
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantUiSettings>(this.settingsUrl));
    const settings = this.normalizeSettings(response);
    this.settings.set(settings);
    this.loaded = true;
    return settings;
  }

  async updateSettings(payload: TenantUiSettings): Promise<TenantUiSettings> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantUiSettings>(this.settingsUrl, payload));
    const settings = this.normalizeSettings(response);
    this.settings.set(settings);
    this.loaded = true;
    return settings;
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to change sidebar settings.';
      }
    }
    return 'Unable to save sidebar settings. Please try again.';
  }

  private normalizeSettings(settings: TenantUiSettings | null | undefined): TenantUiSettings {
    return {
      showUniversityEducationSidebar: settings?.showUniversityEducationSidebar ?? true,
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
