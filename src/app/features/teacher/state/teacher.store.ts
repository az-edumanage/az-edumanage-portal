import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeacherStore {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeSection = signal<string>('overview');

  readonly vm = computed(() => ({
    loading: this.loading(),
    error: this.error(),
    activeSection: this.activeSection(),
  }));

  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setError(message: string | null): void {
    this.error.set(message);
  }

  setActiveSection(section: string): void {
    this.activeSection.set(section);
  }
}
