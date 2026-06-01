import { Injectable, inject, signal } from '@angular/core';
import { TenantGradeDetailsDataService } from '../data-access/tenant-grade-details-data.service';
import { GradeDetails } from '../models/tenant-grade-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGradeDetailsStore {
  private readonly data = inject(TenantGradeDetailsDataService);

  readonly grade = signal<GradeDetails | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  async loadGrade(id: string | null): Promise<void> {
    this.grade.set(null);
    this.loadError.set(null);

    if (!id) {
      this.loadError.set('Grade not found.');
      return;
    }

    this.loading.set(true);
    try {
      this.grade.set(await this.data.getGradeById(id));
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
