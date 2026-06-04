import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantStudentsDataService } from '../data-access/tenant-students-data.service';
import { Student } from '../models/tenant-students.models';

@Injectable({ providedIn: 'root' })
export class TenantStudentsStore {
  private readonly data = inject(TenantStudentsDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('list');

  readonly gradeFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly students = signal<Student[]>([]);

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.gradeFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const grade = this.gradeFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();

    const filtered = this.students().filter((student) => {
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);
      const matchesGrade = !grade || student.grade === grade;
      const matchesStatus = !status || student.status === status;
      return matchesSearch && matchesGrade && matchesStatus;
    });

    if (sortBy === 'date-desc') {
      filtered.sort(
        (a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime(),
      );
    } else if (sortBy === 'date-asc') {
      filtered.sort(
        (a, b) => new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime(),
      );
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  readonly totalFilteredStudents = computed(() => this.filteredStudents().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalFilteredStudents() / this.pageSize())));
  readonly clampedPageIndex = computed(() => Math.min(this.pageIndex(), this.totalPages() - 1));
  readonly pagedStudents = computed(() => {
    const pageIndex = this.clampedPageIndex();
    const pageSize = this.pageSize();
    const start = pageIndex * pageSize;
    return this.filteredStudents().slice(start, start + pageSize);
  });
  readonly pageStart = computed(() => {
    if (this.totalFilteredStudents() === 0) {
      return 0;
    }
    return this.clampedPageIndex() * this.pageSize() + 1;
  });
  readonly pageEnd = computed(() => Math.min((this.clampedPageIndex() + 1) * this.pageSize(), this.totalFilteredStudents()));

  loadStudents(): void {
    this.isLoading.set(true);
    this.data.loadStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.clampPage();
        this.errorMessage.set(null);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.students.set([]);
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
