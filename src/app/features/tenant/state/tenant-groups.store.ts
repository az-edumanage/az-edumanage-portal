import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantGroupsDataService } from '../data-access/tenant-groups-data.service';

@Injectable({ providedIn: 'root' })
export class TenantGroupsStore {
  private readonly data = inject(TenantGroupsDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly subjectFilter = signal('');
  readonly teacherFilter = signal('');
  readonly sortBy = signal('name');

  readonly groups = this.data.groups;

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.subjectFilter()) count++;
    if (this.teacherFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const subject = this.subjectFilter();
    const teacher = this.teacherFilter();
    const sortBy = this.sortBy();

    const filtered = this.groups().filter((group) => {
      const matchesSearch =
        !query ||
        group.name.toLowerCase().includes(query) ||
        group.subject.toLowerCase().includes(query) ||
        group.teacher.toLowerCase().includes(query) ||
        group.room.toLowerCase().includes(query);

      const matchesSubject = !subject || group.subject === subject;
      const matchesTeacher = !teacher || group.teacher === teacher;

      return matchesSearch && matchesSubject && matchesTeacher;
    });

    if (sortBy === 'students-desc') {
      filtered.sort((a, b) => b.studentsCount - a.studentsCount);
    } else if (sortBy === 'students-asc') {
      filtered.sort((a, b) => a.studentsCount - b.studentsCount);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });
}
