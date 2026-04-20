export interface GradeGroup {
  id: string;
  name: string;
  teacher: string;
  studentCount: number;
  status: string;
}

export interface GradeDetails {
  id: string;
  name: string;
  level: string;
  description: string;
  totalStudents: number;
  totalGroups: number;
  totalTeachers: number;
}
