export interface TenantCollege {
  id: string;
  universityId: string;
  universityName: string;
  name: string;
  description: string | null;
  subjectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCollegePayload {
  universityId: string;
  name: string;
  description: string | null;
}

export interface TenantCollegeOption {
  value: string;
  label: string;
  universityId: string;
}
