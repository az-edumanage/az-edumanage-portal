export type StudentStatus = 'Active' | 'Inactive' | 'Pending';

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  status: StudentStatus;
  enrollmentDate: string;
}
