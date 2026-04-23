import { Injectable } from '@angular/core';
import { GroupDetails, GroupStudent } from '../models/tenant-group-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsDataService {
  readonly students: GroupStudent[] = [
    { id: '1', name: 'Ahmed Ali', email: 'ahmed@example.com', attendanceRate: 98, lastAttendance: 'Yesterday' },
    { id: '2', name: 'Sara Mohamed', email: 'sara@example.com', attendanceRate: 92, lastAttendance: 'Yesterday' },
    { id: '3', name: 'Omar Hassan', email: 'omar@example.com', attendanceRate: 85, lastAttendance: '2 days ago' },
    { id: '4', name: 'Laila Mahmoud', email: 'laila@example.com', attendanceRate: 100, lastAttendance: 'Yesterday' },
    { id: '5', name: 'Youssef Ibrahim', email: 'youssef@example.com', attendanceRate: 78, lastAttendance: 'Last week' },
  ];

  getGroupById(id: string | null): GroupDetails {
    const groupId = id || '1';

    return {
      id: groupId,
      name: 'Physics G12-A',
      subject: 'Physics',
      teacher: 'Dr. Ahmed Zewail',
      room: 'Lab 101',
      schedule: 'Mon, Wed 10:00 AM',
      capacity: 30,
      enrolled: 24,
      fees: 500,
      status: 'Active',
    };
  }
}
