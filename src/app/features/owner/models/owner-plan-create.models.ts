export type OwnerPlanStatus = 'Active' | 'Archived' | 'Draft';
export type OwnerPlanVisibility = 'Public' | 'Private';
export type OwnerPlanCurrency = 'USD' | 'EUR' | 'EGP';

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

export interface OwnerPlanModules {
  academicStructure: boolean;
  studentsManagement: boolean;
  scheduling: boolean;
  usersManagement: boolean;
  auditLogs: boolean;
  examsAndGrades: boolean;
  finance: boolean;
  smsIntegration: boolean;
  advancedAnalytics: boolean;
  parentPortal: boolean;
  lms: boolean;
  questionBank: boolean;
}

export interface OwnerPlanCreatePayload {
  name: string;
  description: string;
  status: OwnerPlanStatus;
  visibility: OwnerPlanVisibility;
  currency: OwnerPlanCurrency;
  monthlyPrice: number;
  yearlyPrice: number;
  hasTrial: boolean;
  trialDays: number;
  maxStudents: number;
  maxTeachers: number;
  maxStorage: number;
  maxBranches: number;
  modules: OwnerPlanModules;
  autoRenew: boolean;
  allowDowngrade: boolean;
}

export interface OwnerPlanEditSeed extends OwnerPlanCreatePayload {
  id: string;
}
