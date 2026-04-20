export interface OwnerProvisioningSettingsFormValue {
  dbStrategy: string;
  dbRegion: string;
  defaultPlan: string;
  defaultTrialDays: number;
  autoActivate: boolean;
  enableAdvancedInTrial: boolean;
  trialModExams: boolean;
  trialModFinance: boolean;
  trialModAnalytics: boolean;
  createDefaultRoles: boolean;
  createAcademicYear: boolean;
  setupNotifTemplates: boolean;
  createPaymentCustomer: boolean;
  sendWelcomeEmail: boolean;
  allocateStorage: boolean;
  maxRetries: number;
  retryInterval: number;
  notifyAdmin: boolean;
  rollbackOnFailure: boolean;
}
