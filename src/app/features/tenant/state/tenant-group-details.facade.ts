import { Injectable, inject } from '@angular/core';
import { GroupStudent } from '../models/tenant-group-details.models';
import { TenantGroupDetailsStore } from './tenant-group-details.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsFacade {
  private readonly store = inject(TenantGroupDetailsStore);

  readonly group = this.store.group;
  readonly selectedStudent = this.store.selectedStudent;
  readonly students = this.store.students;

  loadGroup(id: string | null): void {
    this.store.loadGroup(id);
  }

  selectStudent(student: GroupStudent): void {
    this.selectedStudent.set(student);
  }

  clearSelectedStudent(): void {
    this.selectedStudent.set(null);
  }
}
