export interface RoomSchedule {
  id: string;
  groupId: string;
  day: string;
  time: string;
  group: string;
  teacher: string;
  subject: string;
  studentsCount: number;
  durationHours: number;
}

export interface RoomDetails {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  equipment: string[];
  notes: string;
  floor?: string;
  building?: string;
}

export interface BackendRoomDetails {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  equipment?: string[];
  notes?: string | null;
}
