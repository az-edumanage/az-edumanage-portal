export type EducationalStageStatus = 'Active' | 'Inactive' | 'Draft';

export interface EducationalStageCountryOption {
  value: string;
  label: string;
  code: string | null;
}

export interface EducationalStage {
  id: string;
  name: string;
  code: string | null;
  order: number;
  status: EducationalStageStatus;
  countryId: string;
  country: string;
  countryCode: string | null;
  gradeCount: number;
  classCount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}
