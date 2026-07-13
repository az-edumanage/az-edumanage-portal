import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TenantLmsTemplateSummary {
  key: string;
  name: string;
  description: string;
  previewImageUrl: string | null;
}

export interface TenantLmsSettingsView {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  websiteHost?: string | null;
  websiteUrl?: string | null;
  lmsEnabled: boolean;
  websiteEnabled: boolean;
  selectedTemplateKey: string;
  templates: TenantLmsTemplateSummary[];
  brand: {
    teacherName: string;
    subject: string;
    audience: string;
    headline: string;
    subheadline: string;
    announcement: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    portraitImageUrl: string | null;
  };
}

export interface SaveTenantLmsSettingsRequest {
  websiteEnabled: boolean;
  selectedTemplateKey: string;
  teacherName: string;
  subject: string;
  audience: string;
  headline: string;
  subheadline: string;
  announcement: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  portraitImageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantLmsSettingsDataService {
  private readonly http = inject(HttpClient);

  getSettings(): Promise<TenantLmsSettingsView> {
    return firstValueFrom(this.http.get<TenantLmsSettingsView>(`${environment.apiBaseUrl}/tenant/lms-settings`));
  }

  saveSettings(payload: SaveTenantLmsSettingsRequest): Promise<TenantLmsSettingsView> {
    return firstValueFrom(this.http.put<TenantLmsSettingsView>(`${environment.apiBaseUrl}/tenant/lms-settings`, payload));
  }
}
