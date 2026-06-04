import { Injectable, inject } from '@angular/core';
import { TenantGradeDetailsStore } from './tenant-grade-details.store';

@Injectable({ providedIn: 'root' })
export class TenantGradeDetailsFacade {
  private readonly store = inject(TenantGradeDetailsStore);

  readonly grade = this.store.grade;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;

  loadGrade(id: string | null): Promise<void> {
    return this.store.loadGrade(id);
  }
}
