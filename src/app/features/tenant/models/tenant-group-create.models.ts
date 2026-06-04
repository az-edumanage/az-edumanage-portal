export interface TenantGroupSelectorOption {
  id: string;
  name: string;
  subtitle?: string;
  parentId?: string;
  educationCategory?: TenantGroupEducationCategory;
  stageId?: string;
  gradeId?: string;
  universityId?: string;
  collegeId?: string;
  subject?: string;
  level?: string;
  type?: string;
}

export type TenantGroupEducationCategory = 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';

export const TEACHER_UNAVAILABLE_MESSAGE = 'This time cannot be selected; the teacher is not available at this time.';
export const ROOM_UNAVAILABLE_MESSAGE = 'This room cannot be selected; it is not available at this time.';

export interface TeacherUnavailableRange {
  groupId: string;
  groupName: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface TeacherAvailabilityResponse {
  teacherId: string;
  unavailableRanges: TeacherUnavailableRange[];
}

export interface RoomUnavailableRange {
  groupId: string;
  groupName: string;
  roomId: string;
  roomName: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface RoomAvailabilityResponse {
  unavailableRanges: RoomUnavailableRange[];
}

export interface TenantGroupPayload {
  name: string;
  educationCategory: TenantGroupEducationCategory;
  stage: string;
  grade: string;
  university: string;
  college: string;
  subject: string;
  teacher: string;
  ownedBy: string;
  room: string;
  capacity: number;
  isFixedTime: boolean;
  startTime: string;
  duration: number;
  daySchedules: Record<string, { startTime: string; endTime: string }>;
  fees: number;
  autoInvoice: boolean;
  allowSelfEnroll: boolean;
  hasSpecificDuration: boolean;
  startDate: string;
  endDate: string;
  requireApproval: boolean;
  isActive: boolean;
  scheduleDays: string[];
}

export interface TenantGroupTaskData extends Partial<TenantGroupPayload> {
  scheduleDays?: string[];
}

export interface TenantGroupCreateOptions {
  owners: TenantGroupSelectorOption[];
  teachers: TenantGroupSelectorOption[];
  stages: TenantGroupSelectorOption[];
  grades: TenantGroupSelectorOption[];
  universities: TenantGroupSelectorOption[];
  colleges: TenantGroupSelectorOption[];
  rooms: TenantGroupSelectorOption[];
}

export interface TenantGroupTeacherClassificationOptions {
  stages: TenantGroupSelectorOption[];
  grades: TenantGroupSelectorOption[];
  universities: TenantGroupSelectorOption[];
  colleges: TenantGroupSelectorOption[];
  subjects: TenantGroupSelectorOption[];
}

export interface TenantGroupCreateApiPayload {
  name: string;
  pricePerStudent: number;
  ownedByAppUserId: string;
  educationCategory: TenantGroupEducationCategory;
  stageId: string | null;
  gradeId: string | null;
  subjectId: string | null;
  universityId: string | null;
  collegeId: string | null;
  universitySubjectId: string | null;
  assignedTeacherId: string;
  roomId: string | null;
  capacity: number;
  isFixedTime: boolean;
  startTime: string;
  duration: number;
  daySchedules: Record<string, { startTime: string; endTime: string }>;
  scheduleDays: string[];
  autoInvoice: boolean;
  allowSelfEnroll: boolean;
  hasSpecificDuration: boolean;
  startDate: string | null;
  endDate: string | null;
  requireApproval: boolean;
  isActive: boolean;
}

export interface TenantGroupEditApiPayload extends TenantGroupCreateApiPayload {
  id: string;
}
