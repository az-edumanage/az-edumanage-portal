import { computed, Injectable, signal } from '@angular/core';
import { TenantGroupStudent } from '../models/tenant-group-student-add.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupStudentAddStore {
  readonly groupId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly isLoadingCandidates = signal(false);
  readonly candidateError = signal<string | null>(null);
  readonly candidateStudents = signal<TenantGroupStudent[]>([]);
  readonly filteredStudents = signal<TenantGroupStudent[]>([]);
  readonly selectedStudentIds = signal<string[]>([]);
  readonly taskId = signal('');
  readonly selectedStudents = computed(() => {
    const selectedIds = new Set(this.selectedStudentIds());
    return this.candidateStudents().filter((student) => selectedIds.has(student.id));
  });
  readonly selectedStudent = computed(() => this.selectedStudents()[0] ?? null);
  readonly hasSelectedStudents = computed(() => this.selectedStudentIds().length > 0);

  setGroupId(groupId: string | null): void {
    this.groupId.set(groupId);
    this.taskId.set(`enroll-student-group-${groupId}`);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setLoadingCandidates(value: boolean): void {
    this.isLoadingCandidates.set(value);
  }

  setCandidateError(value: string | null): void {
    this.candidateError.set(value);
  }

  setCandidateStudents(students: TenantGroupStudent[]): void {
    this.candidateStudents.set([...students]);
    this.filteredStudents.set([...students]);
    this.selectedStudentIds.update((selectedIds) =>
      selectedIds.filter((studentId) => students.some((student) => student.id === studentId)),
    );
  }

  setFilteredStudents(students: TenantGroupStudent[]): void {
    this.filteredStudents.set([...students]);
  }

  setSelectedStudentIds(studentIds: string[]): void {
    this.selectedStudentIds.set([...new Set(studentIds)]);
  }

  toggleStudent(student: TenantGroupStudent): void {
    this.selectedStudentIds.update((selectedIds) =>
      selectedIds.includes(student.id)
        ? selectedIds.filter((studentId) => studentId !== student.id)
        : [...selectedIds, student.id],
    );
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudentIds().includes(studentId);
  }
}
