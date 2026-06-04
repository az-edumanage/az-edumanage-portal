export type RoomType = string;
export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  status: RoomStatus;
  equipment: string[];
  relatedGroupsCount?: number;
}

export type RoomDeleteStatus = 'closed' | 'confirming' | 'deleting' | 'success' | 'failed';

export interface RoomDeleteState {
  status: RoomDeleteStatus;
  room: Room | null;
  message: string;
}
