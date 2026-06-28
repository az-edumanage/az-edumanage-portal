import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import {
  DEFAULT_TENANT_RUNTIME_CONFIG,
  TenantHostContextType,
  TenantRuntimeConfig,
} from '../config/tenant-runtime.config';

export interface TenantHostContext {
  readonly contextType: TenantHostContextType;
  readonly hostname: string;
  readonly subdomain: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantHostContextService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config: TenantRuntimeConfig = DEFAULT_TENANT_RUNTIME_CONFIG;
  private readonly contextState = signal<TenantHostContext>(this.resolveCurrentHost());

  readonly context = computed(() => this.contextState());
  readonly isTenantHost = computed(() => this.contextState().contextType === 'tenant');

  refresh(): TenantHostContext {
    const context = this.resolveCurrentHost();
    this.contextState.set(context);
    return context;
  }

  private resolveCurrentHost(): TenantHostContext {
    const hostname = this.currentHostname();
    if (!hostname) {
      return { contextType: 'unknown', hostname: '', subdomain: null };
    }
    if (this.config.platformHosts.includes(hostname)) {
      return { contextType: 'platform', hostname, subdomain: null };
    }
    const tenantRoots = [...this.config.tenantRootDomains, ...this.config.localTenantSuffixes]
      .sort((left, right) => right.length - left.length);
    for (const root of tenantRoots) {
      const suffix = `.${root}`;
      if (hostname.endsWith(suffix) && hostname.length > suffix.length) {
        const subdomain = hostname.slice(0, -suffix.length);
        if (this.config.reservedSubdomains.includes(subdomain)) {
          return { contextType: 'reserved', hostname, subdomain };
        }
        return { contextType: 'tenant', hostname, subdomain };
      }
    }
    if (hostname === 'localhost') {
      return { contextType: 'local', hostname, subdomain: null };
    }
    return { contextType: 'unknown', hostname, subdomain: null };
  }

  private currentHostname(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }
    return this.document.location.hostname.toLowerCase();
  }
}
