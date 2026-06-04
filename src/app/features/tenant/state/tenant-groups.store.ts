import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantGroupsDataService } from '../data-access/tenant-groups-data.service';
import { Group } from '../models/tenant-groups.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupsStore {
  private readonly data = inject(TenantGroupsDataService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('list');

  readonly subjectFilter = signal('');
  readonly teacherFilter = signal('');
  readonly sortBy = signal('name');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly groups = signal<Group[]>([]);

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.subjectFilter()) count++;
    if (this.teacherFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const subject = this.subjectFilter();
    const teacher = this.teacherFilter();
    const sortBy = this.sortBy();

    const filtered = this.groups().filter((group) => {
      const matchesSearch =
        !query ||
        group.name.toLowerCase().includes(query) ||
        group.subject.toLowerCase().includes(query) ||
        group.teacher.toLowerCase().includes(query) ||
        group.room.toLowerCase().includes(query);

      const matchesSubject = !subject || group.subject === subject;
      const matchesTeacher = !teacher || group.teacher === teacher;

      return matchesSearch && matchesSubject && matchesTeacher;
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

  readonly totalFilteredGroups = computed(() => this.filteredGroups().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalFilteredGroups() / this.pageSize())));
  readonly clampedPageIndex = computed(() => Math.min(this.pageIndex(), this.totalPages() - 1));
  readonly pagedGroups = computed(() => {
    const pageIndex = this.clampedPageIndex();
    const pageSize = this.pageSize();
    const start = pageIndex * pageSize;
    return this.filteredGroups().slice(start, start + pageSize);
  });
  readonly pageStart = computed(() => {
    if (this.totalFilteredGroups() === 0) {
      return 0;
    }
    return this.clampedPageIndex() * this.pageSize() + 1;
  });
  readonly pageEnd = computed(() => Math.min((this.clampedPageIndex() + 1) * this.pageSize(), this.totalFilteredGroups()));

  loadGroups(): void {
    this.isLoading.set(true);
    this.data.loadGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.clampPage();
        this.errorMessage.set(null);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      },
    });
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
}
