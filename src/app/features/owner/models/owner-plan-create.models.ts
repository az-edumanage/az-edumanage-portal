export type OwnerPlanStatus = 'Active' | 'Archived' | 'Draft';
export type OwnerPlanVisibility = 'Public' | 'Private';
export type OwnerPlanCurrency = 'USD' | 'EUR' | 'EGP';
export type OwnerPlanAudienceType = 'center' | 'teacher';

export interface OwnerPlanOption {
  id: string;
  name: string;
}

export interface OwnerPlanVisibilityOption {
  value: OwnerPlanVisibility;
  label: string;
}

export interface OwnerPlanCurrencyOption {
  value: OwnerPlanCurrency;
  label: string;
}

export interface OwnerPlanModuleOption {
  id: string;
  name: string;
}

export interface OwnerPlanCreatePayload {
  name: string;
  description: string;
  status: OwnerPlanStatus;
  visibility: OwnerPlanVisibility;
  currency: OwnerPlanCurrency;
  audienceType: OwnerPlanAudienceType;
  monthlyPrice: number;
  yearlyPrice: number;
  hasTrial: boolean;
  trialDays: number;
  maxStudents: number;
  maxTeachers: number;
  maxStorage: number;
  maxBranches: number;
  moduleIds: string[];
  autoRenew: boolean;
  allowDowngrade: boolean;
  isRecommended: boolean;
  showAnnualPrice: boolean;
}

export interface OwnerPlanEditSeed extends OwnerPlanCreatePayload {
  id: string;
}
