export interface GroupStudent {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  barcodeNumber?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  notifyParent?: boolean;
  attendanceRate: number;
  lastAttendance: string;
  attendanceTime?: string | null;
  attendanceState?: 'Present' | 'Absent' | null;
  attendanceSource?: 'Manual' | 'Auto' | null;
}

export interface GroupDaySchedule {
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  roomId?: string | null;
}

export interface GroupCalendarEvent {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export interface GroupSessionPostponeRoomOption {
  id: string;
  name: string;
  available: boolean;
  unavailableReason?: string | null;
}

export interface GroupSessionPostponeAvailability {
  date: string;
  startTime: string;
  duration: number;
  teacherAvailable: boolean;
  teacherMessage?: string | null;
  rooms: GroupSessionPostponeRoomOption[];
}

export interface GroupSessionPostponeRequest {
  method: 'BOOK_APPOINTMENT' | 'REPLACE_SCHEDULE';
  date?: string | null;
  startTime?: string | null;
  roomId?: string | null;
  reason?: string | null;
}

export interface GroupSessionPostponeAffectedSession {
  sessionId: string;
  action: 'REMOVED' | 'ADDED' | 'SHIFTED' | 'APPENDED';
  date?: string | null;
  startTime?: string | null;
  roomId?: string | null;
}

export interface GroupSessionPostponeResult {
  method: 'BOOK_APPOINTMENT' | 'REPLACE_SCHEDULE';
  originalSessionId: string;
  newSessionId?: string | null;
  message: string;
  affectedSessions: GroupSessionPostponeAffectedSession[];
}

export interface GroupSessionTeacherAbsence {
  sessionId: string;
  originalTeacherId?: string | null;
  originalTeacherName: string;
  absenceRecorded: boolean;
  replacementTeacherId?: string | null;
  replacementTeacherName?: string | null;
  message?: string | null;
}

export interface GroupSessionTeacherOption {
  id: string;
  name: string;
}

export interface GroupStudentAssessmentScore {
  bloomId: string;
  studentGrade?: number | null;
  finalGrade?: number | null;
  updatedAt?: string | null;
}

export interface GroupStudentAssessment {
  groupId: string;
  sessionId: string;
  studentId: string;
  scores: GroupStudentAssessmentScore[];
}

export interface GroupAssessmentEvaluationScore {
  bloomId: string;
  bloomName: string;
  studentGrade?: number | null;
  finalGrade?: number | null;
  updatedAt?: string | null;
}

export interface GroupAssessmentEvaluation {
  groupId: string;
  groupName: string;
  subjectName?: string | null;
  sessionId: string;
  sessionDate?: string | null;
  sessionStartTime?: string | null;
  studentId: string;
  studentName: string;
  studentGrade?: number | null;
  finalGrade?: number | null;
  updatedAt?: string | null;
  scores: GroupAssessmentEvaluationScore[];
}

export interface GroupStudentAssessmentSaveRequest {
  scores: Array<{
    bloomId: string;
    studentGrade?: number | null;
    finalGrade?: number | null;
  }>;
}

export interface GroupLesson {
  id: string;
  curriculumNodeId: string;
  title: string;
  path: string;
  description?: string | null;
  completed?: boolean;
}

export interface GroupLessonContent {
  id: string;
  curriculumNodeId: string;
  curriculumNodeLabel: string;
  folderId: string;
  folderName: string;
  contentType: 'FILE' | 'NOTE' | 'LINK';
  contentId: string;
  title: string;
  url?: string | null;
  fileContentType?: string | null;
  sizeBytes?: number | null;
}

export interface GroupSessionLibraryContent extends Omit<GroupLessonContent, 'curriculumNodeId' | 'curriculumNodeLabel'> {
  sessionId: string;
  completed?: boolean;
}

export interface GroupExamSettings {
  showResultsImmediately: boolean;
  allowRetakes: boolean;
}

export interface GroupExamRow {
  id: string;
  groupId: string;
  examId: string;
  title: string;
  status: string;
  date: string;
  startTime?: string | null;
  duration: number;
  questionCount?: number | null;
  instructions?: string | null;
  updatedAt?: string | null;
  settings: GroupExamSettings;
}

export interface GroupPublishedSessionContent {
  source: 'SUBJECT_MATERIAL' | 'LESSON_CONTENT' | 'SESSION_LIBRARY' | string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  folderId: string;
  folderName: string;
  contentType: 'FILE' | 'NOTE' | 'LINK';
  contentId: string;
  title: string;
  url?: string | null;
  fileContentType?: string | null;
  sizeBytes?: number | null;
}

export interface GroupSessionPublication {
  id?: string | null;
  groupId: string;
  sessionId: string;
  published: boolean;
  publishedAt?: string | null;
  mediaCount: number;
  media: GroupPublishedSessionContent[];
}

export interface GroupDetails {
  id: string;
  name: string;
  subjectId?: string | null;
  educationCategory?: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION' | string | null;
  stageId?: string | null;
  stageName?: string | null;
  gradeId?: string | null;
  gradeName?: string | null;
  subject: string;
  teacher: string;
  room: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  fees: number;
  status: 'Active' | 'Inactive';
  pricePerStudent?: number;
  avgAttendanceRate?: number | null;
  absenceRate?: number | null;
  attendanceAvailable?: boolean;
  monthlyRevenue?: number;
  currency?: string;
  startAt?: string | null;
  duration?: number | null;
  daySchedules?: Record<string, GroupDaySchedule>;
  scheduleDays?: string[];
  calendarEvents?: GroupCalendarEvent[];
  students?: GroupStudent[];
}

export interface TenantGroupLessonResponse {
  id: string;
  curriculumNodeId: string;
  title: string;
  path: string;
  description?: string | null;
  completed?: boolean;
}

export interface TenantGroupLessonContentResponse {
  id: string;
  curriculumNodeId: string;
  curriculumNodeLabel: string;
  folderId: string;
  folderName: string;
  contentType: 'FILE' | 'NOTE' | 'LINK';
  contentId: string;
  title: string;
  url?: string | null;
  fileContentType?: string | null;
  sizeBytes?: number | null;
}

export interface TenantGroupSessionLibraryContentResponse {
  id: string;
  sessionId: string;
  folderId: string;
  folderName: string;
  contentType: 'FILE' | 'NOTE' | 'LINK';
  contentId: string;
  title: string;
  url?: string | null;
  fileContentType?: string | null;
  sizeBytes?: number | null;
  completed?: boolean;
}

export interface TenantGroupPublishedSessionContentResponse {
  source: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  folderId: string;
  folderName: string;
  contentType: 'FILE' | 'NOTE' | 'LINK';
  contentId: string;
  title: string;
  url?: string | null;
  fileContentType?: string | null;
  sizeBytes?: number | null;
}

export interface TenantGroupSessionPublicationResponse {
  id?: string | null;
  groupId: string;
  sessionId: string;
  published: boolean;
  publishedAt?: string | null;
  mediaCount: number;
  media?: TenantGroupPublishedSessionContentResponse[];
}

export interface TenantGroupStudentResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  barcodeNumber?: string | null;
  barcode_number?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  notifyParent?: boolean | null;
  attendanceRate: number | null;
  lastAttendance: string;
  attendanceTime?: string | null;
  attendanceState?: 'Present' | 'Absent' | null;
  attendanceSource?: 'Manual' | 'Auto' | null;
}

export interface TenantGroupDetailsResponse {
  id: string;
  name: string;
  subjectId?: string | null;
  educationCategory?: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION' | string | null;
  stageId?: string | null;
  stageName?: string | null;
  gradeId?: string | null;
  gradeName?: string | null;
  subject: string;
  teacher: string;
  room: string;
  schedule: string;
  capacity: number | null;
  enrolled: number;
  pricePerStudent: number;
  status: 'Active' | 'Inactive';
  avgAttendanceRate: number | null;
  absenceRate: number | null;
  attendanceAvailable: boolean;
  monthlyRevenue: number;
  currency: string;
  startAt?: string | null;
  duration?: number | null;
  daySchedules?: Record<string, GroupDaySchedule>;
  scheduleDays?: string[];
  calendarEvents?: GroupCalendarEvent[];
  students?: TenantGroupStudentResponse[];
}
