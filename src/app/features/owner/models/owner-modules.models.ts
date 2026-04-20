export type ModuleCategory = 'Core Business' | 'Core System' | 'Advanced';
export type ModuleStatus = 'Enabled' | 'Disabled';

export interface OwnerModule {
  id: string;
  name: string;
  code: string;
  description: string;
  category: ModuleCategory;
  status: ModuleStatus;
  activeTenantsCount: number;
  lastUpdated: string;
  includedInPlans: string[];
  icon: string;
}
