import { Injectable, computed, inject, signal } from '@angular/core';
import { TeacherApiService } from '../data-access/teacher-api.service';
import { TeacherAssignedGroup } from '../models/teacher.models';

export type TeacherGroupsViewMode = 'grid' | 'list';

@Injectable({ providedIn: 'root' })
export class TeacherGroupsStore {
  private readonly api = inject(TeacherApiService);

  readonly groups = signal<TeacherAssignedGroup[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly failed = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<TeacherGroupsViewMode>('list');
  readonly subjectFilter = signal('');
  readonly educationFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly empty = computed(() => this.loaded() && this.groups().length === 0);

  readonly subjectOptions = computed(() => this.uniqueValues(this.groups().map((group) => group.subject)));
  readonly educationOptions = computed(() => this.uniqueValues(this.groups().map((group) => this.educationLabel(group))));
  readonly statusOptions = computed(() => this.uniqueValues(this.groups().map((group) => group.status)));

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.subjectFilter()) count++;
    if (this.educationFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredGroups = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const subject = this.subjectFilter();
    const education = this.educationFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();

    const filtered = this.groups().filter((group) => {
      const searchText = [
        group.name,
        group.subject,
        group.stage,
        group.grade,
        group.university,
        group.college,
        group.room,
        group.schedule,
        this.educationLabel(group),
        this.groupRoomLabel(group),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (!query || searchText.includes(query))
        && (!subject || group.subject === subject)
        && (!education || this.educationLabel(group) === education)
        && (!status || group.status === status);
    });

    if (sortBy === 'students-desc') {
      filtered.sort((a, b) => b.studentsCount - a.studentsCount);
    } else if (sortBy === 'students-asc') {
      filtered.sort((a, b) => a.studentsCount - b.studentsCount);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  readonly noFilteredResults = computed(() => this.loaded() && this.groups().length > 0 && this.filteredGroups().length === 0);
  readonly totalFilteredGroups = computed(() => this.filteredGroups().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalFilteredGroups() / this.pageSize())));
  readonly clampedPageIndex = computed(() => Math.min(this.pageIndex(), this.totalPages() - 1));
  readonly pagedGroups = computed(() => {
    const start = this.clampedPageIndex() * this.pageSize();
    return this.filteredGroups().slice(start, start + this.pageSize());
  });
  readonly pageStart = computed(() => this.totalFilteredGroups() === 0 ? 0 : this.clampedPageIndex() * this.pageSize() + 1);
  readonly pageEnd = computed(() => Math.min((this.clampedPageIndex() + 1) * this.pageSize(), this.totalFilteredGroups()));

  loadGroups(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.errorMessage.set(null);

    this.api.loadAssignedGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups ?? []);
        this.loading.set(false);
        this.loaded.set(true);
        this.failed.set(false);
        this.clampPage();
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.loaded.set(false);
        this.failed.set(true);
        this.errorMessage.set(error.message || 'Unable to load assigned groups');
      },
    });
  }

  retry(): void {
    this.loadGroups();
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.resetPage();
  }

  setFilters(subject: string, education: string, status: string, sortBy: string): void {
    this.subjectFilter.set(subject);
    this.educationFilter.set(education);
    this.statusFilter.set(status);
    this.sortBy.set(sortBy || 'name');
    this.resetPage();
  }

  clearAdvancedFilters(): void {
    this.setFilters('', '', '', 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  setPageIndex(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 0;
    this.pageIndex.set(Math.max(0, Math.min(next, this.totalPages() - 1)));
  }

  setPageSize(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 10;
    this.pageSize.set(Math.max(1, next));
    this.resetPage();
  }

  resetPage(): void {
    this.pageIndex.set(0);
  }

  clampPage(): void {
    this.setPageIndex(this.pageIndex());
  }

  private uniqueValues(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value))]
      .sort((left, right) => left.localeCompare(right));
  }

  private educationLabel(group: TeacherAssignedGroup): string {
    return group.educationCategory === 'UNIVERSITY_EDUCATION' ? 'University Education' : 'Basic Education';
  }

  private groupRoomLabel(group: TeacherAssignedGroup): string {
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

    return [...rooms].join(', ');
  }
}
