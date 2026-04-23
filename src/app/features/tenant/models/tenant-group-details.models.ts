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
}
