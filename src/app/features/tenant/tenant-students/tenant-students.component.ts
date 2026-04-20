import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantStudentsFacade } from '../state/tenant-students.facade';

@Component({
  selector: 'app-tenant-students',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-students.component.html'})
export class TenantStudentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantStudentsFacade);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly students = this.facade.students;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredStudents = this.facade.filteredStudents;

  readonly filterForm = this.fb.group({
    grade: [''],
    status: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(value.grade ?? '', value.status ?? '', value.sortBy ?? 'name');
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
      grade: '',
      status: '',
      sortBy: 'name',
    });
  }
}
