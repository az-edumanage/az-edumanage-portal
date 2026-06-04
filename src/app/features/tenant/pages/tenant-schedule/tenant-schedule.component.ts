import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { ScheduleSession } from '../../models/tenant-schedule.models';
import { TenantScheduleFacade } from '../../state/tenant-schedule.facade';

type ScheduleFilterKey = 'teacher' | 'room' | 'day';

@Component({
  selector: 'app-tenant-schedule',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './tenant-schedule.component.html',
  styleUrl: './tenant-schedule.component.css',
  host: {
    '(document:click)': 'closeFilterPanel()',
    '(document:keydown.escape)': 'closeFilterPanel()',
  },
})
export class TenantScheduleComponent {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TenantScheduleFacade);
  private readonly router = inject(Router);

  readonly days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly timeSlots = [
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00',
    '00:00',
  ];

  readonly filterForm = this.fb.group({
    teacher: [''],
    room: [''],
    day: [''],
  });

  readonly teachers = this.facade.teachers;
  readonly rooms = this.facade.rooms;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filterSearch: Record<ScheduleFilterKey, string> = {
    teacher: '',
    room: '',
    day: '',
  };

  openFilter: ScheduleFilterKey | null = null;
  selectedCellDay: string | null = null;
  selectedCellTime: string | null = null;

  constructor() {
    this.facade.loadSessions();

    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed())
      .subscribe((value) => {
        this.facade.setFilters({
          teacher: value.teacher ?? '',
          room: value.room ?? '',
          day: value.day ?? '',
        });
      });
  }

  getSessionsFor(day: string, time: string) {
    return this.facade.getSessionsFor(day, time);
  }

  formatScheduleTime(time: string | null): string {
    if (!time) {
      return '';
    }

    const minutes = this.toMinutes(time);

    if (minutes === null) {
      return time;
    }

    return this.formatMinutes(minutes);
  }

  formatSessionTimeRange(session: ScheduleSession): string {
    if (!session.duration) {
      return this.formatScheduleTime(session.startTime);
    }

    const start = this.toMinutes(session.startTime);

    if (start === null) {
      return this.formatScheduleTime(session.startTime);
    }

    return `${this.formatMinutes(start)} - ${this.formatMinutes(start + session.duration)}`;
  }

  formatSessionDuration(session: ScheduleSession): string {
    if (!session.duration) {
      return 'Duration not set';
    }

    const hours = Math.floor(session.duration / 60);
    const minutes = session.duration % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} hr ${minutes} min`;
    }

    if (hours > 0) {
      return `${hours} hr`;
    }

    return `${minutes} min`;
  }

  private formatMinutes(totalMinutes: number): string {
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const hour = Math.floor(normalizedMinutes / 60);
    const minute = normalizedMinutes % 60;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  }

  private toMinutes(time: string): number | null {
    const [hourPart, minutePart = '0'] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }

    return hour * 60 + minute;
  }

  toggleFilterPanel(filter: ScheduleFilterKey): void {
    this.openFilter = this.openFilter === filter ? null : filter;
  }

  closeFilterPanel(): void {
    this.openFilter = null;
  }

  updateFilterSearch(filter: ScheduleFilterKey, value: string): void {
    this.filterSearch[filter] = value;
  }

  selectFilterValue(filter: ScheduleFilterKey, value: string): void {
    this.filterForm.controls[filter].setValue(value);
    this.filterSearch[filter] = '';
    this.openFilter = null;
  }

  getSelectedFilterLabel(filter: ScheduleFilterKey, fallback: string): string {
    return this.filterForm.controls[filter].value || fallback;
  }

  filteredFilterOptions(filter: ScheduleFilterKey): string[] {
    const query = this.filterSearch[filter].trim().toLowerCase();
    const options = this.getFilterOptions(filter);

    if (!query) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(query));
  }

  isFilterSelected(filter: ScheduleFilterKey, value: string): boolean {
    return this.filterForm.controls[filter].value === value;
  }

  openScheduleCell(day: string, time: string): void {
    this.selectedCellDay = day;
    this.selectedCellTime = time;
  }

  activateScheduleCell(event: KeyboardEvent, day: string, time: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.openScheduleCell(day, time);
  }

  closeScheduleCell(): void {
    this.selectedCellDay = null;
    this.selectedCellTime = null;
  }

  openGroupDetails(session: ScheduleSession): void {
    if (!session.groupId) {
      return;
    }

    void this.router.navigate(['/tenant/groups', session.groupId]);
  }

  activateGroupDetails(event: KeyboardEvent, session: ScheduleSession): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.openGroupDetails(session);
  }

  selectedCellSessions(): ScheduleSession[] {
    if (!this.selectedCellDay || !this.selectedCellTime) {
      return [];
    }

    return this.getSessionsFor(this.selectedCellDay, this.selectedCellTime);
  }

  getSessionChipLabel(groupName: string, index: number): string {
    const match = groupName.match(/\b([A-Za-z])[\w-]*\s*(\d+)?/);

    if (match) {
      return `${match[1].toUpperCase()}${match[2] ?? index + 1}`;
    }

    return `G${index + 1}`;
  }

  getSessionTitle(session: { groupName: string; teacherName: string; roomName: string; startTime: string }): string {
    return `${session.groupName} | ${session.teacherName} | ${session.roomName} | ${session.startTime}`;
  }

  resetFilters(): void {
    this.filterForm.reset({
      teacher: '',
      room: '',
      day: '',
    });
    this.filterSearch.teacher = '';
    this.filterSearch.room = '';
    this.filterSearch.day = '';
    this.openFilter = null;
    this.facade.resetFilters();
  }

  private getFilterOptions(filter: ScheduleFilterKey): string[] {
    if (filter === 'teacher') {
      return this.teachers();
    }

    if (filter === 'room') {
      return this.rooms();
    }

    return this.days;
  }
}
