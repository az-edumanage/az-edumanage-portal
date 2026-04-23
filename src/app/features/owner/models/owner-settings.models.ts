export type OwnerSettingsTabId =
  | 'general'
  | 'presets'
  | 'security'
  | 'billing'
  | 'communication'
  | 'storage'
  | 'compliance';

export interface OwnerSettingsTab {
  id: OwnerSettingsTabId;
  label: string;
}

export interface OwnerSettingsSubscriptionCycle {
  id: number;
  name: string;
  days: number;
  icon: string;
  active: boolean;
}

export interface OwnerSettingsPaymentMethod {
  id: number;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}
