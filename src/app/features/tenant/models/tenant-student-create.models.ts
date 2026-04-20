export interface TenantStudentCreatePayload {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'Male' | 'Female';
  parentName: string;
  parentPhone: string;
  address: string;
  grade: 'Grade 10' | 'Grade 11' | 'Grade 12';
  enrollmentType: 'Full-time' | 'Part-time' | 'Evening';
  isActive: boolean;
  notifyParent: boolean;
  notifySMS: boolean;
}
