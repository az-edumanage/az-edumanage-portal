import { Injectable, inject } from '@angular/core';
import { TenantSubjectDetailsStore } from './tenant-subject-details.store';

@Injectable({ providedIn: 'root' })
export class TenantSubjectDetailsFacade {
  private readonly store = inject(TenantSubjectDetailsStore);

  readonly subject = this.store.subject;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;

  loadSubject(id: string | null): Promise<void> {
    return this.store.loadSubject(id);
  }
}
