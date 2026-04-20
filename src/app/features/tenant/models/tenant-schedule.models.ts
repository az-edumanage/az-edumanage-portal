export interface ScheduleSession {
  id: string;
  groupName: string;
  teacherName: string;
  roomName: string;
  day: string;
  startTime: string;
  duration: number;
  color: string;
}

export interface ScheduleFilters {
  teacher: string;
  room: string;
  day: string;
}
