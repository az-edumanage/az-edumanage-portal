export interface ScheduleSession {
  id: string;
  groupId: string;
  groupName: string;
  subjectName?: string | null;
  teacherName: string;
  roomId?: string | null;
  roomName: string;
  day: string;
  startTime: string;
  duration: number | null;
  studentsCount?: number | null;
  color: string;
}

export interface ScheduleFilters {
  teacher: string;
  room: string;
  day: string;
}

export interface BackendScheduleSession {
  id: string;
  groupId: string;
  groupName: string;
  subjectName?: string | null;
  teacherName: string;
  roomId?: string | null;
  roomName: string;
  day: string;
  startTime: string;
  duration: number | null;
  studentsCount?: number | null;
}
