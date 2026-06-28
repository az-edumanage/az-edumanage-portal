import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantGradesFacade } from '../../state/tenant-grades.facade';
import { Grade } from '../../models/tenant-grades.models';

@Component({
  selector: 'app-tenant-grades',
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-grades.component.html',
  styleUrls: ['./tenant-grades.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantGradesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantGradesFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly grades = this.facade.grades;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredGrades = this.facade.filteredGrades;
  readonly levelOptions = this.facade.levelOptions;
  readonly deleteState = this.facade.deleteState;
  readonly linkedStageId = this.route.snapshot.queryParamMap.get('stageId') ?? '';

  readonly filterForm = this.fb.group({
    level: [''],
    minStudents: [null as number | null],
    maxStudents: [null as number | null],
    sortBy: ['name'],
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(
          value.level ?? '',
          value.minStudents ?? null,
          value.maxStudents ?? null,
          value.sortBy ?? 'name',
        );
      });
  }

  ngOnInit(): void {
    if (this.linkedStageId) {
      this.viewMode.set('list');
      this.facade.setStageFilter(this.linkedStageId);
    }

    void this.facade.loadGrades();
  }

  openGradeSubjects(grade: Grade): void {
    void this.router.navigate(['/tenant/subjects'], {
      queryParams: {
        stageId: grade.stageId,
        gradeId: grade.id,
      },
    });
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      level: '',
      minStudents: null,
      maxStudents: null,
      sortBy: 'name',
    });
  }

  openDeleteConfirmation(grade: Grade): void {
    this.facade.openDeleteConfirmation(grade);
  }

  cancelDelete(): void {
    this.facade.cancelDelete();
  }

  closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  confirmDelete(): void {
    void this.facade.confirmDelete();
  }
}
