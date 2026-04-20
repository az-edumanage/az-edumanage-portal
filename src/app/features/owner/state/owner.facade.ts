import { Injectable, inject } from '@angular/core';
import { OwnerStore } from './owner.store';

@Injectable({ providedIn: 'root' })
export class OwnerFacade {
  private readonly store = inject(OwnerStore);

  readonly vm = this.store.vm;

  setActiveSection(section: string): void {
    this.store.setActiveSection(section);
  }

  clearError(): void {
    this.store.setError(null);
  }
}
