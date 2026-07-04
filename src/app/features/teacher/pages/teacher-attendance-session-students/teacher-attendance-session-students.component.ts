import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { TenantGroupDetailsDataService } from '../../../tenant/data-access/tenant-group-details-data.service';
import { GroupCalendarEvent, GroupDetails, GroupStudent } from '../../../tenant/models/tenant-group-details.models';

@Component({
  selector: 'app-teacher-attendance-session-students',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './teacher-attendance-session-students.component.html',
  styleUrl: '../teacher-attendance/teacher-attendance.component.css',
})
export class TeacherAttendanceSessionStudentsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly groupDetailsApi = inject(TenantGroupDetailsDataService);

  readonly groupId = signal(this.route.snapshot.paramMap.get('groupId') ?? '');
  readonly sessionId = signal(this.route.snapshot.paramMap.get('sessionId') ?? '');
  readonly group = signal<GroupDetails | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly students = computed(() => this.group()?.students ?? []);
  readonly selectedSession = computed(() => {
    const sessionId = this.sessionId();
    return this.group()?.calendarEvents?.find((session) => session.id === sessionId) ?? null;
  });
  readonly presentCount = computed(() => this.students().filter((student) => this.isPresent(student)).length);
  readonly absentCount = computed(() => Math.max(this.students().length - this.presentCount(), 0));

  constructor() {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.groupDetailsApi.loadGroupById(this.groupId(), { scope: 'teacher', sessionId: this.sessionId() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (group) => this.group.set(group),
        error: (error: Error) => this.errorMessage.set(error.message || 'Unable to load attendance records'),
      });
  }

  attendanceClass(student: GroupStudent): string {
    return this.isPresent(student) ? 'status-present' : 'status-absent';
  }

  attendanceLabel(student: GroupStudent): string {
    return this.isPresent(student) ? 'Present' : 'Absent';
  }

  formatSessionDate(session: GroupCalendarEvent | null): string {
    if (!session) {
      return 'Selected session';
    }
    const date = new Date(`${session.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return session.date;
    }
    return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }

  formatTimeRange(session: GroupCalendarEvent | null): string {
    if (!session) {
      return '';
    }
    return `${this.formatTime(session.startTime)} - ${this.formatTime(session.endTime)}`;
  }

  formatAttendanceTime(student: GroupStudent): string {
    const value = student.attendanceTime?.trim();
    if (!value) {
      return 'Not recorded';
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    }

    return this.formatTime(value);
  }

  trackByStudentId(_: number, student: GroupStudent): string {
    return student.id;
  }

  private isPresent(student: GroupStudent): boolean {
    return student.attendanceState?.toLowerCase() === 'present';
  }

  private formatTime(value: string | null | undefined): string {
    if (!value?.trim()) {
      return 'Not set';
    }
    const [hourPart, minutePart = '0'] = value.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return value;
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  }
}
