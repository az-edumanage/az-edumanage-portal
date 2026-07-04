export interface GroupDaySchedule {
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  roomId?: string | null;
}

export interface Group {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  studentsCount: number;
  schedule: string;
  startAt?: string | null;
  duration?: number | null;
  room: string;
  daySchedules?: Record<string, GroupDaySchedule>;
  pricePerStudent?: number;
  ownedBy?: string;
  educationCategory?: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';
  subscriptionPeriodId?: string | null;
  subscriptionPeriod?: string | null;
}

export type GroupScheduleFilter = 'all' | 'today' | 'running' | 'postponed';

export interface GroupScheduleSummary {
  totalGroups: number;
  todayGroups: number;
  currentRunningGroups: number;
  postponedGroups: number;
  todayGroupIds: string[];
  currentRunningGroupIds: string[];
  postponedGroupIds: string[];
  today: string;
  asOf: string;
  unavailableReason?: string | null;
}
