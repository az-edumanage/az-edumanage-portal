import { Injectable, computed, signal } from '@angular/core';
import { Teacher } from '../models/tenant-teachers.models';

export type TeacherDeleteStatus = 'closed' | 'confirming' | 'deleting' | 'success' | 'failed';

export interface TeacherDeleteState {
  status: TeacherDeleteStatus;
  teacher: Teacher | null;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class TenantTeachersStore {
  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('list');

  readonly subjectFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly activeSettingsId = signal<string | null>(null);
  readonly activeChatTeacher = signal<Teacher | null>(null);
  readonly passwordModalTeacher = signal<Teacher | null>(null);
  readonly passwordSaving = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly deleteState = signal<TeacherDeleteState>({ status: 'closed', teacher: null, message: '' });
  readonly teachers = signal<Teacher[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.subjectFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly subjectOptions = computed(() => {
    const subjects = this.teachers()
      .flatMap((teacher) => teacher.subjects?.map((subject) => subject.name) ?? [])
      .filter(Boolean);
    return Array.from(new Set(subjects)).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredTeachers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const subject = this.subjectFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();

    const filtered = this.teachers().filter((teacher) => {
      const subjectNames = teacher.subjects?.map((item) => item.name) ?? [];
      const matchesSearch =
        !query ||
        teacher.name.toLowerCase().includes(query) ||
        teacher.subject.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query);

      const matchesSubject = !subject || subjectNames.includes(subject) || teacher.subject === subject;
      const matchesStatus = !status || teacher.status === status;

      return matchesSearch && matchesSubject && matchesStatus;
    });

    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  readonly totalFilteredTeachers = computed(() => this.filteredTeachers().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalFilteredTeachers() / this.pageSize())));
  readonly clampedPageIndex = computed(() => Math.min(this.pageIndex(), this.totalPages() - 1));
  readonly pagedTeachers = computed(() => {
    const pageIndex = this.clampedPageIndex();
    const pageSize = this.pageSize();
    const start = pageIndex * pageSize;
    return this.filteredTeachers().slice(start, start + pageSize);
  });
  readonly pageStart = computed(() => {
    if (this.totalFilteredTeachers() === 0) {
      return 0;
    }
    return this.clampedPageIndex() * this.pageSize() + 1;
  });
  readonly pageEnd = computed(() => Math.min((this.clampedPageIndex() + 1) * this.pageSize(), this.totalFilteredTeachers()));

  setTeachers(value: Teacher[]): void {
    this.teachers.set(value);
    this.clampPage();
  }

  updateTeacher(value: Teacher): void {
    this.teachers.update((teachers) => teachers.map((teacher) => (teacher.id === value.id ? value : teacher)));
    this.clampPage();
  }

  removeTeacher(id: string): void {
    this.teachers.update((teachers) => teachers.filter((teacher) => teacher.id !== id));
    this.clampPage();
  }

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  setError(value: string | null): void {
    this.errorMessage.set(value);
  }

  setPageIndex(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 0;
    this.pageIndex.set(Math.max(0, Math.min(next, this.totalPages() - 1)));
  }

  setPageSize(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 10;
    this.pageSize.set(Math.max(1, next));
    this.setPageIndex(0);
  }

  resetPage(): void {
    this.pageIndex.set(0);
  }

  clampPage(): void {
    this.setPageIndex(this.pageIndex());
  }

  openPasswordModal(teacher: Teacher): void {
    this.passwordModalTeacher.set(teacher);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
  }

  closePasswordModal(): void {
    this.passwordModalTeacher.set(null);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.passwordSaving.set(false);
  }

  requestDelete(teacher: Teacher): void {
    this.deleteState.set({ status: 'confirming', teacher, message: '' });
  }

  setDeleteDeleting(): void {
    const current = this.deleteState();
    this.deleteState.set({ ...current, status: 'deleting', message: 'Deleting teacher...' });
  }

  setDeleteSuccess(message: string): void {
    this.deleteState.set({ status: 'success', teacher: null, message });
  }

  setDeleteFailed(message: string): void {
    const current = this.deleteState();
    this.deleteState.set({ ...current, status: 'failed', message });
  }

  closeDeleteModal(): void {
    this.deleteState.set({ status: 'closed', teacher: null, message: '' });
  }

  setPasswordSaving(value: boolean): void {
    this.passwordSaving.set(value);
  }

  setPasswordError(value: string | null): void {
    this.passwordError.set(value);
  }

  setPasswordSuccess(value: string | null): void {
    this.passwordSuccess.set(value);
  }
}
