import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
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

  readonly filterForm = this.fb.group({
    stageId: [''],
    gradeId: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(value.stageId ?? '', value.gradeId ?? '', value.sortBy ?? 'name');
      });
  }

  ngOnInit(): void {
    void this.facade.loadSubjects();
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  onStageFilterChange(): void {
    this.filterForm.controls.gradeId.setValue('');
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      stageId: '',
      gradeId: '',
      sortBy: 'name',
    });
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  deleteSubject(id: string): void {
    void this.facade.deleteSubject(id);
  }
}
