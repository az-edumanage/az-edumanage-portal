export type TeacherStatus = 'Active' | 'On Leave' | 'Inactive';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: TeacherStatus;
  joinDate: string;
}
