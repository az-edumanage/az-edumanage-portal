export interface TenantGradeCreateForm {
  name: string;
  countryId: string;
  stageId: string;
  description: string | null;
}

export interface TenantGradeCountryOption {
  value: string;
  label: string;
  code: string | null;
}

export interface TenantGradeAcademicLevelOption {
  value: string;
  label: string;
  countryId: string;
}
