import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantTeachersDataService } from '../data-access/tenant-teachers-data.service';
import { Teacher } from '../models/tenant-teachers.models';

@Injectable({ providedIn: 'root' })
export class TenantTeachersStore {
  private readonly data = inject(TenantTeachersDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly subjectFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');

  readonly activeSettingsId = signal<string | null>(null);
  readonly activeChatTeacher = signal<Teacher | null>(null);

  readonly teachers = this.data.teachers;

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.subjectFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredTeachers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const subject = this.subjectFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();

    const filtered = this.teachers().filter((teacher) => {
      const matchesSearch =
        !query ||
        teacher.name.toLowerCase().includes(query) ||
        teacher.subject.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query);

      const matchesSubject = !subject || teacher.subject === subject;
      const matchesStatus = !status || teacher.status === status;

      return matchesSearch && matchesSubject && matchesStatus;
    });

    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });
}
