import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthIdentityService } from '../../../core/auth/auth-identity.service';
import {
  OwnerWebsiteSettingsDataService,
  SaveWebsiteSettingsRequest,
  WebsiteSettingsView,
} from '../data-access/owner-website-settings-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerWebSettingsFacade {
  private readonly data = inject(OwnerWebsiteSettingsDataService);
  private readonly identity = inject(AuthIdentityService);

  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly publishingState = signal(false);
  private readonly settingsState = signal<WebsiteSettingsView | null>(null);

  readonly loading = computed(() => this.loadingState());
  readonly saving = computed(() => this.savingState());
  readonly publishing = computed(() => this.publishingState());
  readonly settings = computed(() => this.settingsState());

  resolveTenantId(): string {
    const current = this.identity.identity();
    const isOwnerWorkspace = current?.primaryRole === 'SUPER_ADMIN' || current?.primaryRole === 'OWNER';
    if (isOwnerWorkspace) {
      return 'platform-owner';
    }
    const tenantId = current?.tenantId;
    if (tenantId?.trim()) {
      return tenantId;
    }
    return 'platform-owner';
  }

  async load(): Promise<WebsiteSettingsView> {
    this.loadingState.set(true);
    try {
      const settings = await this.data.getSettings(this.resolveTenantId());
      this.settingsState.set(settings);
      return settings;
    } finally {
      this.loadingState.set(false);
    }
  }

  async saveDraft(payload: SaveWebsiteSettingsRequest): Promise<WebsiteSettingsView> {
    this.savingState.set(true);
    try {
      const settings = await this.data.saveDraft(this.resolveTenantId(), payload);
      this.settingsState.set(settings);
      return settings;
    } finally {
      this.savingState.set(false);
    }
  }

  async publish(): Promise<WebsiteSettingsView> {
    this.publishingState.set(true);
    try {
      const settings = await this.data.publish(this.resolveTenantId());
      this.settingsState.set(settings);
      return settings;
    } finally {
      this.publishingState.set(false);
    }
  }

  uploadWebsiteAssetWithProgress(
    section: string,
    file: File,
  ): Observable<HttpEvent<{ url: string; fileName: string; section: string; tenantId: string }>> {
    return this.data.uploadWebsiteAssetWithProgress(this.resolveTenantId(), section, file);
  }

  async uploadWebsiteAsset(section: string, file: File): Promise<{ url: string; fileName: string; section: string; tenantId: string }> {
    return this.data.uploadWebsiteAsset(this.resolveTenantId(), section, file);
  }

  async deleteWebsiteAsset(section: string, fileName: string): Promise<{ deleted: boolean }> {
    return this.data.deleteWebsiteAsset(this.resolveTenantId(), section, fileName);
  }
}
