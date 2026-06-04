export interface GroupStudent {
  id: string;
  name: string;
  email: string;
  attendanceRate: number;
  lastAttendance: string;
}

export interface GroupDetails {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  room: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  fees: number;
  status: 'Active' | 'Inactive';
  pricePerStudent?: number;
  avgAttendanceRate?: number | null;
  absenceRate?: number | null;
  attendanceAvailable?: boolean;
  monthlyRevenue?: number;
  currency?: string;
  students?: GroupStudent[];
}

export interface TenantGroupStudentResponse {
  id: string;
  name: string;
  email: string;
  attendanceRate: number | null;
  lastAttendance: string;
}

export interface TenantGroupDetailsResponse {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  room: string;
  schedule: string;
  capacity: number | null;
  enrolled: number;
  pricePerStudent: number;
  status: 'Active' | 'Inactive';
  avgAttendanceRate: number | null;
  absenceRate: number | null;
  attendanceAvailable: boolean;
  monthlyRevenue: number;
  currency: string;
  students?: TenantGroupStudentResponse[];
}
