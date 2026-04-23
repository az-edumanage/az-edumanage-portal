import { Injectable, signal } from '@angular/core';
import { ScheduleSession } from '../models/tenant-schedule.models';

@Injectable({ providedIn: 'root' })
export class TenantScheduleDataService {
  readonly sessions = signal<ScheduleSession[]>([
    { id: '1', groupName: 'Physics G12-A', teacherName: 'Dr. Ahmed Zewail', roomName: 'Lab 101', day: 'Monday', startTime: '10:00', duration: 90, color: 'bg-indigo-500 text-white' },
    { id: '2', groupName: 'Math G11-B', teacherName: 'Prof. Mona Helmy', roomName: 'Room 204', day: 'Monday', startTime: '12:00', duration: 60, color: 'bg-emerald-500 text-white' },
    { id: '3', groupName: 'Chemistry G12', teacherName: 'Mr. Khaled Said', roomName: 'Lab 101', day: 'Tuesday', startTime: '09:00', duration: 90, color: 'bg-amber-500 text-white' },
    { id: '4', groupName: 'English G10', teacherName: 'Ms. Fatma Ali', roomName: 'Room 302', day: 'Wednesday', startTime: '14:00', duration: 60, color: 'bg-rose-500 text-white' },
    { id: '5', groupName: 'Biology G11', teacherName: 'Dr. Mostafa El-Sayed', roomName: 'Lab 102', day: 'Thursday', startTime: '11:00', duration: 90, color: 'bg-purple-500 text-white' },
    { id: '6', groupName: 'Physics G12-B', teacherName: 'Dr. Ahmed Zewail', roomName: 'Lab 101', day: 'Monday', startTime: '14:00', duration: 90, color: 'bg-indigo-500 text-white' },
    { id: '7', groupName: 'Math G12-A', teacherName: 'Prof. Mona Helmy', roomName: 'Room 204', day: 'Sunday', startTime: '10:00', duration: 120, color: 'bg-emerald-500 text-white' },
    { id: '8', groupName: 'Arabic G10', teacherName: 'Mr. Hassan Ali', roomName: 'Room 105', day: 'Saturday', startTime: '16:00', duration: 90, color: 'bg-sky-500 text-white' },
  ]);
}
