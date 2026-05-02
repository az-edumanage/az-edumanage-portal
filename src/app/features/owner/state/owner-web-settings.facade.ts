import { Injectable, computed, inject, signal } from '@angular/core';
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
    const tenantId = this.identity.identity()?.tenantId;
    if (tenantId && tenantId.trim()) {
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
}
