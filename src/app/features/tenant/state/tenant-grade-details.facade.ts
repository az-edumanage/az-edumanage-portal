import { Injectable, inject } from '@angular/core';
import { TenantGradeDetailsStore } from './tenant-grade-details.store';

@Injectable({ providedIn: 'root' })
export class TenantGradeDetailsFacade {
  private readonly store = inject(TenantGradeDetailsStore);

  readonly grade = this.store.grade;
  readonly groups = this.store.groups;

  loadGrade(id: string | null): void {
    this.store.loadGrade(id);
  }
}
