import { Injectable, inject, signal } from '@angular/core';
import { TenantSubjectsDataService } from '../data-access/tenant-subjects-data.service';
import { TenantSubject } from '../models/tenant-subjects.models';

@Injectable({ providedIn: 'root' })
export class TenantSubjectDetailsStore {
  private readonly data = inject(TenantSubjectsDataService);

  readonly subject = signal<TenantSubject | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  async loadSubject(id: string | null): Promise<void> {
    this.subject.set(null);
    this.loadError.set(null);
    if (!id) {
      this.loadError.set('Subject not found.');
      return;
    }

    this.loading.set(true);
    try {
      this.subject.set(await this.data.getSubjectDetails(id));
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error, 'Unable to load subject details. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }
}
