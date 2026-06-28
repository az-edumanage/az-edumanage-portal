import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { TenantStudentsFacade } from '../../state/tenant-students.facade';

@Component({
  selector: 'app-tenant-students',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-students.component.html',
  styleUrl: './tenant-students.component.css',
})
export class TenantStudentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantStudentsFacade);
  private readonly router = inject(Router);
  private readonly stagesData = inject(TenantEducationalStagesDataService);
  private readonly gradesData = inject(TenantGradesDataService);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly students = this.facade.students;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredStudents = this.facade.filteredStudents;
  readonly pagedStudents = this.facade.pagedStudents;
  readonly totalFilteredStudents = this.facade.totalFilteredStudents;
  readonly totalPages = this.facade.totalPages;
  readonly pageIndex = this.facade.pageIndex;
  readonly pageSize = this.facade.pageSize;
  readonly pageStart = this.facade.pageStart;
  readonly pageEnd = this.facade.pageEnd;
  readonly stages = signal<EducationalStage[]>([]);
  readonly grades = signal<Grade[]>([]);
  readonly selectedStageFilter = signal('');
  readonly stageOptions = computed(() => [...this.stages()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
  readonly gradeOptions = computed(() => {
    const stageId = this.selectedStageFilter();
    return [...this.grades()]
      .filter((grade) => !stageId || grade.stageId === stageId)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly filterForm = this.fb.group({
    stage: [''],
    grade: [''],
    status: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.facade.loadStudents();
    void this.loadFilterOptions();
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const stage = value.stage ?? '';
        let grade = value.grade ?? '';
        if (this.selectedStageFilter() !== stage) {
          this.selectedStageFilter.set(stage);
          if (grade) {
            grade = '';
            this.filterForm.controls.grade.setValue('', { emitEvent: false });
          }
        }
        this.facade.setFilters(stage, grade, value.status ?? '', value.sortBy ?? 'name');
      });
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.selectedStageFilter.set('');
    this.filterForm.reset({
      stage: '',
      grade: '',
      status: '',
      sortBy: 'name',
    });
  }

  previousPage(): void {
    this.facade.previousPage();
  }

  nextPage(): void {
    this.facade.nextPage();
  }

  setPageSize(value: string): void {
    this.facade.setPageSize(Number(value));
  }

  openStudentDetails(studentId: string): void {
    void this.router.navigate(['/tenant/students', studentId]);
  }

  openStudentDetailsFromKeyboard(event: Event, studentId: string): void {
    event.preventDefault();
    this.openStudentDetails(studentId);
  }

  private async loadFilterOptions(): Promise<void> {
    try {
      const [stages, grades] = await Promise.all([
        this.stagesData.listStages(),
        this.gradesData.listGrades(),
      ]);
      this.stages.set(stages);
      this.grades.set(grades);
    } catch {
      this.stages.set([]);
      this.grades.set([]);
    }
  }
}
