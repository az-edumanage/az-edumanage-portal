import { TenantTeacherEducationCategory, TenantTeacherStatus } from './tenant-teacher-create.models';

export type TeacherStatus = TenantTeacherStatus;
export type TeacherStatusFilter = 'all' | 'inGroupNow' | 'absence';

export interface TeacherStatusSummary {
  totalTeachers: number;
  inGroupNow: number;
  absenceTeachers: number;
  inGroupNowTeacherIds: string[];
  absenceTeacherIds: string[];
  today: string;
  asOf: string;
  unavailableReason?: string | null;
}

export interface TeacherCapacity {
  tenantType: 'TEACHER' | 'CENTER';
  currentTeachers: number;
  maxTeachers: number | null;
  canCreate: boolean;
}

export interface TeacherSubject {
  id: string;
  name: string;
  gradeId: string;
  stageId: string;
}

export interface TeacherUniversitySubject {
  id: string;
  name: string;
  universityId: string;
  collegeId: string;
}

export interface TeacherDocument {
  id: string;
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  storagePath?: string;
  createdAt?: string;
}

export interface TeacherGroup {
  id: string;
  name: string;
  studentsCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  fullName: string;
  email: string;
  phone?: string;
  username: string;
  educationCategory: TenantTeacherEducationCategory;
  subject: string;
  subjects: TeacherSubject[];
  universitySubjects: TeacherUniversitySubject[];
  status: TeacherStatus;
  joinDate: string;
  documents: TeacherDocument[];
  stageIds: string[];
  gradeIds: string[];
  subjectIds: string[];
  universityIds: string[];
  collegeIds: string[];
  universitySubjectIds: string[];
  groups?: TeacherGroup[];
  tenantBound?: boolean;
  canManageAttendance: boolean;
  canManageExams: boolean;
  canMessageStudents: boolean;
  createdAt?: string;
  updatedAt?: string;
}
