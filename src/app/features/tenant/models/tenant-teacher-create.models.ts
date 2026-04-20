export interface TenantTeacherCreatePayload {
  fullName: string;
  email: string;
  phone: string;
  subject: 'Physics' | 'Mathematics' | 'Chemistry' | 'Biology' | 'English' | 'Arabic' | 'History';
  qualification: string;
  password: string;
  forcePasswordChange: boolean;
  status: 'Active' | 'On Leave' | 'Part-time';
  joinDate: string;
  canManageAttendance: boolean;
  canManageExams: boolean;
  canMessageStudents: boolean;
  sendWelcomeEmail: boolean;
}

export interface TenantTeacherEditSeed {
  fullName: string;
  email: string;
  subject: TenantTeacherCreatePayload['subject'];
  qualification: string;
}
