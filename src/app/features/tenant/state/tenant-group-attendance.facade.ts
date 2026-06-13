import { Injectable, inject } from '@angular/core';
import { TenantGroupAttendanceStore } from './tenant-group-attendance.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupAttendanceFacade {
  private readonly store = inject(TenantGroupAttendanceStore);

  readonly groupId = this.store.groupId;
  readonly today = this.store.today;
  readonly students = this.store.students;
  readonly isSaving = this.store.isSaving;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly attendanceAvailable = this.store.attendanceAvailable;
  readonly attendanceBlockedMessage = this.store.attendanceBlockedMessage;
  readonly presentCount = this.store.presentCount;
  readonly absentCount = this.store.absentCount;
  readonly attendanceRate = this.store.attendanceRate;

  async loadGroup(id: string | null): Promise<void> {
    await this.store.loadGroup(id);
  }

  toggleAttendance(id: string, isPresent: boolean): void {
    this.store.toggleAttendance(id, isPresent);
  }

  markAll(isPresent: boolean): void {
    this.store.markAll(isPresent);
  }

  async saveAttendance(): Promise<void> {
    await this.store.saveAttendance();
  }
}
