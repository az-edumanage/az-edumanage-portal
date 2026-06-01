import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantGradeCreateFacade } from '../../state/tenant-grade-create.facade';

@Component({
  selector: 'app-tenant-grade-create',
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-grade-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantGradeCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGradeCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly saveError = this.facade.saveError;
  readonly loadError = this.facade.loadError;
  readonly isEditMode = this.facade.isEditMode;
  readonly gradeForm = this.facade.gradeForm;
  readonly countryOptions = this.facade.countryOptions;
  readonly academicLevelOptions = this.facade.academicLevelOptions;
  readonly countriesLoading = this.facade.countriesLoading;
  readonly levelsLoading = this.facade.levelsLoading;
  readonly countriesError = this.facade.countriesError;
  readonly levelsError = this.facade.levelsError;

  ngOnInit(): void {
    void this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  resetForm(): void {
    this.facade.resetForm();
  }

  goBack(): void {
    this.facade.goBack();
  }

  onCountryChange(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    void this.facade.onCountryChange(value);
  }

  onSubmit(): void {
    void this.facade.onSubmit();
  }
}
