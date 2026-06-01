export interface TenantSubjectGroupRow {
  id: string;
  name: string;
  studentsCount: number;
  teacherName: string | null;
}

export interface TenantSubject {
  id: string;
  name: string;
  stageId: string;
  stageName: string;
  gradeId: string;
  gradeName: string;
  assignedGroupsCount: number;
  totalStudentsCount: number;
  createdAt: string;
  updatedAt: string;
  groups: TenantSubjectGroupRow[];
}

export interface TenantSubjectCreateForm {
  name: string;
  stageId: string;
  gradeId: string;
}

export interface TenantSubjectStageOption {
  value: string;
  label: string;
}

export interface TenantSubjectGradeOption {
  value: string;
  label: string;
  stageId: string;
}
