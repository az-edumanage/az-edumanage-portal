import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TeacherAssignedGroup } from '../../models/teacher.models';
import { TeacherGroupsFacade } from '../../state/teacher-groups.facade';

@Component({
  selector: 'app-teacher-groups',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule],
  templateUrl: './teacher-groups.component.html',
  styleUrl: './teacher-groups.component.css',
})
export class TeacherGroupsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TeacherGroupsFacade);

  readonly groups = this.facade.groups;
  readonly loading = this.facade.loading;
  readonly loaded = this.facade.loaded;
  readonly failed = this.facade.failed;
  readonly empty = this.facade.empty;
  readonly errorMessage = this.facade.errorMessage;
  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly subjectOptions = this.facade.subjectOptions;
  readonly educationOptions = this.facade.educationOptions;
  readonly statusOptions = this.facade.statusOptions;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredGroups = this.facade.filteredGroups;
  readonly noFilteredResults = this.facade.noFilteredResults;
  readonly pagedGroups = this.facade.pagedGroups;
  readonly totalFilteredGroups = this.facade.totalFilteredGroups;
  readonly totalPages = this.facade.totalPages;
  readonly pageIndex = this.facade.pageIndex;
  readonly pageSize = this.facade.pageSize;
  readonly pageStart = this.facade.pageStart;
  readonly pageEnd = this.facade.pageEnd;

  readonly filterForm = this.fb.group({
    subject: [''],
    education: [''],
    status: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.facade.loadGroups();
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(
          value.subject ?? '',
          value.education ?? '',
          value.status ?? '',
          value.sortBy ?? 'name');
      });
  }

  retry(): void {
    this.facade.retry();
  }

  setSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.facade.setSearchQuery(input.value);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.facade.setViewMode(mode);
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      subject: '',
      education: '',
      status: '',
      sortBy: 'name',
    });
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  previousPage(): void {
    this.facade.previousPage();
  }

  nextPage(): void {
    this.facade.nextPage();
  }

  setPageSize(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.facade.setPageSize(Number(select.value));
  }

  educationLabel(group: TeacherAssignedGroup): string {
    return group.educationCategory === 'UNIVERSITY_EDUCATION' ? 'University Education' : 'Basic Education';
  }

  educationContext(group: TeacherAssignedGroup): string {
    const values = group.educationCategory === 'UNIVERSITY_EDUCATION'
      ? [group.university, group.college]
      : [group.stage, group.grade];
    return values.map((value) => value?.trim()).filter(Boolean).join(' / ') || 'Context not set';
  }

  statusClass(status: string): string {
    return status?.toLowerCase() === 'active' ? 'status-active' : 'status-inactive';
  }

  formatRooms(group: TeacherAssignedGroup): string {
    const rooms = new Set<string>();
    if (group.room?.trim()) {
      rooms.add(group.room.trim());
    }

    Object.values(group.daySchedules ?? {}).forEach((schedule) => {
      const room = schedule.room?.trim();
      if (room) {
        rooms.add(room);
      }
    });

    return [...rooms].join(', ') || 'Not set';
  }

  formatStartAt(group: TeacherAssignedGroup): string {
    const dayStartTimes = Object.values(group.daySchedules ?? {})
      .map((schedule) => schedule.startTime?.trim())
      .filter((value): value is string => !!value);

    if (dayStartTimes.length > 0) {
      return [...new Set(dayStartTimes.map((time) => this.formatTimeValue(time)))].join(', ');
    }

    return group.startAt ? this.formatTimeValue(group.startAt) : 'Not set';
  }

  formatDuration(group: TeacherAssignedGroup): string {
    const dayDurations = Object.values(group.daySchedules ?? {})
      .map((schedule) => this.durationBetween(schedule.startTime ?? '', schedule.endTime ?? ''))
      .filter((value): value is number => value !== null);

    if (dayDurations.length > 0) {
      return [...new Set(dayDurations.map((duration) => this.formatDurationValue(duration)))].join(', ');
    }

    return group.duration ? this.formatDurationValue(group.duration) : 'Not set';
  }

  private formatTimeValue(time: string): string {
    const minutes = this.toMinutes(time);
    return minutes === null ? time : this.formatMinutes(minutes);
  }

  private formatDurationValue(duration: number): string {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} hr ${minutes} min`;
    }
    if (hours > 0) {
      return `${hours} hr`;
    }
    return `${minutes} min`;
  }

  private durationBetween(startTime: string, endTime: string): number | null {
    const startMinutes = this.toMinutes(startTime);
    const endMinutes = this.toMinutes(endTime);
    if (startMinutes === null || endMinutes === null) {
      return null;
    }
    const duration = endMinutes - startMinutes;
    return duration > 0 ? duration : null;
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
}
