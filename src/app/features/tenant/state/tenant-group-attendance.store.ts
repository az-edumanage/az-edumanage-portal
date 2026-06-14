import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TenantGroupAttendanceDataService } from '../data-access/tenant-group-attendance-data.service';
import { TenantAttendanceStudent } from '../models/tenant-group-attendance.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupAttendanceStore {
  private readonly data = inject(TenantGroupAttendanceDataService);

  readonly groupId = signal<string | null>(null);
  readonly today = new Date();
  readonly students = signal<TenantAttendanceStudent[]>([]);
  readonly isSaving = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly attendanceAvailable = signal(false);
  readonly attendanceBlockedMessage = computed(() =>
    this.attendanceAvailable() ? null : 'Attendance actions will be available when the current group session starts.',
  );

  readonly presentCount = computed(() => this.students().filter((student) => student.isPresent).length);
  readonly absentCount = computed(() => this.students().filter((student) => !student.isPresent).length);
  readonly attendanceRate = computed(() => {
    const total = this.students().length;
    if (!total) {
      return 0;
    }

    return Math.round((this.presentCount() / total) * 100);
  });

  async loadGroup(groupId: string | null): Promise<void> {
    this.groupId.set(groupId);
    this.students.set([]);
    this.error.set(null);
    this.attendanceAvailable.set(false);
    this.isLoading.set(true);

    try {
      const details = await firstValueFrom(this.data.loadGroupAttendance(groupId));
      this.students.set(details.students);
      this.attendanceAvailable.set(details.attendanceAvailable);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load group attendance students');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleAttendance(id: string, isPresent: boolean): void {
    if (!this.attendanceAvailable()) {
      return;
    }
    this.students.update((list) => list.map((student) => (student.id === id ? { ...student, isPresent } : student)));
  }

  markAll(isPresent: boolean): void {
    if (!this.attendanceAvailable()) {
      return;
    }
    this.students.update((list) => list.map((student) => ({ ...student, isPresent })));
  }

  async saveAttendance(): Promise<void> {
    if (!this.attendanceAvailable()) {
      return;
    }
    this.isSaving.set(true);

    try {
      await this.data.saveAttendance(this.groupId(), this.students());
    } finally {
      this.isSaving.set(false);
    }
  }
}
