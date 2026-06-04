export interface ScheduleSession {
  id: string;
  groupId: string;
  groupName: string;
  teacherName: string;
  roomName: string;
  day: string;
  startTime: string;
  duration: number | null;
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
  teacherName: string;
  roomName: string;
  day: string;
  startTime: string;
  duration: number | null;
}
