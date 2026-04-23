export type RoomType = 'Classroom' | 'Laboratory' | 'Virtual' | 'Auditorium';
export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  status: RoomStatus;
  equipment: string[];
}
