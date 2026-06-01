export type TenantUniversityStatus = 'Active' | 'Inactive' | 'Draft';

export interface TenantUniversity {
  id: string;
  name: string;
  code: string | null;
  countryId: string | null;
  countryName: string | null;
  countryCode: string | null;
  description: string | null;
  status: TenantUniversityStatus;
  sortOrder: number;
  collegeCount: number;
  subjectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUniversityPayload {
  name: string;
  countryId: string;
  description: string | null;
}

export interface TenantUniversityOption {
  value: string;
  label: string;
}
