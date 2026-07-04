export interface StudentProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  barcodeNumber?: string | null;
}

export interface StudentDashboardSummary {
  groupsCount: number;
  weeklySessionsCount: number;
  examsCount: number;
  unpaidInvoicesCount: number;
}

export interface StudentAttendancePoint {
  date: string;
  status: string;
}

export interface StudentAttendanceSummary {
  totalRecorded: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  recent: StudentAttendancePoint[];
}

export interface StudentScheduleSession {
  id: string;
  groupId: string;
  groupName: string;
  subjectName?: string | null;
  teacherName: string;
  roomId?: string | null;
  roomName: string;
  day: string;
  startTime: string;
  duration?: number | null;
  studentsCount?: number | null;
}

export interface StudentGroup {
  id: string;
  name: string;
  subject?: string | null;
  teacher?: string | null;
  room?: string | null;
  schedule: string;
  pricePerStudent?: number | null;
  status: string;
}

export interface StudentPublishedSession {
  id: string;
  groupId: string;
  groupName: string;
  subjectName?: string | null;
  title: string;
  sessionDate?: string | null;
  startTime?: string | null;
  publishedAt?: string | null;
  lessonsCount: number;
  filesCount: number;
}

export interface StudentPublishedSessionFile {
  source: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  folderId?: string | null;
  folderName?: string | null;
  contentType: string;
  contentId: string;
  title: string;
  url?: string | null;
  fileContentType?: string | null;
  sizeBytes?: number | null;
  contentJson?: string | null;
}

export interface StudentPublishedSessionLesson {
  id: string;
  title: string;
  path?: string | null;
  files: StudentPublishedSessionFile[];
}

export interface StudentPublishedSessionDetails extends Omit<StudentPublishedSession, 'lessonsCount' | 'filesCount'> {
  lessons: StudentPublishedSessionLesson[];
  files: StudentPublishedSessionFile[];
}

export interface StudentExam {
  id: string;
  groupId: string;
  groupName: string;
  subjectName?: string | null;
  examId: string;
  title: string;
  status: string;
  date: string;
  startTime?: string | null;
  duration?: number | null;
  instructions?: string | null;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
  updatedAt?: string | null;
}

export interface StudentExamAttemptStart {
  attemptId: string;
  assignmentId: string;
  status: string;
  startedAt: string;
  canRetakeAfterCompletion: boolean;
}

export interface StudentExamAnswer {
  id: string;
  answer: string;
  description?: string | null;
  mediaUrl?: string | null;
  mediaOriginalName?: string | null;
}

export interface StudentExamQuestion {
  id: string;
  question: string;
  type: string;
  description?: string | null;
  mediaUrl?: string | null;
  mediaOriginalName?: string | null;
  weight?: number | null;
  answers: StudentExamAnswer[];
}

export interface StudentExamAttempt {
  attemptId: string;
  assignmentId: string;
  groupId: string;
  groupName: string;
  examId: string;
  title: string;
  subjectName?: string | null;
  date: string;
  startTime?: string | null;
  duration?: number | null;
  instructions?: string | null;
  status: string;
  startedAt: string;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
  questions: StudentExamQuestion[];
}

export interface StudentExamCompletion {
  attemptId: string;
  status: string;
  resultVisible: boolean;
  score?: number | null;
  maxScore?: number | null;
  canRetake: boolean;
  completedAt: string;
  questions: StudentExamQuestionReport[];
}

export interface StudentExamEvaluation {
  attemptId: string;
  assignmentId: string;
  groupId: string;
  examId: string;
  studentId?: string;
  studentName?: string;
  title: string;
  groupName: string;
  subjectName?: string | null;
  date: string;
  startTime?: string | null;
  duration?: number | null;
  score?: number | null;
  maxScore?: number | null;
  startedAt: string;
  completedAt: string;
  status: string;
}

export interface StudentExamQuestionSubmission {
  questionId: string;
  answerId?: string | null;
  answer?: string | null;
}

export interface StudentExamQuestionReport {
  questionId: string;
  question: string;
  type: string;
  studentAnswer: string;
  correctAnswer: string;
  score: number;
  maxScore: number;
  correct: boolean;
  feedback?: string | null;
  matchedPoints: string[];
  missingPoints: string[];
}

export interface StudentInvoice {
  id: string;
  invoiceRef: string;
  groupId: string;
  groupName: string;
  amount: number;
  currency: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  dueDate?: string | null;
  status: string;
}

export interface StudentDashboard {
  student: StudentProfile;
  summary: StudentDashboardSummary;
  attendance: StudentAttendanceSummary;
  upcomingSessions: StudentScheduleSession[];
  upcomingExams: StudentExam[];
  invoices: StudentInvoice[];
}
