import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  sortOrder: number;
}

interface AttendanceClockState {
  displayTime: string;
  hourSlot: string;
  timeZone: string;
  lastUpdatedAt: Date;
}

interface AttendanceGroupScheduleEntry {
  id: string;
  name: string;
  startTime: string;
}

@Component({
  selector: 'app-tenant-attendance',
  imports: [RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-attendance.component.html',
  styleUrl: './tenant-attendance.component.css',
})
export class TenantAttendanceComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly egyptTimeZone = 'Africa/Cairo';
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private autoSelectedTimeSlot: string | null = null;

  readonly totalExpectedStudents = 9;

  nowFactory = (): Date => new Date();

  attendanceClock: AttendanceClockState = this.formatEgyptClock(this.nowFactory());

  attendanceGroupScheduleEntries: AttendanceGroupScheduleEntry[] = [
    { id: 'physics-g12-a', name: 'Physics G12-A', startTime: '10:00 AM' },
    { id: 'chemistry-g11-b', name: 'Chemistry G11-B', startTime: '11:00 AM' },
    { id: 'math-g10-a', name: 'Math G10-A', startTime: '01:00 PM' },
    { id: 'biology-g12-b', name: 'Biology G12-B', startTime: '02:00 PM' },
    { id: 'english-g9-a', name: 'English G9-A', startTime: '11:00 PM' },
    { id: 'physics-g11-c', name: 'Physics G11-C', startTime: '11:00 PM' },
  ];

  selectedTimeSlot: string | null = null;

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

  get timeSlots(): AttendanceTimeSlot[] {
    const slotsByTime = new Map<string, AttendanceTimeSlot>();

    for (const group of this.attendanceGroupScheduleEntries) {
      const normalizedSlot = this.normalizeTimeSlot(group.startTime);

      if (!normalizedSlot) {
        continue;
      }

      const currentSlot = slotsByTime.get(normalizedSlot.time);
      if (currentSlot) {
        currentSlot.groups += 1;
      } else {
        slotsByTime.set(normalizedSlot.time, { ...normalizedSlot, groups: 1 });
      }
    }

    return Array.from(slotsByTime.values()).sort((first, second) => first.sortOrder - second.sortOrder);
  }

  get selectedTimeSlotLabel(): string {
    return this.selectedTimeSlot ?? 'No matching slot';
  }

  get selectedTimeSlotGroupCount(): number {
    return this.timeSlots.find((slot) => slot.time === this.selectedTimeSlot)?.groups ?? 0;
  }

  ngOnInit(): void {
    this.refreshAttendanceClock();
    this.clockTimer = setInterval(() => this.refreshAttendanceClock(), 60000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  markStudentAttendance(code: string, present: boolean): void {
    this.students = this.students.map((student) => (student.code === code ? { ...student, present } : student));
  }

  selectTimeSlot(time: string): void {
    this.selectedTimeSlot = time;
    this.autoSelectedTimeSlot = null;
  }

  refreshAttendanceClock(): void {
    const previousHourSlot = this.attendanceClock.hourSlot;
    this.attendanceClock = this.formatEgyptClock(this.nowFactory());

    if (
      previousHourSlot !== this.attendanceClock.hourSlot ||
      this.selectedTimeSlot === null ||
      this.selectedTimeSlot === this.autoSelectedTimeSlot
    ) {
      this.applyAutomaticTimeSlotSelection();
    }

    this.changeDetectorRef.markForCheck();
  }

  private applyAutomaticTimeSlotSelection(): void {
    const matchingSlot = this.timeSlots.find((slot) => slot.time === this.attendanceClock.hourSlot);

    if (matchingSlot) {
      this.selectedTimeSlot = matchingSlot.time;
      this.autoSelectedTimeSlot = matchingSlot.time;
      return;
    }

    if (this.selectedTimeSlot === null || this.selectedTimeSlot === this.autoSelectedTimeSlot) {
      this.selectedTimeSlot = null;
      this.autoSelectedTimeSlot = null;
    }
  }

  private formatEgyptClock(date: Date): AttendanceClockState {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.egyptTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(date);

    const hour = this.getDatePart(parts, 'hour');
    const minute = this.getDatePart(parts, 'minute');
    const dayPeriod = this.getDatePart(parts, 'dayPeriod');

    return {
      displayTime: `${hour}:${minute} ${dayPeriod}`,
      hourSlot: `${hour}:00 ${dayPeriod}`,
      timeZone: this.egyptTimeZone,
      lastUpdatedAt: date,
    };
  }

  private normalizeTimeSlot(time: string): Pick<AttendanceTimeSlot, 'time' | 'sortOrder'> | null {
    const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

    if (!match) {
      return null;
    }

    const hour = Number(match[1]);
    const minute = match[2] ? Number(match[2]) : 0;
    const dayPeriod = match[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return null;
    }

    const hourInDay = dayPeriod === 'AM' ? hour % 12 : (hour % 12) + 12;
    const displayHour = hour.toString().padStart(2, '0');

    return {
      time: `${displayHour}:00 ${dayPeriod}`,
      sortOrder: hourInDay * 60,
    };
  }

  private getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
    return parts.find((part) => part.type === type)?.value ?? '';
  }
}
