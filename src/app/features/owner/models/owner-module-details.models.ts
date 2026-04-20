import { OwnerModule } from './owner-modules.models';

export interface Feature {
  id: string;
  label: string;
  enabled: boolean;
}

export interface Limit {
  id: string;
  label: string;
  value: number | boolean;
  type: 'number' | 'boolean';
}

export interface TenantOverride {
  tenantName: string;
  plan: string;
  status: 'Forced Enabled' | 'Forced Disabled';
  reason: string;
  expiryDate?: string;
}

export interface ChangeLog {
  user: string;
  action: string;
  date: string;
  details: string;
}

export interface ModuleDependencies {
  dependsOn: string[];
  requiredBy: string[];
}

export interface AvailablePlan {
  name: string;
  tenantCount: number;
}

export interface ModuleDetailsPreset {
  module: OwnerModule;
  features: Feature[];
  limits: Limit[];
}
