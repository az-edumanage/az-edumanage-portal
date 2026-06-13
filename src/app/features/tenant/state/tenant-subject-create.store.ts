import { Injectable, computed, signal } from '@angular/core';
import { TenantSubjectGradeOption, TenantSubjectStageOption } from '../models/tenant-subjects.models';

@Injectable({ providedIn: 'root' })
export class TenantSubjectCreateStore {
  readonly isSubmitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly stages = signal<TenantSubjectStageOption[]>([]);
  readonly grades = signal<TenantSubjectGradeOption[]>([]);
  readonly selectedStageId = signal('');
  readonly editingSubjectId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly filteredGrades = computed(() => {
    const stageId = this.selectedStageId();
    return this.grades()
      .filter((grade) => !stageId || grade.stageId === stageId)
      .sort((a, b) => a.label.localeCompare(b.label));
  });
}
