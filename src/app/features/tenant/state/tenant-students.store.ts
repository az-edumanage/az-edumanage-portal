import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantStudentsDataService } from '../data-access/tenant-students-data.service';

@Injectable({ providedIn: 'root' })
export class TenantStudentsStore {
  private readonly data = inject(TenantStudentsDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('list');

  readonly gradeFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');

  readonly students = this.data.students;

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.gradeFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const grade = this.gradeFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();

    const filtered = this.students().filter((student) => {
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);
      const matchesGrade = !grade || student.grade === grade;
      const matchesStatus = !status || student.status === status;
      return matchesSearch && matchesGrade && matchesStatus;
    });

    if (sortBy === 'date-desc') {
      filtered.sort(
        (a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime(),
      );
    } else if (sortBy === 'date-asc') {
      filtered.sort(
        (a, b) => new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime(),
      );
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });
}
