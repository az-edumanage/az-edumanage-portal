import { TenantSubjectTeacherRow } from './tenant-subjects.models';

export interface TenantUniversitySubject {
  id: string;
  universityId: string;
  universityName: string;
  collegeId: string;
  collegeName: string;
  name: string;
  description: string | null;
  groupCount: number;
  studentCount: number;
  assignedTeachersCount: number;
  createdAt: string;
  updatedAt: string;
  teachers: TenantSubjectTeacherRow[];
}

export interface TenantUniversitySubjectPayload {
  universityId: string;
  collegeId: string;
  name: string;
  description: string | null;
}
