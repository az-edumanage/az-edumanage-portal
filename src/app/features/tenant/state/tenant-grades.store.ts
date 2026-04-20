import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantGradesDataService } from '../data-access/tenant-grades-data.service';

@Injectable({ providedIn: 'root' })
export class TenantGradesStore {
  private readonly data = inject(TenantGradesDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly levelFilter = signal('');
  readonly minStudentsFilter = signal<number | null>(null);
  readonly maxStudentsFilter = signal<number | null>(null);
  readonly sortBy = signal('name');

  readonly grades = this.data.grades;

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.levelFilter()) count++;
    if (this.minStudentsFilter() !== null) count++;
    if (this.maxStudentsFilter() !== null) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredGrades = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const level = this.levelFilter();
    const minStudents = this.minStudentsFilter();
    const maxStudents = this.maxStudentsFilter();
    const sortBy = this.sortBy();

    const filtered = this.grades().filter((grade) => {
      const matchesSearch =
        !query ||
        grade.name.toLowerCase().includes(query) ||
        grade.level.toLowerCase().includes(query);

      const matchesLevel = !level || grade.level === level;
      const matchesMin = minStudents === null || grade.studentCount >= minStudents;
      const matchesMax = maxStudents === null || grade.studentCount <= maxStudents;

      return matchesSearch && matchesLevel && matchesMin && matchesMax;
    });

    if (sortBy === 'students-desc') {
      filtered.sort((a, b) => b.studentCount - a.studentCount);
    } else if (sortBy === 'students-asc') {
      filtered.sort((a, b) => a.studentCount - b.studentCount);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });
}
