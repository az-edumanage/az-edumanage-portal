import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface AttendanceStudent {
  initial: string;
  name: string;
  code: string;
  present: boolean;
}

interface AttendanceTimeSlot {
  time: string;
  groups: number;
}

@Component({
  selector: 'app-tenant-attendance',
  imports: [RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-attendance.component.html',
  styleUrl: './tenant-attendance.component.css',
})
export class TenantAttendanceComponent {
  readonly totalExpectedStudents = 9;

  readonly timeSlots: AttendanceTimeSlot[] = [
    { time: '09:00 AM', groups: 0 },
    { time: '10:00 AM', groups: 0 },
    { time: '11:00 AM', groups: 0 },
    { time: '12:00 PM', groups: 0 },
    { time: '01:00 PM', groups: 2 },
    { time: '02:00 PM', groups: 2 },
    { time: '03:00 PM', groups: 2 },
    { time: '04:00 PM', groups: 0 },
  ];

  selectedTimeSlot = '01:00 PM';

  students: AttendanceStudent[] = [
    { initial: 'A', name: 'Ahmed Ali', code: '10001', present: false },
    { initial: 'S', name: 'Sara Mohamed', code: '10002', present: false },
    { initial: 'O', name: 'Omar Hassan', code: '10003', present: false },
    { initial: 'L', name: 'Laila Mahmoud', code: '10004', present: false },
    { initial: 'Y', name: 'Youssef Ibrahim', code: '10005', present: false },
  ];

  get presentCount(): number {
    return this.students.filter((student) => student.present).length;
  }

  get attendancePercent(): number {
    return Math.round((this.presentCount / this.totalExpectedStudents) * 100);
  }

  get classAttendancePercent(): number {
    return Math.round((this.presentCount / this.students.length) * 100);
  }

  markStudentAttendance(code: string, present: boolean): void {
    this.students = this.students.map((student) => (student.code === code ? { ...student, present } : student));
  }

  selectTimeSlot(time: string): void {
    this.selectedTimeSlot = time;
  }
}
