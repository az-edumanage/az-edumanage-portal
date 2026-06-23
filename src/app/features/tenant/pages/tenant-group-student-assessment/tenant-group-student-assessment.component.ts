import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { GroupCalendarEvent, GroupDetails, GroupStudent } from '../../models/tenant-group-details.models';

@Component({
  selector: 'app-tenant-group-student-assessment',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-student-assessment.component.html',
})
export class TenantGroupStudentAssessmentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(TenantGroupDetailsDataService);

  readonly groupId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
  readonly studentId = this.route.snapshot.paramMap.get('studentId') ?? '';
  readonly group = signal<GroupDetails | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly student = computed<GroupStudent | null>(() => this.group()?.students?.find((row) => row.id === this.studentId) ?? null);
  readonly session = computed<GroupCalendarEvent | null>(() => {
    const group = this.group();
    return group?.calendarEvents?.find((event) => event.id === this.sessionId) ?? null;
  });

  ngOnInit(): void {
    void this.loadGroup();
  }

  sessionTitle(): string {
    const session = this.session();
    if (!session) {
      return 'Student assessment';
    }

    return `${session.day || 'Session'} ${session.startTime || ''}`.trim();
  }

  sessionDateLabel(): string {
    const session = this.session();
    if (!session?.date) {
      return 'Scheduled session';
    }

    const date = new Date(`${session.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return session.date;
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  sessionTimeLabel(): string {
    const session = this.session();
    return session ? `${this.formatTime(session.startTime)} - ${this.formatTime(session.endTime)}` : 'No time set';
  }

  private async loadGroup(): Promise<void> {
    if (!this.groupId) {
      this.error.set('Unable to load assessment.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.group.set(await firstValueFrom(this.data.loadGroupById(this.groupId)));
    } catch {
      this.error.set('Unable to load assessment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private formatTime(value: string | null | undefined): string {
    if (!value) {
      return 'No time';
    }

    const [hoursValue, minutesValue = '00'] = value.split(':');
    const hours = Number(hoursValue);
    const minutes = Number(minutesValue);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return value;
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}
