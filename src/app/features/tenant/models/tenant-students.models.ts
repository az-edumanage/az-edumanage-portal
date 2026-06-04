export type StudentStatus = 'Active' | 'Inactive' | 'Pending';

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  status: StudentStatus;
  enrollmentDate: string;
}

export interface StudentDetails extends Student {
  phone: string;
  barcodeNumber: string;
  gender: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  address: string;
  notifyParent: boolean;
  educationCategory: string;
  scheduleSummary: StudentScheduleSummary;
  scheduleRows: StudentScheduleRow[];
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

export interface TenantStudentBackendRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  barcodeNumber?: string | null;
  barcode_number?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  address?: string | null;
  notifyParent?: boolean | null;
  educationCategory: string | null;
  stageIds?: string[] | null;
  gradeIds?: string[] | null;
  universityIds?: string[] | null;
  collegeIds?: string[] | null;
  scheduleSummary?: StudentScheduleSummary | null;
  scheduleRows?: StudentScheduleRow[] | null;
  createdAt: string | null;
  updatedAt?: string | null;
}
