export type TenantHostContextType = 'tenant' | 'platform' | 'reserved' | 'local' | 'unknown';

export interface TenantRuntimeConfig {
  readonly tenantRootDomains: readonly string[];
  readonly platformHosts: readonly string[];
  readonly reservedSubdomains: readonly string[];
  readonly localTenantSuffixes: readonly string[];
}

export const DEFAULT_TENANT_RUNTIME_CONFIG: TenantRuntimeConfig = {
  tenantRootDomains: ['tenant.az-edumanage.com', 'az-edumanage.com'],
  platformHosts: ['az-edumanage.com', 'www.az-edumanage.com', 'panel.az-edumanage.com'],
  reservedSubdomains: ['api', 'admin', 'owner', 'www', 'app', 'dashboard', 'support'],
  localTenantSuffixes: ['local.az-edumanage.test'],
};
