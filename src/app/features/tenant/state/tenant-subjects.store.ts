import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantSubjectListFilters, TenantSubjectsDataService } from '../data-access/tenant-subjects-data.service';
import { TenantSubject } from '../models/tenant-subjects.models';

@Injectable({ providedIn: 'root' })
export class TenantSubjectsStore {
  private readonly data = inject(TenantSubjectsDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly stageFilter = signal('');
  readonly gradeFilter = signal('');
  readonly sortBy = signal('name');

  readonly subjects = signal<TenantSubject[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.stageFilter()) count++;
    if (this.gradeFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly stageOptions = computed(() => {
    const stages = new Map<string, string>();
    for (const subject of this.subjects()) {
      stages.set(subject.stageId, subject.stageName);
    }
    return Array.from(stages.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly gradeOptions = computed(() => {
    const selectedStageId = this.stageFilter();
    const grades = new Map<string, { value: string; label: string; stageId: string }>();
    for (const subject of this.subjects()) {
      if (!selectedStageId || subject.stageId === selectedStageId) {
        grades.set(subject.gradeId, {
          value: subject.gradeId,
          label: subject.gradeName,
          stageId: subject.stageId,
        });
      }
    }
    return Array.from(grades.values()).sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly filteredSubjects = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const stageId = this.stageFilter();
    const gradeId = this.gradeFilter();
    const sortBy = this.sortBy();

    const filtered = this.subjects().filter((subject) => {
      const matchesSearch =
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.stageName.toLowerCase().includes(query) ||
        subject.gradeName.toLowerCase().includes(query);
      const matchesStage = !stageId || subject.stageId === stageId;
      const matchesGrade = !gradeId || subject.gradeId === gradeId;
      return matchesSearch && matchesStage && matchesGrade;
    });

    if (sortBy === 'groups-desc') {
      filtered.sort((a, b) => b.assignedGroupsCount - a.assignedGroupsCount);
    } else if (sortBy === 'students-desc') {
      filtered.sort((a, b) => b.totalStudentsCount - a.totalStudentsCount);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  async loadSubjects(filters: TenantSubjectListFilters = {}): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.subjects.set(await this.data.listSubjects(filters));
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async deleteSubject(id: string): Promise<boolean> {
    this.deletingId.set(id);
    this.deleteError.set(null);
    try {
      await this.data.deleteSubject(id);
      this.subjects.update((subjects) => subjects.filter((subject) => subject.id !== id));
      return true;
    } catch (error) {
      this.deleteError.set(this.data.toUserMessage(error, 'Unable to delete subject. Please try again.'));
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }
}
