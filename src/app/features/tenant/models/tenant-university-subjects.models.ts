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
  createdAt: string;
  updatedAt: string;
}

export interface TenantUniversitySubjectPayload {
  universityId: string;
  collegeId: string;
  name: string;
  description: string | null;
}
