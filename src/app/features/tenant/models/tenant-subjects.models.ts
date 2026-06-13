export interface TenantSubjectGroupRow {
  id: string;
  name: string;
  studentsCount: number;
  teacherName: string | null;
}

export interface TenantSubjectTeacherRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  joinDate: string | null;
}

export interface TenantSubjectCurriculumNode {
  id: string;
  label: string;
  icon: string;
  description?: string | null;
  children: TenantSubjectCurriculumNode[];
}

export interface TenantCurriculumQuestionAnswer {
  id: string;
  answer: string;
  correct: boolean;
  description: string | null;
  mediaUrl?: string | null;
  mediaFileName?: string | null;
  mediaOriginalName?: string | null;
  mediaContentType?: string | null;
  mediaSizeBytes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCurriculumQuestion {
  id: string;
  question: string;
  type: string;
  answer: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaFileName: string | null;
  mediaOriginalName: string | null;
  mediaContentType: string | null;
  mediaSizeBytes: number | null;
  answers: TenantCurriculumQuestionAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantCurriculumQuestionPage {
  content: TenantCurriculumQuestion[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface TenantCurriculumMaterialFolder {
  id: string;
  name: string;
  description: string | null;
  fileTypes: string[];
  filesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCurriculumMaterialFile {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCurriculumMaterialNote {
  id: string;
  title: string;
  contentJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCurriculumMaterialLink {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubject {
  id: string;
  name: string;
  stageId: string;
  stageName: string;
  gradeId: string;
  gradeName: string;
  assignedGroupsCount: number;
  assignedTeachersCount: number;
  totalStudentsCount: number;
  createdAt: string;
  updatedAt: string;
  groups: TenantSubjectGroupRow[];
  teachers: TenantSubjectTeacherRow[];
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
