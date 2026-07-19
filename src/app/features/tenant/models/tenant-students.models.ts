export type StudentStatus = 'Active' | 'Inactive' | 'Pending';

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  gradeId?: string;
  stage?: string;
  stageId?: string;
  status: StudentStatus;
  enrollmentDate: string;
}

export interface StudentDetails extends Student {
  studentUsername: string;
  phone: string;
  barcodeNumber: string;
  gender: string;
  birthDate: string;
  parentUsername: string;
  parentName: string;
  parentPhone: string;
  address: string;
  notifyParent: boolean;
  educationCategory: string;
  scheduleSummary: StudentScheduleSummary;
  scheduleRows: StudentScheduleRow[];
}

export interface TenantParentStudentLink {
  id: string;
  name: string;
  grade: string;
}

export interface TenantParent {
  id: string;
  appUserId?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  notifyParent: boolean;
  students: TenantParentStudentLink[];
}

export interface TenantParentCreatePayload {
  fullName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
}

export interface TenantParentUpdatePayload {
  fullName: string;
  phone: string;
  email: string;
}

export interface StudentScheduleSummary {
  attendanceLabel: string;
  attendanceProgress: number;
  scheduleDaysCount: number;
  totalGroups: number;
  groupsCount: number;
}

export interface StudentScheduleRow {
  groupId?: string | null;
  group: string;
  day: string;
  time: string;
  roomId?: string | null;
  room: string;
  teacherId?: string | null;
  teacher: string;
}

export type StudentAttendanceFilter = 'all' | 'absent' | 'present';

export interface StudentAttendanceSummary {
  totalStudents: number;
  totalAbsent: number;
  totalPresent: number;
  absentStudentIds: string[];
  presentStudentIds: string[];
  today: string;
  asOf: string;
  unavailableReason?: string | null;
}

export interface StudentCapacity {
  currentStudents: number;
  maxStudents: number | null;
  canCreate: boolean;
}

export interface StudentAttendanceCard {
  key: StudentAttendanceFilter;
  label: 'Total students' | 'Total absence' | 'Total present';
  count: number;
  active: boolean;
  loading: boolean;
  unavailable: boolean;
  disabled: boolean;
}

export interface TenantStudentBackendRecord {
  id: string;
  fullName: string;
  studentUsername?: string | null;
  email: string | null;
  phone?: string | null;
  barcodeNumber?: string | null;
  barcode_number?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  parentAppUserId?: string | null;
  parentUsername?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  address?: string | null;
  notifyParent?: boolean | null;
  educationCategory: string | null;
  stageIds?: string[] | null;
  stageName?: string | null;
  stage_name?: string | null;
  stageNames?: string[] | null;
  gradeIds?: string[] | null;
  gradeName?: string | null;
  grade_name?: string | null;
  gradeNames?: string[] | null;
  universityIds?: string[] | null;
  collegeIds?: string[] | null;
  scheduleSummary?: StudentScheduleSummary | null;
  scheduleRows?: StudentScheduleRow[] | null;
  createdAt: string | null;
  updatedAt?: string | null;
}
