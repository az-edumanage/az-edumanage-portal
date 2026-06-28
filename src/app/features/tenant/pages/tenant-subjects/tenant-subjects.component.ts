import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantSubjectsFacade } from '../../state/tenant-subjects.facade';

@Component({
  selector: 'app-tenant-subjects',
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-subjects.component.html',
  styleUrls: ['./tenant-subjects.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSubjectsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantSubjectsFacade);
  private readonly subjectsData = inject(TenantSubjectsDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly subjects = this.facade.subjects;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredSubjects = this.facade.filteredSubjects;
  readonly stageOptions = this.facade.stageOptions;
  readonly gradeOptions = this.facade.gradeOptions;
  readonly isQuestionsBankRoute = this.router.url.startsWith('/tenant/questions-bank');
  readonly questionsBankStageId = this.route.snapshot.paramMap.get('stageId') ?? '';
  readonly questionsBankGradeId = this.route.snapshot.paramMap.get('gradeId') ?? '';
  readonly isQuestionsBankStageRoute = this.isQuestionsBankRoute && !!this.questionsBankStageId;
  readonly isQuestionsBankGradeRoute = this.isQuestionsBankStageRoute && !!this.questionsBankGradeId;
  readonly loadedQuestionsBankStageName = signal('');
  readonly loadedQuestionsBankGradeName = signal('');
  readonly questionsBankStageName = computed(() => {
    if (!this.questionsBankStageId) {
      return '';
    }

    return this.loadedQuestionsBankStageName()
      || this.stageOptions().find((stage) => stage.value === this.questionsBankStageId)?.label
      || this.questionsBankStageId;
  });
  readonly questionsBankGradeName = computed(() => {
    if (!this.questionsBankGradeId) {
      return '';
    }

    return this.loadedQuestionsBankGradeName()
      || this.gradeOptions().find((grade) => grade.value === this.questionsBankGradeId)?.label
      || this.questionsBankGradeId;
  });

  readonly filterForm = this.fb.group({
    stageId: [''],
    gradeId: [''],
    sortBy: ['name'],
  });

  constructor() {
    if (this.isQuestionsBankRoute) {
      this.viewMode.set('list');
    }

    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const stageId = this.isQuestionsBankStageRoute ? '' : value.stageId ?? '';
        const gradeId = this.isQuestionsBankGradeRoute ? '' : value.gradeId ?? '';
        this.facade.setFilters(stageId, gradeId, value.sortBy ?? 'name');
      });
  }

  ngOnInit(): void {
    if (this.isQuestionsBankStageRoute) {
      this.filterForm.patchValue({
        stageId: this.questionsBankStageId,
        gradeId: this.questionsBankGradeId,
        sortBy: 'name',
      }, {
        emitEvent: false,
      });
      this.facade.setFilters('', '', 'name');
      void this.loadQuestionsBankBreadcrumbNames();
      void this.facade.loadSubjects({
        stageId: this.questionsBankStageId,
        ...(this.questionsBankGradeId ? { gradeId: this.questionsBankGradeId } : {}),
      });
      return;
    }

    const queryStageId = this.route.snapshot.queryParamMap.get('stageId') ?? '';
    const queryGradeId = this.route.snapshot.queryParamMap.get('gradeId') ?? '';

    if (queryStageId || queryGradeId) {
      this.filterForm.patchValue({
        stageId: queryStageId,
        gradeId: queryGradeId,
        sortBy: 'name',
      }, {
        emitEvent: false,
      });
      this.facade.setFilters(queryStageId, queryGradeId, 'name');
    }

    void this.facade.loadSubjects();
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  onStageFilterChange(): void {
    this.filterForm.controls.gradeId.setValue('');
  }

  clearAdvancedFilters(): void {
    if (this.isQuestionsBankStageRoute) {
      this.facade.setFilters('', '', 'name');
      this.filterForm.reset({
        stageId: this.questionsBankStageId,
        gradeId: this.questionsBankGradeId,
        sortBy: 'name',
      }, {
        emitEvent: false,
      });
      return;
    }

    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      stageId: '',
      gradeId: '',
      sortBy: 'name',
    });
  }

  clearAllFilters(): void {
    if (this.isQuestionsBankStageRoute) {
      this.searchQuery.set('');
      this.clearAdvancedFilters();
      return;
    }

    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  deleteSubject(id: string): void {
    void this.facade.deleteSubject(id);
  }

  subjectDetailsLink(subjectId: string): unknown[] {
    return this.isQuestionsBankGradeRoute
      ? ['/tenant/questions-bank/basic-education', this.questionsBankStageId, 'grades', this.questionsBankGradeId, 'subjects', subjectId, 'curriculum']
      : ['/tenant/subjects', subjectId];
  }

  openSubject(subjectId: string): void {
    void this.router.navigate(this.subjectDetailsLink(subjectId));
  }

  private async loadQuestionsBankBreadcrumbNames(): Promise<void> {
    try {
      const [stages, grades] = await Promise.all([
        this.subjectsData.listStageOptions(),
        this.subjectsData.listGradeOptions(),
      ]);
      this.loadedQuestionsBankStageName.set(
        stages.find((stage) => stage.value === this.questionsBankStageId)?.label ?? '',
      );
      this.loadedQuestionsBankGradeName.set(
        grades.find((grade) => grade.value === this.questionsBankGradeId)?.label ?? '',
      );
    } catch {
      this.loadedQuestionsBankStageName.set('');
      this.loadedQuestionsBankGradeName.set('');
    }
  }
}
