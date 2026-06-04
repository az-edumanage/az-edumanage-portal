export type TenantTeacherStatus = 'Active' | 'Inactive';
export type TenantTeacherEducationCategory = 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';

export interface TenantTeacherDocumentPayload {
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  storagePath?: string;
}

export interface TenantTeacherCreatePayload {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  password?: string;
  forcePasswordChange: boolean;
  educationCategory: TenantTeacherEducationCategory;
  stageIds: string[];
  gradeIds: string[];
  subjectIds: string[];
  universityIds: string[];
  collegeIds: string[];
  universitySubjectIds: string[];
  status: TenantTeacherStatus;
  joinDate: string;
  canManageAttendance: boolean;
  canManageExams: boolean;
  canMessageStudents: boolean;
  documents: TenantTeacherDocumentPayload[];
}

export type TenantTeacherUpdatePayload = Omit<TenantTeacherCreatePayload, 'username' | 'password' | 'forcePasswordChange'>;

export type TenantTeacherEditSeed = Partial<TenantTeacherCreatePayload>;

export interface TenantTeacherLookupStage {
  id: string;
  name: string;
}

export interface TenantTeacherLookupGrade {
  id: string;
  name: string;
  stageId: string;
}

export interface TenantTeacherLookupSubject {
  id: string;
  name: string;
  stageId: string;
  gradeId: string;
}

export interface TenantTeacherLookupUniversity {
  id: string;
  name: string;
}

export interface TenantTeacherLookupCollege {
  id: string;
  name: string;
  universityId: string;
}

export interface TenantTeacherLookupUniversitySubject {
  id: string;
  name: string;
  universityId: string;
  collegeId: string;
}

export interface TenantTeacherLookupData {
  stages: TenantTeacherLookupStage[];
  grades: TenantTeacherLookupGrade[];
  subjects: TenantTeacherLookupSubject[];
  universities: TenantTeacherLookupUniversity[];
  colleges: TenantTeacherLookupCollege[];
  universitySubjects: TenantTeacherLookupUniversitySubject[];
}
