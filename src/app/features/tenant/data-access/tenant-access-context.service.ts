import { Injectable, inject, signal } from '@angular/core';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantAccessContextView, TenantOperationalStatus } from '../models/tenant-access.models';

@Injectable({ providedIn: 'root' })
export class TenantAccessContextService {
  private readonly authApi = inject(AuthApiService);

  readonly context = signal<TenantAccessContextView | null>(null);

  async ensureContext(forceRefresh = false): Promise<TenantAccessContextView | null> {
    if (!forceRefresh && this.context()) {
      return this.context();
    }

    const me = await this.authApi.me();
    const tenantAccess = me.tenantAccess;
    if (!tenantAccess) {
      this.context.set(null);
      return null;
    }

    const view: TenantAccessContextView = {
      tenantId: tenantAccess.tenantId,
      subscriptionState: tenantAccess.subscriptionState,
      tenantOperationalStatus: this.normalizeOperationalStatus(tenantAccess.tenantOperationalStatus),
      ownerDisplayStatus: tenantAccess.ownerDisplayStatus,
      accessMessage: tenantAccess.accessMessage,
      operationalStatusReason: tenantAccess.operationalStatusReason,
    };
    this.context.set(view);
    return view;
  }

  clear(): void {
    this.context.set(null);
  }

  private normalizeOperationalStatus(value: string | null | undefined): TenantOperationalStatus {
    switch ((value ?? '').trim().toLowerCase()) {
      case 'active':
      case 'pending':
      case 'suspended':
      case 'disabled':
      case 'blocked':
        return value!.trim().toLowerCase() as TenantOperationalStatus;
      default:
        return 'unknown';
    }
  }
}
