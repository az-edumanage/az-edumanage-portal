import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantStudentsDataService } from '../data-access/tenant-students-data.service';
import { Student, StudentAttendanceCard, StudentAttendanceFilter, StudentAttendanceSummary } from '../models/tenant-students.models';

export type StudentDeleteStatus = 'closed' | 'confirming' | 'deleting' | 'success' | 'failed';

export interface StudentDeleteState {
  status: StudentDeleteStatus;
  student: Student | null;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class TenantStudentsStore {
  private readonly data = inject(TenantStudentsDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('list');

  readonly stageFilter = signal('');
  readonly gradeFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly deleteState = signal<StudentDeleteState>({ status: 'closed', student: null, message: '' });
  readonly passwordModalStudent = signal<Student | null>(null);
  readonly passwordSaving = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly students = signal<Student[]>([]);
  readonly attendanceSummary = signal<StudentAttendanceSummary | null>(null);
  readonly attendanceSummaryLoading = signal(false);
  readonly attendanceSummaryError = signal<string | null>(null);
  readonly attendanceFilter = signal<StudentAttendanceFilter>('all');

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.stageFilter()) count++;
    if (this.gradeFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const stage = this.stageFilter();
    const grade = this.gradeFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();
    const attendanceFilter = this.attendanceFilter();
    const attendanceSummary = this.attendanceSummary();
    const attendanceIds = this.attendanceStudentIdSet(attendanceFilter, attendanceSummary);

    const filtered = this.students().filter((student) => {
      const matchesAttendance = !attendanceIds || attendanceIds.has(student.id);
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);
      const matchesStage = !stage || student.stageId === stage;
      const matchesGrade = !grade || student.gradeId === grade;
      const matchesStatus = !status || student.status === status;
      return matchesAttendance && matchesSearch && matchesStage && matchesGrade && matchesStatus;
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
  readonly attendanceCards = computed<StudentAttendanceCard[]>(() => {
    const summary = this.attendanceSummary();
    const loading = this.attendanceSummaryLoading();
    const unavailable = Boolean(this.attendanceSummaryError() || summary?.unavailableReason);
    const totalStudents = this.students().length;
    const totalAbsent = summary?.totalAbsent ?? 0;
    const totalPresent = summary?.totalPresent ?? 0;
    const active = this.attendanceFilter();
    return [
      {
        key: 'all',
        label: 'Total students',
        count: totalStudents,
        active: active === 'all',
        loading: this.isLoading(),
        unavailable: false,
        disabled: false,
      },
      {
        key: 'absent',
        label: 'Total absence',
        count: totalAbsent,
        active: active === 'absent',
        loading,
        unavailable,
        disabled: unavailable || loading,
      },
      {
        key: 'present',
        label: 'Total present',
        count: totalPresent,
        active: active === 'present',
        loading,
        unavailable,
        disabled: unavailable || loading,
      },
    ];
  });
  readonly attendanceFilterLabel = computed(() => {
    switch (this.attendanceFilter()) {
      case 'absent':
        return 'today absent students';
      case 'present':
        return 'today present students';
      default:
        return 'all students';
    }
  });
  readonly emptyStateTitle = computed(() => {
    switch (this.attendanceFilter()) {
      case 'absent':
        return 'No absent students found';
      case 'present':
        return 'No present students found';
      default:
        return 'No students found';
    }
  });
  readonly emptyStateDescription = computed(() => {
    switch (this.attendanceFilter()) {
      case 'absent':
        return "No students match today's absence scope with the current search and filters.";
      case 'present':
        return "No students match today's present scope with the current search and filters.";
      default:
        return "We couldn't find any students matching your current search and filter criteria.";
    }
  });

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

  loadAttendanceSummary(): void {
    this.attendanceSummaryLoading.set(true);
    this.data.loadAttendanceSummary().subscribe({
      next: (summary) => {
        this.attendanceSummary.set(summary);
        this.attendanceSummaryError.set(null);
        this.attendanceSummaryLoading.set(false);
        this.clampPage();
      },
      error: (error: Error) => {
        this.attendanceSummary.set(null);
        this.attendanceSummaryError.set(error.message);
        this.attendanceSummaryLoading.set(false);
        if (this.attendanceFilter() !== 'all') {
          this.attendanceFilter.set('all');
        }
        this.clampPage();
      },
    });
  }

  setAttendanceFilter(value: StudentAttendanceFilter): void {
    if (value !== 'all' && this.attendanceCards().find((card) => card.key === value)?.disabled) {
      return;
    }
    this.attendanceFilter.set(value);
    this.resetPage();
  }

  requestDelete(student: Student): void {
    this.deleteState.set({ status: 'confirming', student, message: '' });
  }

  setDeleteDeleting(): void {
    const current = this.deleteState();
    this.deleteState.set({ ...current, status: 'deleting', message: 'Deleting student...' });
  }

  setDeleteSuccess(message: string): void {
    this.deleteState.set({ status: 'success', student: null, message });
  }

  setDeleteFailed(message: string): void {
    const current = this.deleteState();
    this.deleteState.set({ ...current, status: 'failed', message });
  }

  closeDeleteModal(): void {
    this.deleteState.set({ status: 'closed', student: null, message: '' });
  }

  openPasswordModal(student: Student): void {
    this.passwordModalStudent.set(student);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
  }

  closePasswordModal(): void {
    this.passwordModalStudent.set(null);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.passwordSaving.set(false);
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

  removeStudent(id: string): void {
    this.students.update((students) => students.filter((student) => student.id !== id));
    this.attendanceSummary.update((summary) => {
      if (!summary) {
        return summary;
      }
      const absentStudentIds = summary.absentStudentIds.filter((studentId) => studentId !== id);
      const presentStudentIds = summary.presentStudentIds.filter((studentId) => studentId !== id);
      return {
        ...summary,
        totalStudents: Math.max(0, summary.totalStudents - 1),
        absentStudentIds,
        presentStudentIds,
        totalAbsent: absentStudentIds.length,
        totalPresent: presentStudentIds.length,
      };
    });
    this.clampPage();
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

  private attendanceStudentIdSet(
    attendanceFilter: StudentAttendanceFilter,
    summary: StudentAttendanceSummary | null
  ): Set<string> | null {
    if (attendanceFilter === 'absent') {
      return new Set(summary?.absentStudentIds ?? []);
    }
    if (attendanceFilter === 'present') {
      return new Set(summary?.presentStudentIds ?? []);
    }
    return null;
  }
}
