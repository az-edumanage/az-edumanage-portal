export type OwnerSettingsTabId =
  | 'general'
  | 'subject'
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

export type SubjectStructureNodeType = 'field' | 'sequence';

export interface SubjectStructureNode {
  id: number;
  type: SubjectStructureNodeType;
  nameEn: string;
  nameAr: string;
  children: SubjectStructureNode[];
}
