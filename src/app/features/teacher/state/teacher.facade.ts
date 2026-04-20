import { Injectable, inject } from '@angular/core';
import { TeacherStore } from './teacher.store';

@Injectable({ providedIn: 'root' })
export class TeacherFacade {
  private readonly store = inject(TeacherStore);

  readonly vm = this.store.vm;

  setActiveSection(section: string): void {
    this.store.setActiveSection(section);
  }

  clearError(): void {
    this.store.setError(null);
  }
}
