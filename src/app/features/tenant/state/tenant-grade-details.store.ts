import { Injectable, inject, signal } from '@angular/core';
import { TenantGradeDetailsDataService } from '../data-access/tenant-grade-details-data.service';
import { GradeDetails, GradeGroup } from '../models/tenant-grade-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGradeDetailsStore {
  private readonly data = inject(TenantGradeDetailsDataService);

  readonly grade = signal<GradeDetails | null>(null);
  readonly groups = signal<GradeGroup[]>([...this.data.groups]);

  loadGrade(id: string | null): void {
    this.grade.set(this.data.getGradeById(id));
  }
}
