import { Injectable, signal } from '@angular/core';
import { Room } from '../models/tenant-rooms.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomsDataService {
  readonly rooms = signal<Room[]>([
    {
      id: '1',
      name: 'Room 101',
      type: 'Classroom',
      capacity: 30,
      status: 'Available',
      equipment: ['Projector', 'AC', 'Whiteboard'],
    },
    {
      id: '2',
      name: 'Physics Lab',
      type: 'Laboratory',
      capacity: 20,
      status: 'Occupied',
      equipment: ['Lab Kits', 'Projector', 'Safety Gear'],
    },
    {
      id: '3',
      name: 'Main Hall',
      type: 'Auditorium',
      capacity: 150,
      status: 'Available',
      equipment: ['Sound System', 'Stage', 'AC'],
    },
    {
      id: '4',
      name: 'Virtual Room A',
      type: 'Virtual',
      capacity: 500,
      status: 'Available',
      equipment: ['Zoom Integration', 'Recording'],
    },
    {
      id: '5',
      name: 'Room 204',
      type: 'Classroom',
      capacity: 25,
      status: 'Maintenance',
      equipment: ['Whiteboard'],
    },
  ]);
}
