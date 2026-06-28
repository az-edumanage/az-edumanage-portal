export interface TeacherSummary {
  sessionsToday: number;
  groups: number;
  attendanceRate: number;
}

export interface TeacherAssignedGroupDaySchedule {
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  roomId?: string | null;
}

export interface TeacherAssignedGroup {
  id: string;
  name: string;
  subject: string;
  educationCategory: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';
  stage?: string | null;
  grade?: string | null;
  university?: string | null;
  college?: string | null;
  studentsCount: number;
  schedule: string;
  startAt?: string | null;
  duration?: number | null;
  room?: string | null;
  status: 'Active' | 'Inactive' | string;
  daySchedules?: Record<string, TeacherAssignedGroupDaySchedule>;
}

export interface TeacherExamSetup {
  id: string;
  name: string;
  subject: string;
  educationCategory: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';
  stageId?: string | null;
  stage?: string | null;
  gradeId?: string | null;
  grade?: string | null;
  subjectId?: string | null;
  universityId?: string | null;
  university?: string | null;
  collegeId?: string | null;
  college?: string | null;
  universitySubjectId?: string | null;
  groupsCount: number;
  studentsCount: number;
  status: 'Active' | 'Pending' | string;
}
