import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantGradesDataService } from '../data-access/tenant-grades-data.service';
import { Grade } from '../models/tenant-grades.models';

export type TenantGradeDeleteStatus = 'closed' | 'confirming' | 'deleting' | 'success' | 'failed';

export interface TenantGradeDeleteState {
  grade: Grade | null;
  status: TenantGradeDeleteStatus;
  message: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantGradesStore {
  private readonly data = inject(TenantGradesDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly levelFilter = signal('');
  readonly minStudentsFilter = signal<number | null>(null);
  readonly maxStudentsFilter = signal<number | null>(null);
  readonly sortBy = signal('name');

  readonly grades = signal<Grade[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly deleteState = signal<TenantGradeDeleteState>({
    grade: null,
    status: 'closed',
    message: null,
  });

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.levelFilter()) count++;
    if (this.minStudentsFilter() !== null) count++;
    if (this.maxStudentsFilter() !== null) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredGrades = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const level = this.levelFilter();
    const minStudents = this.minStudentsFilter();
    const maxStudents = this.maxStudentsFilter();
    const sortBy = this.sortBy();

    const filtered = this.grades().filter((grade) => {
      const matchesSearch =
        !query ||
        grade.name.toLowerCase().includes(query) ||
        grade.level.toLowerCase().includes(query) ||
        grade.country.toLowerCase().includes(query);

      const matchesLevel = !level || grade.level === level;
      const matchesMin = minStudents === null || grade.studentCount >= minStudents;
      const matchesMax = maxStudents === null || grade.studentCount <= maxStudents;

      return matchesSearch && matchesLevel && matchesMin && matchesMax;
    });

    if (sortBy === 'students-desc') {
      filtered.sort((a, b) => b.studentCount - a.studentCount);
    } else if (sortBy === 'students-asc') {
      filtered.sort((a, b) => a.studentCount - b.studentCount);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  readonly levelOptions = computed(() =>
    Array.from(new Set(this.grades().map((grade) => grade.level))).sort((a, b) => a.localeCompare(b)),
  );

  async loadGrades(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.grades.set(await this.data.listGrades());
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  openDeleteConfirmation(grade: Grade): void {
    this.deleteState.set({
      grade,
      status: 'confirming',
      message: null,
    });
  }

  cancelDelete(): void {
    if (this.deleteState().status === 'deleting') {
      return;
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.deleteState.set({
      grade: null,
      status: 'closed',
      message: null,
    });
  }

  async confirmDelete(): Promise<void> {
    const grade = this.deleteState().grade;
    if (!grade || this.deleteState().status === 'deleting') {
      return;
    }

    this.deleteState.set({
      grade,
      status: 'deleting',
      message: null,
    });

    try {
      await this.data.deleteGrade(grade.id);
      this.grades.update((grades) => grades.filter((current) => current.id !== grade.id));
      this.deleteState.set({
        grade,
        status: 'success',
        message: `Grade "${grade.name}" was deleted successfully.`,
      });
    } catch (error) {
      this.deleteState.set({
        grade,
        status: 'failed',
        message: this.data.toDeleteUserMessage(error),
      });
    }
  }
}
