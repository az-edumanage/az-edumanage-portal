export type ModuleCategory = 'Core Business' | 'Core System' | 'Advanced';
export type ModuleStatus = 'Enabled' | 'Disabled';

export interface OwnerModule {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  description: string;
  category: ModuleCategory;
  status: ModuleStatus;
  price: number;
  activeTenantsCount: number;
  lastUpdated: string;
  includedInPlans: string[];
  featureIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  icon: string;
}
