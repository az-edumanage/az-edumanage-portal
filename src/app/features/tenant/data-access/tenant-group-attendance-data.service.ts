import { Injectable } from '@angular/core';
import { TenantAttendanceStudent } from '../models/tenant-group-attendance.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupAttendanceDataService {
  private readonly mockStudents: TenantAttendanceStudent[] = [
    { id: '1', name: 'Ahmed Ali', isPresent: true, attendanceRate: 98, totalSessions: 20, attendedSessions: 19 },
    { id: '2', name: 'Sara Mohamed', isPresent: true, attendanceRate: 92, totalSessions: 20, attendedSessions: 18 },
    { id: '3', name: 'Omar Hassan', isPresent: false, attendanceRate: 85, totalSessions: 20, attendedSessions: 17 },
    { id: '4', name: 'Laila Mahmoud', isPresent: true, attendanceRate: 100, totalSessions: 20, attendedSessions: 20 },
    { id: '5', name: 'Youssef Ibrahim', isPresent: false, attendanceRate: 78, totalSessions: 20, attendedSessions: 15 },
  ];

  getStudentsByGroupId(groupId: string | null): TenantAttendanceStudent[] {
    void groupId;
    return this.mockStudents.map((student) => ({ ...student }));
  }

  async saveAttendance(groupId: string | null, students: TenantAttendanceStudent[]): Promise<void> {
    void groupId;
    void students;
    return Promise.resolve();
  }
}
