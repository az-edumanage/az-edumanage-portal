export interface StudentRegistrationSummary {
  pendingCount: number;
}

export interface StudentRegistrationLink {
  id: string;
  token: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  active: boolean;
}

export interface PendingStudentRegistration {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  username: string;
  gender: string;
  birthDate: string;
  parentName: string | null;
  parentPhone: string | null;
  educationCategory: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';
  stageId: string | null;
  stageName: string | null;
  gradeId: string | null;
  gradeName: string | null;
  universityId: string | null;
  universityName: string | null;
  collegeId: string | null;
  collegeName: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export interface PublicRegistrationOption {
  id: string;
  name: string;
}

export interface PublicRegistrationStage {
  id: string;
  name: string;
}
export interface PublicRegistrationGrade extends PublicRegistrationOption { stageId: string; }
export interface PublicRegistrationUniversity {
  id: string;
  name: string;
}
export interface PublicRegistrationCollege extends PublicRegistrationOption { universityId: string; }

export interface PublicStudentRegistrationForm {
  tenantName: string;
  expiresAt: string;
  stages: PublicRegistrationStage[];
  grades: PublicRegistrationGrade[];
  universities: PublicRegistrationUniversity[];
  colleges: PublicRegistrationCollege[];
}

export interface PublicStudentRegistrationPayload {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  gender: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  educationCategory: string;
  stageId: string | null;
  gradeId: string | null;
  universityId: string | null;
  collegeId: string | null;
}
