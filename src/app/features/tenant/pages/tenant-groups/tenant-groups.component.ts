import { Component, DestroyRef, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantGroupsFacade } from '../../state/tenant-groups.facade';
import { Group, GroupScheduleFilter } from '../../models/tenant-groups.models';

@Component({
  selector: 'app-tenant-groups',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-groups.component.html',
  styleUrl: './tenant-groups.component.css'})
export class TenantGroupsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantGroupsFacade);
  private readonly router = inject(Router);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly scheduleSummary = this.facade.scheduleSummary;
  readonly scheduleSummaryLoading = this.facade.scheduleSummaryLoading;
  readonly scheduleSummaryError = this.facade.scheduleSummaryError;
  readonly scheduleFilter = this.facade.scheduleFilter;
  readonly activeScheduleFilterLabel = this.facade.activeScheduleFilterLabel;
  readonly hasScheduleFilter = this.facade.hasScheduleFilter;
  readonly groups = this.facade.groups;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredGroups = this.facade.filteredGroups;
  readonly pagedGroups = this.facade.pagedGroups;
  readonly totalFilteredGroups = this.facade.totalFilteredGroups;
  readonly totalPages = this.facade.totalPages;
  readonly pageIndex = this.facade.pageIndex;
  readonly pageSize = this.facade.pageSize;
  readonly pageStart = this.facade.pageStart;
  readonly pageEnd = this.facade.pageEnd;
  readonly deleteState = this.facade.deleteState;

  readonly scheduleCards = computed(() => {
    const summary = this.scheduleSummary();
    return [
      {
        filter: 'all' as const,
        label: 'Total Groups',
        value: this.groups().length,
        icon: 'groups',
      },
      {
        filter: 'today' as const,
        label: "Today's Groups",
        value: summary?.todayGroups ?? 0,
        icon: 'today',
      },
      {
        filter: 'running' as const,
        label: 'Current Running Groups',
        value: summary?.currentRunningGroups ?? 0,
        icon: 'play_circle',
      },
      {
        filter: 'postponed' as const,
        label: 'Postponed Groups',
        value: summary?.postponedGroups ?? 0,
        icon: 'event_busy',
      },
    ];
  });

  readonly filterForm = this.fb.group({
    subject: [''],
    teacher: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.facade.loadGroups();
    this.facade.loadScheduleSummary();
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(value.subject ?? '', value.teacher ?? '', value.sortBy ?? 'name');
      });
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  selectScheduleFilter(filter: GroupScheduleFilter): void {
    this.facade.selectScheduleFilter(filter);
  }

  openGroupDetails(groupId: string): void {
    void this.router.navigate(['/tenant/groups', groupId]);
  }

  emptyStateTitle(): string {
    if (!this.hasScheduleFilter()) {
      return 'No groups found';
    }
    return `No ${this.activeScheduleFilterLabel().toLowerCase()} found`;
  }

  emptyStateDescription(): string {
    if (!this.hasScheduleFilter()) {
      return "We couldn't find any academic groups matching your current search and filter criteria.";
    }
    return `No groups match the ${this.activeScheduleFilterLabel().toLowerCase()} schedule filter with the current search and advanced filters.`;
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      subject: '',
      teacher: '',
      sortBy: 'name',
    });
  }

  previousPage(): void {
    this.facade.previousPage();
  }

  nextPage(): void {
    this.facade.nextPage();
  }

  setPageSize(value: string): void {
    this.facade.setPageSize(Number(value));
  }

  requestDelete(groupId: string): void {
    this.facade.requestDelete(groupId);
  }

  closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  confirmDelete(): void {
    this.facade.confirmDelete();
  }

  formatRooms(group: Group): string {
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

  formatStartAt(group: Group): string {
    const dayStartTimes = Object.values(group.daySchedules ?? {})
      .map((schedule) => schedule.startTime?.trim())
      .filter((value): value is string => !!value);

    if (dayStartTimes.length > 0) {
      const formattedTimes = new Set(dayStartTimes.map((time) => this.formatTimeValue(time)));
      return [...formattedTimes].join(', ');
    }

    if (!group.startAt) {
      return 'Not set';
    }

    return this.formatTimeValue(group.startAt);
  }

  private formatTimeValue(time: string): string {
    const minutes = this.toMinutes(time);

    if (minutes === null) {
      return time;
    }

    return this.formatMinutes(minutes);
  }

  formatDuration(group: Group): string {
    const dayDurations = Object.values(group.daySchedules ?? {})
      .map((schedule) => this.durationBetween(schedule.startTime ?? '', schedule.endTime ?? ''))
      .filter((value): value is number => value !== null);

    if (dayDurations.length > 0) {
      const formattedDurations = new Set(dayDurations.map((duration) => this.formatDurationValue(duration)));
      return [...formattedDurations].join(', ');
    }

    if (!group.duration) {
      return 'Not set';
    }

    return this.formatDurationValue(group.duration);
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
