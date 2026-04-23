import { Injectable } from '@angular/core';
import { RoomDetails, RoomSchedule } from '../models/tenant-room-details.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomDetailsDataService {
  getRoomById(id: string | null): RoomDetails {
    const roomId = id || '1';

    return {
      id: roomId,
      name: roomId === '2' ? 'Physics Lab' : 'Room 101',
      type: roomId === '2' ? 'Laboratory' : 'Classroom',
      capacity: roomId === '2' ? 20 : 30,
      status: roomId === '2' ? 'Occupied' : 'Available',
      equipment: roomId === '2' ? ['Lab Kits', 'Projector', 'Safety Gear'] : ['Projector', 'AC', 'Whiteboard'],
      notes: 'This room is equipped with high-speed internet and modern teaching aids. Please ensure all equipment is turned off after use.',
      floor: '1st Floor',
      building: 'Main Block',
    };
  }

  getScheduleByRoomId(): RoomSchedule[] {
    return [
      { day: 'Monday', time: '10:00 AM - 11:30 AM', group: 'Physics G12-A', teacher: 'Dr. Ahmed Zewail', subject: 'Physics', studentsCount: 25, durationHours: 1.5 },
      { day: 'Monday', time: '01:00 PM - 02:30 PM', group: 'Math G11-B', teacher: 'Prof. Mona Helmy', subject: 'Mathematics', studentsCount: 18, durationHours: 1.5 },
      { day: 'Wednesday', time: '10:00 AM - 11:30 AM', group: 'Physics G12-A', teacher: 'Dr. Ahmed Zewail', subject: 'Physics', studentsCount: 25, durationHours: 1.5 },
      { day: 'Thursday', time: '09:00 AM - 10:30 AM', group: 'Chemistry G10-C', teacher: 'Mr. Khaled Said', subject: 'Chemistry', studentsCount: 22, durationHours: 1.5 },
      { day: 'Friday', time: '11:00 AM - 12:30 PM', group: 'Biology G12-D', teacher: 'Dr. Sara Ahmed', subject: 'Biology', studentsCount: 20, durationHours: 1.5 },
    ];
  }
}
