import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantGroupAttendanceDataService } from '../data-access/tenant-group-attendance-data.service';
import { TenantAttendanceStudent } from '../models/tenant-group-attendance.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupAttendanceStore {
  private readonly data = inject(TenantGroupAttendanceDataService);

  readonly groupId = signal<string | null>(null);
  readonly today = new Date();
  readonly students = signal<TenantAttendanceStudent[]>([]);
  readonly isSaving = signal(false);

  readonly presentCount = computed(() => this.students().filter((student) => student.isPresent).length);
  readonly absentCount = computed(() => this.students().filter((student) => !student.isPresent).length);
  readonly attendanceRate = computed(() => {
    const total = this.students().length;
    if (!total) {
      return 0;
    }

    return Math.round((this.presentCount() / total) * 100);
  });

  loadGroup(groupId: string | null): void {
    this.groupId.set(groupId);
    this.students.set(this.data.getStudentsByGroupId(groupId));
  }

  toggleAttendance(id: string, isPresent: boolean): void {
    this.students.update((list) => list.map((student) => (student.id === id ? { ...student, isPresent } : student)));
  }

  markAll(isPresent: boolean): void {
    this.students.update((list) => list.map((student) => ({ ...student, isPresent })));
  }

  async saveAttendance(): Promise<void> {
    this.isSaving.set(true);

    try {
      await this.data.saveAttendance(this.groupId(), this.students());
    } finally {
      this.isSaving.set(false);
    }
  }
}
