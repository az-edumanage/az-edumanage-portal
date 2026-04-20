import { Injectable, inject } from '@angular/core';
import { TenantStore } from './tenant.store';

@Injectable({ providedIn: 'root' })
export class TenantFacade {
  private readonly store = inject(TenantStore);

  readonly vm = this.store.vm;

  setActiveSection(section: string): void {
    this.store.setActiveSection(section);
  }

  clearError(): void {
    this.store.setError(null);
  }
}
