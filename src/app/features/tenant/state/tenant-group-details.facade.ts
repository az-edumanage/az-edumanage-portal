import { Injectable, inject } from '@angular/core';
import { GroupStudent } from '../models/tenant-group-details.models';
import { TenantGroupDetailsScope, TenantGroupDetailsStore } from './tenant-group-details.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsFacade {
  private readonly store = inject(TenantGroupDetailsStore);

  readonly group = this.store.group;
  readonly selectedStudent = this.store.selectedStudent;
  readonly students = this.store.students;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly exitStudentError = this.store.exitStudentError;
  readonly exitingStudentId = this.store.exitingStudentId;
  readonly avgAttendanceLabel = this.store.avgAttendanceLabel;
  readonly absenceRateLabel = this.store.absenceRateLabel;
  readonly monthlyRevenueLabel = this.store.monthlyRevenueLabel;
  readonly capacityUsageLabel = this.store.capacityUsageLabel;

  loadGroup(id: string | null, scope: TenantGroupDetailsScope = 'tenant'): void {
    this.store.loadGroup(id, scope);
  }

  selectStudent(student: GroupStudent): void {
    this.selectedStudent.set(student);
  }

  clearSelectedStudent(): void {
    this.selectedStudent.set(null);
  }

  removeStudentFromGroup(groupId: string | null, student: GroupStudent): void {
    this.store.removeStudentFromGroup(groupId, student);
  }
}
