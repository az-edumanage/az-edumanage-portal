import { Injectable, signal } from '@angular/core';
import { TenantGroupStudent } from '../models/tenant-group-student-add.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupStudentAddStore {
  readonly groupId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly selectedStudent = signal<TenantGroupStudent | null>(null);
  readonly filteredStudents = signal<TenantGroupStudent[]>([]);
  readonly taskId = signal('');

  setGroupId(groupId: string | null): void {
    this.groupId.set(groupId);
    this.taskId.set(`enroll-student-group-${groupId}`);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
