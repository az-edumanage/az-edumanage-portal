export interface TenantGroupExamCreatePayload {
  selectedExamId: string | null;
  title: string;
  date: string;
  startTime: string | null;
  duration: number;
  instructions: string;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
}

export interface PublishedGroupExamOption {
  id: string;
  stageId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  instructions?: string | null;
  status: 'PUBLISHED' | string;
  showResultsImmediately?: boolean;
  allowRetakes?: boolean;
  questionCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GroupExamAssignment {
  groupId: string;
  selectedExamId: string | null;
  examTitle: string;
  sourceStatus?: string | null;
  date: string;
  startTime?: string | null;
  duration: number;
  instructions?: string | null;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
  updatedAt?: string | null;
}

export interface GroupExamAssignmentPayload {
  selectedExamId: string;
  date: string;
  startTime?: string | null;
  duration: number;
  instructions?: string | null;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
}

export interface GroupExamPreviewQuestionAnswer {
  id?: string;
  answer?: string | null;
  text?: string | null;
  isCorrect?: boolean | null;
  [key: string]: unknown;
}

export interface GroupExamPreviewQuestion {
  id: string;
  question: string;
  type: string;
  answer?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  answerExplanation?: string | null;
  tags?: string[] | null;
  answers?: GroupExamPreviewQuestionAnswer[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
