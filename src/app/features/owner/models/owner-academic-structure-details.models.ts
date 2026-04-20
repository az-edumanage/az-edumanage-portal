export interface AcademicStructureFeature {
  id: string;
  label: string;
  enabled: boolean;
}

export interface AcademicStructureLimit {
  id: string;
  label: string;
  value: number;
}

export interface AcademicStructureTenantOverride {
  tenantName: string;
  plan: string;
  status: 'Forced Enabled' | 'Forced Disabled';
  reason: string;
  expiryDate?: string;
}

export interface AcademicStructureChangeLog {
  user: string;
  action: string;
  date: string;
  details: string;
}

export interface AcademicStructureTab {
  id: string;
  label: string;
}
