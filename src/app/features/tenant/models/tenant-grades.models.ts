export interface GradeGroupRow {
  id: string;
  name: string;
  studentsCount: number;
  teacherName: string | null;
}

export interface Grade {
  id: string;
  name: string;
  description: string | null;
  level: string;
  stageId: string;
  countryId: string;
  country: string;
  countryCode: string | null;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
  groups: GradeGroupRow[];
}

export type GradeDetail = Grade;
