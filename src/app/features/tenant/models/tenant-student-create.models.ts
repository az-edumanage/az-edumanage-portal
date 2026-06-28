export type TenantStudentGender = 'Male' | 'Female';
export type TenantStudentEducationCategory = 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';

export interface TenantStudentCreatePayload {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  birthDate: string;
  gender: TenantStudentGender;
  parentName: string;
  parentPhone: string;
  address: string;
  notifyParent: boolean;
  educationCategory: TenantStudentEducationCategory;
  stageIds: string[];
  gradeIds: string[];
  universityIds: string[];
  collegeIds: string[];
}

export interface TenantStudentCreateResponse {
  id: string;
  barcodeNumber: string;
}

export interface TenantStudentLookupStage {
  id: string;
  name: string;
}

export interface TenantStudentLookupGrade {
  id: string;
  name: string;
  stageId: string;
}

export interface TenantStudentLookupUniversity {
  id: string;
  name: string;
}

export interface TenantStudentLookupCollege {
  id: string;
  name: string;
  universityId: string;
}

export interface TenantStudentLookupData {
  stages: TenantStudentLookupStage[];
  grades: TenantStudentLookupGrade[];
  universities: TenantStudentLookupUniversity[];
  colleges: TenantStudentLookupCollege[];
}
